"use strict";

import { getBrailleItemsForMode, getCustomMoleItemsByIds, getCustomMoleItemsForInputMode } from "./brailleRegistry.js";
import { setAttemptCallback, setCurrentMoleId } from "./inputEngine.js";
import {
	playBlitzWordHit,
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
import {
	compactDotPatternText,
	getBlitzItemsForMode,
	getBlitzWordPan,
	getWordLaneIndices,
	getWordyMoleMayhemItems,
	isGrade1BattleMode,
	isWordMode,
	isWordyMoleMayhemMode
} from "./wordCatalogs.js";

let moleElements = [];
let characterEchoEnabled = false;

let availableItems = [];
let roundItems = [];
let roundLaneItems = [];
let activeMoleItem = null;
let activeWordItem = null;
let activeWordLaneIndices = [];
let activeWordLetterIndex = 0;
let pendingWordyTextTokens = [];
let pendingWordyPerkinsMasks = [];

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
let lettersWhackedThisRound = 0;

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
let currentCustomMolePlayMode = "individual";
let currentCustomMoleIDs = [];
let currentCustomItems = [];
let currentReconSourceModeId = "";
let lastWordItemId = "";
let spellWordEnabled = false;

const startIntervalMs = 900;
const endIntervalMs = 300;

const startUpTimeMs = 650;
const endUpTimeMs = 250;

const TRAINING_MOLE_CAP = 15;
const TRAINING_FIRST_MOLE_DELAY_MS = 1000;
const TRAINING_POST_HIT_DELAY_MS = 750;
const STARTUP_FIRST_MOLE_DELAY_MS = 300;
const BLITZ_COMPLETION_SOUND_DELAY_MS = 80;
const BLITZ_COMPLETION_MINIMUM_TRANSITION_DELAY_MS = 650;

let isTrainingMode = false;
let trainingMolesCompleted = 0;
let speakBrailleDotsEnabled = false;
let lastTrainingMissAtMs = 0;
let spatialMoleMappingEnabled = true;
let moleReconItems = [];
let moleReconItemIDs = new Set();
let shownMoleReconItems = [];
let shownMoleReconItemIDs = new Set();
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

function getEffectiveModeId() {
	if (currentModeId === "moleRecon" && currentReconSourceModeId) {
		return currentReconSourceModeId;
	}
	return currentModeId;
}

function isInvasionMode(modeId) {
	return modeId === "grade1Invasion" ||
		modeId === "grade2Invasion" ||
		(modeId === "customMoles" && currentCustomMolePlayMode === "invasion");
}

function isCurrentWordMode() {
	return isWordMode(getEffectiveModeId()) || currentCustomItems.some(item => item?.kind === "blitzWord" || item?.kind === "wordyWord");
}

function isCurrentBlitzMode() {
	const effectiveModeId = getEffectiveModeId();
	if (isGrade1BattleMode(effectiveModeId)) return true;
	return currentModeId === "moleRecon" && currentCustomItems.some(item => item?.kind === "blitzWord");
}

function isCurrentWordyMode() {
	const effectiveModeId = getEffectiveModeId();
	if (isWordyMoleMayhemMode(effectiveModeId)) return true;
	return currentModeId === "moleRecon" && currentCustomItems.some(item => item?.kind === "wordyWord");
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

	if (modeId === "customMoles" && currentCustomMolePlayMode === "individual") {
		return Array.isArray(pool) ? pool.slice(0, 5) : [];
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
	lettersWhackedThisRound = 0;

	currentModeId = modeId;
	currentDurationSeconds = durationSeconds;
	currentInputMode = inputMode;
	currentCustomMolePlayMode = options.customMolePlayMode === "invasion" ? "invasion" : "individual";
	currentCustomMoleIDs = Array.isArray(options.customMoleIDs) ? options.customMoleIDs.slice() : [];
	currentCustomItems = Array.isArray(options.customItems) ? options.customItems.slice() : [];
	currentReconSourceModeId = typeof options.reconSourceModeId === "string" ? options.reconSourceModeId : "";
	spellWordEnabled = !!options.spellWordEnabled;

	isTrainingMode = difficulty === "training";
	speakBrailleDotsEnabled = !!options.speakBrailleDots && isTrainingMode;
	spatialMoleMappingEnabled = options.spatialMoleMappingEnabled !== false;
	trainingMolesCompleted = 0;
	lastTrainingMissAtMs = 0;
	moleReconItems = [];
	moleReconItemIDs = new Set();
	shownMoleReconItems = [];
	shownMoleReconItemIDs = new Set();
	lastLaneIndex = null;
	sameLaneRunCount = 0;
	lastWordItemId = "";
	clearWordState();

	difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] ?? 1.0;

	roundDurationMs = durationSeconds * 1000;
	availableItems = getItemsForRoundMode(modeId, inputMode);
	roundItems = isCurrentWordMode() ? [] : pickRoundItems(modeId, availableItems, spatialMoleMappingEnabled);
	roundLaneItems = isCurrentWordMode() ? Array.from({ length: 5 }, () => null) : buildRoundLaneItems(modeId, roundItems, spatialMoleMappingEnabled);

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
		scheduleNextTrainingMole(TRAINING_FIRST_MOLE_DELAY_MS);
		return;
	}

	roundTimer = setTimeout(requestRoundEnd, roundDurationMs);
	scheduleNextMole(STARTUP_FIRST_MOLE_DELAY_MS);
}

function stopRound() {
	endRoundNow(true);
}

function getItemsForRoundMode(modeId, inputMode) {
	const effectiveModeId = modeId === "moleRecon" && currentReconSourceModeId
		? currentReconSourceModeId
		: modeId;

	if (modeId === "moleRecon" && currentCustomItems.length) {
		return currentCustomItems.slice();
	}

	if (isGrade1BattleMode(effectiveModeId)) {
		return getBlitzItemsForMode(effectiveModeId);
	}

	if (isWordyMoleMayhemMode(effectiveModeId)) {
		return getWordyMoleMayhemItems();
	}

	if (modeId === "moleRecon") {
		const selectedItems = getCustomMoleItemsByIds(currentCustomMoleIDs, inputMode);
		return selectedItems.length ? selectedItems : getCustomMoleItemsForInputMode(inputMode).slice(0, 5);
	}

	if (modeId !== "customMoles") {
		return getBrailleItemsForMode(modeId);
	}

	const selectedItems = getCustomMoleItemsByIds(currentCustomMoleIDs, inputMode);
	if (selectedItems.length >= 5) {
		return selectedItems;
	}

	return getCustomMoleItemsForInputMode(inputMode).slice(0, 5);
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

function getTicketMultiplierForMode(modeId) {
	switch (modeId) {
		case "grade1ThreeLetterBlitz":
			return 1.2;
		case "grade1FourLetterBlitz":
			return 1.3;
		case "grade1MoleBlitz":
			return 1.4;
		case "grade2Invasion":
			return 1.5;
		case "wordyMoleMayhem":
			return 1.8;
		default:
			return 1;
	}
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

	clearActivePresentation();
	setCurrentMoleId(0);

	setAttemptCallback(null);

	if (canceled) cancelSpeech();

	const effectiveModeId = getEffectiveModeId();
	let baseTickets = scoreToTickets(score);
	let streakBonusTickets = streakBonusCount;
	let speedTickets = speedBonusTickets;
	const ticketMultiplier = getTicketMultiplierForMode(effectiveModeId);
	if (ticketMultiplier !== 1) {
		baseTickets = Math.round(baseTickets * ticketMultiplier);
	}

	if (isTrainingMode) {
		baseTickets = 0;
		streakBonusTickets = 0;
		speedTickets = 0;
	}

	const usesAllShownMolesForRecon = !isTrainingMode && moleReconItems.length === 0 && shownMoleReconItems.length > 0;
	const reconItems = usesAllShownMolesForRecon ? shownMoleReconItems.slice() : moleReconItems.slice();
	const grudgeMatchItems = shownMoleReconItems.slice();

	stopRoundBeat();

	document.dispatchEvent(new CustomEvent("wabRoundEnded", {
		detail: {
			modeId: currentModeId,
			resultsModeId: effectiveModeId,
			reconSourceModeId: currentReconSourceModeId,
			inputMode: currentInputMode,
			durationSeconds: currentDurationSeconds,
			isTraining: isTrainingMode,
			trainingMoleCap: TRAINING_MOLE_CAP,
			trainingMolesCompleted,
			score,
			hits: hitsThisRound,
			misses: missesThisRound,
			escapes: escapesThisRound,
			lettersWhacked: lettersWhackedThisRound,
			streakBonusCount,
			canceled: !!canceled,
			moleReconItems: reconItems,
			grudgeMatchItems,
			usesAllShownMolesForRecon,
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
		const endgameCompression = difficultyMultiplier > 1 ? 0.55 : 0.45;
		interval = Math.floor(interval * endgameCompression);
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
		if (isCurrentWordMode()) {
			void showWordTarget(false);
			return;
		}
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
		if (isCurrentWordMode()) {
			void showWordTarget(true);
			return;
		}
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

function buildWordAnnounceText(item) {
	if (!item) return "";
	const parts = [item.announceText];

	if (spellWordEnabled && Array.isArray(item.letters) && item.letters.length) {
		parts.push(item.letters.map(letter => letter.toUpperCase()).join(" "));
	}

	if (isTrainingMode && speakBrailleDotsEnabled) {
		const dotsText = compactDotPatternText(item.perkinsSequenceDots);
		if (dotsText) {
			parts.push(dotsText);
		}
	}

	return parts.filter(Boolean).join(", ");
}

async function showTrainingMole() {
	if (!isRunning || roundEnding) return;

	clearActivePresentation();

	activeMoleId += 1;
	missRegisteredForMole = false;
	activePerkinsSequenceIndex = 0;

	const nextMole = pickNextMole();
	activeMoleIndex = nextMole.index;
	activeMoleItem = nextMole.item;
	const moleItem = activeMoleItem;
	if (!moleItem) {
		clearActivePresentation();
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

	clearActivePresentation();

	activeMoleId += 1;
	missRegisteredForMole = false;
	activePerkinsSequenceIndex = 0;

	const nextMole = pickNextMole();
	activeMoleIndex = nextMole.index;
	activeMoleItem = nextMole.item;
	const moleItem = activeMoleItem;
	if (!moleItem) {
		clearActivePresentation();
		setCurrentMoleId(0);
		scheduleNextMole(0);
		return;
	}

	const thisMoleId = activeMoleId;
	recordShownMoleReconItem(moleItem);

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
		recordMoleReconItem(moleItem);
		hitStreak = 0;

		const mole = moleElements[activeMoleIndex];
		if (mole) {
			mole.classList.add("isMiss");
		}

		playRetreatSound(activeMoleIndex);

		clearActivePresentation();
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

function clearWordState() {
	activeWordItem = null;
	activeWordLaneIndices = [];
	activeWordLetterIndex = 0;
	pendingWordyTextTokens = [];
	pendingWordyPerkinsMasks = [];
}

function clearActiveWord() {
	for (const laneIndex of activeWordLaneIndices) {
		deactivateMoleVisual(laneIndex);
	}
	clearWordState();
	activeMoleIndex = null;
	activeMoleItem = null;
	activePerkinsSequenceIndex = 0;
}

function clearActiveMole() {
	activePerkinsSequenceIndex = 0;
	if (activeMoleIndex === null) return;
	deactivateMoleVisual(activeMoleIndex);
	activeMoleIndex = null;
	activeMoleItem = null;
}

function clearActivePresentation() {
	if (activeWordItem) {
		clearActiveWord();
		return;
	}
	clearActiveMole();
}

function recordMoleReconItem(item) {
	if (!item?.id || moleReconItemIDs.has(item.id)) return;
	moleReconItemIDs.add(item.id);
	moleReconItems.push(item);
}

function recordShownMoleReconItem(item) {
	if (!item?.id || shownMoleReconItemIDs.has(item.id)) return;
	shownMoleReconItemIDs.add(item.id);
	shownMoleReconItems.push(item);
}

function activateMoleVisual(index, label = null) {
	const mole = moleElements[index];
	if (!mole) return;

	const item = activeMoleIndex === index ? activeMoleItem : roundLaneItems[index];
	mole.dataset.label = label ?? (item?.id || "");
	mole.classList.add("isUp");
}

function deactivateMoleVisual(index) {
	const mole = moleElements[index];
	if (!mole) return;

	mole.classList.remove("isUp", "isHit", "isMiss");
	delete mole.dataset.label;
}

function pickNextWordItem() {
	if (!Array.isArray(availableItems) || !availableItems.length) {
		return null;
	}

	if (availableItems.length === 1) {
		lastWordItemId = availableItems[0].id || "";
		return availableItems[0];
	}

	let candidates = availableItems;
	if (lastWordItemId) {
		const filtered = availableItems.filter(item => item?.id !== lastWordItemId);
		if (filtered.length) {
			candidates = filtered;
		}
	}

	const item = candidates[Math.floor(Math.random() * candidates.length)] || null;
	if (item?.id) {
		lastWordItemId = item.id;
	}
	return item;
}

function showBlitzWordVisual(wordItem) {
	const laneIndices = getWordLaneIndices(wordItem.letters.length);
	activeWordLaneIndices = laneIndices;
	activeMoleIndex = laneIndices[0] ?? 2;
	for (let i = 0; i < laneIndices.length; i++) {
		activateMoleVisual(laneIndices[i], wordItem.letters[i] || "");
		playMolePopSound(laneIndices[i]);
	}
}

function showWordyVisual(wordItem) {
	const laneIndex = 2;
	activeWordLaneIndices = [laneIndex];
	activeMoleIndex = laneIndex;
	activateMoleVisual(laneIndex, wordItem.displayLabel || wordItem.text || "");
	playMolePopSound(laneIndex);
}

function currentBlitzLaneIndex() {
	return activeWordLaneIndices[activeWordLetterIndex] ?? activeWordLaneIndices[activeWordLaneIndices.length - 1] ?? 2;
}

function currentWordAudioLane() {
	if (isCurrentBlitzMode()) {
		return currentBlitzLaneIndex();
	}
	return activeWordLaneIndices[0] ?? 2;
}

function computeBlitzWindowMs(wordItem, speechResult) {
	const perLetterMsByInputMode = {
		qwerty: 540,
		perkins: 760,
		brailleDisplay: 860
	};
	const perLetterMs = perLetterMsByInputMode[currentInputMode] ?? 760;
	const speechDurationMs = getSpeechDurationMs(speechResult);
	const entryTimeMs = perLetterMs * wordItem.letters.length * difficultyMultiplier;
	const minimumMs = 2400;
	const maximumMs = 8000;
	return Math.min(Math.max(speechDurationMs + entryTimeMs + 450, minimumMs), maximumMs);
}

function computeWordyWindowMs(wordItem, speechResult) {
	const perLetterMsByInputMode = {
		qwerty: 520,
		perkins: 720,
		brailleDisplay: 780
	};
	const perLetterMs = perLetterMsByInputMode[currentInputMode] ?? 720;
	const speechDurationMs = getSpeechDurationMs(speechResult);
	const entryTimeMs = perLetterMs * wordItem.letters.length * difficultyMultiplier;
	const minimumMs = 4000;
	const maximumMs = 14000;
	return Math.min(Math.max(speechDurationMs + entryTimeMs + 600, minimumMs), maximumMs);
}

function getSpeechDurationMs(speechResult) {
	const startedAt = Number(speechResult?.onstartAtMs ?? speechResult?.startedAtMs ?? speechResult?.startedAt);
	const endedAt = Number(speechResult?.endedAtMs ?? speechResult?.endedAt);
	if (Number.isFinite(startedAt) && Number.isFinite(endedAt) && endedAt > startedAt) {
		return endedAt - startedAt;
	}
	return 400;
}

async function showWordTarget(trainingOnly) {
	if (!isRunning || roundEnding) return;

	clearActivePresentation();

	activeMoleId += 1;
	missRegisteredForMole = false;
	activePerkinsSequenceIndex = 0;
	clearWordState();

	const wordItem = pickNextWordItem();
	activeWordItem = wordItem;
	activeMoleItem = wordItem;
	if (!wordItem) {
		setCurrentMoleId(0);
		if (trainingOnly) {
			scheduleNextTrainingMole(0);
		} else {
			scheduleNextMole(0);
		}
		return;
	}

	if (!trainingOnly) {
		recordShownMoleReconItem(wordItem);
	}

	const thisMoleId = activeMoleId;
	setCurrentMoleId(thisMoleId);

	const announceText = buildWordAnnounceText(wordItem);
	const speechPromise = speak(announceText, {
		timeoutMs: 600,
		cancelPrevious: true,
		dedupe: false
	});

	activeMoleUpTimeMs = trainingOnly ? 0 : getCurrentUpTime();

	setTimeout(() => {
		if (!isRunning || roundEnding) return;
		if (thisMoleId !== activeMoleId) return;
		activeMoleShownAtMs = performance.now();
		if (isCurrentBlitzMode()) {
			showBlitzWordVisual(wordItem);
		} else {
			showWordyVisual(wordItem);
		}
	}, 80);

	const speechResult = await speechPromise;

	if (!isRunning || roundEnding) return;
	if (thisMoleId !== activeMoleId) return;
	if (trainingOnly) {
		clearTimeout(moleUpTimer);
		moleUpTimer = null;
		return;
	}

	const upTime = isCurrentBlitzMode()
		? computeBlitzWindowMs(wordItem, speechResult)
		: computeWordyWindowMs(wordItem, speechResult);
	activeMoleUpTimeMs = upTime;

	clearTimeout(moleUpTimer);
	moleUpTimer = setTimeout(() => {
		if (!isRunning || roundEnding) return;
		if (thisMoleId !== activeMoleId) return;
		handleWordEscape();
	}, upTime);
}

function handleWordEscape() {
	escapesThisRound += 1;
	recordMoleReconItem(activeWordItem);
	hitStreak = 0;

	if (isCurrentBlitzMode()) {
		const remainingLanes = activeWordLaneIndices.slice(activeWordLetterIndex);
		for (let i = 0; i < remainingLanes.length; i++) {
			const laneIndex = remainingLanes[i];
			const mole = moleElements[laneIndex];
			if (mole) {
				mole.classList.add("isMiss");
			}
			playRetreatSound(laneIndex);
		}
	} else {
		const laneIndex = currentWordAudioLane();
		const mole = moleElements[laneIndex];
		if (mole) {
			mole.classList.add("isMiss");
		}
		playRetreatSound(laneIndex);
	}

	clearActivePresentation();
	setCurrentMoleId(0);
	scheduleNextMole(0);
}

function normalizeAttemptLetters(text) {
	return String(text || "")
		.toLowerCase()
		.replace(/[^a-z]/g, "");
}

function sequenceStartsWith(sequence, prefix) {
	if (!Array.isArray(sequence) || !Array.isArray(prefix) || prefix.length > sequence.length) {
		return false;
	}
	for (let i = 0; i < prefix.length; i++) {
		if (sequence[i] !== prefix[i]) {
			return false;
		}
	}
	return true;
}

function handleAttempt(attempt) {
	if (!isRunning || roundEnding) return;
	if (attempt?.key === "`") return;
	if (attempt.moleId !== activeMoleId) return;
	if (currentInputMode === "perkins" && attempt.type === "standard") return;

	if (isCurrentWordMode()) {
		handleWordAttempt(attempt);
		return;
	}

	if (activeMoleIndex === null) return;

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

function handleWordAttempt(attempt) {
	if (!activeWordItem) return;
	if (isCurrentBlitzMode()) {
		handleBlitzAttempt(attempt);
		return;
	}
	if (isCurrentWordyMode()) {
		handleWordyAttempt(attempt);
	}
}

function handleBlitzAttempt(attempt) {
	if (!activeWordItem) return;

	if (attempt.type === "perkins") {
		const expectedMask = activeWordItem.perkinsSequenceMasks[activeWordLetterIndex];
		if (attempt.dotMask === expectedMask) {
			handleBlitzLetterHit(true);
			return;
		}
		handleBlitzMiss();
		return;
	}

	let submittedLetters = "";
	if (attempt.type === "standard") {
		submittedLetters = normalizeAttemptLetters(attempt.key);
	} else if (attempt.type === "brailleText") {
		submittedLetters = normalizeAttemptLetters(attempt.char);
	}

	if (!submittedLetters) {
		handleBlitzMiss();
		return;
	}

	const remaining = activeWordItem.letters.slice(activeWordLetterIndex, activeWordLetterIndex + submittedLetters.length).join("");
	if (submittedLetters !== remaining) {
		handleBlitzMiss();
		return;
	}

	const groupedSound = submittedLetters.length > 1;
	const scoreBeforeSubmission = score;
	for (let i = 0; i < submittedLetters.length; i++) {
		handleBlitzLetterHit(
			!groupedSound,
			groupedSound
				? {
					playCompletionSound: true,
					scoreBeforeCompletion: scoreBeforeSubmission,
					delayMs: BLITZ_COMPLETION_SOUND_DELAY_MS
				}
				: null
		);
	}
}

function handleBlitzLetterHit(playSound, completionContext = null) {
	const scoreBeforeLetter = score;
	const isFinalLetter = activeWordLetterIndex === (activeWordItem.letters.length - 1);
	const shouldPlayLetterSound = playSound && !isFinalLetter;
	const laneIndex = activeWordLaneIndices[activeWordLetterIndex] ?? currentWordAudioLane();
	const mole = moleElements[laneIndex];
	if (mole) {
		mole.classList.add("isHit");
	}
	if (shouldPlayLetterSound) {
		playHitSound(score, laneIndex);
	}
	lettersWhackedThisRound += 1;
	if (!isTrainingMode) {
		score += 10;
		dispatchScoreUpdated();
	}
	activeWordLetterIndex += 1;
	deactivateMoleVisual(laneIndex);

	if (activeWordLetterIndex >= activeWordItem.letters.length) {
		handleBlitzWordCompleted(
			completionContext || {
				playCompletionSound: true,
				scoreBeforeCompletion: isTrainingMode ? 0 : scoreBeforeLetter,
				delayMs: BLITZ_COMPLETION_SOUND_DELAY_MS
			}
		);
	}
}

function handleBlitzWordCompleted(completionContext = {}) {
	clearTimeout(moleUpTimer);
	moleUpTimer = null;
	missRegisteredForMole = true;
	setCurrentMoleId(0);
	const wordLength = activeWordItem?.letters?.length || 3;
	const scoreAfterCompletion = score;
	const scoreBeforeCompletion = Number.isFinite(completionContext.scoreBeforeCompletion)
		? completionContext.scoreBeforeCompletion
		: (isTrainingMode ? 0 : Math.max(0, scoreAfterCompletion - 10));
	const soundDelayMs = Number.isFinite(completionContext.delayMs)
		? completionContext.delayMs
		: BLITZ_COMPLETION_SOUND_DELAY_MS;
	const shouldPlayCompletionSound = completionContext.playCompletionSound !== false;

	if (isTrainingMode) {
		hitsThisRound += 1;
		trainingMolesCompleted += 1;
		if (shouldPlayCompletionSound) {
			playBlitzCompletionSound(wordLength, scoreBeforeCompletion, scoreAfterCompletion, soundDelayMs);
		}
		clearActivePresentation();
		scheduleNextTrainingMole(TRAINING_POST_HIT_DELAY_MS);
		return;
	}

	hitsThisRound += 1;
	hitStreak += 1;
	applyStreakAndSpeedBonuses();
	if (shouldPlayCompletionSound) {
		playBlitzCompletionSound(wordLength, scoreBeforeCompletion, scoreAfterCompletion, soundDelayMs);
	}
	clearActivePresentation();
	scheduleNextMole(Math.max(0, BLITZ_COMPLETION_MINIMUM_TRANSITION_DELAY_MS - getCurrentInterval()));
}

function handleBlitzMiss() {
	if (isTrainingMode) {
		handleTrainingMiss(currentWordAudioLane());
		return;
	}
	if (missRegisteredForMole) return;
	missRegisteredForMole = true;
	missesThisRound += 1;
	recordMoleReconItem(activeWordItem);
	hitStreak = 0;
	score = Math.max(0, score - 2);
	playMissSound(currentWordAudioLane());
	dispatchScoreUpdated();
}

function handleWordyAttempt(attempt) {
	if (!activeWordItem) return;

	if (attempt.type === "perkins") {
		const updated = pendingWordyPerkinsMasks.concat(attempt.dotMask);
		const acceptedSequences = Array.isArray(activeWordItem.acceptedPerkinsSequences)
			? activeWordItem.acceptedPerkinsSequences
			: [activeWordItem.perkinsSequenceMasks || []];
		const isComplete = acceptedSequences.some(sequence => sequence.length === updated.length && sequenceStartsWith(sequence, updated));
		const isPrefix = acceptedSequences.some(sequence => sequenceStartsWith(sequence, updated));
		if (isComplete) {
			pendingWordyPerkinsMasks = [];
			handleWordyCompleted();
			return;
		}
		if (isPrefix) {
			pendingWordyPerkinsMasks = updated;
			return;
		}
		pendingWordyPerkinsMasks = [];
		handleWordyMiss();
		return;
	}

	let submittedLetters = "";
	if (attempt.type === "standard") {
		submittedLetters = normalizeAttemptLetters(attempt.key);
	} else if (attempt.type === "brailleText") {
		submittedLetters = normalizeAttemptLetters(attempt.char);
	}
	if (!submittedLetters) {
		handleWordyMiss();
		return;
	}

	const updatedTokens = pendingWordyTextTokens.concat(submittedLetters.split(""));
	const expectedPrefix = activeWordItem.letters.slice(0, updatedTokens.length).join("");
	const submittedPrefix = updatedTokens.join("");
	if (submittedPrefix === expectedPrefix && updatedTokens.length === activeWordItem.letters.length) {
		pendingWordyTextTokens = [];
		handleWordyCompleted();
		return;
	}
	if (submittedPrefix === expectedPrefix) {
		pendingWordyTextTokens = updatedTokens;
		return;
	}
	pendingWordyTextTokens = [];
	handleWordyMiss();
}

function handleWordyCompleted() {
	clearTimeout(moleUpTimer);
	moleUpTimer = null;
	missRegisteredForMole = true;
	const wordLength = Array.isArray(activeWordItem?.letters) ? activeWordItem.letters.length : 3;
	const scoreBeforeCompletion = score;
	lettersWhackedThisRound += activeWordItem.letters.length;
	setCurrentMoleId(0);

	if (isTrainingMode) {
		hitsThisRound += 1;
		trainingMolesCompleted += 1;
		playBlitzCompletionSound(wordLength, scoreBeforeCompletion, scoreBeforeCompletion, 0);
		clearActivePresentation();
		scheduleNextTrainingMole(TRAINING_POST_HIT_DELAY_MS);
		return;
	}

	hitsThisRound += 1;
	hitStreak += 1;
	score += 10 + (activeWordItem.letters.length * 2);
	applyStreakAndSpeedBonuses();
	dispatchScoreUpdated();
	playBlitzCompletionSound(wordLength, scoreBeforeCompletion, score, 0);
	clearActivePresentation();
	scheduleNextMole(0);
}

function playBlitzCompletionSound(wordLength, scoreBeforeHit, scoreAfterHit, delayMs) {
	const playSound = () => {
		playBlitzWordHit(wordLength, scoreBeforeHit, scoreAfterHit);
	};
	if (delayMs > 0) {
		setTimeout(playSound, delayMs);
		return;
	}
	playSound();
}

function applyStreakAndSpeedBonuses() {
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
}

function handleWordyMiss() {
	pendingWordyTextTokens = [];
	pendingWordyPerkinsMasks = [];
	if (isTrainingMode) {
		handleTrainingMiss(currentWordAudioLane());
		return;
	}
	if (missRegisteredForMole) return;
	missRegisteredForMole = true;
	missesThisRound += 1;
	recordMoleReconItem(activeWordItem);
	hitStreak = 0;
	score = Math.max(0, score - 2);
	playMissSound(currentWordAudioLane());
	dispatchScoreUpdated();
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

		clearActivePresentation();
		setCurrentMoleId(0);

		scheduleNextTrainingMole(TRAINING_POST_HIT_DELAY_MS);
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

	clearActivePresentation();
	setCurrentMoleId(0);
	scheduleNextMole(0);
	dispatchScoreUpdated();
}

function handleTrainingMiss(laneIndex = activeMoleIndex) {
	const now = performance.now();
	if (now - lastTrainingMissAtMs < 200) return;
	lastTrainingMissAtMs = now;
	playMissSound(laneIndex ?? 2);
}

function handleMiss() {
	missesThisRound += 1;
	recordMoleReconItem(activeMoleItem);
	hitStreak = 0;
	score = Math.max(0, score - 2);

	playMissSound(activeMoleIndex);
	dispatchScoreUpdated();
}

function dispatchScoreUpdated() {
	document.dispatchEvent(new CustomEvent("wabScoreUpdated", {
		detail: {
			score,
			hitStreak,
			lettersWhacked: lettersWhackedThisRound
		}
	}));
}

function getCurrentSpeechPayload() {
	if (activeWordItem) {
		return { text: buildWordAnnounceText(activeWordItem) };
	}

	if (activeMoleIndex === null) return null;

	const item = activeMoleItem;
	if (!item) return null;

	return { text: buildAnnounceText(item) };
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
