"use strict";

let currentUtterance = null;
let lastSpokenText = "";
let lastSpeakStartedAt = 0;
let lastSpeakEndedAt = 0;

let voiceNamePreference = "";
let ratePreference = 1;
let pitchPreference = 1;
let volumePreference = 1;

let isUnlocked = false;

function nowMs() {
	return performance.now();
}

function getVoicesSafe() {
	if (!("speechSynthesis" in window)) return [];
	return window.speechSynthesis.getVoices() || [];
}

function pickVoice() {
	if (!("speechSynthesis" in window)) return null;
	const voices = getVoicesSafe();
	if (!voices.length) return null;

	if (voiceNamePreference) {
		const exact = voices.find(v => v.name === voiceNamePreference);
		if (exact) return exact;
	}

	const english = voices.find(v => (v.lang || "").toLowerCase().startsWith("en"));
	if (english) return english;

	return voices[0] || null;
}

function cancelSpeech() {
	if (!("speechSynthesis" in window)) return;

	window.speechSynthesis.cancel();
	currentUtterance = null;
}

function setSpeechPreferences({ voiceName = "", rate = 1, pitch = 1, volume = 1 } = {}) {
	voiceNamePreference = voiceName;
	ratePreference = rate;
	pitchPreference = pitch;
	volumePreference = volume;
}

function unlockSpeech() {
	if (!("speechSynthesis" in window)) return false;
	if (isUnlocked) return true;

	try {
		const u = new SpeechSynthesisUtterance(" ");
		u.volume = 0;
		u.rate = ratePreference;
		u.pitch = pitchPreference;
		const voice = pickVoice();
		if (voice) u.voice = voice;

		window.speechSynthesis.cancel();
		window.speechSynthesis.speak(u);

		isUnlocked = true;
		return true;
	} catch (e) {
		return false;
	}
}

function speak(text, options = {}) {
	if (!("speechSynthesis" in window)) {
		return Promise.resolve({ ok: false, reason: "unsupported", started: false, ended: false, text });
	}

	const cleanText = String(text ?? "").trim();
	if (!cleanText) {
		return Promise.resolve({ ok: false, reason: "empty", started: false, ended: false, text: cleanText });
	}

	const {
		on = "start",
		timeoutMs = 350,
		cancelPrevious = true,
		dedupe = true,
		rate = ratePreference,
		pitch = pitchPreference,
		volume = volumePreference
	} = options;

	if (dedupe && cleanText === lastSpokenText && window.speechSynthesis.speaking) {
		return Promise.resolve({ ok: true, reason: "deduped", started: true, ended: false, text: cleanText });
	}

	if (cancelPrevious) cancelSpeech();

	lastSpokenText = cleanText;

	return new Promise(resolve => {
		let settled = false;
		let started = false;
		let ended = false;

		const u = new SpeechSynthesisUtterance(cleanText);
		currentUtterance = u;

		u.rate = rate;
		u.pitch = pitch;
		u.volume = volume;

		const voice = pickVoice();
		if (voice) u.voice = voice;

		const finish = (reason) => {
			if (settled) return;
			settled = true;
			resolve({ ok: true, reason, started, ended, text: cleanText });
		};

		u.onstart = () => {
			started = true;
			lastSpeakStartedAt = nowMs();
			if (on === "start") finish("start");
		};

		u.onend = () => {
			ended = true;
			lastSpeakEndedAt = nowMs();
			if (on === "end") finish("end");
		};

		u.onerror = () => {
			if (settled) return;
			settled = true;
			resolve({ ok: false, reason: "error", started, ended, text: cleanText });
		};

		try {
			window.speechSynthesis.speak(u);
		} catch (e) {
			if (settled) return;
			settled = true;
			resolve({ ok: false, reason: "exception", started, ended, text: cleanText });
			return;
		}

		setTimeout(() => {
			if (settled) return;
			finish("timeout");
		}, timeoutMs);
	});
}

function getSpeechTelemetry() {
	return {
		lastSpokenText,
		lastSpeakStartedAt,
		lastSpeakEndedAt,
		isUnlocked,
		isSpeaking: ("speechSynthesis" in window) ? window.speechSynthesis.speaking : false
	};
}

export {
	getVoicesSafe,
	setSpeechPreferences,
	unlockSpeech,
	cancelSpeech,
	speak,
	getSpeechTelemetry
};
