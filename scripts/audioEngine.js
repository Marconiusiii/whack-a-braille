"use strict";

let audioContext = null;
let isUnlocked = false;

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

function playStartFlourish() {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;

	const master = ctx.createGain();
	master.gain.value = 0.35;
	master.connect(ctx.destination);

	const osc = ctx.createOscillator();
	osc.type = "triangle";

	osc.frequency.setValueAtTime(660, now);
	osc.frequency.setValueAtTime(880, now + 0.12);
	osc.frequency.setValueAtTime(1320, now + 0.24);

	const gain = ctx.createGain();
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(0.9, now + 0.02);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

	osc.connect(gain);
	gain.connect(master);

	osc.start(now);
	osc.stop(now + 0.4);
}

/* ---------- HIT SOUND (PUNCH + SPRING) ---------- */

function playHitSound() {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;

	const master = ctx.createGain();
	master.gain.value = 0.5;
	master.connect(ctx.destination);

	/* Low punch body */
	const bodyOsc = ctx.createOscillator();
	bodyOsc.type = "sine";
	bodyOsc.frequency.setValueAtTime(140, now);
	bodyOsc.frequency.exponentialRampToValueAtTime(90, now + 0.08);

	/* Noise impact */
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

	/* Springy rebound */
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

/* ---------- MISS SOUND (SAD, UNCHANGED) ---------- */

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

/* ---------- END OF ROUND FANFARE (HAPPY UPWARDS) ---------- */

function playEndBuzzer() {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;

	const master = ctx.createGain();
	master.gain.value = 0.45;
	master.connect(ctx.destination);

	const osc1 = ctx.createOscillator();
	const osc2 = ctx.createOscillator();

	osc1.type = "triangle";
	osc2.type = "sine";

	osc1.frequency.setValueAtTime(330, now);
	osc1.frequency.exponentialRampToValueAtTime(660, now + 0.9);

	osc2.frequency.setValueAtTime(220, now);
	osc2.frequency.exponentialRampToValueAtTime(440, now + 0.9);

	const gain = ctx.createGain();
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(1.0, now + 0.08);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

	osc1.connect(gain);
	osc2.connect(gain);
	gain.connect(master);

	osc1.start(now);
	osc2.start(now);

	osc1.stop(now + 1.2);
	osc2.stop(now + 1.2);
}

export {
	unlockAudio,
	playStartFlourish,
	playHitSound,
	playMissSound,
	playEndBuzzer
};
