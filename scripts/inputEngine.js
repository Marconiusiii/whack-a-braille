"use strict";

let attemptCallback = null;

const perkinsKeyToDot = {
	f: 1,
	d: 2,
	s: 3,
	j: 4,
	k: 5,
	l: 6
};

const perkinsKeys = new Set(Object.keys(perkinsKeyToDot));

let hardwareKeySeen = false;
let chordDown = new Set();
let chordUsed = new Set();
let chordEvalTimer = null;

function setAttemptCallback(cb) {
	attemptCallback = cb;
}

function resetInputHeuristics() {
	hardwareKeySeen = false;
}

function getHardwareKeySeen() {
	return hardwareKeySeen;
}

function clearChordTimer() {
	if (chordEvalTimer) {
		clearTimeout(chordEvalTimer);
		chordEvalTimer = null;
	}
}

function dotMaskFromKeys(keysSet) {
	let mask = 0;
	for (const key of keysSet) {
		const dot = perkinsKeyToDot[key];
		if (dot) mask |= 1 << (dot - 1);
	}
	return mask;
}

function emitAttempt(attempt) {
	if (!attemptCallback) return;
	attemptCallback(attempt);
}

function isEditableTarget(target) {
	if (!target) return false;
	const tag = (target.tagName || "").toLowerCase();
	if (tag === "input" || tag === "textarea") return true;
	if (target.isContentEditable) return true;
	return false;
}

function normalizeKey(event) {
	const key = (event.key || "").toLowerCase();
	if (key === " ") return "space";
	return key;
}

function onKeyDown(event) {
	hardwareKeySeen = true;

	const key = normalizeKey(event);

	if (perkinsKeys.has(key)) {
		chordDown.add(key);
		chordUsed.add(key);
		clearChordTimer();
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
	const key = normalizeKey(event);

	if (perkinsKeys.has(key)) {
		chordDown.delete(key);
		event.preventDefault();
		event.stopPropagation();

		if (chordDown.size === 0 && chordUsed.size > 0) {
			clearChordTimer();
			chordEvalTimer = setTimeout(() => {
				const mask = dotMaskFromKeys(chordUsed);
				chordUsed.clear();
				emitAttempt({
					type: "perkins",
					dotMask: mask
				});
			}, 30);
		}
		return;
	}

	if (key.length === 1) {
		if (isEditableTarget(event.target)) {
			event.preventDefault();
			event.stopPropagation();
		}

		emitAttempt({
			type: "standard",
			key: key
		});
		return;
	}

	if (key === "space") {
		if (isEditableTarget(event.target)) {
			event.preventDefault();
			event.stopPropagation();
		}
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
	const clean = String(text ?? "");
	if (!clean) return;

	emitAttempt({
		type: "bsi",
		text: clean
	});
}

export {
	attachDesktopListeners,
	setAttemptCallback,
	handleBrailleTextInput,
	resetInputHeuristics,
	getHardwareKeySeen
};
