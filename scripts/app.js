"use strict";

import { initGameLoop, startRound, stopRound } from "./gameLoop.js";
import { attachDesktopListeners, handleBrailleTextInput as handleBrailleTextInputEngine } from "./inputEngine.js";
import { unlockAudio } from "./audioEngine.js";
import { unlockSpeech } from "./speechEngine.js";
import { resetInputHeuristics, getHardwareKeySeen } from "./inputEngine.js";


const body = document.body;
const homeContent = document.getElementById("homeContent");
const gameArea = document.getElementById("gameArea");
const resultsArea = document.getElementById("resultsArea");
const startButton = document.getElementById("startGameButton");
const playAgainButton = document.getElementById("playAgainButton");
const cashOutButton = document.getElementById("cashOutButton");
const brailleInput = document.getElementById("brailleInput");
const liveRegion = document.getElementById("srLiveRegion");

const grade1InputModeFieldset = document.getElementById("grade1InputModeFieldset");
const inputModeQwerty = document.getElementById("inputModeQwerty");
const inputModePerkins = document.getElementById("inputModePerkins");

let gameState = "home";
let mobileBrailleActive = false;

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
		releaseBrailleFocus();
		startButton.focus();
	}

	if (state === "playing") {
		homeContent.inert = true;
		gameArea.hidden = false;
		resultsArea.hidden = true;
		activateBrailleFocus();
	}

	if (state === "results") {
		homeContent.inert = true;
		gameArea.hidden = true;
		resultsArea.hidden = false;
		releaseBrailleFocus();
		requestAnimationFrame(() => {
			document.getElementById("resultsHeading").focus();
		});
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

function startGame() {
	unlockAudio();
	unlockSpeech();
	const settings = getSelectedSettings();
	setGameState("playing");
	startRound(settings.brailleMode, settings.roundTime, settings.inputMode);
}

function endGame() {
	setGameState("results");
}

function announce(text) {
	liveRegion.textContent = "";
	setTimeout(() => {
		liveRegion.textContent = text;
	}, 10);
}

function announceEndOfRound() {
	announce("Round complete. Results coming up.");
}

function activateBrailleFocus() {
	if (!brailleInput) return;

	resetInputHeuristics();
	brailleInput.blur();

	setTimeout(() => {
		if (gameState !== "playing") return;
		if (getHardwareKeySeen()) return;
		brailleInput.focus();
	}, 700);
}

function releaseBrailleFocus() {
	mobileBrailleActive = false;
	if (document.activeElement === brailleInput) {
		brailleInput.blur();
	}
}

function handleBrailleTextInput(text) {
	if (gameState !== "playing") return;
	handleBrailleTextInputEngine(text);
}

function setupEventListeners() {
	startButton.addEventListener("click", startGame);

	playAgainButton.addEventListener("click", () => {
		const settings = getSelectedSettings();
		setGameState("playing");
		startRound(settings.brailleMode, settings.roundTime, settings.inputMode);
	});

	cashOutButton.addEventListener("click", () => {
		setGameState("home");
	});

	document.querySelectorAll("input[name='brailleMode']").forEach(radio => {
		radio.addEventListener("change", syncInputModeUI);
	});

	brailleInput.addEventListener("beforeinput", event => {
		if (event.inputType === "insertText") {
			event.preventDefault();
			handleBrailleTextInput(event.data);
		}
	});

}

function init() {
	setGameState("home");
	setupEventListeners();
	syncInputModeUI();

	initGameLoop({
		liveRegion: liveRegion,
		moleElements: Array.from(document.querySelectorAll("#gameBoard .mole"))
	});
document.addEventListener("wabRoundEnded", () => {
	if (body.getAttribute("data-game-state") === "playing") {
		endGame();
	}
});

	attachDesktopListeners();
}

init();
