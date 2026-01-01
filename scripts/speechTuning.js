"use strict";

function clamp(value, min, max) {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

function computeMoleWindowMs({
	speechResult,
	baseUpTimeMs,
	reactionBufferMs = 260,
	minUpTimeMs = 400,
	maxUpTimeMs = 1800
} = {}) {
	let speechDuration = 0;

	if (speechResult && speechResult.started && speechResult.ended) {
		const startedAt = speechResult.startedAt ?? 0;
		const endedAt = speechResult.endedAt ?? 0;
		if (endedAt > startedAt) {
			speechDuration = endedAt - startedAt;
		}
	}

	if (!speechDuration) {
		speechDuration = 300;
	}

	const windowMs = baseUpTimeMs + speechDuration + reactionBufferMs;

	if (windowMs < minUpTimeMs) return minUpTimeMs;
	if (windowMs > maxUpTimeMs) return maxUpTimeMs;
	return windowMs;
}

function computeRoundEndGraceMs({ baseGraceMs = 350, maxGraceMs = 750 } = {}) {
	return clamp(baseGraceMs, 0, maxGraceMs);
}

export {
	computeMoleWindowMs,
	computeRoundEndGraceMs
};
