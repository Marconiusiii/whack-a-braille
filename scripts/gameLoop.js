"use strict";

import { getBrailleItemsForMode } from "./brailleRegistry.js";
import { setAttemptCallback, setCurrentMoleId } from "./inputEngine.js";
import { playHitSound, playMissSound, playMolePopSound, playRetreatSound } from "./audioEngine.js";
import { speak, cancelSpeech } from "./speechEngine.js";
import { computeMoleWindowMs, computeRoundEndGraceMs } from "./speechTuning.js";

let moleElements = [];

let availableItems = [];
let roundItems = [];

let activeMoleIndex = null;
let activeMoleId = 0;
let missRegisteredForMole = false;
let activeMoleShownAtMs = 0;

let isRunning = false;
let roundEnding = false;

let roundDurationMs = 30000;
let roundStartTime = 0;
let score = 0;
let hitStreak = 0;
let hitsThisRound = 0;
let missesThisRound = 0;
let escapesThisRound = 0;
let streakBonusCount = 0;
let speedHitCount = 0;
let speedBonusTickets = 0;

let roundTimer = null;
let moleTimer = null;
let moleUpTimer = null;
let activeMoleUpTimeMs = 0;

const DIFFICULTY_MULTIPLIERS = {
	beginner: 1.5,
	normal: 1.0,
	supreme: 0.5
};
let difficultyMultiplier = 1.0;

let currentModeId = "";
let currentInputMode = "qwerty";
let currentDurationSeconds = 30;

const startIntervalMs = 900;
const endIntervalMs = 300;

const startUpTimeMs = 650;
const endUpTimeMs = 250;

const TRAINING_MOLE_CAP = 15;

let isTrainingMode = false;
let trainingMolesCompleted = 0;
let speakBrailleDotsEnabled = false;
let lastTrainingMissAtMs = 0;

function initGameLoop(options) {
	moleElements = options.moleElements || [];
}

function startRound(modeId, durationSeconds, inputMode, difficulty = "normal", options = {}) {
	if (isRunning) return;

	score = 0;
	hitStreak = 0;
	hitsThisRound = 0;
	missesThisRound = 0;
	escapesThisRound = 0;
	streakBonusCount = 0;
	speedHitCount = 0;
	speedBonusTickets = 0;

	currentModeId = modeId;
	currentDurationSeconds = durationSeconds;
	currentInputMode = modeId === "everything" ? "perkins" : inputMode;

	isTrainingMode = difficulty === "training";
	speakBrailleDotsEnabled = !!options.speakBrailleDots && isTrainingMode;
	trainingMolesCompleted = 0;
	lastTrainingMissAtMs = 0;

	difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] ?? 1.0;

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
	clearTimeout(moleTimer);
	clearTimeout(moleUpTimer);

	roundTimer = null;
	moleTimer = null;
	moleUpTimer = null;

	if (isTrainingMode) {
		scheduleNextTrainingMole(0);
		return;
	}

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

function scoreToTickets(scoreValue) {
	if (scoreValue >= 200) return 20;
	if (scoreValue >= 150) return 15;
	if (scoreValue >= 100) return 10;
	if (scoreValue >= 50) return 5;
	return 0;
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

	let baseTickets = scoreToTickets(score);
	let streakBonusTickets = streakBonusCount;
	let speedTickets = speedBonusTickets;

	if (isTrainingMode) {
		baseTickets = 0;
		streakBonusTickets = 0;
		speedTickets = 0;
	}

	document.dispatchEvent(new CustomEvent("wabRoundEnded", {
		detail: {
			modeId: currentModeId,
			inputMode: currentInputMode,
			durationSeconds: currentDurationSeconds,
			isTraining: isTrainingMode,
			trainingMoleCap: TRAINING_MOLE_CAP,
			trainingMolesCompleted,
			score,
			hits: hitsThisRound,
			misses: missesThisRound,
			escapes: escapesThisRound,
			streakBonusCount,
			canceled: !!canceled,
			tickets: {
				base: baseTickets,
				streakBonus: streakBonusTickets,
				speedBonus: speedTickets,
				total: baseTickets + streakBonusTickets + speedTickets
			}
		}
	}));
}

function pickFiveItems(pool) {
	if (!Array.isArray(pool) || pool.length === 0) {
		return [];
	}

	const copy = [...pool];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}

	return copy.slice(0, Math.min(5, copy.length));
}

function getProgress() {
	const elapsed = Date.now() - roundStartTime;
	let progress = Math.min(elapsed / roundDurationMs, 1);

	if (roundDurationMs >= 45000) {
		if (progress > 0.3 && progress < 0.7) {
			progress = 0.3 + (progress - 0.3) * 1.6;
		} else if (progress >= 0.7) {
			progress = 0.9;
		}
	}

	return Math.min(progress, 1);
}

function lerp(start, end, t) {
	return start + (end - start) * t;
}

function getCurrentInterval() {
	let interval = Math.floor(lerp(startIntervalMs, endIntervalMs, getProgress()));

	if (getProgress() > 0.7) {
		interval = Math.floor(interval * 0.45);
	}

	return Math.max(Math.floor(interval * difficultyMultiplier), 180);
}

function getCurrentUpTime() {
	const base = Math.floor(lerp(startUpTimeMs, endUpTimeMs, getProgress()));
	return Math.floor(base * difficultyMultiplier);
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

function scheduleNextTrainingMole(extraDelayMs = 0) {
	if (!isRunning || roundEnding) return;

	if (trainingMolesCompleted >= TRAINING_MOLE_CAP) {
		endRoundNow(false);
		return;
	}

	const delay = Math.max(0, extraDelayMs);

	clearTimeout(moleTimer);
	moleTimer = setTimeout(() => {
		void showTrainingMole();
	}, delay);
}

function dotsToSpeech(dots) {
	if (!Array.isArray(dots) || !dots.length) return "";
	if (dots.length === 1) return "Dot " + dots[0];
	return "Dots " + dots.join(" ");
}

async function showTrainingMole() {
	if (!isRunning || roundEnding) return;

	clearActiveMole();

	activeMoleId++;
	missRegisteredForMole = false;

	activeMoleIndex = pickNextMoleIndex();
	const moleItem = roundItems[activeMoleIndex];
	if (!moleItem) {
		clearActiveMole();
		setCurrentMoleId(0);
		scheduleNextTrainingMole(0);
		return;
	}

	const thisMoleId = activeMoleId;

	setCurrentMoleId(thisMoleId);

	let announceText = moleItem.announceText;

	if (speakBrailleDotsEnabled) {
		const dotText = dotsToSpeech(moleItem.dots);
		if (dotText) announceText = announceText + ", " + dotText;
	}

	const speechPromise = speak(announceText, {
		on: "start",
		timeoutMs: 400,
		cancelPrevious: true,
		dedupe: false
	});

	activeMoleUpTimeMs = 0;

	setTimeout(() => {
		if (!isRunning || roundEnding) return;
		if (thisMoleId !== activeMoleId) return;

		activateMoleVisual(activeMoleIndex);
		activeMoleShownAtMs = performance.now();
		playMolePopSound(activeMoleIndex);
	}, 80);

	await speechPromise;

	if (!isRunning || roundEnding) return;
	if (thisMoleId !== activeMoleId) return;

	clearTimeout(moleUpTimer);
	moleUpTimer = null;
}

async function showRandomMole() {
	if (!isRunning || roundEnding) return;

	clearActiveMole();

	activeMoleId++;
	missRegisteredForMole = false;

	activeMoleIndex = pickNextMoleIndex();
	const moleItem = roundItems[activeMoleIndex];
	if (!moleItem) {
		clearActiveMole();
		setCurrentMoleId(0);
		scheduleNextMole(0);
		return;
	}

	const thisMoleId = activeMoleId;

	setCurrentMoleId(thisMoleId);

	const speechPromise = speak(moleItem.announceText, {
		on: "start",
		timeoutMs: 400,
		cancelPrevious: true,
		dedupe: false
	});
	activeMoleUpTimeMs = getCurrentUpTime();

	setTimeout(() => {
		if (!isRunning || roundEnding) return;
		if (thisMoleId !== activeMoleId) return;

		activateMoleVisual(activeMoleIndex);
		activeMoleShownAtMs = performance.now();
		playMolePopSound(activeMoleIndex);
	}, 80);

	const speechResult = await speechPromise;

	if (!isRunning || roundEnding) return;
	if (thisMoleId !== activeMoleId) return;

	const upTime = computeMoleWindowMs({
		speechResult,
		baseUpTimeMs: getCurrentUpTime()
	});

	activeMoleUpTimeMs = upTime;

	clearTimeout(moleUpTimer);
	moleUpTimer = setTimeout(() => {
		if (!isRunning || roundEnding) return;
		if (thisMoleId !== activeMoleId) return;

		escapesThisRound += 1;
		hitStreak = 0;

		const mole = moleElements[activeMoleIndex];
		if (mole) {
			mole.classList.add("isMiss");
		}

		playRetreatSound(activeMoleIndex);

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
	if (!mole) return;

	const item = roundItems[index];

	mole.dataset.label = item?.id || "";
	mole.classList.add("isUp");
}

function deactivateMoleVisual(index) {
	const mole = moleElements[index];
	if (!mole) return;

	mole.classList.remove("isUp", "isHit", "isMiss");
	delete mole.dataset.label;
}

function handleAttempt(attempt) {
	if (!isRunning || roundEnding) return;
	if (activeMoleIndex === null) return;
	if (attempt.moleId !== activeMoleId) return;

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

	if (isTrainingMode) {
		handleTrainingMiss();
		return;
	}

	if (missRegisteredForMole) return;
	missRegisteredForMole = true;
	handleMiss();
}

function handleHit() {
	if (isTrainingMode) {
		playHitSound(0, activeMoleIndex);

		hitsThisRound += 1;
		trainingMolesCompleted += 1;

		const mole = moleElements[activeMoleIndex];
		if (mole) {
			mole.classList.add("isHit");
		}

		clearTimeout(moleUpTimer);
		moleUpTimer = null;

		missRegisteredForMole = true;

		clearActiveMole();
		setCurrentMoleId(0);

		scheduleNextTrainingMole(180);
		return;
	}

	playHitSound(score, activeMoleIndex);

	hitsThisRound += 1;
	hitStreak += 1;

	score += 10;

	if (hitStreak % 5 === 0) {
		score += 10;
		streakBonusCount += 1;
	}
	const nowMs = performance.now();
	const reactionMs = nowMs - activeMoleShownAtMs;

	const speedThresholdMs = activeMoleUpTimeMs * 0.55;

	if (reactionMs <= speedThresholdMs) {
		speedHitCount += 1;

		if (speedHitCount % 3 === 0 && speedBonusTickets < 5) {
			speedBonusTickets += 1;
		}
	}

	const mole = moleElements[activeMoleIndex];
	if (mole) {
		mole.classList.add("isHit");
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

function handleTrainingMiss() {
	const now = performance.now();
	if (now - lastTrainingMissAtMs < 200) return;
	lastTrainingMissAtMs = now;

	playMissSound(activeMoleIndex);
}

function handleMiss() {
	missesThisRound += 1;
	hitStreak = 0;
	score = Math.max(0, score - 2);

	playMissSound(activeMoleIndex);

	document.dispatchEvent(new CustomEvent("wabScoreUpdated", {
		detail: {
			score,
			hitStreak
		}
	}));
}
function getCurrentSpokenText() {
	if (activeMoleIndex === null) return null;

	const item = roundItems[activeMoleIndex];
	if (!item) return null;

	let text = item.announceText;

	if (isTrainingMode && speakBrailleDotsEnabled) {
		const dots = Array.isArray(item.dots) ? item.dots : [];

		if (dots.length === 1) {
			text += ", Dot " + dots[0];
		} else if (dots.length > 1) {
			text += ", Dots " + dots.join(", ");
		}
	}

	return text;
}

export {
	initGameLoop,
	startRound,
	getCurrentSpokenText,
	stopRound
};
