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

const keyDownMoleId = new Map();

function setAttemptCallback(cb) {
	attemptCallback = cb;
}

function setInputMode(mode) {
	currentInputMode = mode === "perkins" ? "perkins" : "qwerty";
	chordDown.clear();
	chordUsed.clear();
	chordMoleId = 0;
	keyDownMoleId.clear();
}

function setCurrentMoleId(id) {
	currentMoleId = Number.isFinite(id) ? id : 0;
}

function emitAttempt(attempt, moleIdForAttempt) {
	if (!attemptCallback) return;
	attempt.moleId = moleIdForAttempt;
	attemptCallback(attempt);
}

function normalizeKey(event) {
	const key = (event.key || "").toLowerCase();
	if (key === " ") return "space";
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

	if (currentInputMode === "perkins" && perkinsKeys.has(key)) {
		if (chordUsed.size === 0) chordMoleId = currentMoleId;
		chordDown.add(key);
		chordUsed.add(key);
		event.preventDefault();
		event.stopPropagation();
		return;
	}

	if (key.length === 1 || key === "space") {
		if (!keyDownMoleId.has(key)) keyDownMoleId.set(key, currentMoleId);
		event.preventDefault();
		event.stopPropagation();
	}
}

function onKeyUp(event) {
	const key = normalizeKey(event);

	if (currentInputMode === "perkins" && perkinsKeys.has(key)) {
		chordDown.delete(key);
		event.preventDefault();
		event.stopPropagation();

		if (chordDown.size === 0 && chordUsed.size > 0) {
			const mask = dotMaskFromKeys(chordUsed);
			const moleIdForChord = chordMoleId || currentMoleId;
			chordUsed.clear();
			chordMoleId = 0;

			emitAttempt({
				type: "perkins",
				dotMask: mask
			}, moleIdForChord);
		}
		return;
	}

	if (key.length === 1) {
		const moleIdForKey = keyDownMoleId.get(key) ?? currentMoleId;
		keyDownMoleId.delete(key);

		event.preventDefault();
		event.stopPropagation();

		emitAttempt({
			type: "standard",
			key
		}, moleIdForKey);
		return;
	}

	if (key === "space") {
		const moleIdForKey = keyDownMoleId.get("space") ?? currentMoleId;
		keyDownMoleId.delete("space");

		event.preventDefault();
		event.stopPropagation();

		emitAttempt({
			type: "standard",
			key: " "
		}, moleIdForKey);
	}
}

function attachKeyboardListeners() {
	window.addEventListener("keydown", onKeyDown, true);
	window.addEventListener("keyup", onKeyUp, true);
}

/*
	Text from braille displays / BSI:
	We must treat it as committed characters.
	Spaces are ignored to avoid “commit-space” causing misses.
*/
function handleCommittedText(text) {
	const raw = String(text ?? "");
	if (!raw) return;

	for (let i = 0; i < raw.length; i++) {
		const ch = raw[i].toLowerCase();
		if (ch === " ") continue;

		emitAttempt({
			type: "brailleText",
			char: ch
		}, currentMoleId);
	}
}

export {
	attachKeyboardListeners,
	setAttemptCallback,
	setInputMode,
	setCurrentMoleId,
	handleCommittedText
};
