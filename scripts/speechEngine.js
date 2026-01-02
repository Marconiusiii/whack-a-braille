"use strict";

let voicesReady = false;
let cachedVoices = [];
let preferredVoiceName = "";
let currentUtterance = null;
let lastSpokenText = "";
let unlockPerformed = false;

function isSpeechSupported() {
	return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
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

async function speak(text, options = {}) {
	const startedAtMs = performance.now();

	if (!isSpeechSupported()) {
		return { spoken: false, reason: "unsupported", startedAtMs, endedAtMs: startedAtMs };
	}

	const t = String(text || "");
	if (!t) {
		return { spoken: false, reason: "empty", startedAtMs, endedAtMs: performance.now() };
	}

	const {
		rate = 1,
		pitch = 1,
		volume = 1,
		cancelPrevious = true,
		dedupe = true,
		timeoutMs = 0,
		startWatchdogMs = 350,
		retryOnce = true
	} = options;

	if (dedupe && t === lastSpokenText) {
		return { spoken: false, reason: "deduped", startedAtMs, endedAtMs: performance.now() };
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
	utterance.rate = rate;
	utterance.pitch = pitch;
	utterance.volume = volume;

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
				endedAtMs: onendAtMs
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
				endedAtMs: onendAtMs
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
				endedAtMs: performance.now()
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
							endedAtMs: performance.now()
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
	setPreferredVoiceName
};
