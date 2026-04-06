"use strict";

import { getBrailleItemsForMode } from "./brailleRegistry.js";
import { setAttemptCallback, setCurrentMoleId } from "./inputEngine.js";
import {
	playHitSound,
	playMissSound,
	playMolePopSound,
	playRetreatSound,
	startRoundBeat,
	stopRoundBeat
} from "./audioEngine.js";
import { speak, cancelSpeech } from "./speechEngine.js";
import { computeMoleWindowMs, computeRoundEndGraceMs } from "./speechTuning.js";
import { scoreToTickets } from "./ticketRules.js";

let moleElements = [];
let characterEchoEnabled = false;

let availableItems = [];
let roundItems = [];
let roundLaneItems = [];
let activeMoleItem = null;

let activeMoleIndex = null;
let activeMoleId = 0;
let missRegisteredForMole = false;
let activeMoleShownAtMs = 0;
let activePerkinsSequenceIndex = 0;

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
let spatialMoleMappingEnabled = true;
let lastLaneIndex = null;
let sameLaneRunCount = 0;
const MAX_SAME_LANE_IN_ROW = 2;

const qwertyLaneMap = new Map([
	["1", 0], ["2", 0],
	["3", 1], ["4", 1],
	["5", 2], ["6", 2],
	["7", 3], ["8", 3],
	["9", 4], ["0", 4],
	["q", 0], ["a", 0], ["z", 0], ["w", 0], ["s", 0], ["x", 0],
	["e", 1], ["d", 1], ["c", 1], ["r", 1], ["f", 1], ["v", 1],
	["t", 2], ["g", 2], ["b", 2], ["y", 2], ["h", 2], ["n", 2],
	["u", 3], ["j", 3], ["m", 3], ["i", 3], ["k", 3], [",", 3],
	["o", 4], ["l", 4], [".", 4], ["p", 4], [";", 4], ["/", 4], ["[", 4], ["]", 4], ["\\", 4], ["'", 4]
]);

function initGameLoop(options) {
	moleElements = options.moleElements || [];
}

function isInvasionMode(modeId) {
	return modeId === "grade1Invasion" || modeId === "grade2Invasion";
}

function isSpatialMappingEligibleMode(modeId) {
	return modeId === "typingSimpleHomeRow" ||
		modeId === "typingHomeRow" ||
		modeId === "typingHomeTopRow" ||
		modeId === "typingHomeBottomRow" ||
		modeId === "grade1Invasion" ||
		modeId === "letters-aj" ||
		modeId === "letters-at" ||
		modeId === "grade1Letters" ||
		modeId === "grade1Numbers" ||
		modeId === "grade1LettersNumbers";
}

function laneForItem(item) {
	const key = String(item?.standardKey || "").toLowerCase();
	if (!key) return null;
	const lane = qwertyLaneMap.get(key);
	return Number.isInteger(lane) ? lane : null;
}

function buildRoundLaneItems(modeId, items, useSpatialMapping) {
	if (isInvasionMode(modeId)) {
		return Array.from({ length: 5 }, () => null);
	}

	const lanes = Array.from({ length: 5 }, () => null);

	if (!useSpatialMapping || !isSpatialMappingEligibleMode(modeId)) {
		for (let i = 0; i < Math.min(5, items.length); i++) {
			lanes[i] = items[i];
		}
		return lanes;
	}

	const occupied = new Set();

	for (const item of items) {
		const lane = laneForItem(item);
		if (lane === null || occupied.has(lane)) {
			continue;
		}
		lanes[lane] = item;
		occupied.add(lane);
	}

	return lanes;
}

function pickRoundItems(modeId, pool, useSpatialMapping) {
	if (isInvasionMode(modeId)) {
		return Array.isArray(pool) ? pool.slice() : [];
	}

	if (!useSpatialMapping || !isSpatialMappingEligibleMode(modeId)) {
		return pickFiveItems(pool);
	}

	const copy = Array.isArray(pool) ? [...pool] : [];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}

	const selected = [];
	const occupied = new Set();

	for (const item of copy) {
		const lane = laneForItem(item);
		if (lane === null || occupied.has(lane)) continue;
		selected.push(item);
		occupied.add(lane);
		if (selected.length >= 5) break;
	}

	return selected.length ? selected : pickFiveItems(pool);
}

function startRound(modeId, durationSeconds, inputMode, difficulty = "normal", options = {}) {
	if (isRunning) return;

	characterEchoEnabled = !!options.characterEcho;

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
	currentInputMode = inputMode;

	isTrainingMode = difficulty === "training";
	speakBrailleDotsEnabled = !!options.speakBrailleDots && isTrainingMode;
	spatialMoleMappingEnabled = options.spatialMoleMappingEnabled !== false;
	trainingMolesCompleted = 0;
	lastTrainingMissAtMs = 0;
	lastLaneIndex = null;
	sameLaneRunCount = 0;

	difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] ?? 1.0;

	roundDurationMs = durationSeconds * 1000;
	availableItems = getBrailleItemsForMode(modeId);
	roundItems = pickRoundItems(modeId, availableItems, spatialMoleMappingEnabled);
	roundLaneItems = buildRoundLaneItems(modeId, roundItems, spatialMoleMappingEnabled);

	isRunning = true;
	roundEnding = false;

	const timerMusicEnabled = options.timerMusicEnabled !== false;

	if (!isTrainingMode && timerMusicEnabled) {
		startRoundBeat(() => getProgress());
	}

	roundStartTime = Date.now();

	activeMoleIndex = null;
	activeMoleId = 0;
	activeMoleItem = null;
	missRegisteredForMole = false;
	activePerkinsSequenceIndex = 0;

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

function finishRoundEarly() {
	endRoundNow(false);
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

	let baseTickets = scoreToTickets(score);
	let streakBonusTickets = streakBonusCount;
	let speedTickets = speedBonusTickets;

	if (currentModeId === "grade2Invasion") {
		baseTickets = Math.round(baseTickets * 1.5);
	}

	if (isTrainingMode) {
		baseTickets = 0;
		streakBonusTickets = 0;
		speedTickets = 0;
	}

	stopRoundBeat();

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

function buildAnnounceText(item) {
	if (!item) return "";

	let text = item.announceText;

	const isGrade1 =
		item.modeTags &&
		item.modeTags.includes("grade1Letters");

	if (isGrade1 && characterEchoEnabled && item.nato) {
		text += ", " + item.nato;
	}

	if (isTrainingMode && speakBrailleDotsEnabled) {
		const perkinsSequenceDots = Array.isArray(item.perkinsSequenceDots) && item.perkinsSequenceDots.length
			? item.perkinsSequenceDots
			: [Array.isArray(item.dots) ? item.dots : []];

		if (perkinsSequenceDots.length === 1) {
			const dots = perkinsSequenceDots[0];
			if (dots.length === 1) {
				text += ", Dot " + dots[0];
			} else if (dots.length > 1) {
				text += ", Dots " + dots.join(" ");
			}
		} else {
			const parts = perkinsSequenceDots
				.map(dots => {
					if (dots.length === 1) return "Dot " + dots[0];
					if (dots.length > 1) return "Dots " + dots.join(" ");
					return "";
				})
				.filter(Boolean);
			if (parts.length) {
				text += ", " + parts.join(", then ");
			}
		}
	}

	return text;
}

async function showTrainingMole() {
	if (!isRunning || roundEnding) return;

	clearActiveMole();

	activeMoleId++;
	missRegisteredForMole = false;
	activePerkinsSequenceIndex = 0;

	const nextMole = pickNextMole();
	activeMoleIndex = nextMole.index;
	activeMoleItem = nextMole.item;
	const moleItem = activeMoleItem;
	if (!moleItem) {
		clearActiveMole();
		setCurrentMoleId(0);
		scheduleNextTrainingMole(0);
		return;
	}

	const thisMoleId = activeMoleId;

	setCurrentMoleId(thisMoleId);

	const announceText = buildAnnounceText(moleItem);

	const speechPromise = speak(announceText, {
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
	activePerkinsSequenceIndex = 0;

	const nextMole = pickNextMole();
	activeMoleIndex = nextMole.index;
	activeMoleItem = nextMole.item;
	const moleItem = activeMoleItem;
	if (!moleItem) {
		clearActiveMole();
		setCurrentMoleId(0);
		scheduleNextMole(0);
		return;
	}

	const thisMoleId = activeMoleId;

	setCurrentMoleId(thisMoleId);

	const announceText = buildAnnounceText(moleItem);

	const speechPromise = speak(announceText, {
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
		baseUpTimeMs: getCurrentUpTime(),
		expectedInputCellCount: getExpectedPerkinsCellCount(moleItem, currentInputMode)
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

function pickLaneIndex(candidates, blockedIndex = null) {
	if (!candidates.length) return 0;
	if (candidates.length === 1) {
		const onlyIndex = candidates[0];
		if (onlyIndex === lastLaneIndex) {
			sameLaneRunCount += 1;
		} else {
			lastLaneIndex = onlyIndex;
			sameLaneRunCount = 1;
		}
		return onlyIndex;
	}

	let filtered = candidates.filter(i => i !== blockedIndex);

	if (lastLaneIndex !== null && sameLaneRunCount >= MAX_SAME_LANE_IN_ROW) {
		const withoutStreak = filtered.filter(i => i !== lastLaneIndex);
		if (withoutStreak.length) {
			filtered = withoutStreak;
		}
	}

	if (!filtered.length) {
		filtered = candidates.slice();
	}

	const index = filtered[Math.floor(Math.random() * filtered.length)];

	if (index === lastLaneIndex) {
		sameLaneRunCount += 1;
	} else {
		lastLaneIndex = index;
		sameLaneRunCount = 1;
	}

	return index;
}

function pickNextInvasionMole() {
	if (!Array.isArray(availableItems) || availableItems.length === 0) {
		return { index: 0, item: null };
	}

	if (spatialMoleMappingEnabled && isSpatialMappingEligibleMode(currentModeId)) {
		const laneBuckets = Array.from({ length: 5 }, () => []);
		for (const item of availableItems) {
			const lane = laneForItem(item);
			if (lane === null) continue;
			laneBuckets[lane].push(item);
		}

		const laneCandidates = [];
		for (let i = 0; i < laneBuckets.length; i++) {
			if (laneBuckets[i].length) {
				laneCandidates.push(i);
			}
		}

		if (!laneCandidates.length) {
			const fallbackIndex = pickLaneIndex([0, 1, 2, 3, 4], activeMoleIndex);
			const fallbackItem = availableItems[Math.floor(Math.random() * availableItems.length)] || null;
			return { index: fallbackIndex, item: fallbackItem };
		}

		const index = pickLaneIndex(laneCandidates, activeMoleIndex);
		const bucket = laneBuckets[index];
		const item = bucket[Math.floor(Math.random() * bucket.length)] || null;
		return { index, item };
	}

	const index = pickLaneIndex([0, 1, 2, 3, 4], activeMoleIndex);
	const item = availableItems[Math.floor(Math.random() * availableItems.length)] || null;
	return { index, item };
}

function pickNextMole() {
	if (isInvasionMode(currentModeId)) {
		return pickNextInvasionMole();
	}

	const candidates = [];
	for (let i = 0; i < roundLaneItems.length; i++) {
		if (roundLaneItems[i]) candidates.push(i);
	}

	if (!candidates.length) {
		return { index: 0, item: null };
	}

	const index = pickLaneIndex(candidates, activeMoleIndex);
	return { index, item: roundLaneItems[index] };
}

function clearActiveMole() {
	activePerkinsSequenceIndex = 0;
	if (activeMoleIndex === null) return;
	deactivateMoleVisual(activeMoleIndex);
	activeMoleIndex = null;
	activeMoleItem = null;
}

function activateMoleVisual(index) {
	const mole = moleElements[index];
	if (!mole) return;

	const item = activeMoleIndex === index ? activeMoleItem : roundLaneItems[index];

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
	if (attempt?.key === "`") return;
	if (activeMoleIndex === null) return;
	if (attempt.moleId !== activeMoleId) return;

	if (currentInputMode === "perkins" && attempt.type === "standard") return;

	const currentItem = activeMoleItem;
	if (!currentItem) return;
	let isHit = false;

	if (attempt.type === "perkins") {
		const expectedSequence = getPerkinsSequenceMasks(currentItem);
		const expectedMask = expectedSequence[activePerkinsSequenceIndex] ?? expectedSequence[0];

		if (attempt.dotMask === expectedMask) {
			if (activePerkinsSequenceIndex >= expectedSequence.length - 1) {
				isHit = true;
			} else {
				activePerkinsSequenceIndex += 1;
				return;
			}
		} else {
			activePerkinsSequenceIndex = 0;
		}
	}

	if (attempt.type === "standard") {
		if (typeof currentItem.standardKey === "string") {
			const a = String(attempt.key || "").toLowerCase();
			const b = String(currentItem.standardKey || "").toLowerCase();
			isHit = a === b;
		}
	}

	if (attempt.type === "brailleText") {
		const attemptValue = String(attempt.char || "").trim().toLowerCase();
		const acceptedInputs = Array.isArray(currentItem.acceptedTextInputs)
			? currentItem.acceptedTextInputs
			: [String(currentItem.id || "").trim().toLowerCase()];
		isHit = acceptedInputs.includes(attemptValue);
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
function getCurrentSpeechPayload() {
	if (activeMoleIndex === null) return null;

	const item = activeMoleItem;
	if (!item) return null;

	let text = item.announceText;

	const isGrade1 =
		item.modeTags &&
		item.modeTags.includes("grade1Letters");

	if (isGrade1 && characterEchoEnabled && item.nato) {
		text += ", " + item.nato;
	}

	if (isTrainingMode && speakBrailleDotsEnabled) {
		const perkinsSequenceDots = Array.isArray(item.perkinsSequenceDots) && item.perkinsSequenceDots.length
			? item.perkinsSequenceDots
			: [Array.isArray(item.dots) ? item.dots : []];

		if (perkinsSequenceDots.length === 1) {
			const dots = perkinsSequenceDots[0];
			if (dots.length === 1) {
				text += ", Dot " + dots[0];
			} else if (dots.length > 1) {
				text += ", Dots " + dots.join(" ");
			}
		} else {
			const parts = perkinsSequenceDots
				.map(dots => {
					if (dots.length === 1) return "Dot " + dots[0];
					if (dots.length > 1) return "Dots " + dots.join(" ");
					return "";
				})
				.filter(Boolean);
			if (parts.length) {
				text += ", " + parts.join(", then ");
			}
		}
	}

	return { text };
}

function getPerkinsSequenceMasks(item) {
	const sequence = Array.isArray(item?.perkinsSequenceMasks) && item.perkinsSequenceMasks.length
		? item.perkinsSequenceMasks
		: [Number(item?.dotMask) || 0];
	return sequence;
}

function getExpectedPerkinsCellCount(item, inputMode) {
	if (inputMode !== "perkins") return 1;
	const count = Number(item?.expectedPerkinsCellCount);
	return Number.isFinite(count) && count > 0 ? count : 1;
}

export {
	initGameLoop,
	startRound,
	getCurrentSpeechPayload,
	stopRound,
	finishRoundEarly
};
