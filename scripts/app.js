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
const resultsScoreValue = document.getElementById("resultsScoreValue");
const resultsTicketsRoundValue = document.getElementById("resultsTicketsRoundValue");
const resultsTicketsTotalValue = document.getElementById("resultsTicketsTotalValue");
const resultsHitsValue = document.getElementById("resultsHitsValue");
const resultsMissesValue = document.getElementById("resultsMissesValue");
const resultsEscapesValue = document.getElementById("resultsEscapesValue");

let gameState = "home";
let totalTickets = 0;

function loadTotalTickets() {
	const raw = localStorage.getItem("wabTotalTickets");
	const n = parseInt(raw, 10);
	totalTickets = Number.isFinite(n) && n > 0 ? n : 0;
}

function saveTotalTickets() {
	localStorage.setItem("wabTotalTickets", String(totalTickets));
}

function resetTotalTickets() {
	totalTickets = 0;
	localStorage.removeItem("wabTotalTickets");
}

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
			resetTotalTickets();
			setGameState("home");
		});
	}

	document.querySelectorAll("input[name='brailleMode']").forEach(radio => {
		radio.addEventListener("change", syncInputModeUI);
	});

document.addEventListener("wabRoundEnded", (e) => {
	if (gameState !== "playing") return;

	const detail = e.detail || {};

	const score = Number.isFinite(detail.score) ? detail.score : 0;
	const hits = Number.isFinite(detail.hits) ? detail.hits : 0;
	const misses = Number.isFinite(detail.misses) ? detail.misses : 0;
	const escapes = Number.isFinite(detail.escapes) ? detail.escapes : 0;

	const ticketsThisRound = scoreToTickets(score);

	totalTickets += ticketsThisRound;
	saveTotalTickets();

	if (resultsScoreValue) resultsScoreValue.textContent = String(score);
	if (resultsTicketsRoundValue) resultsTicketsRoundValue.textContent = String(ticketsThisRound);
	if (resultsTicketsTotalValue) resultsTicketsTotalValue.textContent = String(totalTickets);

	if (resultsHitsValue) resultsHitsValue.textContent = String(hits);
	if (resultsMissesValue) resultsMissesValue.textContent = String(misses);
	if (resultsEscapesValue) resultsEscapesValue.textContent = String(escapes);

	setGameState("results");
});
}

function setupScoreListener() {
	const scoreText = document.getElementById("scoreText");
	if (!scoreText) return;

	document.addEventListener("wabScoreUpdated", e => {
		const newScore = e.detail?.score;
		if (typeof newScore !== "number") return;
		scoreText.textContent = "Score: " + newScore;
	});
}

function scoreToTickets(score) {
	if (score >= 200) return 20;
	if (score >= 150) return 15;
	if (score >= 100) return 10;
	if (score >= 50) return 5;
	return 0;
}

function init() {
	loadTotalTickets();
	setGameState("home");
	setupEventListeners();
	setupScoreListener();
	syncInputModeUI();

	initGameLoop({
		moleElements: Array.from(document.querySelectorAll("#gameBoard .mole"))
	});

	attachKeyboardListeners();
}

init();
