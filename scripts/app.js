"use strict";

import { initGameLoop, startRound, stopRound } from "./gameLoop.js";
import { attachDesktopListeners, handleBrailleTextInput } from "./inputEngine.js";
import { handleBrailleTextInput as handleBrailleTextInputEngine } from "./inputEngine.js";

const body = document.body;
const homeContent = document.getElementById("homeContent");
const gameArea = document.getElementById("gameArea");
const resultsArea = document.getElementById("resultsArea");
const startButton = document.getElementById("startGameButton");
const playAgainButton = document.getElementById("playAgainButton");
const cashOutButton = document.getElementById("cashOutButton");
const brailleInput = document.getElementById("brailleInput");
const liveRegion = document.getElementById("srLiveRegion");

let gameState = "home";
let roundTimer = null;
let roundDuration = 30;
let mobileBrailleActive = false;

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
		document.getElementById("resultsHeading").focus();
	}
}

function getSelectedSettings() {
	const mode = document.querySelector("input[name='brailleMode']:checked").value;
	const time = document.querySelector("input[name='roundTime']:checked").value;
	return {
		brailleMode: mode,
		roundTime: parseInt(time, 10)
	};
}

function startGame() {
	const settings = getSelectedSettings();
	roundDuration = settings.roundTime;

	setGameState("playing");
	startRound(settings.brailleMode, settings.roundTime);
}

function endGame() {
	stopRound();
	announceEndOfRound();
	setGameState("results");
}

function startRoundTimer() {
	stopRoundTimer();
	roundTimer = setTimeout(() => {
		endGame();
	}, roundDuration * 1000);
}

function stopRoundTimer() {
	if (roundTimer !== null) {
		clearTimeout(roundTimer);
		roundTimer = null;
	}
}

function announce(text) {
	liveRegion.textContent = "";
	window.setTimeout(() => {
		liveRegion.textContent = text;
	}, 10);
}

function announceEndOfRound() {
	announce("Round complete. Results coming up.");
}

function activateBrailleFocus() {
	if (!brailleInput) return;
	mobileBrailleActive = true;
	brailleInput.focus();
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

function handleKeyDown(event) {
	if (gameState !== "playing") return;

	// Ignore if mobile braille input is active
	if (mobileBrailleActive) return;

	// Placeholder: chord handling will go here
	console.log("Key down:", event.key);
}

function setupEventListeners() {
	startButton.addEventListener("click", startGame);

	playAgainButton.addEventListener("click", () => {
		setGameState("home");
	});

	cashOutButton.addEventListener("click", () => {
		setGameState("home");
	});

	document.addEventListener("keydown", handleKeyDown);

	brailleInput.addEventListener("beforeinput", event => {
		if (event.inputType === "insertText") {
			event.preventDefault();
			handleBrailleTextInput(event.data);
		}
	});

	// Safety net: keep focus on braille input during play
	document.addEventListener("focusin", () => {
		if (gameState === "playing" && brailleInput && !brailleInput.contains(document.activeElement)) {
			brailleInput.focus();
		}
	});
}

function init() {
	setGameState("home");
	setupEventListeners();
	initGameLoop({
		liveRegion: liveRegion,
		moleElements: Array.from(document.querySelectorAll("#gameBoard .mole"))
	});

	attachDesktopListeners();

}

init();
