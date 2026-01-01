"use strict";

let attemptCallback = null;
let captureEnabled = false;

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

function setAttemptCallback(cb) {
	attemptCallback = cb;
}

function setCaptureEnabled(isEnabled) {
	captureEnabled = !!isEnabled;
	if (!captureEnabled) {
		chordDown.clear();
		chordUsed.clear();
	}
}

function emitAttempt(attempt) {
	if (!attemptCallback) return;
	attemptCallback(attempt);
}

function normalizeKey(event) {
	const key = (event.key || "").toLowerCase();
	if (key === " ") return "space";
	return key;
}

function dotMaskFromKeys(keysSet) {
	let mask = 0;
	for (const key of keysSet) {
		const dot = perkinsKeyToDot[key];
		if (dot) mask |= 1 << (dot - 1);
	}
	return mask;
}

function onKeyDown(event) {
	if (!captureEnabled) return;

	const key = normalizeKey(event);

	if (perkinsKeys.has(key)) {
		chordDown.add(key);
		chordUsed.add(key);
		event.preventDefault();
		event.stopPropagation();
		return;
	}

	if (key.length === 1 || key === "space") {
		event.preventDefault();
		event.stopPropagation();
	}
}

function onKeyUp(event) {
	if (!captureEnabled) return;

	const key = normalizeKey(event);

	if (perkinsKeys.has(key)) {
		chordDown.delete(key);
		event.preventDefault();
		event.stopPropagation();

		if (chordDown.size === 0 && chordUsed.size > 0) {
			const mask = dotMaskFromKeys(chordUsed);
			chordUsed.clear();
			emitAttempt({
				type: "perkins",
				dotMask: mask
			});
		}
		return;
	}

	if (key.length === 1) {
		event.preventDefault();
		event.stopPropagation();
		emitAttempt({
			type: "standard",
			key: key
		});
		return;
	}

	if (key === "space") {
		event.preventDefault();
		event.stopPropagation();
		emitAttempt({
			type: "standard",
			key: " "
		});
	}
}

function attachDesktopListeners() {
	window.addEventListener("keydown", onKeyDown, true);
	window.addEventListener("keyup", onKeyUp, true);
}

function handleBrailleTextInput(text) {
	if (!captureEnabled) return;

	const clean = String(text ?? "").trim();
	if (!clean) return;

	emitAttempt({
		type: "bsi",
		text: clean
	});
}

export {
	attachDesktopListeners,
	setAttemptCallback,
	setCaptureEnabled,
	handleBrailleTextInput
};
