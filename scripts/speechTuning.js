"use strict";

function clamp(value, min, max) {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

function computeMoleWindowMs({ speechResult, baseUpTimeMs, extraPadMs = 120, minUpTimeMs = 220, maxUpTimeMs = 1200 } = {}) {
	let pad = 0;

	if (!speechResult || speechResult.ok !== true) pad = 220;
	else if (speechResult.started !== true) pad = 220;
	else if (speechResult.reason === "timeout") pad = 180;

	const windowMs = baseUpTimeMs + pad + extraPadMs;
	return clamp(windowMs, minUpTimeMs, maxUpTimeMs);
}

function computeRoundEndGraceMs({ baseGraceMs = 350, maxGraceMs = 750 } = {}) {
	return clamp(baseGraceMs, 0, maxGraceMs);
}

export {
	computeMoleWindowMs,
	computeRoundEndGraceMs
};
