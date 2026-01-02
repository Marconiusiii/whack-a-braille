"use strict";

let attemptCallback = null;
let currentInputMode = "qwerty";
let currentMoleId = 0;

const perkinsKeyToDot = {
	f: 1,
	d: 2,
	s: 3,
	j: 4,
	k: 5,
	l: 6
};

const perkinsKeys = new Set(Object.keys(perkinsKeyToDot));

let chordDown = new Set();
let chordUsed = new Set();
let chordMoleId = 0;

function setAttemptCallback(cb) {
	attemptCallback = cb;
}

function setInputMode(mode) {
	currentInputMode = mode === "perkins" ? "perkins" : "qwerty";
	chordDown.clear();
	chordUsed.clear();
	chordMoleId = 0;
}

function setCurrentMoleId(id) {
	currentMoleId = id;
}

function emitAttempt(attempt) {
	if (!attemptCallback) return;
	attempt.moleId = currentMoleId;
	attemptCallback(attempt);
}

function normalizeKey(event) {
	const key = (event.key || "").toLowerCase();
	return key;
}

function dotMaskFromKeys(keys) {
	let mask = 0;
	for (const key of keys) {
		const dot = perkinsKeyToDot[key];
		if (dot) mask |= 1 << (dot - 1);
	}
	return mask;
}

function onKeyDown(event) {
	const key = normalizeKey(event);

	/* ONLY intercept Perkins keys in Perkins mode */
	if (currentInputMode === "perkins" && perkinsKeys.has(key)) {
		if (chordUsed.size === 0) chordMoleId = currentMoleId;
		chordDown.add(key);
		chordUsed.add(key);
		event.preventDefault();
		event.stopPropagation();
		return;
	}

	/* Otherwise: DO NOT BLOCK
	   This allows braille displays (keyboard emulation) to work */
}

function onKeyUp(event) {
	const key = normalizeKey(event);

	if (currentInputMode === "perkins" && perkinsKeys.has(key)) {
		chordDown.delete(key);
		event.preventDefault();
		event.stopPropagation();

		if (chordDown.size === 0 && chordUsed.size > 0) {
			const mask = dotMaskFromKeys(chordUsed);
			chordUsed.clear();
			chordMoleId = 0;

			emitAttempt({
				type: "perkins",
				dotMask: mask
			});
		}
		return;
	}

	/* Normal keyboard / braille-display characters */
	if (key.length === 1) {
		emitAttempt({
			type: "standard",
			key
		});
	}
}

function attachKeyboardListeners() {
	window.addEventListener("keydown", onKeyDown, true);
	window.addEventListener("keyup", onKeyUp, true);
}

export {
	attachKeyboardListeners,
	setAttemptCallback,
	setInputMode,
	setCurrentMoleId
};
