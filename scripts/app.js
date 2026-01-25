"use strict";

import { initGameLoop, getCurrentSpeechPayload, startRound } from "./gameLoop.js";
import { unlockAudio, setGameAudioMode, playEndBuzzer, playStartFlourish, playEverythingStinger } from "./audioEngine.js";
import {
	unlockSpeech,
	getAvailableVoicesForLanguage,
	speak,
	setPreferredVoiceName,
	setSpeechRate
} from "./speechEngine.js";
import { attachKeyboardListeners, setInputMode, setCurrentMoleId } from "./inputEngine.js";
import { prizeCatalog } from "./prizeCatalog.js";

const body = document.body;

const homeContent = document.getElementById("homeContent");
const gameArea = document.getElementById("gameArea");
const resultsArea = document.getElementById("resultsArea");
const footer = document.querySelector("footer");
const cashOutArea = document.getElementById("cashOutArea");
const cashOutHeading = document.getElementById("cashOutHeading");
const cashOutPrizeOptions = document.getElementById("cashOutPrizeOptions");
const cashOutTicketCount = document.getElementById("cashOutTicketCount");
const PRIZE_SHELF_KEY = "whackABraillePrizeShelf";
const roundLengthFieldset = document.getElementById("roundLengthFieldset");
const trainingOptionsFieldset = document.getElementById("trainingOptionsFieldset");
const speakBrailleDots = document.getElementById("speakBrailleDots");
const scoreText = document.getElementById("scoreText");

const speechRatePercentInput = document.getElementById("speechRatePercent");
const voiceSelect = document.getElementById("voiceSelect");
const playVoiceSampleButton = document.getElementById("playVoiceSample");

const SETTINGS_STORAGE_KEY = "wabGameSettings";


const confirmPrizeButton = document.getElementById("confirmPrizeButton");
const cancelCashOutButton = document.getElementById("cancelCashOutButton");
const trainingHomeButton = document.getElementById("trainingHomeButton");

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
const resultsStreakBonusValue = document.getElementById('resultsStreakBonusValue');
const resultsSpeedBonusValue = document.getElementById('resultsSpeedBonusValue');

let gameState = "home";
let totalTickets = 0;
function populateVoiceSelect() {
	if (!voiceSelect) return;

	const lang = navigator.language || "en";
	const voices = getAvailableVoicesForLanguage(lang);

	voiceSelect.innerHTML = "";

	if (!voices.length) {
		const opt = document.createElement("option");
		opt.value = "";
		opt.textContent = "No voices available";
		voiceSelect.appendChild(opt);
		voiceSelect.disabled = true;
		return;
	}

	voiceSelect.disabled = false;

	for (const voice of voices) {
		const option = document.createElement("option");
		option.value = voice.name;
		option.textContent = `${voice.name} (${voice.lang})`;
		voiceSelect.appendChild(option);
	}

	const saved = loadGameSettings()?.voiceName;
	if (saved) {
		voiceSelect.value = saved;
		setPreferredVoiceName(saved);
	}
}

function loadTotalTickets() {
	const raw = localStorage.getItem("wabTotalTickets");
	const n = parseInt(raw, 10);
	totalTickets = Number.isFinite(n) && n > 0 ? n : 0;
}

function saveTotalTickets() {
	localStorage.setItem("wabTotalTickets", String(totalTickets));
}

	function syncTrainingUI() {
	const difficulty = getSelectedDifficulty();
	const isTraining = difficulty === "training";

	if (roundLengthFieldset) {
		roundLengthFieldset.disabled = isTraining;
	}

	if (trainingOptionsFieldset) {
		trainingOptionsFieldset.disabled = !isTraining;
	}

	if (!isTraining && speakBrailleDots) {
		speakBrailleDots.checked = false;
	}
}
function percentToSpeechRate(percent) {
	const p = Number(percent);
	if (!Number.isFinite(p)) return 1.0;

	const clamped = Math.min(Math.max(p, 1), 100);
	return 0.6 + ((clamped - 1) / 99) * 1.4;
}

function resetTotalTickets() {
	totalTickets = 0;
	localStorage.removeItem("wabTotalTickets");
}

function loadPrizeShelf() {
	const data = JSON.parse(localStorage.getItem(PRIZE_SHELF_KEY)) || {};
	renderPrizeShelf(data);
}

function savePrizeShelf(data) {
	localStorage.setItem(PRIZE_SHELF_KEY, JSON.stringify(data));
}

function addPrizeToShelf(prizeLabel) {
	const data = JSON.parse(localStorage.getItem(PRIZE_SHELF_KEY)) || {};

	data[prizeLabel] = (data[prizeLabel] || 0) + 1;

	savePrizeShelf(data);
	renderPrizeShelf(data);
}

function renderPrizeShelf(data) {
	const list = document.getElementById("prizeList");
	const emptyMessage = document.getElementById("noPrizesMessage");

	list.innerHTML = "";

	const entries = Object.entries(data);

	if (entries.length === 0) {
		emptyMessage.hidden = false;
		return;
	}

	emptyMessage.hidden = true;

	entries.forEach(([label, count]) => {
		const li = document.createElement("li");

		li.textContent =
			count > 1
				? `${label} x ${count}`
				: label;

		list.appendChild(li);
	});
}


function isGrade2Mode(modeId) {
	return modeId === "grade2Symbols" || modeId === "grade2Words";
}

function setHiddenInert(el, hide) {
	if (!el) return;
	el.hidden = hide;
	el.inert = hide;
}
function getSelectedAudioMode() {
	return document.querySelector("input[name='gameAudio']:checked")?.value || "original";
}

function getSelectedDifficulty() {
	return document.querySelector("input[name='difficulty']:checked")?.value || "normal";
}

function setGameState(state) {
	gameState = state;

	body.setAttribute("data-game-state", state);

	setHiddenInert(homeContent, true);
	setHiddenInert(gameArea, true);
	setHiddenInert(resultsArea, true);
	setHiddenInert(footer, true);
	setHiddenInert(cashOutArea, true);

	switch (state) {
		case "playing":
			document.title = "Currently Whacking Some Braille";
			break;

		case "results":
			document.title = "Results - Whack a Braille";
			break;

		case "cashout":
			document.title = "Prize Counter - Whack a Braille";
			break;

		default:
			document.title = "Whack a Braille!";
			break;
	}

	if (state === "home") {
		setHiddenInert(homeContent, false);
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
		setHiddenInert(gameArea, false);

		setCurrentMoleId(0);
		return;
	}

	if (state === "results") {
		setHiddenInert(resultsArea, false);

		setCurrentMoleId(0);

		const difficulty = getSelectedDifficulty();
		if (difficulty !== "training") {
			playEndBuzzer();
		}

		if (resultsHeading) {
			requestAnimationFrame(() => {
				resultsHeading.setAttribute("tabindex", "-1");
				resultsHeading.focus({ preventScroll: true });
			});
		}
		return;
	}

	if (state === "cashout") {
		setHiddenInert(cashOutArea, false);

		if (cashOutHeading) {
			requestAnimationFrame(() => {
				cashOutHeading.setAttribute("tabindex", "-1");
				cashOutHeading.focus({ preventScroll: true });
			});
		}
		return;
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
function applySettingsToUI(settings) {
	if (!settings) return;

	if (settings.difficulty) {
		const el = document.querySelector(
			`input[name='difficulty'][value='${settings.difficulty}']`
		);
		if (el) el.checked = true;
	}
	if (
		typeof settings.speechRatePercent === "number" &&
		speechRatePercentInput
	) {
		speechRatePercentInput.value = settings.speechRatePercent;
		const rate = percentToSpeechRate(settings.speechRatePercent);
		setSpeechRate(rate);
	}

	if (settings.voiceName && voiceSelect) {
		voiceSelect.value = settings.voiceName;
		setPreferredVoiceName(settings.voiceName);
	}

	if (settings.roundTime) {
		const el = document.querySelector(
			`input[name='roundTime'][value='${settings.roundTime}']`
		);
		if (el) el.checked = true;
	}

	if (settings.inputMode) {
		const el = document.querySelector(
			`input[name='inputMode'][value='${settings.inputMode}']`
		);
		if (el) el.checked = true;
	}

	if (settings.brailleMode) {
		const el = document.querySelector(
			`input[name='brailleMode'][value='${settings.brailleMode}']`
		);
		if (el) el.checked = true;
	}

	if (typeof settings.speakBrailleDots === "boolean" && speakBrailleDots) {
		speakBrailleDots.checked = settings.speakBrailleDots;
	}
}

function saveGameSettings(settings) {
	try {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
	} catch {}
}

function loadGameSettings() {
	try {
		const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function getSelectedSettings() {
	const brailleMode = document.querySelector("input[name='brailleMode']:checked")?.value || "grade1Letters";
	const roundTimeValue = document.querySelector("input[name='roundTime']:checked")?.value || "30";
	const roundTime = parseInt(roundTimeValue, 10);

	let inputMode = document.querySelector("input[name='inputMode']:checked")?.value || "qwerty";
	if (isGrade2Mode(brailleMode)) inputMode = "perkins";
	if (brailleMode === "everything") {
	inputMode = "perkins";
}

	return {
		brailleMode,
		roundTime: Number.isFinite(roundTime) ? roundTime : 30,
		inputMode,
	voiceName: voiceSelect?.value || null,
	speechRatePercent: Number(speechRatePercentInput?.value) || 35,
		difficulty: getSelectedDifficulty(),
		speakBrailleDots: !!speakBrailleDots?.checked
	};
}

function startGameFromSettings() {
	unlockAudio();
	unlockSpeech();

	const settings = getSelectedSettings();

	const isTraining = settings.difficulty === "training";
	if (scoreText) {
		scoreText.hidden = isTraining;
		if (!isTraining) {
			scoreText.textContent = "Score: 0";
		}
	}

	setInputMode(settings.inputMode);
	setCurrentMoleId(0);


	const audioMode = getSelectedAudioMode();
	setGameAudioMode(audioMode);

	setGameState("playing");

	if (settings.brailleMode === "everything") {
		playEverythingStinger();
	} else {
		playStartFlourish();
	}


	const openingAnnouncement =
		settings.brailleMode === "everything"
			? "Incoming Mole Invasion!"
			: "Ready?";

	speak(openingAnnouncement, {
		cancelPrevious: true,
		dedupe: false
	});

	setTimeout(() => {
	startRound(
		settings.brailleMode,
		settings.roundTime,
		settings.inputMode,
		settings.difficulty,
		{
			speakBrailleDots: settings.speakBrailleDots
		}
	);
	}, 650);
}

function setupEventListeners() {
	if (startButton) {
		startButton.addEventListener("click", () => {
			primeSpeech();
			startGameFromSettings();
		});
	}

	if (voiceSelect) {
		voiceSelect.addEventListener("change", () => {
			const name = voiceSelect.value;
			if (name) {
				setPreferredVoiceName(name);
				saveGameSettings(getSelectedSettings());
			}
		});
	}

	if (speechRatePercentInput) {
		speechRatePercentInput.addEventListener("change", () => {
			const rate = percentToSpeechRate(speechRatePercentInput.value);
			setSpeechRate(rate);
			saveGameSettings(getSelectedSettings());
		});
	}

	if (playVoiceSampleButton) {
		playVoiceSampleButton.addEventListener("click", () => {
			unlockSpeech();
			speak("Welcome to Whack a Braille!", {
				cancelPrevious: true,
				dedupe: false
			});
		});
	}

document.addEventListener("keydown", e => {
	const key = e.key;

	const target = e.target;
	if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
		return;
	}

	// Backtick: repeat current target
	if (key === "`") {
		const payload = getCurrentSpeechPayload();
		if (!payload) return;

		speak(payload.text, {
			cancelPrevious: true,
			dedupe: false
		});
		return;
	}

	// Backslash: exit Training mode early
	if (key === "\\") {
		if (getSelectedDifficulty() === "training") {
			endRoundNow(false);
		}
		return;
	}
});

	document.querySelectorAll(
		"input[name='difficulty'], input[name='roundTime'], input[name='inputMode'], input[name='brailleMode'], input[name='gameAudio'], #speakBrailleDots"
).forEach(el => {
		el.addEventListener("change", () => {
			saveGameSettings(getSelectedSettings());
		});
	});

const clearPrizeShelfButton = document.getElementById("clearPrizeShelf");
if (clearPrizeShelfButton) {
	clearPrizeShelfButton.addEventListener("click", () => {
		localStorage.removeItem(PRIZE_SHELF_KEY);
		renderPrizeShelf({});
	});
}

	if (playAgainButton) {
		playAgainButton.addEventListener("click", () => {
			startGameFromSettings();
		});
	}

	if (cashOutButton) {
		cashOutButton.addEventListener("click", () => {
			renderCashOut();
			setGameState("cashout");
		});
	}

	if (trainingHomeButton) {
		trainingHomeButton.addEventListener("click", () => {
			setGameState("home");
		});
	}

if (confirmPrizeButton) {
	confirmPrizeButton.addEventListener("click", () => {
		if (!selectedPrizeId) return;

		const prize = prizeCatalog.find(p => p.id === selectedPrizeId);
		if (!prize) return;

		addPrizeToShelf(prize.label);
		resetTotalTickets();
		setGameState("home");
	});
}

if (cancelCashOutButton) {
	cancelCashOutButton.addEventListener("click", () => {
		setGameState("playing");
	});
}

	document.querySelectorAll("input[name='difficulty']").forEach(radio => {
		radio.addEventListener("change", syncTrainingUI);
	});


	document.querySelectorAll("input[name='brailleMode']").forEach(radio => {
		radio.addEventListener("change", syncInputModeUI);
	});

document.addEventListener("wabRoundEnded", (e) => {
	if (gameState !== "playing") return;

	const detail = e.detail || {};
	const isTraining = !!detail.isTraining;

	const score = Number.isFinite(detail.score) ? detail.score : 0;
	const hits = Number.isFinite(detail.hits) ? detail.hits : 0;
	const misses = Number.isFinite(detail.misses) ? detail.misses : 0;
	const escapes = Number.isFinite(detail.escapes) ? detail.escapes : 0;

	const ticketBreakdown = detail.tickets || null;

	const ticketsThisRound = ticketBreakdown
		? (Number(ticketBreakdown.total) || 0)
		: scoreToTickets(score);

	if (!isTraining) {
		totalTickets += ticketsThisRound;
		saveTotalTickets();
	}

	const streakBonusValue = ticketBreakdown ? (Number(ticketBreakdown.streakBonus) || 0) : 0;
	const speedBonusValue = ticketBreakdown ? (Number(ticketBreakdown.speedBonus) || 0) : 0;

	if (resultsStreakBonusValue) resultsStreakBonusValue.textContent = String(streakBonusValue);
	if (resultsSpeedBonusValue) resultsSpeedBonusValue.textContent = String(speedBonusValue);

	if (resultsScoreValue) resultsScoreValue.textContent = String(score);
	if (resultsTicketsRoundValue) resultsTicketsRoundValue.textContent = String(ticketsThisRound);
	if (resultsTicketsTotalValue) resultsTicketsTotalValue.textContent = String(totalTickets);

	if (resultsHitsValue) resultsHitsValue.textContent = String(hits);
	if (resultsMissesValue) resultsMissesValue.textContent = String(misses);
	if (resultsEscapesValue) resultsEscapesValue.textContent = String(escapes);

	if (playAgainButton) {
		playAgainButton.textContent = isTraining ? "Keep Training!" : "Keep Whacking!";
	}

	if (cashOutButton) {
		cashOutButton.hidden = isTraining;
	}

	if (trainingHomeButton) {
		trainingHomeButton.hidden = !isTraining;
	}

	function setLineHidden(valueEl, hidden) {
		if (!valueEl) return;
		const line = valueEl.closest("div");
		if (line) line.hidden = hidden;
	}

	setLineHidden(resultsScoreValue, isTraining);
	setLineHidden(resultsTicketsRoundValue, isTraining);
	setLineHidden(resultsTicketsTotalValue, isTraining);
	setLineHidden(resultsStreakBonusValue, isTraining);
	setLineHidden(resultsSpeedBonusValue, isTraining);
	setLineHidden(resultsHitsValue, isTraining);
	setLineHidden(resultsMissesValue, isTraining);
	setLineHidden(resultsEscapesValue, isTraining);

	if (resultsHeading) {
		resultsHeading.textContent = isTraining ? "Training Complete! Great Work!" : "Results";
	}

	setGameState("results");
	requestAnimationFrame(() => {
		if (resultsHeading) {
			resultsHeading.setAttribute("tabindex", "-1");
			resultsHeading.focus();
		}
	});

});
}

function setupScoreListener() {
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

function getEligiblePrizes(ticketCount) {
	return prizeCatalog.filter(prize => {
		if (ticketCount < prize.minTickets) return false;
		if (prize.maxTickets !== null && ticketCount > prize.maxTickets) return false;
		return true;
	});
}

function pickRandomPrizes(prizes, count = 3) {
	const shuffled = prizes.slice().sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
}

let selectedPrizeId = null;

function renderCashOut() {
	selectedPrizeId = null;

	if (confirmPrizeButton) {
		confirmPrizeButton.disabled = true;
	}

	if (cashOutTicketCount) {
		cashOutTicketCount.textContent = String(totalTickets);
	}

	const eligible = getEligiblePrizes(totalTickets);
	const picks = pickRandomPrizes(eligible, 3);

	const existingRadios = document.querySelectorAll("input[name='cashOutPrize']");
existingRadios.forEach(radio => {
	radio.checked = false;
});

	cashOutPrizeOptions.innerHTML = "";

	picks.forEach((prize, index) => {
		const wrapper = document.createElement("div");

		const input = document.createElement("input");
		input.type = "radio";
		input.name = "cashOutPrize";
		input.id = "cashOutPrize_" + prize.id;
		input.value = prize.id;

		const label = document.createElement("label");
		label.setAttribute("for", input.id);
		label.textContent = prize.label;

		input.addEventListener("change", () => {
			selectedPrizeId = prize.id;
			if (confirmPrizeButton) {
				confirmPrizeButton.disabled = false;
			}
		});

		wrapper.appendChild(input);
		wrapper.appendChild(label);

		cashOutPrizeOptions.appendChild(wrapper);

	});
}

function init() {
	loadTotalTickets();
	loadPrizeShelf();
	const savedSettings = loadGameSettings();
	if (savedSettings) {
		applySettingsToUI(savedSettings);
	}
	syncTrainingUI();
	setGameState("home");
	setupEventListeners();
	setupScoreListener();
	syncInputModeUI();
	syncTrainingUI();

	initGameLoop({
		moleElements: Array.from(document.querySelectorAll("#gameBoard .mole"))
	});
	populateVoiceSelect();

	if (speechSynthesis.onvoiceschanged !== undefined) {
		speechSynthesis.onvoiceschanged = populateVoiceSelect;
	}

	attachKeyboardListeners();
}

init();
