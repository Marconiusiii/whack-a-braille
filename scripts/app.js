"use strict";

import { initGameLoop, startRound } from "./gameLoop.js";
import { attachDesktopListeners, handleBrailleTextInput as handleBrailleTextInputEngine } from "./inputEngine.js";
import { unlockAudio } from "./audioEngine.js";
import { unlockSpeech } from "./speechEngine.js";

const body = document.body;
const homeContent = document.getElementById("homeContent");
const gameArea = document.getElementById("gameArea");
const resultsArea = document.getElementById("resultsArea");
const startButton = document.getElementById("startGameButton");
const dropCoinButton = document.getElementById("dropCoinButton");
const cashOutButton = document.getElementById("cashOutButton");
const brailleInput = document.getElementById("brailleInput");

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
		homeContent.inert = false;
		gameArea.hidden = true;
		resultsArea.hidden = true;
		if (brailleInput) brailleInput.blur();
		startButton.focus();
		return;
	}

	if (state === "playing") {
		homeContent.inert = true;
		gameArea.hidden = false;
		resultsArea.hidden = true;
		if (brailleInput) brailleInput.blur();
		return;
	}

	if (state === "results") {
		homeContent.inert = true;
		gameArea.hidden = true;
		resultsArea.hidden = false;
		resultsArea.inert = false;
		if (brailleInput) brailleInput.blur();

		if (resultsHeading) {
			requestAnimationFrame(() => {
				resultsHeading.focus();
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
	const brailleMode = document.querySelector("input[name='brailleMode']:checked").value;
	const roundTime = parseInt(document.querySelector("input[name='roundTime']:checked").value, 10);

	let inputMode = document.querySelector("input[name='inputMode']:checked")?.value || "qwerty";
	if (isGrade2Mode(brailleMode)) inputMode = "perkins";

	return {
		brailleMode,
		roundTime,
		inputMode
	};
}

function startGameFromSettings() {
	unlockAudio();
	unlockSpeech();
	const settings = getSelectedSettings();
	setGameState("playing");
	startRound(settings.brailleMode, settings.roundTime, settings.inputMode);
}

function endGameToResults() {
	setGameState("results");
}

function setupEventListeners() {
	startButton.addEventListener("click", startGameFromSettings);

	if (dropCoinButton) {
		dropCoinButton.addEventListener("click", () => {
			startGameFromSettings();
		});
	}

	if (cashOutButton) {
		cashOutButton.addEventListener("click", () => {
			setGameState("home");
		});
	}

	document.querySelectorAll("input[name='brailleMode']").forEach(radio => {
		radio.addEventListener("change", syncInputModeUI);
	});

	if (brailleInput) {
		brailleInput.addEventListener("beforeinput", event => {
			if (gameState !== "playing") return;
			if (event.inputType === "insertText") {
				event.preventDefault();
				handleBrailleTextInputEngine(event.data);
			}
		});
	}

	document.addEventListener("wabRoundEnded", () => {
		if (body.getAttribute("data-game-state") === "playing") {
			endGameToResults();
		}
	});
}

function init() {
	setGameState("home");
	setupEventListeners();
	syncInputModeUI();

	initGameLoop({
		moleElements: Array.from(document.querySelectorAll("#gameBoard .mole"))
	});

	attachDesktopListeners();
}

init();
