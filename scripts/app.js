"use strict";

import { initGameLoop, getCurrentSpeechPayload, startRound, stopRound, finishRoundEarly } from "./gameLoop.js";
import { unlockAudio, setGameAudioMode, playEndBuzzer, playStartFlourish, playEverythingStinger, playPrizeFanfare } from "./audioEngine.js";
import {
	unlockSpeech,
	getAvailableVoicesForLanguage,
	ensureVoicesReady,
	speak,
	setPreferredVoiceName,
	setSpeechRate,
	setSpeechVolume
} from "./speechEngine.js";
import { attachKeyboardListeners, setInputMode, setCurrentMoleId, emitTextAttempt } from "./inputEngine.js";
import {
	grade1Letters,
	grade1Numbers,
	grade2Symbols,
	grade2Words,
	grade2Dot5Initials,
	grade2Dot45Initials,
	grade2Suffixes,
	grade2Dot456Initials
} from "./brailleRegistry.js";
import { prizeCatalog } from "./prizeCatalog.js";
import { scoreToTickets } from "./ticketRules.js";

const body = document.body;

const homeContent = document.getElementById("homeContent");
const gameArea = document.getElementById("gameArea");
const resultsArea = document.getElementById("resultsArea");
const footer = document.querySelector("footer");
const cashOutArea = document.getElementById("cashOutArea");
const cashOutHeading = document.getElementById("cashOutHeading");
const cashOutPrizeOptions = document.getElementById("cashOutPrizeOptions");
const cashOutTicketCount = document.getElementById("cashOutTicketCount");
const cashOutPrizeFieldset = document.getElementById("cashOutPrizeFieldset");
const PRIZE_SHELF_KEY = "whackABraillePrizeShelf";
const roundLengthFieldset = document.getElementById("roundLengthFieldset");
const trainingOptionsFieldset = document.getElementById("trainingOptionsFieldset");
const speakBrailleDots = document.getElementById("speakBrailleDots");
const scoreText = document.getElementById("scoreText");
const characterEchoCheckbox = document.getElementById("characterEcho");
const timerMusicCheckbox = document.getElementById("timerMusicEnabled");
const spatialMoleMappingCheckbox = document.getElementById("spatialMoleMappingEnabled");
const mobileBsiEntry = document.getElementById("mobileBsiEntry");
const mobileBsiInput = document.getElementById("mobileBsiInput");
const moleChooserSelect = document.getElementById("moleChooserSelect");
const desktopBrailleDisplayEntry = document.getElementById("desktopBrailleDisplayEntry");
const desktopBrailleDisplayInput = document.getElementById("desktopBrailleDisplayInput");
const grade1ReferenceBody = document.getElementById("grade1ReferenceBody");
const grade2ReferenceBody = document.getElementById("grade2ReferenceBody");

const speechRatePercentInput = document.getElementById("speechRatePercent");
const speechVolumePercentInput = document.getElementById("speechVolumePercent");
const voiceSelect = document.getElementById("voiceSelect");
const playVoiceSampleButton = document.getElementById("playVoiceSample");

const SETTINGS_STORAGE_KEY = "wabGameSettings";


const confirmPrizeButton = document.getElementById("confirmPrizeButton");
const cancelCashOutButton = document.getElementById("cancelCashOutButton");
const cashOutHomeButton = document.getElementById("cashOutHomeButton");
const trainingHomeButton = document.getElementById("trainingHomeButton");

const startButton = document.getElementById("startGameButton");
const homeCashInButton = document.getElementById("homeCashInButton");
const playAgainButton = document.getElementById("playAgainButton");
const cashOutButton = document.getElementById("cashOutButton");
const saveTicketsHomeButton = document.getElementById("saveTicketsHomeButton");
const exitRoundButton = document.getElementById("exitRoundButton");
const prizeShelfHelp = document.getElementById("prizeShelfHelp");
const prizeShelfCountBadge = document.getElementById("prizeShelfCountBadge");
const prizeDetailDialog = document.getElementById("prizeDetailDialog");
const prizeDetailTitle = document.getElementById("prizeDetailTitle");
const prizeDetailClaimed = document.getElementById("prizeDetailClaimed");
const prizeDetailTierCost = document.getElementById("prizeDetailTierCost");
const prizeDetailOwned = document.getElementById("prizeDetailOwned");
const prizeDetailFlavor = document.getElementById("prizeDetailFlavor");
const deletePrizeButton = document.getElementById("deletePrizeButton");
const closePrizeDetailButton = document.getElementById("closePrizeDetailButton");

const grade1InputModeFieldset = document.getElementById("grade1InputModeFieldset");
const cashOutSummaryText = document.getElementById("cashOutSummaryText");

const resultsHeading = document.getElementById("resultsHeading");
const resultsScoreValue = document.getElementById("resultsScoreValue");
const resultsTicketsRoundValue = document.getElementById("resultsTicketsRoundValue");
const resultsTicketsTotalValue = document.getElementById("resultsTicketsTotalValue");
const resultsHitsValue = document.getElementById("resultsHitsValue");
const resultsMissesValue = document.getElementById("resultsMissesValue");
const resultsEscapesValue = document.getElementById("resultsEscapesValue");
const resultsStreakBonusValue = document.getElementById('resultsStreakBonusValue');
const resultsSpeedBonusValue = document.getElementById('resultsSpeedBonusValue');
const srLiveRegion = document.getElementById("srLiveRegion");

let gameState = "home";
let totalTickets = 0;
let srAnnounceTimer = null;
let mobileBsiEnabled = false;
let cashOutSource = "results";
let activePrizeDetailId = null;
let lastPrizeShelfTriggerId = null;

const TICKET_STORAGE_KEY = "wabTotalTickets";
const prizeCatalogById = new Map(prizeCatalog.map(prize => [prize.id, prize]));
const prizeCatalogByLabel = new Map(prizeCatalog.map(prize => [prize.label, prize]));
const invasionIntroPhrases = [
	"Incoming moles!",
	"Invasion Incoming!",
	"Mole Invasion, Oh no!",
	"Prepare for Moles!",
	"So many moles!",
	"Here comes the mole stampede!",
	"The moles are on the move!",
	"Brace yourself for moles!",
	"Grade 2 moles, everywhere!",
	"Moles incoming from all sides!"
];

function dotSetsToUnicode(dotSets) {
	return (Array.isArray(dotSets) ? dotSets : []).map(dots => {
		const list = Array.isArray(dots) ? dots : [];
		let mask = 0;
		for (const dot of list) {
			mask |= 1 << (dot - 1);
		}
		return String.fromCodePoint(0x2800 + mask);
	});
}

function formatDotSets(dotSets) {
	return (Array.isArray(dotSets) ? dotSets : [])
		.map(dots => {
			const list = Array.isArray(dots) ? dots : [];
			if (list.length === 1) return `Dot ${list[0]}`;
			if (list.length > 1) return `Dots ${list.join(" ")}`;
			return "";
		})
		.filter(Boolean)
		.join(", ");
}

function getReferenceLabel(item) {
	if (item?.modeTags?.includes("grade2Suffixes")) {
		return `-${item.id}`;
	}
	return String(item?.id || "");
}

function createUnicodeCell(dotSets) {
	const wrapper = document.createElement("span");
	wrapper.className = "brailleReferenceUnicode";
	dotSetsToUnicode(dotSets).forEach(cell => {
		const span = document.createElement("span");
		span.className = "brailleReferenceUnicodeCell";
		span.textContent = cell;
		wrapper.appendChild(span);
	});
	return wrapper;
}

function appendReferenceRow(tbody, item) {
	if (!tbody || !item) return;
	const row = document.createElement("tr");

	const labelCell = document.createElement("td");
	labelCell.textContent = getReferenceLabel(item);

	const dotsCell = document.createElement("td");
	const dotSets = Array.isArray(item.perkinsSequenceDots) && item.perkinsSequenceDots.length
		? item.perkinsSequenceDots
		: [Array.isArray(item.dots) ? item.dots : []];
	dotsCell.textContent = formatDotSets(dotSets);

	const unicodeCell = document.createElement("td");
	unicodeCell.appendChild(createUnicodeCell(dotSets));

	row.appendChild(labelCell);
	row.appendChild(dotsCell);
	row.appendChild(unicodeCell);
	tbody.appendChild(row);
}

function renderBrailleReferenceTables() {
	if (grade1ReferenceBody) {
		grade1ReferenceBody.innerHTML = "";
		[...grade1Letters, ...grade1Numbers].forEach(item => {
			appendReferenceRow(grade1ReferenceBody, item);
		});
	}

	if (grade2ReferenceBody) {
		grade2ReferenceBody.innerHTML = "";
		[
			...grade2Symbols,
			...grade2Words,
			...grade2Dot5Initials,
			...grade2Dot45Initials,
			...grade2Suffixes,
			...grade2Dot456Initials
		].forEach(item => {
			appendReferenceRow(grade2ReferenceBody, item);
		});
	}
}

const moleChooserOptions = [
	{ value: "typingSimpleHomeRow", label: "Simple Home Row", group: "typing" },
	{ value: "typingHomeRow", label: "QWERTY Home Row", group: "typing" },
	{ value: "typingHomeTopRow", label: "QWERTY Home Row + Top Row", group: "typing" },
	{ value: "typingHomeBottomRow", label: "QWERTY Home Row + Bottom Row", group: "typing" },
	{ value: "letters-aj", label: "Grade 1 Letters A-J", group: "grade1" },
	{ value: "letters-at", label: "Grade 1 Letters A-T", group: "grade1" },
	{ value: "grade1Letters", label: "Letters only (Grade 1)", group: "grade1" },
	{ value: "grade1Numbers", label: "Numbers only (Grade 1)", group: "grade1" },
	{ value: "grade1LettersNumbers", label: "Letters and numbers (Grade 1)", group: "grade1" },
	{ value: "grade1Invasion", label: "Grade 1 Invasion", group: "grade1" },
	{ value: "grade2Symbols", label: "Grade 2 contractions (symbols)", group: "grade2" },
	{ value: "grade2Words", label: "Grade 2 whole-word contractions", group: "grade2" },
	{ value: "grade2Dot5Initials", label: "Grade 2 Dot 5 initial-letter contractions", group: "grade2" },
	{ value: "grade2Dot45Initials", label: "Grade 2 Dots 4 5 initial-letter contractions", group: "grade2" },
	{ value: "grade2Suffixes", label: "Grade 2 suffix contractions", group: "grade2" },
	{ value: "grade2Dot456Initials", label: "Grade 2 Dots 4 5 6 initial-letter contractions", group: "grade2" },
	{ value: "grade2Invasion", label: "Grade 2 Invasion", group: "grade2" }
];

function announceToSr(message) {
	if (!srLiveRegion) return;
	if (srAnnounceTimer) {
		clearTimeout(srAnnounceTimer);
		srAnnounceTimer = null;
	}
	srLiveRegion.textContent = "";
	srAnnounceTimer = setTimeout(() => {
		srLiveRegion.textContent = String(message || "");
		srAnnounceTimer = null;
	}, 10);
}

function pickInvasionIntroPhrase() {
	return invasionIntroPhrases[Math.floor(Math.random() * invasionIntroPhrases.length)] || "Incoming moles!";
}

function computeOpeningStartDelayMs(speechResult, isInvasionModeActive) {
	if (!isInvasionModeActive) return 650;
	const startedAt = Number(
		speechResult?.onstartAtMs ?? speechResult?.startedAtMs ?? speechResult?.startedAt
	);
	const endedAt = Number(
		speechResult?.endedAtMs ?? speechResult?.endedAt
	);
	let speechDurationMs = 0;
	if (Number.isFinite(startedAt) && Number.isFinite(endedAt) && endedAt > startedAt) {
		speechDurationMs = endedAt - startedAt;
	}
	if (!speechDurationMs) {
		speechDurationMs = 300;
	}
	return Math.max(900, Math.min(3000, speechDurationMs + 240));
}

function loadStorageObject(key, fallback = {}) {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return fallback;
		}
		return parsed;
	} catch {
		return fallback;
	}
}

async function populateVoiceSelect() {
	if (!voiceSelect) return;
	const wasFocused = document.activeElement === voiceSelect;
	const focusedValue = wasFocused ? voiceSelect.value : "";

	await ensureVoicesReady();

	const lang = navigator.language || "en";
	const filteredVoices = getAvailableVoicesForLanguage(lang);
	const allVoices = (window.speechSynthesis && typeof window.speechSynthesis.getVoices === "function")
		? (window.speechSynthesis.getVoices() || [])
		: [];
	const voices = filteredVoices.length ? filteredVoices : allVoices;

	voiceSelect.innerHTML = "";

	const defaultOption = document.createElement("option");
	defaultOption.value = "";
	defaultOption.textContent = "System default";
	voiceSelect.appendChild(defaultOption);

	if (!voices.length) {
		const opt = document.createElement("option");
		opt.value = "";
		opt.textContent = "No voices available";
		voiceSelect.appendChild(opt);
		voiceSelect.value = "";
		voiceSelect.disabled = false;
		setPreferredVoiceName("");
		return;
	}

	voiceSelect.disabled = false;

	for (const voice of voices) {
		const option = document.createElement("option");
		option.value = voice.name;
		option.textContent = `${voice.name} (${voice.lang})`;
		voiceSelect.appendChild(option);
	}

	if (wasFocused) {
		const hasFocusedValue = focusedValue === "" || voices.some(v => v.name === focusedValue);
		if (hasFocusedValue) {
			voiceSelect.value = focusedValue;
			setPreferredVoiceName(focusedValue);
			return;
		}
	}

	const saved = loadGameSettings()?.voiceName;
	if (saved) {
		const hasSaved = voices.some(v => v.name === saved);
		if (hasSaved) {
			voiceSelect.value = saved;
			setPreferredVoiceName(saved);
			return;
		}
	}

	voiceSelect.value = "";
	setPreferredVoiceName("");
}

function loadTotalTickets() {
	const raw = localStorage.getItem(TICKET_STORAGE_KEY);
	const n = parseInt(raw, 10);
	totalTickets = Number.isFinite(n) && n > 0 ? n : 0;
}

function saveTotalTickets() {
	localStorage.setItem(TICKET_STORAGE_KEY, String(totalTickets));
}

function updateHomeCashInButton() {
	if (!homeCashInButton) return;
	homeCashInButton.textContent = `Cash In Tickets: ${totalTickets} Available`;
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

function percentToSpeechVolume(percent) {
	const p = Number(percent);
	if (!Number.isFinite(p)) return 0.85;
	const clamped = Math.min(Math.max(p, 5), 100);
	return clamped / 100;
}

function loadPrizeShelf() {
	const data = normalizePrizeShelfData(loadStorageObject(PRIZE_SHELF_KEY, {}));
	renderPrizeShelf(data);
}

function savePrizeShelf(data) {
	localStorage.setItem(PRIZE_SHELF_KEY, JSON.stringify(data));
}

function normalizePrizeShelfData(data) {
	const shelf = {};
	if (!data || typeof data !== "object" || Array.isArray(data)) return shelf;

	for (const [key, value] of Object.entries(data)) {
		if (typeof value === "number") {
			const prize = prizeCatalogByLabel.get(key);
			if (!prize || value < 1) continue;
			shelf[prize.id] = {
				id: prize.id,
				label: prize.label,
				count: value,
				claimedAt: null,
				ticketCost: getPrizeTicketCost(prize)
			};
			continue;
		}

		if (!value || typeof value !== "object" || Array.isArray(value)) continue;
		const prizeId = typeof value.id === "string" ? value.id : key;
		const prize = prizeCatalogById.get(prizeId) || prizeCatalogByLabel.get(value.label);
		if (!prize) continue;
		const count = Math.max(1, Number(value.count) || 1);
		shelf[prize.id] = {
			id: prize.id,
			label: prize.label,
			count,
			claimedAt: typeof value.claimedAt === "string" ? value.claimedAt : null,
			ticketCost: Number.isFinite(Number(value.ticketCost))
				? Number(value.ticketCost)
				: getPrizeTicketCost(prize)
		};
	}

	return shelf;
}

function getPrizeShelfData() {
	return normalizePrizeShelfData(loadStorageObject(PRIZE_SHELF_KEY, {}));
}

function addPrizeToShelf(prize) {
	const data = getPrizeShelfData();
	const existing = data[prize.id];

	data[prize.id] = {
		id: prize.id,
		label: prize.label,
		count: (existing?.count || 0) + 1,
		claimedAt: existing?.claimedAt || new Date().toISOString(),
		ticketCost: getPrizeTicketCost(prize)
	};

	savePrizeShelf(data);
	renderPrizeShelf(data);
}

function renderPrizeShelf(data) {
	const list = document.getElementById("prizeList");
	const emptyMessage = document.getElementById("noPrizesMessage");
	if (prizeShelfHelp) {
		prizeShelfHelp.hidden = isMobileBsiRuntime();
	}

	list.innerHTML = "";

	const entries = Object.values(normalizePrizeShelfData(data));
	const totalPrizeCount = entries.reduce((sum, entry) => sum + (Number(entry.count) || 0), 0);
	if (prizeShelfCountBadge) {
		prizeShelfCountBadge.textContent = `${totalPrizeCount} ${totalPrizeCount === 1 ? "prize" : "prizes"}`;
	}

	if (entries.length === 0) {
		emptyMessage.hidden = false;
		list.hidden = true;
		return;
	}

	emptyMessage.hidden = true;
	list.hidden = false;

	entries.forEach(entry => {
		const li = document.createElement("li");
		const button = document.createElement("button");
		button.type = "button";
		button.dataset.prizeId = entry.id;
		button.id = `prizeShelfButton-${entry.id}`;
		button.textContent =
			entry.count > 1
				? `${entry.label} x ${entry.count}`
				: entry.label;
		button.addEventListener("click", () => {
			openPrizeDetail(entry.id, button.id);
		});
		button.addEventListener("keydown", event => {
			if (event.key !== "Delete" && event.key !== "Backspace") return;
			event.preventDefault();
			deletePrizeFromShelf(entry.id, button.id);
		});

		li.appendChild(button);
		list.appendChild(li);
	});
}

function formatClaimedDate(claimedAt) {
	if (!claimedAt) return "Unknown";
	const date = new Date(claimedAt);
	if (Number.isNaN(date.getTime())) return "Unknown";
	return date.toLocaleDateString(undefined, {
		year: "numeric",
		month: "long",
		day: "numeric"
	});
}

function getPrizeTierLabel(prize) {
	const match = /^tier(\d+)_/i.exec(prize.id || "");
	if (match) {
		return `Tier ${match[1]}`;
	}
	return "Prize Tier";
}

function closePrizeDetail() {
	if (!prizeDetailDialog?.open) return;
	prizeDetailDialog.close();
	const trigger = lastPrizeShelfTriggerId ? document.getElementById(lastPrizeShelfTriggerId) : null;
	if (trigger) {
		requestAnimationFrame(() => {
			safeFocus(trigger);
		});
	}
}

function openPrizeDetail(prizeId, triggerId) {
	const shelf = getPrizeShelfData();
	const entry = shelf[prizeId];
	const prize = prizeCatalogById.get(prizeId);
	if (!entry || !prize || !prizeDetailDialog) return;
	lastPrizeShelfTriggerId = triggerId || null;
	activePrizeDetailId = prizeId;
	prizeDetailTitle.textContent = prize.label;
	prizeDetailClaimed.textContent = `Date Claimed: ${formatClaimedDate(entry.claimedAt)}`;
	const ticketCost = entry.ticketCost || getPrizeTicketCost(prize);
	prizeDetailTierCost.textContent = `${getPrizeTierLabel(prize)}, ${ticketCost} ${ticketCost === 1 ? "ticket" : "tickets"}`;
	prizeDetailFlavor.textContent = prize.flavorText || "";
	if (entry.count > 1) {
		prizeDetailOwned.hidden = false;
		prizeDetailOwned.textContent = `Total Owned: ${entry.count}`;
	} else {
		prizeDetailOwned.hidden = true;
		prizeDetailOwned.textContent = "";
	}
	prizeDetailDialog.showModal();
	requestAnimationFrame(() => {
		safeFocus(prizeDetailTitle);
	});
}

function focusPrizeShelfAfterDelete(deletedButtonId) {
	const deletedButton = deletedButtonId ? document.getElementById(deletedButtonId) : null;
	const shelfButtons = Array.from(document.querySelectorAll("#prizeList button"));
	if (deletedButton && shelfButtons.length) {
		const next = shelfButtons.find(button => button.id !== deletedButtonId) || shelfButtons[shelfButtons.length - 1];
		if (next) {
			requestAnimationFrame(() => {
				safeFocus(next);
			});
			return;
		}
	}
	const target = document.getElementById("prizeShelf")?.querySelector("summary") || document.getElementById("clearPrizeShelf");
	if (target) {
		requestAnimationFrame(() => {
			safeFocus(target);
		});
	}
}

function deletePrizeFromShelf(prizeId, buttonId = null) {
	const shelf = getPrizeShelfData();
	const entry = shelf[prizeId];
	if (!entry) return;
	if (entry.count > 1) {
		entry.count -= 1;
	} else {
		delete shelf[prizeId];
	}
	savePrizeShelf(shelf);
	renderPrizeShelf(shelf);
	if (prizeDetailDialog?.open && activePrizeDetailId === prizeId) {
		activePrizeDetailId = null;
		prizeDetailDialog.close();
	}
	focusPrizeShelfAfterDelete(buttonId || lastPrizeShelfTriggerId);
}


function isGrade2Mode(modeId) {
	return modeId === "grade2Symbols" ||
		modeId === "grade2Words" ||
		modeId === "grade2Dot5Initials" ||
		modeId === "grade2Dot45Initials" ||
		modeId === "grade2Suffixes" ||
		modeId === "grade2Dot456Initials";
}

function isInvasionMode(modeId) {
	return modeId === "grade1Invasion" || modeId === "grade2Invasion";
}

function isTypingOnlyMode(modeId) {
	return modeId === "typingSimpleHomeRow" || modeId === "typingHomeRow" || modeId === "typingHomeTopRow" || modeId === "typingHomeBottomRow";
}

function getSelectedInputMode() {
	return document.querySelector("input[name='inputMode']:checked")?.value || "qwerty";
}

function getMoleChooserOptionsForInputMode(inputMode) {
	if (inputMode === "qwerty") {
		return moleChooserOptions.filter(option => option.group !== "grade2");
	}
	if (inputMode === "perkins" || inputMode === "brailleDisplay") {
		return moleChooserOptions.filter(option => option.group !== "typing");
	}
	return moleChooserOptions.slice();
}

function ensureMoleChooserValue() {
	if (!moleChooserSelect || !moleChooserSelect.options.length) return;
	if (moleChooserSelect.value) return;

	const fallback = Array.from(moleChooserSelect.options).find(option => option.value === "grade1Letters");
	moleChooserSelect.value = fallback ? fallback.value : moleChooserSelect.options[0].value;
}

function setHiddenInert(el, hide) {
	if (!el) return;
	el.hidden = hide;
	if ("inert" in el) {
		el.inert = hide;
	}
}

function isMobileBsiRuntime() {
	if (typeof window === "undefined" || typeof navigator === "undefined") return false;
	const ua = navigator.userAgent || "";
	const hasMobileUa = /Android|iPhone|iPad|iPod/i.test(ua);
	const hasTouch = (navigator.maxTouchPoints || 0) > 0;
	return hasMobileUa && hasTouch;
}

function armMobileBsiInput() {
	if (!mobileBsiEnabled || !mobileBsiInput) return;
	if (gameState !== "playing") return;
	safeFocus(mobileBsiInput);
}

function armDesktopBrailleDisplayInput() {
	if (!desktopBrailleDisplayInput || !desktopBrailleDisplayEntry) return;
	if (gameState !== "playing") return;
	if (getSelectedInputMode() !== "brailleDisplay") return;
	safeFocus(desktopBrailleDisplayInput);
}

function resetDesktopBrailleDisplayInput() {
	if (!desktopBrailleDisplayInput) return;
	desktopBrailleDisplayInput.value = "";
	try {
		desktopBrailleDisplayInput.setSelectionRange(0, 0);
	} catch {
	}
	if (gameState === "playing" && getSelectedInputMode() === "brailleDisplay") {
		requestAnimationFrame(() => {
			armDesktopBrailleDisplayInput();
		});
	}
}

function syncDesktopBrailleDisplayUI() {
	if (!desktopBrailleDisplayEntry || !desktopBrailleDisplayInput) return;
	const enabled = getSelectedInputMode() === "brailleDisplay";
	desktopBrailleDisplayEntry.hidden = !enabled;
	desktopBrailleDisplayInput.hidden = false;
	desktopBrailleDisplayInput.disabled = !enabled;
	if (!enabled) {
		resetDesktopBrailleDisplayInput();
	}
}

function safeFocus(el) {
	if (!el) return;
	try {
		el.focus({ preventScroll: true });
	} catch {
		el.focus();
	}
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
				safeFocus(startButton);
			});
		}
		return;
	}

	if (state === "playing") {
		setHiddenInert(gameArea, false);

		setCurrentMoleId(0);
		armMobileBsiInput();
		armDesktopBrailleDisplayInput();
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
				safeFocus(resultsHeading);
			});
		}
		return;
	}

	if (state === "cashout") {
		setHiddenInert(cashOutArea, false);

		if (cashOutHeading) {
			requestAnimationFrame(() => {
				cashOutHeading.setAttribute("tabindex", "-1");
				safeFocus(cashOutHeading);
				setTimeout(() => {
					if (gameState !== "cashout") return;
					safeFocus(cashOutHeading);
				}, 40);
				setTimeout(() => {
					if (gameState !== "cashout") return;
					safeFocus(cashOutHeading);
				}, 120);
			});
		}
		return;
	}
}

function primeSpeech() {
	if (
		typeof window === "undefined" ||
		!("speechSynthesis" in window) ||
		!("SpeechSynthesisUtterance" in window)
	) {
		return;
	}

	const utterance = new SpeechSynthesisUtterance(" ");
	utterance.volume = 0;
	try {
		window.speechSynthesis.speak(utterance);
	} catch {
	}
}


function syncInputModeUI() {
	if (!grade1InputModeFieldset) return;
	grade1InputModeFieldset.disabled = false;
}

function syncMoleChooserForInputMode() {
	if (!moleChooserSelect) return;

	const selectedInputMode = getSelectedInputMode();
	const previousValue = moleChooserSelect.value;
	const allowedOptions = getMoleChooserOptionsForInputMode(selectedInputMode);

	moleChooserSelect.innerHTML = "";

	allowedOptions.forEach(option => {
		const optionEl = document.createElement("option");
		optionEl.value = option.value;
		optionEl.textContent = option.label;
		moleChooserSelect.appendChild(optionEl);
	});

	if (allowedOptions.some(option => option.value === previousValue)) {
		moleChooserSelect.value = previousValue;
	} else if (allowedOptions.some(option => option.value === "grade1Letters")) {
		moleChooserSelect.value = "grade1Letters";
	} else if (allowedOptions.length) {
		moleChooserSelect.value = allowedOptions[0].value;
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
	if (
		typeof settings.speechVolumePercent === "number" &&
		speechVolumePercentInput
	) {
		speechVolumePercentInput.value = settings.speechVolumePercent;
		setSpeechVolume(percentToSpeechVolume(settings.speechVolumePercent));
	}

	if (typeof settings.characterEcho === "boolean" && characterEchoCheckbox) {
		characterEchoCheckbox.checked = settings.characterEcho;
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
		syncMoleChooserForInputMode();
		if (moleChooserSelect) {
			moleChooserSelect.value = settings.brailleMode;
			ensureMoleChooserValue();
		}
	}

	if (typeof settings.speakBrailleDots === "boolean" && speakBrailleDots) {
		speakBrailleDots.checked = settings.speakBrailleDots;
	}

	if (typeof settings.timerMusicEnabled === "boolean" && timerMusicCheckbox) {
		timerMusicCheckbox.checked = settings.timerMusicEnabled;
	}

	if (typeof settings.spatialMoleMappingEnabled === "boolean" && spatialMoleMappingCheckbox) {
		spatialMoleMappingCheckbox.checked = settings.spatialMoleMappingEnabled;
	}
}

function saveGameSettings(settings) {
	try {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
	} catch {}
}

function loadGameSettings() {
	const settings = loadStorageObject(SETTINGS_STORAGE_KEY, {});
	return Object.keys(settings).length ? settings : null;
}

function getSelectedSettings() {
	const brailleMode = moleChooserSelect?.value || "grade1Letters";
	const roundTimeValue = document.querySelector("input[name='roundTime']:checked")?.value || "30";
	const roundTime = parseInt(roundTimeValue, 10);

	const inputMode = getSelectedInputMode();

	return {
		brailleMode,
		roundTime: Number.isFinite(roundTime) ? roundTime : 30,
		inputMode,
		voiceName: voiceSelect?.value || null,
		speechRatePercent: Number(speechRatePercentInput?.value) || 35,
		speechVolumePercent: Number(speechVolumePercentInput?.value) || 85,
		difficulty: getSelectedDifficulty(),
		speakBrailleDots: !!speakBrailleDots?.checked,
		timerMusicEnabled: !!timerMusicCheckbox?.checked,
		characterEcho: !!characterEchoCheckbox?.checked,
		spatialMoleMappingEnabled: spatialMoleMappingCheckbox ? !!spatialMoleMappingCheckbox.checked : true
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

	if (isInvasionMode(settings.brailleMode)) {
		playEverythingStinger();
	} else {
		playStartFlourish();
	}


	const invasionModeActive = isInvasionMode(settings.brailleMode);
	const openingAnnouncement = invasionModeActive
		? pickInvasionIntroPhrase()
		: "Ready?";

	const speechResult = speak(openingAnnouncement, {
		cancelPrevious: true,
		dedupe: false
	});
	const startDelayMs = computeOpeningStartDelayMs(speechResult, invasionModeActive);

	setTimeout(() => {
	startRound(
		settings.brailleMode,
		settings.roundTime,
		settings.inputMode,
		settings.difficulty,
		{
			speakBrailleDots: settings.speakBrailleDots,
			characterEcho: settings.characterEcho,
			timerMusicEnabled: settings.timerMusicEnabled,
			spatialMoleMappingEnabled: settings.spatialMoleMappingEnabled
		}
	);
	}, startDelayMs);
}

function setupEventListeners() {
	if (startButton) {
		startButton.addEventListener("click", () => {
			primeSpeech();
			startGameFromSettings();
		});
	}

	if (exitRoundButton) {
		exitRoundButton.addEventListener("click", () => {
			finishRoundEarly();
		});
	}

	if (homeCashInButton) {
		homeCashInButton.addEventListener("click", () => {
			renderCashOut("home");
			setGameState("cashout");
		});
	}

	if (voiceSelect) {
		voiceSelect.addEventListener("change", () => {
			const name = voiceSelect.value || "";
			setPreferredVoiceName(name);
			saveGameSettings(getSelectedSettings());
		});
	}

	if (characterEchoCheckbox) {
		characterEchoCheckbox.addEventListener("change", () => {
			saveGameSettings(getSelectedSettings());
		});
	}

	if (speechRatePercentInput) {
		speechRatePercentInput.addEventListener("change", () => {
			const rate = percentToSpeechRate(speechRatePercentInput.value);
			setSpeechRate(rate);
			saveGameSettings(getSelectedSettings());
		});
	}

	if (speechVolumePercentInput) {
		speechVolumePercentInput.addEventListener("change", () => {
			const volume = percentToSpeechVolume(speechVolumePercentInput.value);
			setSpeechVolume(volume);
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
	if (!target || typeof target.tagName !== "string") {
		return;
	}
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

	if (key === "\\") {
		if (getSelectedDifficulty() === "training") {
			stopRound();
		}
		return;
	}
	});

	document.querySelectorAll(
		"input[name='difficulty'], input[name='roundTime'], input[name='inputMode'], input[name='gameAudio'], #speakBrailleDots, #timerMusicEnabled, #spatialMoleMappingEnabled, #moleChooserSelect"
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
		announceToSr("Prize Shelf Cleared");
	});
}

	if (playAgainButton) {
		playAgainButton.addEventListener("click", () => {
			startGameFromSettings();
		});
	}

	if (cashOutButton) {
		cashOutButton.addEventListener("click", () => {
			renderCashOut("results");
			setGameState("cashout");
		});
	}

	if (saveTicketsHomeButton) {
		saveTicketsHomeButton.addEventListener("click", () => {
			setGameState("home");
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

			const ticketCost = getPrizeTicketCost(prize);
			if (totalTickets < ticketCost) return;

			playPrizeFanfare(getPrizeTierNumber(prize));
			addPrizeToShelf(prize);
			totalTickets = Math.max(0, totalTickets - ticketCost);
			saveTotalTickets();
			updateHomeCashInButton();
			setGameState("home");
		});
	}

if (cancelCashOutButton) {
	cancelCashOutButton.addEventListener("click", () => {
		if (cashOutSource === "home") {
			setGameState("home");
			return;
		}
		setGameState("results");
	});
}

	if (closePrizeDetailButton) {
		closePrizeDetailButton.addEventListener("click", () => {
			closePrizeDetail();
		});
	}

	if (deletePrizeButton) {
		deletePrizeButton.addEventListener("click", () => {
			if (!activePrizeDetailId) return;
			deletePrizeFromShelf(activePrizeDetailId, lastPrizeShelfTriggerId);
		});
	}

	if (prizeDetailDialog) {
		prizeDetailDialog.addEventListener("close", () => {
			activePrizeDetailId = null;
		});
		prizeDetailDialog.addEventListener("cancel", event => {
			event.preventDefault();
			closePrizeDetail();
		});
	}

	if (cashOutHomeButton) {
		cashOutHomeButton.addEventListener("click", () => {
			setGameState("home");
		});
	}

	document.querySelectorAll("input[name='difficulty']").forEach(radio => {
		radio.addEventListener("change", syncTrainingUI);
	});

	if (moleChooserSelect) {
		moleChooserSelect.addEventListener("change", () => {
			syncInputModeUI();
			saveGameSettings(getSelectedSettings());
		});
	}

	document.querySelectorAll("input[name='inputMode']").forEach(radio => {
		radio.addEventListener("change", () => {
			syncMoleChooserForInputMode();
			syncInputModeUI();
			syncDesktopBrailleDisplayUI();
			saveGameSettings(getSelectedSettings());
		});
	});

	document.addEventListener("wabRoundEnded", (e) => {
	if (gameState !== "playing") return;
	resetDesktopBrailleDisplayInput();

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
		updateHomeCashInButton();
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

	if (saveTicketsHomeButton) {
		saveTicketsHomeButton.hidden = isTraining;
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

});
}

function setupMobileBsiListeners() {
	if (!mobileBsiEnabled || !mobileBsiInput) return;

	function flushMobileText() {
		if (gameState !== "playing") {
			mobileBsiInput.value = "";
			return;
		}

		const text = mobileBsiInput.value;
		if (!text) return;

		const normalized = text.trim().replace(/\s+/g, " ");
		if (normalized) {
			emitTextAttempt(normalized);
		}

		mobileBsiInput.value = "";
	}

	mobileBsiInput.addEventListener("input", () => {
		flushMobileText();
	});

	mobileBsiInput.addEventListener("keydown", (e) => {
		if (e.key === "Enter" || e.key === "Return") {
			e.preventDefault();
			flushMobileText();
		}
	});

	mobileBsiInput.addEventListener("blur", () => {
		if (gameState !== "playing") return;
		setTimeout(() => {
			armMobileBsiInput();
		}, 40);
	});
}

function setupDesktopBrailleDisplayListeners() {
	if (!desktopBrailleDisplayInput) return;
	let lastDesktopBrailleValue = "";
	let lastDesktopBrailleAt = 0;
	let desktopBrailleResetTimer = 0;

	function scheduleDesktopBrailleDisplayReset() {
		if (desktopBrailleResetTimer) {
			clearTimeout(desktopBrailleResetTimer);
		}
		desktopBrailleResetTimer = window.setTimeout(() => {
			desktopBrailleResetTimer = 0;
			resetDesktopBrailleDisplayInput();
		}, 0);
	}

	function emitDesktopBrailleAttempt(text) {
		const normalized = String(text || "").trim().toLowerCase();
		if (!normalized) return;

		const now = performance.now();
		if (normalized === lastDesktopBrailleValue && now - lastDesktopBrailleAt < 80) {
			scheduleDesktopBrailleDisplayReset();
			return;
		}

		lastDesktopBrailleValue = normalized;
		lastDesktopBrailleAt = now;
		emitTextAttempt(normalized);
		scheduleDesktopBrailleDisplayReset();
	}

	function flushDesktopBrailleDisplayText() {
		if (gameState !== "playing" || getSelectedInputMode() !== "brailleDisplay") {
			scheduleDesktopBrailleDisplayReset();
			return;
		}
		const text = desktopBrailleDisplayInput.value;
		if (!text) return;

		emitDesktopBrailleAttempt(text);
	}

	desktopBrailleDisplayInput.addEventListener("input", () => {
		flushDesktopBrailleDisplayText();
	});

	desktopBrailleDisplayInput.addEventListener("blur", () => {
		if (gameState !== "playing" || getSelectedInputMode() !== "brailleDisplay") return;
		setTimeout(() => {
			armDesktopBrailleDisplayInput();
		}, 40);
	});
}

function setupScoreListener() {
	if (!scoreText) return;

	document.addEventListener("wabScoreUpdated", e => {
		const newScore = e.detail?.score;
		if (typeof newScore !== "number") return;
		scoreText.textContent = "Score: " + newScore;
		resetDesktopBrailleDisplayInput();
	});
}

function getEligiblePrizes(ticketCount) {
	return prizeCatalog.filter(prize => {
		if (ticketCount < prize.minTickets) return false;
		if (prize.maxTickets !== null && ticketCount > prize.maxTickets) return false;
		return true;
	});
}

function pickRandomPrizes(prizes, count = 3) {
	const shuffled = prizes.slice();
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled.slice(0, Math.max(0, count));
}

let selectedPrizeId = null;

function getPrizeTicketCost(prize) {
	return Math.max(1, Number(prize?.minTickets) || 0);
}

function getPrizeTierNumber(prize) {
	const match = /^tier(\d+)_/i.exec(prize?.id || "");
	const tier = Number(match?.[1]);
	return Number.isFinite(tier) && tier >= 1 && tier <= 5 ? tier : 1;
}

function renderCashOut(source = "results") {
	cashOutSource = source === "home" ? "home" : "results";
	selectedPrizeId = null;

	if (confirmPrizeButton) {
		confirmPrizeButton.disabled = true;
	}

	if (cashOutTicketCount) {
		cashOutTicketCount.textContent = String(totalTickets);
	}

	if (cancelCashOutButton) {
		cancelCashOutButton.hidden = cashOutSource !== "results";
	}

	if (cashOutPrizeFieldset) {
		cashOutPrizeFieldset.hidden = totalTickets <= 0;
	}

	if (cashOutHomeButton) {
		cashOutHomeButton.textContent =
			cashOutSource === "results"
				? "Save Tickets and Return Home"
				: "Return Home";
	}

	if (confirmPrizeButton) {
		confirmPrizeButton.hidden = totalTickets <= 0;
	}

	if (cashOutSummaryText) {
		if (totalTickets <= 0) {
			cashOutSummaryText.textContent = "Your ticket jar is empty right now. Go whack some moles and come back for something shiny.";
		} else {
			cashOutSummaryText.textContent =
				cashOutSource === "results"
					? "Choose one of the wonderful prizes, or keep playing to win more tickets."
					: "Choose one of the wonderful prizes, or save your tickets and come back later.";
		}
	}

	const eligible = totalTickets > 0 ? getEligiblePrizes(totalTickets) : [];
	const picks = pickRandomPrizes(eligible, 3);

	const existingRadios = document.querySelectorAll("input[name='cashOutPrize']");
existingRadios.forEach(radio => {
	radio.checked = false;
});

	cashOutPrizeOptions.innerHTML = "";

	if (!picks.length) {
		const message = document.createElement("p");
		message.textContent = "No prizes to claim just yet.";
		cashOutPrizeOptions.appendChild(message);
		return;
	}

	picks.forEach((prize, index) => {
		const wrapper = document.createElement("div");

		const input = document.createElement("input");
		input.type = "radio";
		input.name = "cashOutPrize";
		input.id = "cashOutPrize_" + prize.id;
		input.value = prize.id;

		const label = document.createElement("label");
		label.setAttribute("for", input.id);
		const ticketCost = getPrizeTicketCost(prize);
		label.textContent = `${prize.label}, ${ticketCost} ${ticketCost === 1 ? "ticket" : "tickets"}`;

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
	mobileBsiEnabled = isMobileBsiRuntime() && !!mobileBsiInput && !!mobileBsiEntry;
	if (mobileBsiEntry) {
		mobileBsiEntry.hidden = !mobileBsiEnabled;
	}
	if (mobileBsiInput) {
		mobileBsiInput.disabled = !mobileBsiEnabled;
	}
	syncDesktopBrailleDisplayUI();
	if (speechRatePercentInput) {
		setSpeechRate(percentToSpeechRate(speechRatePercentInput.value));
	}
	if (speechVolumePercentInput) {
		setSpeechVolume(percentToSpeechVolume(speechVolumePercentInput.value));
	}

	loadTotalTickets();
	updateHomeCashInButton();
	loadPrizeShelf();
	renderBrailleReferenceTables();
	syncMoleChooserForInputMode();
	ensureMoleChooserValue();
	const savedSettings = loadGameSettings();
	if (savedSettings) {
		applySettingsToUI(savedSettings);
	}
	syncTrainingUI();
	setGameState("home");
	setupEventListeners();
	setupScoreListener();
	syncInputModeUI();
	syncMoleChooserForInputMode();
	ensureMoleChooserValue();
	syncTrainingUI();

	initGameLoop({
		moleElements: Array.from(document.querySelectorAll("#gameBoard .mole"))
	});
	void populateVoiceSelect();

	if (typeof speechSynthesis !== "undefined" && typeof speechSynthesis.addEventListener === "function") {
		speechSynthesis.addEventListener("voiceschanged", () => {
			void populateVoiceSelect();
		});
	}

	attachKeyboardListeners();
	setupMobileBsiListeners();
	setupDesktopBrailleDisplayListeners();
}

init();
