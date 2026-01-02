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

function playHitSound() {
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

/* ---------- MISS SOUND ---------- */

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

/* ---------- MOLE RETREAT (LONGER SILLY CHITTER) ---------- */

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

/* ---------- END OF ROUND FANFARE (150 BPM, VIBRATO FINAL) ---------- */

function playEndBuzzer() {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const master = ctx.createGain();
	master.gain.value = 0.45;
	master.connect(ctx.destination);

	const beat = 60 / 150; // 150 BPM

	const sequence = [
		{ notes: [261.63, 329.63, 392.0], duration: beat }, // C major
		{ notes: [261.63, 329.63, 392.0], duration: beat }, // C major
		{ notes: [277.18, 329.63, 392.0], duration: beat }, // C# dim
		{ notes: [293.66, 369.99, 440.0], duration: beat }, // D major
		{ notes: [196.0, 246.94, 392.0, 493.88], duration: beat * 4, vibrato: true } // Gmaj7
	];

	let t = now;

	sequence.forEach(chord => {
		chord.notes.forEach(freq => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.type = "triangle";
			osc.frequency.setValueAtTime(freq, t);

			if (chord.vibrato) {
				const lfo = ctx.createOscillator();
				const lfoGain = ctx.createGain();
				lfo.frequency.value = 6;
				lfoGain.gain.value = 6;

				lfo.connect(lfoGain);
				lfoGain.connect(osc.frequency);

				lfo.start(t);
				lfo.stop(t + chord.duration);
			}

			gain.gain.setValueAtTime(0.0001, t);
			gain.gain.exponentialRampToValueAtTime(0.9, t + 0.08);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + chord.duration);

			osc.connect(gain);
			gain.connect(master);

			osc.start(t);
			osc.stop(t + chord.duration);
		});

		t += chord.duration;
	});
}

export {
	unlockAudio,
	playStartFlourish,
	playHitSound,
	playMissSound,
	playRetreatSound,
	playEndBuzzer
};
