"use strict";

import { getBrailleItemsForMode } from "./brailleRegistry.js";
import { setAttemptCallback } from "./inputEngine.js";

/*
	GameLoop responsibilities:

	- Choose 5 static braille items per round
	- Control mole timing and ramp
	- Track which mole is active
	- Announce only the active mole
	- Resolve hit vs miss
	- End the round cleanly

	GameLoop does NOT:
	- Manage focus
	- Manage input listeners
	- Play audio
	- Track scores yet
*/

let liveRegion = null;
let moleElements = [];
let roundDurationMs = 30000;
let currentInputMode = "qwerty";

let availableItems = [];
let roundItems = [];
let activeMoleIndex = null;

let roundStartTime = 0;
let roundTimer = null;
let moleTimer = null;

let isRunning = false;

/* Timing tuning */

const startIntervalMs = 900;
const endIntervalMs = 300;
const startUpTimeMs = 650;
const endUpTimeMs = 250;

/* Public setup */

function initGameLoop(options) {
	liveRegion = options.liveRegion;
	moleElements = options.moleElements;
}

/* Round control */

function startRound(modeId, durationSeconds, inputMode) {

	if (isRunning) return;
	currentInputMode = inputMode;


	roundDurationMs = durationSeconds * 1000;
	availableItems = getBrailleItemsForMode(modeId);
	roundItems = pickFiveItems(availableItems);

	isRunning = true;
	roundStartTime = Date.now();

	setAttemptCallback(handleAttempt);

	scheduleNextMole();
	roundTimer = setTimeout(endRound, roundDurationMs);
}

function endRound() {
	isRunning = false;

	clearTimeout(roundTimer);
	clearTimeout(moleTimer);

	clearActiveMole();

	setAttemptCallback(null);
}

function stopRound() {
	endRound();
}

/* Mole selection */

function pickFiveItems(pool) {
	const shuffled = [...pool].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, 5);
}

/* Timing helpers */

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

/* Mole lifecycle */

function scheduleNextMole() {
	if (!isRunning) return;

	const delay = getCurrentInterval() + randomJitter();
	moleTimer = setTimeout(showRandomMole, delay);
}

function randomJitter() {
	return Math.floor(Math.random() * 120);
}

function showRandomMole() {
	if (!isRunning) return;

	clearActiveMole();

	activeMoleIndex = pickNextMoleIndex();
	const moleItem = roundItems[activeMoleIndex];

	announceMole(moleItem);
	activateMoleVisual(activeMoleIndex);

	const upTime = getCurrentUpTime();

	moleTimer = setTimeout(() => {
		clearActiveMole();
		scheduleNextMole();
	}, upTime);
}

function pickNextMoleIndex() {
	let index;
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

/* Visual hooks */

function activateMoleVisual(index) {
	const mole = moleElements[index];
	if (mole) mole.classList.add("active");
}

function deactivateMoleVisual(index) {
	const mole = moleElements[index];
	if (mole) mole.classList.remove("active");
}

/* Screen reader output */

function announceMole(item) {
	if (!liveRegion) return;
	liveRegion.textContent = "";
	setTimeout(() => {
		liveRegion.textContent = item.announceText;
	}, 10);
}

/* Input resolution */

function handleAttempt(attempt) {
	if (!isRunning) return;
	if (activeMoleIndex === null) return;

	const currentItem = roundItems[activeMoleIndex];

	if (currentInputMode === "perkins" && attempt.type === "standard") {
		return;
	}

	if (attempt.item && attempt.item.id === currentItem.id) {
		handleHit();
	} else {
		handleMiss();
	}
}

function handleHit() {
	clearActiveMole();
	scheduleNextMole();
}

function handleMiss() {
	// Miss feedback will be audio-only later
}

/* Exports */

export {
	initGameLoop,
	startRound,
	stopRound
};
