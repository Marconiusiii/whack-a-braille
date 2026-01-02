"use strict";

import { getBrailleItemsForMode } from "./brailleRegistry.js";
import { setAttemptCallback, setCurrentMoleId } from "./inputEngine.js";
import { playHitSound, playMissSound, playRetreatSound } from "./audioEngine.js";
import { speak, cancelSpeech } from "./speechEngine.js";
import { computeMoleWindowMs, computeRoundEndGraceMs } from "./speechTuning.js";

let moleElements = [];

let availableItems = [];
let roundItems = [];

let activeMoleIndex = null;
let activeMoleId = 0;
let missRegisteredForMole = false;

let isRunning = false;
let roundEnding = false;

let roundDurationMs = 30000;
let roundStartTime = 0;
let score = 0;
let hitStreak = 0;
let hitsThisRound = 0;
let missesThisRound = 0;
let escapesThisRound = 0;

let roundTimer = null;
let moleTimer = null;
let moleUpTimer = null;

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

	score = 0;
	hitStreak = 0;
	hitsThisRound = 0;
	missesThisRound = 0;
	escapesThisRound = 0;

	currentModeId = modeId;
	currentDurationSeconds = durationSeconds;
	currentInputMode = inputMode;

	roundDurationMs = durationSeconds * 1000;
	availableItems = getBrailleItemsForMode(modeId);
	roundItems = pickFiveItems(availableItems);

	isRunning = true;
	roundEnding = false;

	roundStartTime = Date.now();

	activeMoleIndex = null;
	activeMoleId = 0;
	missRegisteredForMole = false;

	setCurrentMoleId(0);
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

	const graceMs = computeRoundEndGraceMs({
		baseGraceMs: 350,
		maxGraceMs: 750
	});

	clearTimeout(roundTimer);
	roundTimer = setTimeout(() => {
		endRoundNow(false);
	}, graceMs);
}

function endRoundNow(canceled) {
	if (!isRunning) return;

	isRunning = false;
	roundEnding = false;

	clearTimeout(roundTimer);
	clearTimeout(moleTimer);
	clearTimeout(moleUpTimer);

	roundTimer = null;
	moleTimer = null;
	moleUpTimer = null;

	clearActiveMole();
	setCurrentMoleId(0);

	setAttemptCallback(null);

	if (canceled) cancelSpeech();

	document.dispatchEvent(new CustomEvent("wabRoundEnded", {
		detail: {
			modeId: currentModeId,
			inputMode: currentInputMode,
			durationSeconds: currentDurationSeconds,
			score,
			hits: hitsThisRound,
			misses: missesThisRound,
			escapes: escapesThisRound,
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
	if (!isRunning || roundEnding) return;

	const delay = getCurrentInterval() + randomJitter() + extraDelayMs;

	clearTimeout(moleTimer);
	moleTimer = setTimeout(() => {
		void showRandomMole();
	}, delay);
}

async function showRandomMole() {
	if (!isRunning || roundEnding) return;

	clearActiveMole();

	activeMoleId++;
	missRegisteredForMole = false;

	activeMoleIndex = pickNextMoleIndex();
	const moleItem = roundItems[activeMoleIndex];
	const thisMoleId = activeMoleId;

	// Critical: allow whacks during speech.
	// This makes attempt.moleId line up immediately.
	setCurrentMoleId(thisMoleId);

	const speechResult = await speak(moleItem.announceText, {
		on: "start",
		timeoutMs: 400,
		cancelPrevious: true,
		dedupe: false
	});

	if (!isRunning || roundEnding) return;
	if (thisMoleId !== activeMoleId) return;

	activateMoleVisual(activeMoleIndex);

	const upTime = computeMoleWindowMs({
		speechResult,
		baseUpTimeMs: getCurrentUpTime()
	});

	clearTimeout(moleUpTimer);
	moleUpTimer = setTimeout(() => {
		if (!isRunning || roundEnding) return;
		if (thisMoleId !== activeMoleId) return;
		escapesThisRound += 1;
hitStreak = 0;

		playRetreatSound();

		clearActiveMole();
		setCurrentMoleId(0);
		scheduleNextMole(0);
	}, upTime);
}

function pickNextMoleIndex() {
	let index;
	do {
		index = Math.floor(Math.random() * roundItems.length);
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
	if (!isRunning || roundEnding) return;
	if (activeMoleIndex === null) return;
	if (attempt.moleId !== activeMoleId) return;

	// If perkins mode is active, ignore standard keyboard attempts.
	if (currentInputMode === "perkins" && attempt.type === "standard") return;

	const currentItem = roundItems[activeMoleIndex];
	let isHit = false;

	if (attempt.type === "perkins") {
		isHit = attempt.dotMask === currentItem.dotMask;
	}

	if (attempt.type === "standard") {
		if (typeof currentItem.standardKey === "string") {
			const a = String(attempt.key || "").toLowerCase();
			const b = String(currentItem.standardKey || "").toLowerCase();
			isHit = a === b;
		}
	}

	if (attempt.type === "brailleText") {
		isHit = String(attempt.char || "").toLowerCase() === String(currentItem.id || "").toLowerCase();
	}

	if (isHit) {
		handleHit();
		return;
	}

	if (missRegisteredForMole) return;
	missRegisteredForMole = true;
	handleMiss();
}

function handleHit() {
		playHitSound();

	hitsThisRound += 1;
	hitStreak += 1;

	score += 10;

	if (hitStreak % 5 === 0) {
		score += 10;
	}


	clearTimeout(moleUpTimer);
	moleUpTimer = null;

	missRegisteredForMole = true;

	clearActiveMole();
	setCurrentMoleId(0);
	scheduleNextMole(0);

	document.dispatchEvent(new CustomEvent("wabScoreUpdated", {
		detail: {
			score,
			hitStreak
		}
	}));
}

function handleMiss() {
	missesThisRound += 1;
	hitStreak = 0;
	score = Math.max(0, score - 2);

	playMissSound();

	document.dispatchEvent(new CustomEvent("wabScoreUpdated", {
		detail: {
			score,
			hitStreak
		}
	}));
}

export {
	initGameLoop,
	startRound,
	stopRound
};
