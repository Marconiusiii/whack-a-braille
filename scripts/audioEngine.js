"use strict";

let audioContext = null;
let isUnlocked = false;
let hitBuffer = null;
let hitGainNode = null;
let gameAudioMode = "original";
let sillyHitBuffer = null;
let fiftyPointBuffer = null;
let sillyGainNode = null;
let beatTimeout = null;
let beatStepIndex = 0;
let beatRepeatCount = 0;
let beatRootMidi = 48;

const molePanMap = [
	-1.0,	// Mole 1: far left
	-0.5,	// Mole 2: mid left
	0.0,	// Mole 3: center
	0.5,	// Mole 4: mid right
	1.0		// Mole 5: far right
];

const enableFiftyPointSound = true;

function createMolePanner(ctx, moleIndex) {
	const pan = ctx.createStereoPanner();
	pan.pan.value = molePanMap[moleIndex] ?? 0.0;
	return pan;
}



function checkFiftyPointSound(score) {
	if (!enableFiftyPointSound) return;

	if (score >= 50 && lastScoreAnnounced < 50) {
		playFiftyPointSound();
	}
	lastScoreAnnounced = score;
}

let lastScoreAnnounced = 0;

function setGameAudioMode(mode) {
	gameAudioMode = mode === "silly" ? "silly" : "original";
}
async function loadSillySounds() {
	if (sillyHitBuffer && fiftyPointBuffer) return;

	const [bonkRes, fiftyRes] = await Promise.all([
		fetch("files/ChanceyBonk_6.m4a"),
		fetch("files/50pts_2.m4a")
	]);

	const bonkData = await bonkRes.arrayBuffer();
	const fiftyData = await fiftyRes.arrayBuffer();

	sillyHitBuffer = await audioContext.decodeAudioData(bonkData);
	fiftyPointBuffer = await audioContext.decodeAudioData(fiftyData);

	sillyGainNode = audioContext.createGain();
	sillyGainNode.gain.value = 0.6;
	sillyGainNode.connect(audioContext.destination);
}


async function loadHitSound() {
	if (hitBuffer) return;

	const response = await fetch("files/ChanceyBonk_6.m4a");
	const arrayBuffer = await response.arrayBuffer();

	hitBuffer = await audioContext.decodeAudioData(arrayBuffer);

	hitGainNode = audioContext.createGain();
	hitGainNode.gain.value = 0.5;
	hitGainNode.connect(audioContext.destination);
}


function getAudioContext() {
	if (!audioContext) {
		audioContext = new (window.AudioContext || window.webkitAudioContext)();
	}
	return audioContext;
}

function unlockAudio() {
	if (isUnlocked) return;
	lastScoreAnnounced = 0;

	const ctx = getAudioContext();

	if (ctx.state === "suspended") {
		ctx.resume();
	}
	loadHitSound().catch(() => {});
	loadSillySounds().catch(() => {});


	const buffer = ctx.createBuffer(1, 1, 22050);
	const source = ctx.createBufferSource();
	source.buffer = buffer;
	source.connect(ctx.destination);
	source.start(0);

	isUnlocked = true;
}

function ensureRunning(ctx) {
	if (ctx.state === "suspended") {
		ctx.resume();
	}
}

/* ---------- START ROUND FLOURISH ---------- */

function playSillyHitSound(moleIndex) {
	if (!isUnlocked) return;
	if (!sillyHitBuffer || !sillyGainNode) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;

	const src = ctx.createBufferSource();
	src.buffer = sillyHitBuffer;

	// More noticeable speed variation
	src.playbackRate.value = 0.9 + Math.random() * 0.2;

	// Base detune
	src.detune.value = (Math.random() * 120) - 60;

	// Pitch wobble (this is what makes it obviously silly)
	const lfo = ctx.createOscillator();
	const lfoGain = ctx.createGain();
	lfo.frequency.value = 7 + Math.random() * 4;
	lfoGain.gain.value = 35 + Math.random() * 20;

	lfo.connect(lfoGain);
	lfoGain.connect(src.detune);

	// Big, playful lowpass sweep (opens instead of choking)
	const filter = ctx.createBiquadFilter();
	filter.type = "lowpass";

	const startCutoff = 1200 + Math.random() * 800;
	const endCutoff = 3800 + Math.random() * 1200;

	filter.frequency.setValueAtTime(startCutoff, now);
	filter.frequency.exponentialRampToValueAtTime(endCutoff, now + 0.18);

	// Gain envelope that respects full duration
	const gain = ctx.createGain();

	const attack = 0.01;
	const release = 0.08;
	const peak = 1.0;

	const duration = src.buffer.duration / src.playbackRate.value;
	const releaseStart = Math.max(now + duration - release, now + attack);

	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.linearRampToValueAtTime(peak, now + attack);
	gain.gain.setValueAtTime(peak, releaseStart);
	gain.gain.linearRampToValueAtTime(0.0001, releaseStart + release);

	src.connect(filter);
	filter.connect(gain);
	const pan = createMolePanner(ctx, moleIndex);
	gain.connect(pan);
	pan.connect(sillyGainNode);

	lfo.start(now);
	lfo.stop(now + duration);

	src.start(now);
}

function playFiftyPointSound() {
	if (!isUnlocked) return;
	if (!fiftyPointBuffer || !sillyGainNode) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const src = ctx.createBufferSource();
	src.buffer = fiftyPointBuffer;

	src.connect(sillyGainNode);
	src.start();
}


function playStartFlourish() {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;

	const master = ctx.createGain();
	master.gain.value = 0.45;
	master.connect(ctx.destination);

	// Faster tempo for more playful energy
	const beat = 60 / 220;

	// Tight root chord pool near middle C
	const rootChordPool = [
		[261.63, 329.63, 392.0],	// C
		[277.18, 349.23, 415.3],	// D♭
		[293.66, 369.99, 440.0],	// D
		[311.13, 392.0, 466.16],	// E♭
		[329.63, 415.3, 493.88]	// E
	];

	const rootChord =
		rootChordPool[Math.floor(Math.random() * rootChordPool.length)];

	// Always resolve up a perfect fifth
	const resolveChord = rootChord.map(freq => freq * 1.5);

	// Very subtle pitch variance
	const pitchJitter = () => 1 + (Math.random() - 0.5) * 0.003;

	/* ---------------- First quarter note ---------------- */

	rootChord.forEach(freq => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = "triangle";
		osc.frequency.setValueAtTime(freq * pitchJitter(), now);

		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(0.65, now + 0.05);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + beat * 0.95);

		osc.connect(gain);
		gain.connect(master);

		osc.start(now);
		osc.stop(now + beat);
	});

	/* ---------------- Second quarter note (swung forward) ---------------- */

	// Swung later so it pushes hard into the sustain
	const secondQuarterStart = now + beat * 1.40;

	rootChord.forEach(freq => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = "triangle";
		osc.frequency.setValueAtTime(freq * pitchJitter(), secondQuarterStart);

		gain.gain.setValueAtTime(0.0001, secondQuarterStart);
		gain.gain.exponentialRampToValueAtTime(0.6, secondQuarterStart + 0.04);
		gain.gain.exponentialRampToValueAtTime(0.0001, secondQuarterStart + beat * 0.9);

		osc.connect(gain);
		gain.connect(master);

		osc.start(secondQuarterStart);
		osc.stop(secondQuarterStart + beat);
	});

	/* ---------------- Whole note resolve (perfect fifth) ---------------- */

	const sustainStart = now + beat * 2;
	const sustainDur = beat * 4;

	resolveChord.forEach(freq => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = "triangle";
		osc.frequency.setValueAtTime(freq * pitchJitter(), sustainStart);

		// Vibrato consistent with ending flourish
		const lfo = ctx.createOscillator();
		const lfoGain = ctx.createGain();
		lfo.frequency.value = 4.5 + Math.random();
		lfoGain.gain.value = 6 + Math.random() * 2;
		lfo.connect(lfoGain);
		lfoGain.connect(osc.frequency);

		gain.gain.setValueAtTime(0.0001, sustainStart);
		gain.gain.exponentialRampToValueAtTime(0.75, sustainStart + 0.08);
		gain.gain.exponentialRampToValueAtTime(0.0001, sustainStart + sustainDur);

		osc.connect(gain);
		gain.connect(master);

		lfo.start(sustainStart);
		lfo.stop(sustainStart + sustainDur);

		osc.start(sustainStart);
		osc.stop(sustainStart + sustainDur);
	});
}

function playEverythingStinger() {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;

	const master = ctx.createGain();
	master.gain.value = 0.5;
	master.connect(ctx.destination);

	// Same tempo feel as tuned start flourish
	const beat = 60 / 220;

	// Minor root chord pool near middle C (dark but grounded)
	const minorChordPool = [
		[261.63, 311.13, 392.0],	// C minor
		[293.66, 349.23, 440.0],	// D minor
		[246.94, 293.66, 369.99]	// B♭ minor flavor
	];

	const rootChord =
		minorChordPool[Math.floor(Math.random() * minorChordPool.length)];

	// Danger interval: minor second above root
	const trillInterval = rootChord[0] * 1.05946;

	const pitchJitter = () => 1 + (Math.random() - 0.5) * 0.002;

	/* ---------------- Initial warning hit ---------------- */

	rootChord.forEach(freq => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = "triangle";
		osc.frequency.setValueAtTime(freq * pitchJitter(), now);

		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(0.7, now + 0.05);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + beat * 0.9);

		osc.connect(gain);
		gain.connect(master);

		osc.start(now);
		osc.stop(now + beat);
	});

	/* ---------------- Trill (warning / danger) ---------------- */

	const trillStart = now + beat * 0.9;
	const trillDur = beat * 1.2;

	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = "triangle";

	// Fast alternating trill
	osc.frequency.setValueAtTime(rootChord[0], trillStart);
	osc.frequency.setValueAtTime(trillInterval, trillStart + 0.05);
	osc.frequency.setValueAtTime(rootChord[0], trillStart + 0.1);
	osc.frequency.setValueAtTime(trillInterval, trillStart + 0.15);
	osc.frequency.setValueAtTime(rootChord[0], trillStart + 0.2);
	osc.frequency.setValueAtTime(trillInterval, trillStart + 0.25);

	gain.gain.setValueAtTime(0.0001, trillStart);
	gain.gain.exponentialRampToValueAtTime(0.6, trillStart + 0.04);
	gain.gain.exponentialRampToValueAtTime(0.0001, trillStart + trillDur);

	osc.connect(gain);
	gain.connect(master);

	osc.start(trillStart);
	osc.stop(trillStart + trillDur);

	/* ---------------- Sustained unstable minor resolve ---------------- */

	const sustainStart = trillStart + trillDur * 0.8;
	const sustainDur = beat * 4;

	rootChord.forEach(freq => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = "triangle";
		osc.frequency.setValueAtTime(freq * pitchJitter(), sustainStart);

		// Deeper, slower vibrato for unease
		const lfo = ctx.createOscillator();
		const lfoGain = ctx.createGain();
		lfo.frequency.value = 3.2 + Math.random();
		lfoGain.gain.value = 10 + Math.random() * 4;
		lfo.connect(lfoGain);
		lfoGain.connect(osc.frequency);

		gain.gain.setValueAtTime(0.0001, sustainStart);
		gain.gain.exponentialRampToValueAtTime(0.8, sustainStart + 0.1);
		gain.gain.exponentialRampToValueAtTime(0.0001, sustainStart + sustainDur);

		osc.connect(gain);
		gain.connect(master);

		lfo.start(sustainStart);
		lfo.stop(sustainStart + sustainDur);

		osc.start(sustainStart);
		osc.stop(sustainStart + sustainDur);
	});
}

/* ---------- HIT SOUND ---------- */

function playOriginalHitSound(moleIndex) {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const pan = createMolePanner(ctx, moleIndex);

	const master = ctx.createGain();
	master.gain.value = 0.85;
	pan.connect(master);
	master.connect(ctx.destination);

	// spring tuning parameters

	const springBaseHz = 195;
	const springVarianceHz = 45;
	const springDuration = 0.85;

	const springDipRatio = 0.78;
	const springPeakRatio = 1.25;

	const springWobbleHz = 3.0;
	const springWobbleStartDepth = 15;
	const springWobbleEndDepth = 2.5;

	const springPeakGain = 0.4;

	// sub thud

	const subOsc = ctx.createOscillator();
	const subGain = ctx.createGain();

	subOsc.type = "sine";
	subOsc.frequency.setValueAtTime(75, now);
	subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.09);

	subGain.gain.setValueAtTime(0.0001, now);
	subGain.gain.exponentialRampToValueAtTime(1.15, now + 0.015);
	subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

	subOsc.connect(subGain);
	subGain.connect(pan);

	subOsc.start(now);
	subOsc.stop(now + 0.15);

	// sub harmonic reinforcement

	const subHarm = ctx.createOscillator();
	const subHarmGain = ctx.createGain();

	subHarm.type = "triangle";
	subHarm.frequency.setValueAtTime(110, now);
	subHarm.frequency.exponentialRampToValueAtTime(80, now + 0.1);

	subHarmGain.gain.setValueAtTime(0.0001, now);
	subHarmGain.gain.exponentialRampToValueAtTime(0.28, now + 0.02);
	subHarmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

	subHarm.connect(subHarmGain);
	subHarmGain.connect(pan);

	subHarm.start(now);
	subHarm.stop(now + 0.18);

	// body thud

	const bodyOsc = ctx.createOscillator();
	const bodyGain = ctx.createGain();

	bodyOsc.type = "triangle";

	const bodyStart = 135 + Math.random() * 15;
	const bodyEnd = 90 + Math.random() * 10;

	bodyOsc.frequency.setValueAtTime(bodyStart, now);
	bodyOsc.frequency.exponentialRampToValueAtTime(bodyEnd, now + 0.11);

	bodyGain.gain.setValueAtTime(0.0001, now);
	bodyGain.gain.exponentialRampToValueAtTime(0.7, now + 0.02);
	bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);

	bodyOsc.connect(bodyGain);
	bodyGain.connect(pan);

	bodyOsc.start(now);
	bodyOsc.stop(now + 0.22);

	// impact noise

	const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.07, ctx.sampleRate);
	const noiseData = noiseBuffer.getChannelData(0);
	for (let i = 0; i < noiseData.length; i++) {
		noiseData[i] = Math.random() * 2 - 1;
	}

	const noise = ctx.createBufferSource();
	noise.buffer = noiseBuffer;

	const noiseFilter = ctx.createBiquadFilter();
	noiseFilter.type = "bandpass";
	noiseFilter.frequency.value = 500 + Math.random() * 120;
	noiseFilter.Q.value = 0.9;

	const noiseGain = ctx.createGain();
	noiseGain.gain.setValueAtTime(0.0001, now);
	noiseGain.gain.exponentialRampToValueAtTime(0.45, now + 0.01);
	noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

	noise.connect(noiseFilter);
	noiseFilter.connect(noiseGain);
	noiseGain.connect(pan);

	noise.start(now);
	noise.stop(now + 0.09);

	// mechanical spring release

	const springOsc = ctx.createOscillator();
	const springGain = ctx.createGain();

	springOsc.type = "triangle";

	const springBase =
		springBaseHz + (Math.random() - 0.5) * springVarianceHz;

	springOsc.frequency.setValueAtTime(springBase * springDipRatio, now + 0.04);
	springOsc.frequency.exponentialRampToValueAtTime(
		springBase * springPeakRatio,
		now + 0.18
	);
	springOsc.frequency.exponentialRampToValueAtTime(
		springBase * springDipRatio,
		now + 0.36
	);
	springOsc.frequency.exponentialRampToValueAtTime(
		springBase * 1.08,
		now + 0.55
	);
	springOsc.frequency.exponentialRampToValueAtTime(
		springBase,
		now + springDuration
	);

	const springWobble = ctx.createOscillator();
	const springWobbleGain = ctx.createGain();

	springWobble.type = "sine";
	springWobble.frequency.value = springWobbleHz;

	springWobbleGain.gain.setValueAtTime(
		springWobbleStartDepth,
		now + 0.04
	);
	springWobbleGain.gain.exponentialRampToValueAtTime(
		springWobbleEndDepth,
		now + springDuration
	);

	springWobble.connect(springWobbleGain);
	springWobbleGain.connect(springOsc.frequency);

	springGain.gain.setValueAtTime(0.0001, now + 0.04);
	springGain.gain.exponentialRampToValueAtTime(
		springPeakGain,
		now + 0.08
	);
	springGain.gain.exponentialRampToValueAtTime(
		0.0001,
		now + springDuration
	);

	springOsc.connect(springGain);
	springGain.connect(pan);

	springWobble.start(now + 0.04);
	springOsc.start(now + 0.04);

	springOsc.stop(now + springDuration + 0.05);
	springWobble.stop(now + springDuration + 0.05);
}



function playHitSound(score, moleIndex) {
	if (gameAudioMode === "silly") {
		playSillyHitSound(moleIndex);
		checkFiftyPointSound(score);
		return;
	}

	playOriginalHitSound(moleIndex);
}


function playMissSound(moleIndex) {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const panValue = molePanMap[moleIndex] ?? 0.0;

	const pan = ctx.createStereoPanner();
	pan.pan.value = panValue;

	const master = ctx.createGain();
	master.gain.value = 0.55;
	pan.connect(master);
	master.connect(ctx.destination);

	/* ---------------- Heavy air whoosh ---------------- */

	const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.38, ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i++) {
		data[i] = Math.random() * 2 - 1;
	}

	const noise = ctx.createBufferSource();
	noise.buffer = buffer;

	/* ---------------- Weighty spectral shape ---------------- */

	const filter = ctx.createBiquadFilter();
	filter.type = "bandpass";
	filter.frequency.setValueAtTime(900, now);
	filter.frequency.exponentialRampToValueAtTime(450, now + 0.32);
	filter.Q.value = 0.6;

	/* ---------------- Slow gather → release envelope ---------------- */

	const gain = ctx.createGain();
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(0.75, now + 0.14);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

	noise.connect(filter);
	filter.connect(gain);
	gain.connect(pan);

	noise.start(now);
	noise.stop(now + 0.40);
}

/* ---------- MOLE RETREAT ---------- */
function playMolePopSound(moleIndex) {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const panValue = molePanMap[moleIndex] ?? 0.0;

	const pan = ctx.createStereoPanner();
	pan.pan.value = panValue;

	const master = ctx.createGain();
	master.gain.value = 0.38;
	pan.connect(master);
	master.connect(ctx.destination);

	/* ---------------- Slide whistle body ---------------- */

	const osc = ctx.createOscillator();
	osc.type = "sine";

	// Quick pitch nudge for attack, then full rise
	osc.frequency.setValueAtTime(170, now);
	osc.frequency.exponentialRampToValueAtTime(260, now + 0.018);
	osc.frequency.exponentialRampToValueAtTime(760, now + 0.24);

	/* ---------------- Gentle vibrato ---------------- */

	const vibrato = ctx.createOscillator();
	vibrato.type = "sine";
	vibrato.frequency.value = 6.8;

	const vibratoGain = ctx.createGain();
	vibratoGain.gain.value = 20;

	vibrato.connect(vibratoGain);
	vibratoGain.connect(osc.frequency);

	/* ---------------- Sharper but smooth gain envelope ---------------- */

	const gain = ctx.createGain();

	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.linearRampToValueAtTime(0.65, now + 0.018);
	gain.gain.linearRampToValueAtTime(0.0001, now + 0.28);

	/* ---------------- Soft tone shaping ---------------- */

	const filter = ctx.createBiquadFilter();
	filter.type = "lowpass";
	filter.frequency.value = 1900;
	filter.Q.value = 0.6;

	osc.connect(filter);
	filter.connect(gain);
	gain.connect(pan);

	/* ---------------- Start / stop ---------------- */

	vibrato.start(now);
	osc.start(now);

	osc.stop(now + 0.30);
	vibrato.stop(now + 0.30);
}


function playRetreatSound(moleIndex) {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const panValue = molePanMap[moleIndex] ?? 0.0;

	const pan = ctx.createStereoPanner();
	pan.pan.value = panValue;

	const master = ctx.createGain();
	master.gain.value = 0.4;
	pan.connect(master);
	master.connect(ctx.destination);

	/* ---------------- Downward slide ---------------- */

	const osc = ctx.createOscillator();
	osc.type = "sine";
	osc.frequency.setValueAtTime(680, now);
	osc.frequency.exponentialRampToValueAtTime(190, now + 0.14);

	/* ---------------- Escape vibrato ---------------- */

	const vibrato = ctx.createOscillator();
	vibrato.type = "sine";
	vibrato.frequency.value = 16;

	const vibratoGain = ctx.createGain();
	vibratoGain.gain.value = 32;

	vibrato.connect(vibratoGain);
	vibratoGain.connect(osc.frequency);

	/* ---------------- Envelope ---------------- */

	const gain = ctx.createGain();
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.linearRampToValueAtTime(0.55, now + 0.02);
	gain.gain.linearRampToValueAtTime(0.0001, now + 0.18);

	/* ---------------- Tone shaping ---------------- */

	const filter = ctx.createBiquadFilter();
	filter.type = "lowpass";
	filter.frequency.value = 1600;
	filter.Q.value = 0.6;

	osc.connect(filter);
	filter.connect(gain);
	gain.connect(pan);

	vibrato.start(now);
	osc.start(now);

	osc.stop(now + 0.2);
	vibrato.stop(now + 0.2);
}

/* ---------- END OF ROUND FANFARE (180 BPM, RANDOMIZED, BASS) ---------- */


function playEndBuzzer() {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const master = ctx.createGain();
	master.gain.value = 0.45;
	master.connect(ctx.destination);

	const beat = 60 / 180;

	const chordPool = {
		cMajor: [
			[261.63, 329.63, 392.0],
			[261.63, 392.0, 523.25],
			[261.63, 329.63, 392.0, 523.25],
			[261.63, 329.63, 440.0]
		],
		cSharpDim: [
			[277.18, 329.63, 392.0],
			[277.18, 369.99, 392.0],
			[277.18, 329.63, 466.16]
		],
		dMajor: [
			[293.66, 369.99, 440.0],
			[293.66, 369.99, 493.88],
			[293.66, 440.0, 587.33]
		],
		gMaj7: [
			[196.0, 246.94, 392.0, 493.88],
			[196.0, 246.94, 392.0, 587.33],
			[196.0, 293.66, 392.0, 493.88]
		]
	};

	const progression = [
		{ pool: "cMajor", duration: beat },
		{ pool: "cMajor", duration: beat },
		{ pool: "cSharpDim", duration: beat },
		{ pool: "dMajor", duration: beat },
		{ pool: "gMaj7", duration: beat * 4, vibrato: true }
	];

	let t = now;

	progression.forEach(step => {
		const notes = chordPool[step.pool][Math.floor(Math.random() * chordPool[step.pool].length)];

		notes.forEach(freq => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.type = "triangle";
			osc.frequency.setValueAtTime(freq, t);

			if (step.vibrato) {
				const lfo = ctx.createOscillator();
				const lfoGain = ctx.createGain();
				lfo.frequency.value = 5.5;
				lfoGain.gain.value = 6;
				lfo.connect(lfoGain);
				lfoGain.connect(osc.frequency);
				lfo.start(t);
				lfo.stop(t + step.duration);
			}

			gain.gain.setValueAtTime(0.0001, t);
			gain.gain.exponentialRampToValueAtTime(0.9, t + 0.06);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + step.duration);

			osc.connect(gain);
			gain.connect(master);

			osc.start(t);
			osc.stop(t + step.duration);
		});

		const bassFreq =
			step.pool === "cMajor" ? 130.81 :
			step.pool === "cSharpDim" ? 138.59 :
			step.pool === "dMajor" ? 146.83 :
			98.0;

		const bassOsc = ctx.createOscillator();
		const bassGain = ctx.createGain();

		bassOsc.type = "sine";
		bassOsc.frequency.setValueAtTime(bassFreq, t);

		bassGain.gain.setValueAtTime(0.0001, t);
		bassGain.gain.exponentialRampToValueAtTime(0.6, t + 0.05);
		bassGain.gain.exponentialRampToValueAtTime(0.0001, t + step.duration);

		bassOsc.connect(bassGain);
		bassGain.connect(master);

		bassOsc.start(t);
		bassOsc.stop(t + step.duration);

		t += step.duration;
	});
}

function startRoundBeat(getProgressFn) {
	if (!isUnlocked) return;
	stopRoundBeat();

	const ctx = getAudioContext();
	ensureRunning(ctx);

	function scheduleNextBeat() {
		if (!isUnlocked) return;

		const progress = Math.max(0, Math.min(1, getProgressFn()));

		const minIntervalMs = 220;
		const maxIntervalMs = 720;

		const intervalMs =
			maxIntervalMs - (maxIntervalMs - minIntervalMs) * progress;

		playBeatPulse(progress);

		beatTimeout = setTimeout(scheduleNextBeat, intervalMs);
	}

	scheduleNextBeat();
}

function stopRoundBeat() {
	if (beatTimeout) {
		clearTimeout(beatTimeout);
		beatTimeout = null;
	}

	beatStepIndex = 0;
	beatRepeatCount = 0;
	beatRootMidi = 60;
}

function playBeatPulse(progress) {
	const ctx = getAudioContext();
	const now = ctx.currentTime;

	const master = ctx.createGain();
	master.gain.value = 0.25 + progress * 0.2;
	master.connect(ctx.destination);

	// musical tuning values

	const mainNoteGain = 0.42;
	const pickupNoteGain = 0.36;

	const mainNoteDuration = 0.28;
	const pickupNoteDuration = 0.11;

	const pickupLeadTime = 0.07;
	const pickupAttackTime = 0.02;
	const mainAttackTime = 0.04;

	// scale pattern 1 3 5 3

	const pattern = [0, 4, 7, 4];
	const step = pattern[beatStepIndex % pattern.length];

	const rootMidi = beatRootMidi;
	const targetMidi = rootMidi + step;
	const targetFreq =
		440 * Math.pow(2, (targetMidi - 69) / 12);

	// pickup note before the fifth

	if (step === 7) {
		const pickupMidi = targetMidi - 1;
		const pickupFreq =
			440 * Math.pow(2, (pickupMidi - 69) / 12);

		const pickupStart = now;
		const pickupEnd = pickupStart + pickupNoteDuration;

		const pickupOsc = ctx.createOscillator();
		const pickupGain = ctx.createGain();

		pickupOsc.type = "triangle";
		pickupOsc.frequency.setValueAtTime(pickupFreq, pickupStart);

		pickupGain.gain.setValueAtTime(0.0001, pickupStart);
		pickupGain.gain.exponentialRampToValueAtTime(
			pickupNoteGain,
			pickupStart + pickupAttackTime
		);
		pickupGain.gain.exponentialRampToValueAtTime(
			0.0001,
			pickupEnd
		);

		pickupOsc.connect(pickupGain);
		pickupGain.connect(master);

		pickupOsc.start(pickupStart);
		pickupOsc.stop(pickupEnd);
	}

	// main beat note

	const mainStart =
		step === 7 ? now + pickupLeadTime : now;

	const mainEnd = mainStart + mainNoteDuration;

	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = "triangle";
	osc.frequency.setValueAtTime(targetFreq, mainStart);

	gain.gain.setValueAtTime(0.0001, mainStart);
	gain.gain.exponentialRampToValueAtTime(
		mainNoteGain,
		mainStart + mainAttackTime
	);
	gain.gain.exponentialRampToValueAtTime(
		0.0001,
		mainEnd
	);

	osc.connect(gain);
	gain.connect(master);

	osc.start(mainStart);
	osc.stop(mainEnd);

	// progression state update

	beatStepIndex += 1;

	if (beatStepIndex % pattern.length === 0) {
		beatRepeatCount += 1;

		if (beatRepeatCount >= 2) {
			beatRepeatCount = 0;
			beatRootMidi += 2;
		}
	}
}



export {
	unlockAudio,
	playStartFlourish,
	playEverythingStinger,
	playHitSound,
	playMissSound,
	playRetreatSound,
	playMolePopSound,
	playEndBuzzer,
	setGameAudioMode,
	startRoundBeat,
	stopRoundBeat
};
