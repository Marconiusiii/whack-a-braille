"use strict";

import { initGameLoop, startRound } from "./gameLoop.js";
import { unlockAudio, playEndBuzzer, playStartFlourish } from "./audioEngine.js";
import { unlockSpeech, speak } from "./speechEngine.js";
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

function setHiddenInert(el, hide) {
	if (!el) return;
	el.hidden = hide;
	el.inert = hide;
}

function setGameState(state) {
	gameState = state;
	body.setAttribute("data-game-state", state);

	if (state === "home") {
		setHiddenInert(homeContent, false);
		setHiddenInert(gameArea, true);
		setHiddenInert(resultsArea, true);
		setHiddenInert(footer, false);

		setCurrentMoleId(0);

		if (startButton) {
			requestAnimationFrame(() => {
				startButton.focus({ preventScroll: true });
			});
		}
		return;
	}

	if (state === "playing") {
		setHiddenInert(homeContent, true);
		setHiddenInert(resultsArea, true);
		setHiddenInert(footer, true);

		if (gameArea) {
			gameArea.hidden = false;
			gameArea.inert = false;
		}

		setCurrentMoleId(0);
		return;
	}

	if (state === "results") {
		setHiddenInert(homeContent, true);
		setHiddenInert(gameArea, true);
		setHiddenInert(footer, true);

		if (resultsArea) {
			resultsArea.hidden = false;
			resultsArea.inert = false;
		}

		setCurrentMoleId(0);

		playEndBuzzer();

		if (resultsHeading) {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					resultsHeading.focus({ preventScroll: true });
				});
			});
		}
	}
}
function primeSpeech() {
	const utterance = new SpeechSynthesisUtterance(" ");
	utterance.volume = 0;
	window.speechSynthesis.speak(utterance);
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
	const brailleMode = document.querySelector("input[name='brailleMode']:checked")?.value || "grade1Letters";
	const roundTimeValue = document.querySelector("input[name='roundTime']:checked")?.value || "30";
	const roundTime = parseInt(roundTimeValue, 10);

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

	playStartFlourish();
	speak("Ready?", {
		cancelPrevious: true,
		dedupe: false
	});
	setTimeout(() => {
		startRound(settings.brailleMode, settings.roundTime, settings.inputMode);
	}, 650);
}

function setupEventListeners() {
	if (startButton) {
		startButton.addEventListener("click", () => {
			primeSpeech();
			startGameFromSettings();
		});
	}

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

	document.querySelectorAll("input[name='brailleMode']").forEach(radio => {
		radio.addEventListener("change", syncInputModeUI);
	});

	document.addEventListener("wabRoundEnded", () => {
		if (gameState === "playing") {
			setGameState("results");
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

	attachKeyboardListeners();
}

init();
