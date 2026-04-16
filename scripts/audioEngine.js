"use strict";

let audioContext = null;
let isUnlocked = false;
let gameAudioMode = "original";
let sillyHitBuffer = null;
let fiftyPointBuffer = null;
let sillyGainNode = null;
let beatTimeout = null;
let beatStepIndex = 0;
let beatRepeatCount = 0;
const beatStartRootMidi = 55;

let beatRootMidi = beatStartRootMidi;

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
	gameAudioMode = mode === "silly" || mode === "goofy" || mode === "retro" ? mode : "original";
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

function getCurrentBeatHarmonyMidis() {
	const pattern = [0, 4, 7, 2];
	const patternIndex = beatStepIndex === 0 ? 0 : (beatStepIndex - 1) % pattern.length;
	const rootMidi = beatRootMidi;
	const currentStep = pattern[patternIndex];
	const currentMidi = rootMidi + currentStep;

	return {
		rootMidi,
		currentMidi,
		chordMidis: [rootMidi, rootMidi + 4, rootMidi + 7]
	};
}

function playRetroHitSound(moleIndex) {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const pan = createMolePanner(ctx, moleIndex);
	const master = ctx.createGain();
	master.gain.value = 1.05;
	pan.connect(master);
	master.connect(ctx.destination);

	const harmony = getCurrentBeatHarmonyMidis();
	const chordMidis = harmony.chordMidis;
	const leadMidiPool = [chordMidis[2] - 19, chordMidis[2] - 12, chordMidis[0], chordMidis[1]];
	const flourishMidis = [chordMidis[0], chordMidis[1], chordMidis[1] + 4];

	const bass = ctx.createOscillator();
	const bassGain = ctx.createGain();
	bass.type = "triangle";
	bass.frequency.setValueAtTime(midiToFreq(harmony.rootMidi - 10), now);
	bass.frequency.exponentialRampToValueAtTime(midiToFreq(harmony.rootMidi - 17), now + 0.18);
	bassGain.gain.setValueAtTime(0.0001, now);
	bassGain.gain.exponentialRampToValueAtTime(0.58, now + 0.008);
	bassGain.gain.exponentialRampToValueAtTime(0.14, now + 0.12);
	bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
	bass.connect(bassGain);
	bassGain.connect(pan);
	bass.start(now);
	bass.stop(now + 0.3);

	const rumble = ctx.createOscillator();
	const rumbleGain = ctx.createGain();
	rumble.type = "sine";
	rumble.frequency.setValueAtTime(midiToFreq(harmony.rootMidi - 22), now);
	rumble.frequency.exponentialRampToValueAtTime(midiToFreq(harmony.rootMidi - 29), now + 0.24);
	rumbleGain.gain.setValueAtTime(0.0001, now);
	rumbleGain.gain.exponentialRampToValueAtTime(0.24, now + 0.014);
	rumbleGain.gain.exponentialRampToValueAtTime(0.07, now + 0.16);
	rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
	rumble.connect(rumbleGain);
	rumbleGain.connect(pan);
	rumble.start(now);
	rumble.stop(now + 0.36);

	const leadStart = now + 0.01;
	leadMidiPool.forEach((midi, index) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		const start = leadStart + index * 0.01;
		const freq = midiToFreq(midi + 12);
		osc.type = index <= 1 ? "square" : "triangle";
		osc.frequency.setValueAtTime(freq, start);
		const vibrato = ctx.createOscillator();
		const vibratoGain = ctx.createGain();
		vibrato.type = "sine";
		vibrato.frequency.value = 7.8;
		vibratoGain.gain.setValueAtTime(10, start);
		vibratoGain.gain.exponentialRampToValueAtTime(1.2, start + 0.38);
		vibrato.connect(vibratoGain);
		vibratoGain.connect(osc.frequency);
		gain.gain.setValueAtTime(0.0001, start);
		gain.gain.exponentialRampToValueAtTime(index === 0 ? 0.13 : index === 1 ? 0.17 : 0.11, start + 0.006);
		gain.gain.exponentialRampToValueAtTime(0.08, start + 0.1);
		gain.gain.exponentialRampToValueAtTime(0.03, start + 0.18);
		gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.38);
		osc.connect(gain);
		gain.connect(pan);
		osc.start(start);
		vibrato.start(start);
		osc.stop(start + 0.4);
		vibrato.stop(start + 0.4);
	});

	flourishMidis.forEach((midi, index) => {
		const flourish = ctx.createOscillator();
		const flourishGain = ctx.createGain();
		const flourishStart = now + 0.05 + index * 0.028;
		const flourishFreq = midiToFreq(midi + 12);
		flourish.type = "square";
		flourish.frequency.setValueAtTime(flourishFreq, flourishStart);
		flourish.frequency.exponentialRampToValueAtTime(flourishFreq * 1.02, flourishStart + 0.06);
		flourishGain.gain.setValueAtTime(0.0001, flourishStart);
		flourishGain.gain.exponentialRampToValueAtTime(0.05 - index * 0.008, flourishStart + 0.006);
		flourishGain.gain.exponentialRampToValueAtTime(0.0001, flourishStart + 0.085);
		flourish.connect(flourishGain);
		flourishGain.connect(pan);
		flourish.start(flourishStart);
		flourish.stop(flourishStart + 0.09);
	});
}

function playRetroMissSound(moleIndex) {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const pan = createMolePanner(ctx, moleIndex);
	const master = ctx.createGain();
	master.gain.value = 0.72;
	pan.connect(master);
	master.connect(ctx.destination);

	const bass = ctx.createOscillator();
	const bassGain = ctx.createGain();
	bass.type = "triangle";
	bass.frequency.setValueAtTime(132 + Math.random() * 12, now);
	bass.frequency.exponentialRampToValueAtTime(74 + Math.random() * 8, now + 0.12);
	bass.frequency.exponentialRampToValueAtTime(54 + Math.random() * 6, now + 0.28);
	bassGain.gain.setValueAtTime(0.0001, now);
	bassGain.gain.exponentialRampToValueAtTime(0.14, now + 0.018);
	bassGain.gain.exponentialRampToValueAtTime(0.05, now + 0.12);
	bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
	bass.connect(bassGain);
	bassGain.connect(pan);
	bass.start(now);
	bass.stop(now + 0.32);

	const failStart = now + 0.01;
	const failA = 520 + Math.random() * 100;
	const failB = failA * (Math.random() < 0.5 ? 0.79 : 0.67);
	[failA, failB].forEach((freq, index) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = index === 0 ? "square" : "sawtooth";
		osc.frequency.setValueAtTime(freq, failStart);
		osc.frequency.exponentialRampToValueAtTime(freq * 0.76, failStart + 0.12);
		osc.frequency.exponentialRampToValueAtTime(freq * 0.6, failStart + 0.24);
		gain.gain.setValueAtTime(0.0001, failStart);
		gain.gain.exponentialRampToValueAtTime(index === 0 ? 0.1 : 0.06, failStart + 0.012);
		gain.gain.exponentialRampToValueAtTime(0.03, failStart + 0.12);
		gain.gain.exponentialRampToValueAtTime(0.0001, failStart + 0.28);
		osc.connect(gain);
		gain.connect(pan);
		osc.start(failStart);
		osc.stop(failStart + 0.3);
	});

	const blip = ctx.createOscillator();
	const blipGain = ctx.createGain();
	const blipStart = now + 0.12;
	blip.type = "square";
	blip.frequency.setValueAtTime(340 + Math.random() * 60, blipStart);
	blip.frequency.exponentialRampToValueAtTime(240 + Math.random() * 40, blipStart + 0.1);
	blipGain.gain.setValueAtTime(0.0001, blipStart);
	blipGain.gain.exponentialRampToValueAtTime(0.045, blipStart + 0.01);
	blipGain.gain.exponentialRampToValueAtTime(0.0001, blipStart + 0.12);
	blip.connect(blipGain);
	blipGain.connect(pan);
	blip.start(blipStart);
	blip.stop(blipStart + 0.14);
}

function playRetroRetreatSound(moleIndex) {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const pan = createMolePanner(ctx, moleIndex);
	const master = ctx.createGain();
	master.gain.value = 0.82;
	pan.connect(master);
	master.connect(ctx.destination);

	const bass = ctx.createOscillator();
	const bassGain = ctx.createGain();
	bass.type = "triangle";
	bass.frequency.setValueAtTime(148 + Math.random() * 14, now);
	bass.frequency.exponentialRampToValueAtTime(84 + Math.random() * 8, now + 0.16);
	bass.frequency.exponentialRampToValueAtTime(52 + Math.random() * 6, now + 0.34);
	bassGain.gain.setValueAtTime(0.0001, now);
	bassGain.gain.exponentialRampToValueAtTime(0.18, now + 0.016);
	bassGain.gain.exponentialRampToValueAtTime(0.06, now + 0.16);
	bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
	bass.connect(bassGain);
	bassGain.connect(pan);
	bass.start(now);
	bass.stop(now + 0.38);

	const retreatStart = now + 0.008;
	const phrase = [780, 620, 500, 360].map(freq => freq + Math.random() * 40);
	phrase.forEach((freq, index) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		const stepStart = retreatStart + index * 0.055;
		osc.type = index % 2 === 0 ? "square" : "triangle";
		osc.frequency.setValueAtTime(freq, stepStart);
		osc.frequency.exponentialRampToValueAtTime(freq * 0.9, stepStart + 0.04);
		gain.gain.setValueAtTime(0.0001, stepStart);
		gain.gain.exponentialRampToValueAtTime(index === 0 ? 0.12 : 0.09, stepStart + 0.006);
		gain.gain.exponentialRampToValueAtTime(0.0001, stepStart + 0.06);
		osc.connect(gain);
		gain.connect(pan);
		osc.start(stepStart);
		osc.stop(stepStart + 0.07);
	});

	const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.2), ctx.sampleRate);
	const noiseData = noiseBuffer.getChannelData(0);
	for (let i = 0; i < noiseData.length; i++) {
		const t = i / noiseData.length;
		const gate = Math.sin(t * Math.PI * 26) > 0 ? 1 : -1;
		noiseData[i] = (Math.random() * 2 - 1) * gate * (0.3 - t * 0.2);
	}
	const dirt = ctx.createBufferSource();
	dirt.buffer = noiseBuffer;
	const dirtFilter = ctx.createBiquadFilter();
	dirtFilter.type = "lowpass";
	dirtFilter.frequency.setValueAtTime(920, now + 0.1);
	dirtFilter.frequency.exponentialRampToValueAtTime(220, now + 0.34);
	const dirtGain = ctx.createGain();
	const dirtStart = now + 0.08;
	dirtGain.gain.setValueAtTime(0.0001, dirtStart);
	dirtGain.gain.exponentialRampToValueAtTime(0.17, dirtStart + 0.03);
	dirtGain.gain.exponentialRampToValueAtTime(0.06, dirtStart + 0.16);
	dirtGain.gain.exponentialRampToValueAtTime(0.0001, dirtStart + 0.26);
	dirt.connect(dirtFilter);
	dirtFilter.connect(dirtGain);
	dirtGain.connect(pan);
	dirt.start(dirtStart);
	dirt.stop(dirtStart + 0.28);
}

function playCartoonWhackHit(moleIndex) {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const pan = createMolePanner(ctx, moleIndex);
	const master = ctx.createGain();
	master.gain.value = 0.92;
	pan.connect(master);
	master.connect(ctx.destination);

	const lowThunk = ctx.createOscillator();
	const lowThunkGain = ctx.createGain();
	lowThunk.type = "sine";
	lowThunk.frequency.setValueAtTime(88 + Math.random() * 10, now);
	lowThunk.frequency.exponentialRampToValueAtTime(42 + Math.random() * 5, now + 0.18);
	lowThunkGain.gain.setValueAtTime(0.0001, now);
	lowThunkGain.gain.linearRampToValueAtTime(1.25, now + 0.014);
	lowThunkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
	lowThunk.connect(lowThunkGain);
	lowThunkGain.connect(pan);
	lowThunk.start(now);
	lowThunk.stop(now + 0.24);

	const bodyNoiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.14), ctx.sampleRate);
	const bodyNoiseData = bodyNoiseBuffer.getChannelData(0);
	for (let i = 0; i < bodyNoiseData.length; i++) {
		const decay = 1 - (i / bodyNoiseData.length);
		bodyNoiseData[i] = (Math.random() * 2 - 1) * decay;
	}
	const bodyNoise = ctx.createBufferSource();
	bodyNoise.buffer = bodyNoiseBuffer;
	const bodyFilter = ctx.createBiquadFilter();
	bodyFilter.type = "bandpass";
	bodyFilter.frequency.setValueAtTime(280 + Math.random() * 70, now);
	bodyFilter.Q.value = 0.8;
	const bodyNoiseGain = ctx.createGain();
	bodyNoiseGain.gain.setValueAtTime(0.0001, now);
	bodyNoiseGain.gain.linearRampToValueAtTime(0.52, now + 0.01);
	bodyNoiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
	bodyNoise.connect(bodyFilter);
	bodyFilter.connect(bodyNoiseGain);
	bodyNoiseGain.connect(pan);
	bodyNoise.start(now);
	bodyNoise.stop(now + 0.15);

	const bodyTone = ctx.createOscillator();
	const bodyToneGain = ctx.createGain();
	bodyTone.type = "triangle";
	const bodyStart = 155 + Math.random() * 35;
	bodyTone.frequency.setValueAtTime(bodyStart, now);
	bodyTone.frequency.exponentialRampToValueAtTime(95 + Math.random() * 18, now + 0.18);
	bodyToneGain.gain.setValueAtTime(0.0001, now);
	bodyToneGain.gain.linearRampToValueAtTime(0.58, now + 0.018);
	bodyToneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
	bodyTone.connect(bodyToneGain);
	bodyToneGain.connect(pan);
	bodyTone.start(now);
	bodyTone.stop(now + 0.26);

	const oofOsc = ctx.createOscillator();
	const oofGain = ctx.createGain();
	const oofFilter = ctx.createBiquadFilter();
	const oofStart = now + 0.012;
	oofOsc.type = "sawtooth";
	oofOsc.frequency.setValueAtTime(185 + Math.random() * 20, oofStart);
	oofOsc.frequency.exponentialRampToValueAtTime(120 + Math.random() * 12, oofStart + 0.12);
	oofOsc.frequency.exponentialRampToValueAtTime(92 + Math.random() * 8, oofStart + 0.28);
	oofFilter.type = "lowpass";
	oofFilter.frequency.setValueAtTime(720, oofStart);
	oofFilter.frequency.exponentialRampToValueAtTime(380, oofStart + 0.2);
	oofFilter.Q.value = 0.45;
	oofGain.gain.setValueAtTime(0.0001, oofStart);
	oofGain.gain.linearRampToValueAtTime(0.3, oofStart + 0.016);
	oofGain.gain.exponentialRampToValueAtTime(0.12, oofStart + 0.14);
	oofGain.gain.exponentialRampToValueAtTime(0.0001, oofStart + 0.31);
	oofOsc.connect(oofFilter);
	oofFilter.connect(oofGain);
	oofGain.connect(pan);
	oofOsc.start(oofStart);
	oofOsc.stop(oofStart + 0.33);

	const reboundOsc = ctx.createOscillator();
	const reboundGain = ctx.createGain();
	const reboundStart = now + 0.11;
	reboundOsc.type = "sine";
	reboundOsc.frequency.setValueAtTime(74 + Math.random() * 6, reboundStart);
	reboundOsc.frequency.exponentialRampToValueAtTime(56 + Math.random() * 5, reboundStart + 0.18);
	reboundGain.gain.setValueAtTime(0.0001, reboundStart);
	reboundGain.gain.linearRampToValueAtTime(0.22, reboundStart + 0.015);
	reboundGain.gain.exponentialRampToValueAtTime(0.0001, reboundStart + 0.22);
	reboundOsc.connect(reboundGain);
	reboundGain.connect(pan);
	reboundOsc.start(reboundStart);
	reboundOsc.stop(reboundStart + 0.24);

	const boingOsc = ctx.createOscillator();
	const boingGain = ctx.createGain();
	boingOsc.type = "triangle";
	const boingBase = 228 + Math.random() * 92;
	const boingStart = now + 0.03;
	const boingDuration = 0.79;
	const springCycles = 4 + Math.random() * 3;
	const wobbleRate = springCycles / boingDuration;
	boingOsc.frequency.setValueAtTime(boingBase, boingStart);
	boingGain.gain.setValueAtTime(0.0001, boingStart);
	boingGain.gain.exponentialRampToValueAtTime(0.14 + Math.random() * 0.13, boingStart + 0.03);
	boingGain.gain.exponentialRampToValueAtTime(0.09, boingStart + 0.16);
	boingGain.gain.exponentialRampToValueAtTime(0.05, boingStart + 0.38);
	boingGain.gain.exponentialRampToValueAtTime(0.018, boingStart + 0.58);
	boingGain.gain.exponentialRampToValueAtTime(0.0001, boingStart + 0.76);
	boingOsc.connect(boingGain);
	boingGain.connect(pan);
	boingOsc.start(boingStart);
	boingOsc.stop(boingStart + boingDuration);

	const wobble = ctx.createOscillator();
	const wobbleGain = ctx.createGain();
	wobble.type = "sine";
	wobble.frequency.value = wobbleRate;
	wobbleGain.gain.setValueAtTime(28, boingStart);
	wobbleGain.gain.exponentialRampToValueAtTime(9.2, boingStart + 0.42);
	wobbleGain.gain.exponentialRampToValueAtTime(1.4, boingStart + 0.76);
	wobble.connect(wobbleGain);
	wobbleGain.connect(boingOsc.frequency);
	wobble.start(boingStart);
	wobble.stop(boingStart + boingDuration);

	if (Math.random() < 0.38) {
		const glitterBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
		const glitterData = glitterBuffer.getChannelData(0);
		for (let i = 0; i < glitterData.length; i++) {
			const decay = 1 - (i / glitterData.length);
			glitterData[i] = (Math.random() * 2 - 1) * decay;
		}
		const glitterNoise = ctx.createBufferSource();
		glitterNoise.buffer = glitterBuffer;
		const glitterFilter = ctx.createBiquadFilter();
		glitterFilter.type = "highpass";
		glitterFilter.frequency.value = 2600;
		const glitterGain = ctx.createGain();
		const glitterStart = now + 0.045;
		glitterGain.gain.setValueAtTime(0.0001, glitterStart);
		glitterGain.gain.exponentialRampToValueAtTime(0.05, glitterStart + 0.012);
		glitterGain.gain.exponentialRampToValueAtTime(0.0001, glitterStart + 0.09);
		glitterNoise.connect(glitterFilter);
		glitterFilter.connect(glitterGain);
		glitterGain.connect(pan);
		glitterNoise.start(glitterStart);
		glitterNoise.stop(glitterStart + 0.09);
	}
}

function playCartoonMissSound(moleIndex) {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const pan = createMolePanner(ctx, moleIndex);
	const master = ctx.createGain();
	master.gain.value = 0.74;
	pan.connect(master);
	master.connect(ctx.destination);

	const whooshBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.68), ctx.sampleRate);
	const whooshData = whooshBuffer.getChannelData(0);
	for (let i = 0; i < whooshData.length; i++) {
		const decay = 1 - (i / whooshData.length);
		whooshData[i] = (Math.random() * 2 - 1) * decay;
	}
	const whoosh = ctx.createBufferSource();
	whoosh.buffer = whooshBuffer;
	const filter = ctx.createBiquadFilter();
	filter.type = "bandpass";
	const wideWhoosh = Math.random() < 0.5;
	const whooshStart = wideWhoosh ? 1080 + Math.random() * 140 : 700 + Math.random() * 200;
	const whooshEnd = wideWhoosh ? 380 + Math.random() * 90 : 300 + Math.random() * 100;
	filter.frequency.setValueAtTime(whooshStart, now);
	filter.frequency.exponentialRampToValueAtTime(whooshEnd, now + 0.6);
	filter.Q.value = wideWhoosh ? 0.68 : 0.82;
	const gain = ctx.createGain();
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(0.22, now + 0.08);
	gain.gain.exponentialRampToValueAtTime(0.12, now + 0.26);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
	whoosh.connect(filter);
	filter.connect(gain);
	gain.connect(pan);
	whoosh.start(now);

	const swooshOsc = ctx.createOscillator();
	const swooshGain = ctx.createGain();
	const swooshFilter = ctx.createBiquadFilter();
	swooshOsc.type = "sine";
	swooshOsc.frequency.setValueAtTime(96 + Math.random() * 18, now);
	swooshOsc.frequency.exponentialRampToValueAtTime(52 + Math.random() * 10, now + 0.34);
	swooshOsc.frequency.exponentialRampToValueAtTime(38 + Math.random() * 8, now + 0.6);
	swooshFilter.type = "lowpass";
	swooshFilter.frequency.value = 220;
	swooshFilter.Q.value = 0.4;
	swooshGain.gain.setValueAtTime(0.0001, now);
	swooshGain.gain.exponentialRampToValueAtTime(0.06, now + 0.08);
	swooshGain.gain.exponentialRampToValueAtTime(0.03, now + 0.3);
	swooshGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
	swooshOsc.connect(swooshFilter);
	swooshFilter.connect(swooshGain);
	swooshGain.connect(pan);
	swooshOsc.start(now);
	swooshOsc.stop(now + 0.64);

	const whistleOsc = ctx.createOscillator();
	const whistleGain = ctx.createGain();
	const whistleStart = now + 0.02;
	whistleOsc.type = "triangle";
	if (wideWhoosh) {
		whistleOsc.frequency.setValueAtTime(450 + Math.random() * 80, whistleStart);
		whistleOsc.frequency.exponentialRampToValueAtTime(280 + Math.random() * 40, whistleStart + 0.36);
	} else {
		whistleOsc.frequency.setValueAtTime(360 + Math.random() * 90, whistleStart);
		whistleOsc.frequency.exponentialRampToValueAtTime(500 + Math.random() * 60, whistleStart + 0.16);
		whistleOsc.frequency.exponentialRampToValueAtTime(240 + Math.random() * 50, whistleStart + 0.46);
	}
	whistleGain.gain.setValueAtTime(0.0001, whistleStart);
	whistleGain.gain.exponentialRampToValueAtTime(0.035, whistleStart + 0.03);
	whistleGain.gain.exponentialRampToValueAtTime(0.018, whistleStart + 0.24);
	whistleGain.gain.exponentialRampToValueAtTime(0.0001, whistleStart + 0.38);
	whistleOsc.connect(whistleGain);
	whistleGain.connect(pan);
	whistleOsc.start(whistleStart);
	whistleOsc.stop(whistleStart + 0.5);

	whoosh.stop(now + 0.68);
}

function playCartoonRetreatSound(moleIndex) {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const pan = createMolePanner(ctx, moleIndex);
	const master = ctx.createGain();
	master.gain.value = 1.02;
	pan.connect(master);
	master.connect(ctx.destination);

	const scamperBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.52), ctx.sampleRate);
	const scamperData = scamperBuffer.getChannelData(0);
	for (let i = 0; i < scamperData.length; i++) {
		const t = i / scamperData.length;
		const grain = Math.sin(t * Math.PI * 22) > 0 ? 1 : -1;
		scamperData[i] = (Math.random() * 2 - 1) * grain * (0.24 - t * 0.16);
	}
	const scamperNoise = ctx.createBufferSource();
	scamperNoise.buffer = scamperBuffer;
	const scamperFilter = ctx.createBiquadFilter();
	scamperFilter.type = "lowpass";
	scamperFilter.frequency.setValueAtTime(520, now);
	scamperFilter.frequency.setValueAtTime(430, now + 0.08);
	scamperFilter.frequency.setValueAtTime(350, now + 0.18);
	scamperFilter.frequency.exponentialRampToValueAtTime(210, now + 0.46);
	scamperFilter.Q.value = 0.4;
	const scamperGain = ctx.createGain();
	scamperGain.gain.setValueAtTime(0.0001, now);
	scamperGain.gain.exponentialRampToValueAtTime(0.28, now + 0.025);
	scamperGain.gain.exponentialRampToValueAtTime(0.12, now + 0.3);
	scamperGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
	scamperNoise.connect(scamperFilter);
	scamperFilter.connect(scamperGain);
	scamperGain.connect(pan);
	scamperNoise.start(now);
	scamperNoise.stop(now + 0.52);

	const sneakyOsc = ctx.createOscillator();
	const sneakyGain = ctx.createGain();
	const lowBurrowOsc = ctx.createOscillator();
	const lowBurrowGain = ctx.createGain();
	const deepDigOsc = ctx.createOscillator();
	const deepDigGain = ctx.createGain();
	sneakyOsc.type = "triangle";
	sneakyOsc.frequency.setValueAtTime(360 + Math.random() * 30, now);
	sneakyOsc.frequency.setValueAtTime(330, now + 0.06);
	sneakyOsc.frequency.setValueAtTime(290, now + 0.14);
	sneakyOsc.frequency.setValueAtTime(245, now + 0.22);
	sneakyOsc.frequency.exponentialRampToValueAtTime(185, now + 0.5);
	sneakyGain.gain.setValueAtTime(0.0001, now);
	sneakyGain.gain.exponentialRampToValueAtTime(0.18, now + 0.015);
	sneakyGain.gain.exponentialRampToValueAtTime(0.08, now + 0.24);
	sneakyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
	sneakyOsc.connect(sneakyGain);
	sneakyGain.connect(pan);
	sneakyOsc.start(now);
	sneakyOsc.stop(now + 0.54);

	lowBurrowOsc.type = "sine";
	lowBurrowOsc.frequency.setValueAtTime(122 + Math.random() * 10, now + 0.04);
	lowBurrowOsc.frequency.exponentialRampToValueAtTime(72 + Math.random() * 8, now + 0.26);
	lowBurrowOsc.frequency.exponentialRampToValueAtTime(46 + Math.random() * 6, now + 0.6);
	lowBurrowGain.gain.setValueAtTime(0.0001, now + 0.04);
	lowBurrowGain.gain.exponentialRampToValueAtTime(0.16, now + 0.1);
	lowBurrowGain.gain.exponentialRampToValueAtTime(0.07, now + 0.34);
	lowBurrowGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.66);
	lowBurrowOsc.connect(lowBurrowGain);
	lowBurrowGain.connect(pan);
	lowBurrowOsc.start(now + 0.04);
	lowBurrowOsc.stop(now + 0.68);

	deepDigOsc.type = "sine";
	deepDigOsc.frequency.setValueAtTime(68 + Math.random() * 8, now + 0.06);
	deepDigOsc.frequency.exponentialRampToValueAtTime(42 + Math.random() * 5, now + 0.3);
	deepDigOsc.frequency.exponentialRampToValueAtTime(28 + Math.random() * 4, now + 0.72);
	deepDigGain.gain.setValueAtTime(0.0001, now + 0.06);
	deepDigGain.gain.exponentialRampToValueAtTime(0.14, now + 0.14);
	deepDigGain.gain.exponentialRampToValueAtTime(0.08, now + 0.38);
	deepDigGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.78);
	deepDigOsc.connect(deepDigGain);
	deepDigGain.connect(pan);
	deepDigOsc.start(now + 0.06);
	deepDigOsc.stop(now + 0.8);

	const dirtBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.42), ctx.sampleRate);
	const dirtData = dirtBuffer.getChannelData(0);
	for (let i = 0; i < dirtData.length; i++) {
		const t = i / dirtData.length;
		const chunk = Math.sin(t * Math.PI * 10) > 0 ? 1 : -1;
		const grit = (Math.random() * 2 - 1) * (0.2 - t * 0.12);
		const clump = (Math.random() * 2 - 1) * chunk * (0.54 - t * 0.28);
		dirtData[i] = clump + grit;
	}
	const dirtNoise = ctx.createBufferSource();
	dirtNoise.buffer = dirtBuffer;
	const dirtFilter = ctx.createBiquadFilter();
	dirtFilter.type = "lowpass";
	dirtFilter.frequency.setValueAtTime(760, now + 0.26);
	dirtFilter.frequency.exponentialRampToValueAtTime(130, now + 0.86);
	dirtFilter.Q.value = 0.35;
	const dirtGain = ctx.createGain();
	const dirtStart = now + 0.08;
	dirtGain.gain.setValueAtTime(0.0001, dirtStart);
	dirtGain.gain.exponentialRampToValueAtTime(0.24, dirtStart + 0.04);
	dirtGain.gain.exponentialRampToValueAtTime(0.66, dirtStart + 0.14);
	dirtGain.gain.exponentialRampToValueAtTime(0.32, dirtStart + 0.44);
	dirtGain.gain.exponentialRampToValueAtTime(0.0001, dirtStart + 0.64);
	dirtNoise.connect(dirtFilter);
	dirtFilter.connect(dirtGain);
	dirtGain.connect(pan);
	dirtNoise.start(dirtStart);
	dirtNoise.stop(dirtStart + 0.66);
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
	master.gain.value = 1.0;
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

	// bright click for a cleaner arcade snap on contact
	const clickOsc = ctx.createOscillator();
	const clickGain = ctx.createGain();
	clickOsc.type = "square";
	clickOsc.frequency.setValueAtTime(1300 + Math.random() * 180, now);
	clickOsc.frequency.exponentialRampToValueAtTime(420, now + 0.03);
	clickGain.gain.setValueAtTime(0.0001, now);
	clickGain.gain.exponentialRampToValueAtTime(0.14, now + 0.005);
	clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
	clickOsc.connect(clickGain);
	clickGain.connect(pan);
	clickOsc.start(now);
	clickOsc.stop(now + 0.05);

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

function midiToFreq(midi) {
	return 440 * Math.pow(2, (midi - 69) / 12);
}

function schedulePrizeTone(ctx, master, start, duration, frequency, peak, type = "triangle", vibratoRate = 0, vibratoDepth = 0) {
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(frequency, start);

	if (vibratoRate > 0 && vibratoDepth > 0) {
		const vibrato = ctx.createOscillator();
		const vibratoGain = ctx.createGain();
		vibrato.type = "sine";
		vibrato.frequency.value = vibratoRate;
		vibratoGain.gain.value = vibratoDepth;
		vibrato.connect(vibratoGain);
		vibratoGain.connect(osc.frequency);
		vibrato.start(start);
		vibrato.stop(start + duration);
	}

	gain.gain.setValueAtTime(0.0001, start);
	gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
	gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
	osc.connect(gain);
	gain.connect(master);
	osc.start(start);
	osc.stop(start + duration);
}

function schedulePrizeBell(ctx, master, start, duration, startFreq, endFreq, peak = 0.08) {
	const bell = ctx.createOscillator();
	const gain = ctx.createGain();
	bell.type = "triangle";
	bell.frequency.setValueAtTime(startFreq, start);
	bell.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
	gain.gain.setValueAtTime(0.0001, start);
	gain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
	bell.connect(gain);
	gain.connect(master);
	bell.start(start);
	bell.stop(start + duration);
}

function playPrizeFanfare(tier = 1) {
	if (!isUnlocked) return;

	const ctx = getAudioContext();
	ensureRunning(ctx);

	const now = ctx.currentTime;
	const master = ctx.createGain();
	const safeTier = Math.min(Math.max(Number(tier) || 1, 1), 5);
	master.gain.value = 0.68;
	master.connect(ctx.destination);

	const configs = {
		1: { baseMidi: 63 + Math.floor(Math.random() * 3), melody: [0, 4], starts: [0.0, 0.16], durations: [0.2, 0.28], pad: [0, 4] },
		2: { baseMidi: 59 + Math.floor(Math.random() * 3), melody: [0, 4, 7], starts: [0.0, 0.12, 0.26], durations: [0.18, 0.18, 0.34], pad: [0, 4, 7] },
		3: { baseMidi: 62 + Math.floor(Math.random() * 3), melody: [0, 4, 7, 11], starts: [0.0, 0.12, 0.24, 0.36], durations: [0.2, 0.2, 0.2, 0.46], pad: [0, 4, 7] },
		4: { baseMidi: 61 + Math.floor(Math.random() * 3), melody: [0, 4, 7, 12], starts: [0.0, 0.12, 0.24, 0.37], durations: [0.22, 0.22, 0.22, 0.62], pad: [0, 4, 7, 12] },
		5: { baseMidi: 65 + Math.floor(Math.random() * 3), melody: [0, 4, 7, 11, 16, 19], starts: [0.0, 0.11, 0.23, 0.36, 0.5, 0.68], durations: [0.22, 0.22, 0.22, 0.22, 0.22, 0.72], pad: [0, 7, 12, 16] }
	};
	const config = configs[safeTier];

	config.melody.forEach((step, index) => {
		schedulePrizeTone(
			ctx,
			master,
			now + config.starts[index],
			config.durations[index],
			midiToFreq(config.baseMidi + step),
			safeTier >= 4 ? 0.32 : safeTier === 3 ? 0.26 : safeTier === 2 ? 0.21 : 0.18,
			"triangle",
			index === config.melody.length - 1 && safeTier >= 4 ? (safeTier === 5 ? 4.2 : 4.8) : 0,
			index === config.melody.length - 1 && safeTier >= 4 ? (safeTier === 5 ? 1.6 : 2.7) : 0
		);
	});

	config.pad.forEach(step => {
		schedulePrizeTone(
			ctx,
			master,
			now + 0.05,
			safeTier >= 5 ? 0.72 : safeTier >= 4 ? 0.48 : 0.36,
			midiToFreq(config.baseMidi + step),
			safeTier >= 4 ? 0.11 : 0.08,
			"sine"
		);
	});

	if (safeTier >= 2) {
		schedulePrizeTone(ctx, master, now, 0.08, 900 + safeTier * 60, 0.08 + safeTier * 0.01, "sine");
	}

	if (safeTier >= 3) {
		[0.18, 0.27, 0.34, 0.42].forEach((offset, index) => {
			const sparkleFreq = midiToFreq(config.baseMidi + 19 + index);
			schedulePrizeBell(ctx, master, now + offset, 0.18, sparkleFreq, sparkleFreq * 1.6, 0.06);
		});
	}

	if (safeTier >= 4) {
		const glissStart = now + (safeTier === 5 ? 0.52 : 0.18);
		const glissDuration = safeTier === 5 ? 0.44 : 0.4;
		const bellCount = safeTier === 5 ? 6 : 4;
		for (let i = 0; i < bellCount; i++) {
			const progress = i / Math.max(1, bellCount - 1);
			const startFreq = midiToFreq(config.baseMidi + (safeTier === 5 ? 12 : 16)) * Math.pow(2, progress * 0.08);
			const endFreq = midiToFreq(config.baseMidi + (safeTier === 5 ? 31 : 30)) * Math.pow(2, progress * 0.06);
			schedulePrizeBell(ctx, master, glissStart + i * 0.03, glissDuration - i * 0.03, startFreq, endFreq, safeTier === 5 ? 0.09 : 0.07);
		}
	}
}



function playHitSound(score, moleIndex) {
	if (gameAudioMode === "silly") {
		playSillyHitSound(moleIndex);
		checkFiftyPointSound(score);
		return;
	}

	if (gameAudioMode === "goofy") {
		playCartoonWhackHit(moleIndex);
		return;
	}

	if (gameAudioMode === "retro") {
		playRetroHitSound(moleIndex);
		return;
	}

	playOriginalHitSound(moleIndex);
}


function playMissSound(moleIndex) {
	if (gameAudioMode === "retro") {
		playRetroMissSound(moleIndex);
		return;
	}

	if (gameAudioMode === "goofy") {
		playCartoonMissSound(moleIndex);
		return;
	}

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
	if (gameAudioMode === "retro") {
		playRetroRetreatSound(moleIndex);
		return;
	}

	if (gameAudioMode === "goofy") {
		playCartoonRetreatSound(moleIndex);
		return;
	}

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
	beatRootMidi = beatStartRootMidi;
}

function playBeatPulse(progress) {
	const ctx = getAudioContext();
	const now = ctx.currentTime;

	const master = ctx.createGain();
	master.gain.value = 0.25 + progress * 0.2;
	master.connect(ctx.destination);

	const noteGain = 0.42;
	const noteDuration = 0.26;
	const attackTime = 0.04;

	// scale pattern 1 3 5 2

	const pattern = [0, 4, 7, 2];
	const step = pattern[beatStepIndex % pattern.length];

	const rootMidi = beatRootMidi;
	const targetMidi = rootMidi + step;
	const targetFreq =
		440 * Math.pow(2, (targetMidi - 69) / 12);

	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = "triangle";
	osc.frequency.setValueAtTime(targetFreq, now);

	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(
		noteGain,
		now + attackTime
	);
	gain.gain.exponentialRampToValueAtTime(
		0.0001,
		now + noteDuration
	);

	osc.connect(gain);
	gain.connect(master);

	osc.start(now);
	osc.stop(now + noteDuration + 0.02);

	beatStepIndex += 1;

	if (beatStepIndex % pattern.length === 0) {
		beatRepeatCount += 1;

		if (beatRepeatCount >= 2) {
			beatRepeatCount = 0;
			beatRootMidi += 1;
		}
	}
}



export {
	unlockAudio,
	playStartFlourish,
	playEverythingStinger,
	playPrizeFanfare,
	playHitSound,
	playMissSound,
	playRetreatSound,
	playMolePopSound,
	playEndBuzzer,
	setGameAudioMode,
	startRoundBeat,
	stopRoundBeat
};
