"use strict";

import { brailleRegistry } from "./brailleRegistry.js";

/*
	InputEngine responsibilities:

	- Track Perkins-style key chords
	- Resolve chords to dot masks
	- Resolve mobile braille text input
	- Emit a normalized "attempt" object
	- Never touch the DOM
	- Never announce anything
*/

const perkinsKeyToDot = {
	f: 1,
	d: 2,
	s: 3,
	j: 4,
	k: 5,
	l: 6
};

let activeKeys = new Set();
let chordTimer = null;
let chordWindowMs = 80;

let attemptCallback = null;

function setAttemptCallback(callback) {
	attemptCallback = callback;
}

function resetChord() {
	activeKeys.clear();
	if (chordTimer !== null) {
		clearTimeout(chordTimer);
		chordTimer = null;
	}
}

function buildDotMaskFromKeys(keys) {
	let mask = 0;
	for (const key of keys) {
		const dot = perkinsKeyToDot[key];
		if (dot) {
			mask |= 1 << (dot - 1);
		}
	}
	return mask;
}

function resolvePerkinsChord(dotMask) {
	if (dotMask === 0) return null;

	for (const item of brailleRegistry) {
		if (item.dotMask === dotMask) {
			return item;
		}
	}
	return null;
}

function handlePerkinsKeyDown(event) {
	const key = event.key.toLowerCase();
	if (!(key in perkinsKeyToDot)) return;

	activeKeys.add(key);

	if (chordTimer === null) {
		chordTimer = setTimeout(resolveChord, chordWindowMs);
	}
}

function handlePerkinsKeyUp(event) {
	const key = event.key.toLowerCase();
	if (!(key in perkinsKeyToDot)) return;

	// keyup is intentionally ignored
	// resolution happens on timer
}

function resolveChord() {
	const dotMask = buildDotMaskFromKeys(activeKeys);
	const match = resolvePerkinsChord(dotMask);

	if (attemptCallback) {
		attemptCallback({
			type: "perkins",
			dotMask: dotMask,
			item: match
		});
	}

	resetChord();
}

function resolveStandardKeyInput(key) {
	const normalizedKey = key.toLowerCase();

	for (const item of brailleRegistry) {
		if (item.standardKey === normalizedKey) {
			return item;
		}
	}
	return null;
}

function handleStandardKey(event) {
	if (event.key.length !== 1) return;

	const match = resolveStandardKeyInput(event.key);

	if (attemptCallback) {
		attemptCallback({
			type: "standard",
			key: event.key,
			item: match
		});
	}
}

function normalizeBrailleText(text) {
	return text.trim().toLowerCase();
}

function resolveBrailleTextInput(text) {
	const normalized = normalizeBrailleText(text);
	if (!normalized) return null;

	for (const item of brailleRegistry) {
		if (item.id === normalized) return item;
	}
	return null;
}

function handleBrailleTextInput(text) {
	const match = resolveBrailleTextInput(text);

	if (attemptCallback) {
		attemptCallback({
			type: "brailleText",
			text: text,
			item: match
		});
	}
}

function attachDesktopListeners() {
	document.addEventListener("keydown", event => {
		if (event.key.toLowerCase() in perkinsKeyToDot) {
			handlePerkinsKeyDown(event);
		} else {
			handleStandardKey(event);
		}
	});

	document.addEventListener("keyup", handlePerkinsKeyUp);
}

export {
	setAttemptCallback,
	handleBrailleTextInput,
	attachDesktopListeners
};
