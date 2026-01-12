"use strict";

let audioContext = null;
let isUnlocked = false;
let hitBuffer = null;
let hitGainNode = null;
let gameAudioMode = "original";
let sillyHitBuffer = null;
let fiftyPointBuffer = null;
let sillyGainNode = null;

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
	master.gain.value = 0.55;
	master.connect(ctx.destination);

	const beat = 60 / 180;

	// Chord stab: dissonant → triumphant
	const stabChord = [261.63, 329.63, 392.0, 523.25];

	stabChord.forEach(freq => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = "triangle";
		osc.frequency.setValueAtTime(freq, now);

		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(1.0, now + 0.05);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + beat);

		osc.connect(gain);
		gain.connect(master);

		osc.start(now);
		osc.stop(now + beat);
	});

	// Massive octave leap sustain with vibrato
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = "triangle";
	osc.frequency.setValueAtTime(1046.5, now + beat);

	const lfo = ctx.createOscillator();
	const lfoGain = ctx.createGain();
	lfo.frequency.value = 4.8;
	lfoGain.gain.value = 10;
	lfo.connect(lfoGain);
	lfoGain.connect(osc.frequency);

	gain.gain.setValueAtTime(0.0001, now + beat);
	gain.gain.exponentialRampToValueAtTime(0.9, now + beat + 0.08);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + beat * 5);

	osc.connect(gain);
	gain.connect(master);

	lfo.start(now + beat);
	lfo.stop(now + beat * 5);

	osc.start(now + beat);
	osc.stop(now + beat * 5);
}

/* ---------- HIT SOUND ---------- */

function playOriginalHitSound(moleIndex) {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const master = ctx.createGain();
	master.gain.value = 0.7;
	master.connect(ctx.destination);

	const bodyOsc = ctx.createOscillator();
	bodyOsc.type = "sine";
	bodyOsc.frequency.setValueAtTime(140, now);
	bodyOsc.frequency.exponentialRampToValueAtTime(90, now + 0.08);

	const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
	const noiseData = noiseBuffer.getChannelData(0);
	for (let i = 0; i < noiseData.length; i++) {
		noiseData[i] = Math.random() * 2 - 1;
	}

	const noise = ctx.createBufferSource();
	noise.buffer = noiseBuffer;

	const noiseFilter = ctx.createBiquadFilter();
	noiseFilter.type = "lowpass";
	noiseFilter.frequency.value = 500;

	const springOsc = ctx.createOscillator();
	springOsc.type = "triangle";
	springOsc.frequency.setValueAtTime(420, now + 0.05);
	springOsc.frequency.exponentialRampToValueAtTime(900, now + 0.18);

	const gain = ctx.createGain();
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(1.0, now + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

	bodyOsc.connect(gain);
	noise.connect(noiseFilter);
	noiseFilter.connect(gain);
	springOsc.connect(gain);
	const pan = createMolePanner(ctx, moleIndex);
	gain.connect(pan);
	pan.connect(master);

	bodyOsc.start(now);
	noise.start(now);
	springOsc.start(now + 0.05);

	bodyOsc.stop(now + 0.18);
	noise.stop(now + 0.06);
	springOsc.stop(now + 0.25);
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

export {
	unlockAudio,
	playStartFlourish,
	playEverythingStinger,
	playHitSound,
	playMissSound,
	playRetreatSound,
	playMolePopSound,
	playEndBuzzer,
	setGameAudioMode
};
