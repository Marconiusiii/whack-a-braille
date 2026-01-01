"use strict";

/*
	Audio Engine for Whack a Braille

	- Audio-only feedback
	- No speech
	- Arcade-style synthesized sounds
	- Unlocks on user gesture
*/

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
	isUnlocked = true;
}

/* Utility */

function createGain(ctx, value) {
	const gain = ctx.createGain();
	gain.gain.value = value;
	return gain;
}

/* HIT SOUND */

function playHitSound() {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	const now = ctx.currentTime;

	const osc = ctx.createOscillator();
	const gain = createGain(ctx, 0.25);

	osc.type = "triangle";
	osc.frequency.setValueAtTime(520, now);
	osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

	osc.connect(gain);
	gain.connect(ctx.destination);

	osc.start(now);
	osc.stop(now + 0.15);
}

/* MISS SOUND */

function playMissSound() {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	const now = ctx.currentTime;

	const osc = ctx.createOscillator();
	const gain = createGain(ctx, 0.2);

	osc.type = "square";
	osc.frequency.setValueAtTime(260, now);
	osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(0.2, now + 0.03);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

	osc.connect(gain);
	gain.connect(ctx.destination);

	osc.start(now);
	osc.stop(now + 0.2);
}

/* Public API */

export {
	unlockAudio,
	playHitSound,
	playMissSound
};
