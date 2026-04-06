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
	extraPerkinsCellMs = 420,
	expectedInputCellCount = 1,
	minUpTimeMs = 400,
	maxUpTimeMs = 1800
} = {}) {
	let speechDuration = 0;

	if (speechResult) {
		const startedAt = Number(
			speechResult.onstartAtMs ?? speechResult.startedAtMs ?? speechResult.startedAt
		);
		const endedAt = Number(
			speechResult.endedAtMs ?? speechResult.endedAt
		);
		if (Number.isFinite(startedAt) && Number.isFinite(endedAt) && endedAt > startedAt) {
			speechDuration = endedAt - startedAt;
		}
	}

	if (!speechDuration) {
		speechDuration = 300;
	}

	const additionalCells = Math.max(0, Number(expectedInputCellCount || 1) - 1);
	const windowMs = baseUpTimeMs + speechDuration + reactionBufferMs + (additionalCells * extraPerkinsCellMs);

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
