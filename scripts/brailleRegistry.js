"use strict";

/*
	Dot numbering reference
	1 4
	2 5
	3 6
*/

function dotsToMask(dots) {
	let mask = 0;
	for (const dot of dots) {
		mask |= 1 << (dot - 1);
	}
	return mask;
}

const brailleModes = {
	grade1Letters: { id: "grade1Letters", label: "Letters only (Grade 1)" },
	grade1Numbers: { id: "grade1Numbers", label: "Numbers only (Grade 1)" },
	grade1LettersNumbers: { id: "grade1LettersNumbers", label: "Letters and numbers (Grade 1)" },
	grade2Symbols: { id: "grade2Symbols", label: "Grade 2 contractions (symbols)" },
	grade2Words: { id: "grade2Words", label: "Grade 2 whole-word contractions" }
};

const brailleRegistry = [

	/* Grade 1 Letters */

	{ id: "a", modeTags: ["grade1Letters", "grade1LettersNumbers"], displayLabel: "a", announceText: "a", dots: [1], dotMask: dotsToMask([1]), perkinsKeys: ["f"], standardKey: "a" },
	{ id: "b", modeTags: ["grade1Letters", "grade1LettersNumbers"], displayLabel: "b", announceText: "b", dots: [1,2], dotMask: dotsToMask([1,2]), perkinsKeys: ["f","d"], standardKey: "b" },
	{ id: "c", modeTags: ["grade1Letters", "grade1LettersNumbers"], displayLabel: "c", announceText: "c", dots: [1,4], dotMask: dotsToMask([1,4]), perkinsKeys: ["f","j"], standardKey: "c" },
	{ id: "d", modeTags: ["grade1Letters", "grade1LettersNumbers"], displayLabel: "d", announceText: "d", dots: [1,4,5], dotMask: dotsToMask([1,4,5]), perkinsKeys: ["f","j","k"], standardKey: "d" },
	{ id: "e", modeTags: ["grade1Letters", "grade1LettersNumbers"], displayLabel: "e", announceText: "e", dots: [1,5], dotMask: dotsToMask([1,5]), perkinsKeys: ["f","k"], standardKey: "e" },

	/* continue full alphabet later */

	/* Grade 1 Numbers (no number sign) */

	{ id: "1", modeTags: ["grade1Numbers", "grade1LettersNumbers"], displayLabel: "1", announceText: "1", dots: [1], dotMask: dotsToMask([1]), perkinsKeys: ["f"], standardKey: "1" },
	{ id: "2", modeTags: ["grade1Numbers", "grade1LettersNumbers"], displayLabel: "2", announceText: "2", dots: [1,2], dotMask: dotsToMask([1,2]), perkinsKeys: ["f","d"], standardKey: "2" },
	{ id: "3", modeTags: ["grade1Numbers", "grade1LettersNumbers"], displayLabel: "3", announceText: "3", dots: [1,4], dotMask: dotsToMask([1,4]), perkinsKeys: ["f","j"], standardKey: "3" },

	/* continue 4–0 later */

	/* Grade 2 Symbol Contractions (two-letter, announce letters individually) */

	{ id: "er", modeTags: ["grade2Symbols"], displayLabel: "er", announceText: "E R", dots: [1,2,4,5], dotMask: dotsToMask([1,2,4,5]), perkinsKeys: ["f","d","j","k"], standardKey: null },
	{ id: "ed", modeTags: ["grade2Symbols"], displayLabel: "ed", announceText: "E D", dots: [1,2,4,6], dotMask: dotsToMask([1,2,4,6]), perkinsKeys: ["f","d","j","l"], standardKey: null },
	{ id: "ou", modeTags: ["grade2Symbols"], displayLabel: "ou", announceText: "O U", dots: [1,2,5,6], dotMask: dotsToMask([1,2,5,6]), perkinsKeys: ["f","d","k","l"], standardKey: null },
	{ id: "sh", modeTags: ["grade2Symbols"], displayLabel: "sh", announceText: "S H", dots: [1,4,6], dotMask: dotsToMask([1,4,6]), perkinsKeys: ["f","j","l"], standardKey: null },
	{ id: "th", modeTags: ["grade2Symbols"], displayLabel: "th", announceText: "T H", dots: [1,4,5,6], dotMask: dotsToMask([1,4,5,6]), perkinsKeys: ["f","j","k","l"], standardKey: null },

	/* Grade 2 Symbol Contractions (word-like, spoken as words) */

	{ id: "and", modeTags: ["grade2Symbols"], displayLabel: "and", announceText: "and", dots: [1,2,3,4,6], dotMask: dotsToMask([1,2,3,4,6]), perkinsKeys: ["f","d","s","j","l"], standardKey: null },
	{ id: "for", modeTags: ["grade2Symbols"], displayLabel: "for", announceText: "for", dots: [1,2,3,4], dotMask: dotsToMask([1,2,3,4]), perkinsKeys: ["f","d","s","j"], standardKey: null },
	{ id: "the", modeTags: ["grade2Symbols"], displayLabel: "the", announceText: "the", dots: [2,3,4,6], dotMask: dotsToMask([2,3,4,6]), perkinsKeys: ["d","s","j","l"], standardKey: null },
	{ id: "with", modeTags: ["grade2Symbols"], displayLabel: "with", announceText: "with", dots: [2,3,4,5,6], dotMask: dotsToMask([2,3,4,5,6]), perkinsKeys: ["d","s","j","k","l"], standardKey: null },
	{ id: "ing", modeTags: ["grade2Symbols"], displayLabel: "ing", announceText: "ing", dots: [3,4,6], dotMask: dotsToMask([3,4,6]), perkinsKeys: ["s","j","l"], standardKey: null },

	/* Grade 2 Whole-Word Contractions */

	{ id: "but", modeTags: ["grade2Words"], displayLabel: "but", announceText: "but", dots: [1,2], dotMask: dotsToMask([1,2]), perkinsKeys: ["f","d"], standardKey: null },
	{ id: "can", modeTags: ["grade2Words"], displayLabel: "can", announceText: "can", dots: [1,4], dotMask: dotsToMask([1,4]), perkinsKeys: ["f","j"], standardKey: null },
	{ id: "do", modeTags: ["grade2Words"], displayLabel: "do", announceText: "do", dots: [1,4,5], dotMask: dotsToMask([1,4,5]), perkinsKeys: ["f","j","k"], standardKey: null },
	{ id: "knowledge", modeTags: ["grade2Words"], displayLabel: "knowledge", announceText: "knowledge", dots: [1,3,4,5], dotMask: dotsToMask([1,3,4,5]), perkinsKeys: ["f","s","j","k"], standardKey: null }

];

function getBrailleItemsForMode(modeId) {
	return brailleRegistry.filter(item => item.modeTags.includes(modeId));
}

export { brailleModes, brailleRegistry, getBrailleItemsForMode };
