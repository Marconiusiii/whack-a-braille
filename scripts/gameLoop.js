"use strict";

import { getBrailleItemsForMode } from "./brailleRegistry.js";
import { setAttemptCallback } from "./inputEngine.js";
import { playHitSound, playMissSound } from "./audioEngine.js";
import { speak, cancelSpeech } from "./speechEngine.js";
import { computeMoleWindowMs, computeRoundEndGraceMs } from "./speechTuning.js";

let moleElements = [];
let roundDurationMs = 30000;

let availableItems = [];
let roundItems = [];
let activeMoleIndex = null;

let roundStartTime = 0;
let roundTimer = null;
let moleTimer = null;
let moleUpTimer = null;

let isRunning = false;
let roundEnding = false;

let currentModeId = "";
let currentInputMode = "qwerty";
let currentDurationSeconds = 30;

const startIntervalMs = 900;
const endIntervalMs = 300;
const startUpTimeMs = 650;
const endUpTimeMs = 250;

function initGameLoop(options) {
	moleElements = options.moleElements || [];
}

function startRound(modeId, durationSeconds, inputMode) {
	if (isRunning) return;

	currentModeId = modeId;
	currentDurationSeconds = durationSeconds;
	currentInputMode = inputMode;

	roundDurationMs = durationSeconds * 1000;
	availableItems = getBrailleItemsForMode(modeId);
	roundItems = pickFiveItems(availableItems);

	isRunning = true;
	roundEnding = false;
	roundStartTime = Date.now();

	setAttemptCallback(handleAttempt);

	clearTimeout(roundTimer);
	roundTimer = setTimeout(requestRoundEnd, roundDurationMs);

	scheduleNextMole(0);
}

function stopRound() {
	endRoundNow(true);
}

function requestRoundEnd() {
	if (!isRunning) return;
	roundEnding = true;

	clearTimeout(moleTimer);
	moleTimer = null;

	const grace = computeRoundEndGraceMs({ baseGraceMs: 350, maxGraceMs: 750 });

	clearTimeout(roundTimer);
	roundTimer = setTimeout(() => {
		endRoundNow(false);
	}, grace);
}

function endRoundNow(canceled) {
	if (!isRunning) return;

	isRunning = false;
	roundEnding = false;

	clearTimeout(roundTimer);
	roundTimer = null;

	clearTimeout(moleTimer);
	moleTimer = null;

	clearTimeout(moleUpTimer);
	moleUpTimer = null;

	clearActiveMole();

	setAttemptCallback(null);

	if (canceled) cancelSpeech();

	document.dispatchEvent(new CustomEvent("wabRoundEnded", {
		detail: {
			modeId: currentModeId,
			inputMode: currentInputMode,
			durationSeconds: currentDurationSeconds,
			canceled: !!canceled
		}
	}));
}

function pickFiveItems(pool) {
	const copy = [...pool];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy.slice(0, 5);
}

function getProgress() {
	const elapsed = Date.now() - roundStartTime;
	return Math.min(elapsed / roundDurationMs, 1);
}

function lerp(start, end, t) {
	return start + (end - start) * t;
}

function getCurrentInterval() {
	return Math.floor(lerp(startIntervalMs, endIntervalMs, getProgress()));
}

function getCurrentUpTime() {
	return Math.floor(lerp(startUpTimeMs, endUpTimeMs, getProgress()));
}

function randomJitter() {
	return Math.floor(Math.random() * 120);
}

function scheduleNextMole(extraDelayMs = 0) {
	if (!isRunning) return;
	if (roundEnding) return;

	const delay = getCurrentInterval() + randomJitter() + extraDelayMs;

	clearTimeout(moleTimer);
	moleTimer = setTimeout(() => {
		void showRandomMole();
	}, delay);
}

async function showRandomMole() {
	if (!isRunning) return;
	if (roundEnding) return;

	clearActiveMole();

	activeMoleIndex = pickNextMoleIndex();
	const moleItem = roundItems[activeMoleIndex];

	const speechResult = await speak(moleItem.announceText, {
		on: "start",
		timeoutMs: 350,
		cancelPrevious: true,
		dedupe: false
	});

	if (!isRunning) return;
	if (roundEnding) return;

	activateMoleVisual(activeMoleIndex);

	const baseUpTime = getCurrentUpTime();
	const upTime = computeMoleWindowMs({
		speechResult,
		baseUpTimeMs: baseUpTime,
		extraPadMs: 120,
		minUpTimeMs: 220,
		maxUpTimeMs: 1200
	});

	clearTimeout(moleUpTimer);
	moleUpTimer = setTimeout(() => {
		clearActiveMole();
		scheduleNextMole(0);
	}, upTime);
}

function pickNextMoleIndex() {
	let index;
	if (roundItems.length < 2) return 0;

	do {
		index = Math.floor(Math.random() * 5);
	} while (index === activeMoleIndex);

	return index;
}

function clearActiveMole() {
	if (activeMoleIndex === null) return;
	deactivateMoleVisual(activeMoleIndex);
	activeMoleIndex = null;
}

function activateMoleVisual(index) {
	const mole = moleElements[index];
	if (mole) mole.classList.add("active");
}

function deactivateMoleVisual(index) {
	const mole = moleElements[index];
	if (mole) mole.classList.remove("active");
}

function handleAttempt(attempt) {
	if (!isRunning) return;
	if (roundEnding) return;
	if (activeMoleIndex === null) return;

	if (currentInputMode === "perkins" && attempt.type === "standard") return;

	const currentItem = roundItems[activeMoleIndex];

	if (attempt.item && attempt.item.id === currentItem.id) {
		handleHit();
	} else {
		handleMiss();
	}
}

function handleHit() {
	requestAnimationFrame(() => {
		playHitSound();
	});
	clearTimeout(moleUpTimer);
	moleUpTimer = null;
	clearActiveMole();
	scheduleNextMole(0);
}

function handleMiss() {
	requestAnimationFrame(() => {
		playMissSound();
	});
}

export {
	initGameLoop,
	startRound,
	stopRound
};
