"use strict";

let voicesReady = false;
let cachedVoices = [];
let lastSpokenText = "";
let unlockPerformed = false;

function ensureVoicesReady() {
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

function pickVoice() {
	if (!cachedVoices.length) return null;

	const preferred = cachedVoices.find(v =>
		v.lang &&
		v.lang.toLowerCase().startsWith(document.documentElement.lang || "en")
	);

	return preferred || cachedVoices[0];
}

function unlockSpeech() {
	if (unlockPerformed) return;

	try {
		const u = new SpeechSynthesisUtterance(" ");
		u.volume = 0;
		window.speechSynthesis.speak(u);
		unlockPerformed = true;
	} catch (e) {
	}
}

function cancelSpeech() {
	try {
		window.speechSynthesis.cancel();
	} catch (e) {
	}
}

async function speak(text, options = {}) {
	if (!text) {
		return { spoken: false, reason: "empty" };
	}

	const {
		rate = 1,
		pitch = 1,
		volume = 1,
		cancelPrevious = true,
		dedupe = true,
		timeoutMs = 0
	} = options;

	if (dedupe && text === lastSpokenText) {
		return { spoken: false, reason: "deduped" };
	}

	await ensureVoicesReady();

	if (cancelPrevious && window.speechSynthesis.speaking) {
		cancelSpeech();
		await Promise.resolve();
	}

	const utterance = new SpeechSynthesisUtterance(text);
	const voice = pickVoice();

	if (voice) {
		utterance.voice = voice;
	}

	utterance.rate = rate;
	utterance.pitch = pitch;
	utterance.volume = volume;

	let finished = false;

	const resultPromise = new Promise(resolve => {
		utterance.onend = () => {
			finished = true;
			resolve({ spoken: true, finished: true });
		};

		utterance.onerror = () => {
			finished = true;
			resolve({ spoken: false, error: true });
		};
	});

	window.speechSynthesis.speak(utterance);
	lastSpokenText = text;

	if (timeoutMs > 0) {
		return Promise.race([
			resultPromise,
			new Promise(resolve => {
				setTimeout(() => {
					if (!finished) {
						resolve({ spoken: true, timedOut: true });
					}
				}, timeoutMs);
			})
		]);
	}

	return resultPromise;
}

export {
	unlockSpeech,
	speak,
	cancelSpeech
};
