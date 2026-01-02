"use strict";

import { initGameLoop, startRound } from "./gameLoop.js";
import { unlockAudio } from "./audioEngine.js";
import { unlockSpeech } from "./speechEngine.js";
import { attachKeyboardListeners, setInputMode, setCurrentMoleId } from "./inputEngine.js";

const body = document.body;

const homeContent = document.getElementById("homeContent");
const gameArea = document.getElementById("gameArea");
const resultsArea = document.getElementById("resultsArea");
const footer = document.querySelector("footer");

const startButton = document.getElementById("startGameButton");
const playAgainButton = document.getElementById("playAgainButton");
const cashOutButton = document.getElementById("cashOutButton");

const grade1InputModeFieldset = document.getElementById("grade1InputModeFieldset");
const inputModePerkins = document.getElementById("inputModePerkins");

const resultsHeading = document.getElementById("resultsHeading");

let gameState = "home";

function isGrade2Mode(modeId) {
	return modeId === "grade2Symbols" || modeId === "grade2Words";
}

function setGameState(state) {
	gameState = state;
	body.setAttribute("data-game-state", state);

	if (state === "home") {
		if (homeContent) {
			homeContent.hidden = false;
			homeContent.inert = false;
		}

		if (gameArea) gameArea.hidden = true;
		if (resultsArea) resultsArea.hidden = true;

		if (footer) footer.hidden = false;

		setCurrentMoleId(0);

		if (startButton) startButton.focus();
		return;
	}

	if (state === "playing") {
		if (homeContent) {
			homeContent.hidden = true;
			homeContent.inert = true;
		}

		if (gameArea) gameArea.hidden = false;
		if (resultsArea) resultsArea.hidden = true;

		if (footer) footer.hidden = true;

		setCurrentMoleId(0);
		return;
	}

	if (state === "results") {
		if (homeContent) {
			homeContent.hidden = true;
			homeContent.inert = true;
		}

		if (gameArea) gameArea.hidden = true;
		if (resultsArea) resultsArea.hidden = false;

		if (footer) footer.hidden = true;

		setCurrentMoleId(0);

		if (resultsHeading) {
			requestAnimationFrame(() => {
				resultsHeading.focus({ preventScroll: true });
				setTimeout(() => resultsHeading.focus({ preventScroll: true }), 75);
			});
		}
	}
}

function syncInputModeUI() {
	const selectedMode = document.querySelector("input[name='brailleMode']:checked")?.value;
	if (!selectedMode || !grade1InputModeFieldset) return;

	if (isGrade2Mode(selectedMode)) {
		grade1InputModeFieldset.disabled = true;
		if (inputModePerkins) inputModePerkins.checked = true;
	} else {
		grade1InputModeFieldset.disabled = false;
	}
}

function getSelectedSettings() {
	const brailleMode = document.querySelector("input[name='brailleMode']:checked")?.value || "lettersOnly";
	const roundTimeRaw = document.querySelector("input[name='roundTime']:checked")?.value || "30";
	const roundTime = parseInt(roundTimeRaw, 10);

	let inputMode = document.querySelector("input[name='inputMode']:checked")?.value || "qwerty";
	if (isGrade2Mode(brailleMode)) inputMode = "perkins";

	return {
		brailleMode,
		roundTime: Number.isFinite(roundTime) ? roundTime : 30,
		inputMode
	};
}

function startGameFromSettings() {
	unlockAudio();
	unlockSpeech();

	const settings = getSelectedSettings();

	setInputMode(settings.inputMode);
	setCurrentMoleId(0);

	setGameState("playing");
	startRound(settings.brailleMode, settings.roundTime, settings.inputMode);
}

function setupEventListeners() {
	if (startButton) startButton.addEventListener("click", startGameFromSettings);

	if (playAgainButton) {
		playAgainButton.addEventListener("click", () => {
			startGameFromSettings();
		});
	}

	if (cashOutButton) {
		cashOutButton.addEventListener("click", () => {
			setGameState("home");
		});
	}

	document.querySelectorAll("input[name='brailleMode']").forEach((radio) => {
		radio.addEventListener("change", syncInputModeUI);
	});

	document.addEventListener("wabRoundEnded", () => {
		if (gameState !== "playing") return;
		setCurrentMoleId(0);
		setGameState("results");
	});
}

function init() {
	setGameState("home");
	setupEventListeners();
	syncInputModeUI();

	initGameLoop({
		moleElements: Array.from(document.querySelectorAll("#gameBoard .mole"))
	});

	attachKeyboardListeners();
}

init();
