"use strict";

let voicesReady = false;
let cachedVoices = [];
let preferredVoiceName = "";
let currentUtterance = null;
let lastSpokenText = "";
let unlockPerformed = false;
let currentSpeechRate = 1.0;

function isSpeechSupported() {
	return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}
function setSpeechRate(rate) {
	if (typeof rate === "number" && rate >= 0.5 && rate <= 2.0) {
		currentSpeechRate = rate;
	}
}

function ensureVoicesReady() {
	if (!isSpeechSupported()) return Promise.resolve();

	if (voicesReady && cachedVoices.length) {
		return Promise.resolve();
	}

	return new Promise(resolve => {
		const voices = window.speechSynthesis.getVoices();
		if (voices.length) {
			cachedVoices = voices;
			voicesReady = true;
			resolve();
			return;
		}

		const handler = () => {
			cachedVoices = window.speechSynthesis.getVoices();
			voicesReady = true;
			window.speechSynthesis.removeEventListener("voiceschanged", handler);
			resolve();
		};

		window.speechSynthesis.addEventListener("voiceschanged", handler);
	});
}

function getDefaultLang() {
	const docLang = (document.documentElement && document.documentElement.lang) ? document.documentElement.lang : "";
	return (docLang || navigator.language || "en-US").toLowerCase();
}

function pickVoice() {
	if (!cachedVoices.length) return null;

	if (preferredVoiceName) {
		const exact = cachedVoices.find(v => v.name === preferredVoiceName);
		if (exact) return exact;
	}

	const langPrefix = getDefaultLang().split("-")[0];

	const byExactLang = cachedVoices.find(v => (v.lang || "").toLowerCase() === getDefaultLang());
	if (byExactLang) return byExactLang;

	const byPrefix = cachedVoices.find(v => (v.lang || "").toLowerCase().startsWith(langPrefix));
	if (byPrefix) return byPrefix;

	return cachedVoices[0];
}

function setPreferredVoiceName(name) {
	preferredVoiceName = String(name || "");
}

function unlockSpeech() {
	if (unlockPerformed) return;
	if (!isSpeechSupported()) return;

	try {
		const u = new SpeechSynthesisUtterance(" ");
		u.volume = 0;
		currentUtterance = u;
		window.speechSynthesis.speak(u);
		unlockPerformed = true;
	} catch (e) {
	}
}

function cancelSpeech() {
	if (!isSpeechSupported()) return;

	try {
		window.speechSynthesis.cancel();
	} catch (e) {
	}

	currentUtterance = null;
}

function kickSpeechQueue() {
	if (!isSpeechSupported()) return;

	try {
		window.speechSynthesis.pause();
		window.speechSynthesis.resume();
	} catch (e) {
	}
}

function clampNumber(value, min, max, fallback) {
	const n = typeof value === "number" ? value : parseFloat(value);
	if (!Number.isFinite(n)) return fallback;
	return Math.min(Math.max(n, min), max);
}
function getAvailableVoicesForLanguage(lang) {
	const voices = window.speechSynthesis.getVoices() || [];

	if (!lang) return voices;

	const base = lang.split("-")[0].toLowerCase();

	return voices.filter(v => {
		if (!v.lang) return false;
		return v.lang.toLowerCase().startsWith(base);
	});
}

async function speak(text, options = {}) {
	const startedAtMs = performance.now();

	if (!isSpeechSupported()) {
		return {
			spoken: false,
			reason: "unsupported",
			startedAtMs,
			endedAtMs: startedAtMs,
			panRequested: false,
			panApplied: false
		};
	}

	const t = String(text || "");
	if (!t) {
		return {
			spoken: false,
			reason: "empty",
			startedAtMs,
			endedAtMs: performance.now(),
			panRequested: false,
			panApplied: false
		};
	}

	const {
		rate = currentSpeechRate,
		pitch = 1,
		volume = 1,
		cancelPrevious = true,
		dedupe = true,
		timeoutMs = 0,
		startWatchdogMs = 350,
		retryOnce = true,
		pan
	} = options;

	const panRequested = typeof pan === "number" && Number.isFinite(pan) && pan !== 0;

	if (dedupe && t === lastSpokenText) {
		return {
			spoken: false,
			reason: "deduped",
			startedAtMs,
			endedAtMs: performance.now(),
			panRequested,
			panApplied: false
		};
	}

	await ensureVoicesReady();

	if (cancelPrevious && window.speechSynthesis.speaking) {
		cancelSpeech();
		await Promise.resolve();
	}

	const voice = pickVoice();

	let didStart = false;
	let didEnd = false;
	let didError = false;
	let onstartAtMs = 0;
	let onendAtMs = 0;

	const utterance = new SpeechSynthesisUtterance(t);
	currentUtterance = utterance;

	if (voice) utterance.voice = voice;

	utterance.rate = clampNumber(rate, 0.1, 3, currentSpeechRate);
	utterance.pitch = clampNumber(pitch, 0, 2, 1);
	utterance.volume = clampNumber(volume, 0, 1, 1);

	const resultPromise = new Promise(resolve => {
		utterance.onstart = () => {
			didStart = true;
			onstartAtMs = performance.now();
		};

		utterance.onend = () => {
			didEnd = true;
			onendAtMs = performance.now();
			resolve({
				spoken: true,
				finished: true,
				startedAtMs,
				onstartAtMs,
				endedAtMs: onendAtMs,
				panRequested,
				panApplied: false
			});
		};

		utterance.onerror = () => {
			didError = true;
			onendAtMs = performance.now();
			resolve({
				spoken: false,
				error: true,
				startedAtMs,
				onstartAtMs: didStart ? onstartAtMs : 0,
				endedAtMs: onendAtMs,
				panRequested,
				panApplied: false
			});
		};
	});

	window.speechSynthesis.speak(utterance);
	lastSpokenText = t;

	const watchdogPromise = new Promise(resolve => {
		setTimeout(async () => {
			if (didStart || didEnd || didError) {
				resolve(null);
				return;
			}

			kickSpeechQueue();

			if (retryOnce) {
				cancelSpeech();
				await Promise.resolve();

				const retry = await speak(t, {
					...options,
					retryOnce: false
				});
				resolve({
					...retry,
					retried: true
				});
				return;
			}

			resolve({
				spoken: false,
				reason: "no-start",
				startedAtMs,
				endedAtMs: performance.now(),
				panRequested,
				panApplied: false
			});
		}, Math.max(50, startWatchdogMs));
	});

	if (timeoutMs > 0) {
		return Promise.race([
			resultPromise,
			watchdogPromise.then(r => r || resultPromise),
			new Promise(resolve => {
				setTimeout(() => {
					if (!didEnd && !didError) {
						resolve({
							spoken: true,
							timedOut: true,
							startedAtMs,
							onstartAtMs: didStart ? onstartAtMs : 0,
							endedAtMs: performance.now(),
							panRequested,
							panApplied: false
						});
					}
				}, timeoutMs);
			})
		]);
	}

	const watchdogResult = await watchdogPromise;
	if (watchdogResult) return watchdogResult;

	return resultPromise;
}

export {
	unlockSpeech,
	speak,
	cancelSpeech,
	setPreferredVoiceName,
	setSpeechRate,
	getAvailableVoicesForLanguage
};
