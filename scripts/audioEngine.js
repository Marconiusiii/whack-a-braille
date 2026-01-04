"use strict";

let audioContext = null;
let isUnlocked = false;
let hitBuffer = null;
let hitGainNode = null;
let gameAudioMode = "original";
let sillyHitBuffer = null;
let fiftyPointBuffer = null;
let sillyGainNode = null;

function checkFiftyPointSound(score) {
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

function playSillyHitSound() {
	if (!isUnlocked) return;
	if (!sillyHitBuffer || !sillyGainNode) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const src = ctx.createBufferSource();
	src.buffer = sillyHitBuffer;

	src.playbackRate.value = 0.95 + Math.random() * 0.2;

	src.connect(sillyGainNode);
	src.start();
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
	master.gain.value = 0.35;
	master.connect(ctx.destination);

	const notes = [392, 523, 659, 784];
	const dur = 0.25;

	notes.forEach((freq, i) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = "triangle";
		osc.frequency.setValueAtTime(freq, now + i * dur);

		gain.gain.setValueAtTime(0.0001, now + i * dur);
		gain.gain.exponentialRampToValueAtTime(0.8, now + i * dur + 0.05);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + i * dur + 0.22);

		osc.connect(gain);
		gain.connect(master);

		osc.start(now + i * dur);
		osc.stop(now + i * dur + 0.24);
	});
}

/* ---------- HIT SOUND ---------- */

function playOriginalHitSound() {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const master = ctx.createGain();
	master.gain.value = 0.5;
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
	gain.connect(master);

	bodyOsc.start(now);
	noise.start(now);
	springOsc.start(now + 0.05);

	bodyOsc.stop(now + 0.18);
	noise.stop(now + 0.06);
	springOsc.stop(now + 0.25);
}

function playHitSound(score) {
	if (gameAudioMode === "silly") {
		playSillyHitSound();
		checkFiftyPointSound(score);
		return;
	}

	playOriginalHitSound();
}


function playMissSound() {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const master = ctx.createGain();
	master.gain.value = 0.35;
	master.connect(ctx.destination);

	const osc = ctx.createOscillator();
	osc.type = "sine";
	osc.frequency.setValueAtTime(260, now);
	osc.frequency.exponentialRampToValueAtTime(170, now + 0.28);

	const gain = ctx.createGain();
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(0.7, now + 0.04);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

	osc.connect(gain);
	gain.connect(master);

	osc.start(now);
	osc.stop(now + 0.5);
}

/* ---------- MOLE RETREAT ---------- */

function playRetreatSound() {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const master = ctx.createGain();
	master.gain.value = 0.22;
	master.connect(ctx.destination);

	for (let i = 0; i < 6; i++) {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		const filter = ctx.createBiquadFilter();

		osc.type = "triangle";
		osc.frequency.setValueAtTime(900 - i * 80, now + i * 0.07);
		osc.frequency.exponentialRampToValueAtTime(700 - i * 80, now + i * 0.07 + 0.06);

		filter.type = "bandpass";
		filter.frequency.value = 1100;

		gain.gain.setValueAtTime(0.0001, now + i * 0.07);
		gain.gain.exponentialRampToValueAtTime(0.6, now + i * 0.07 + 0.015);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.1);

		osc.connect(filter);
		filter.connect(gain);
		gain.connect(master);

		osc.start(now + i * 0.07);
		osc.stop(now + i * 0.14);
	}
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
	playHitSound,
	playMissSound,
	playRetreatSound,
	playEndBuzzer,
	setGameAudioMode
};
