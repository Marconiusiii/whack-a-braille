"use strict";

function isLetterInRange(letter, endChar) {
	const code = letter.toUpperCase().charCodeAt(0);
	return code >= 65 && code <= endChar.charCodeAt(0);
}

function dotsToMask(dots) {
	let mask = 0;
	for (const dot of dots) {
		mask |= 1 << (dot - 1);
	}
	return mask;
}

function dotsToPerkinsKeys(dots) {
	const map = { 1:"f", 2:"d", 3:"s", 4:"j", 5:"k", 6:"l" };
	return dots.map(dot => map[dot]);
}

function normalizePerkinsSequence(rawSequence, fallbackDots) {
	const sequence = Array.isArray(rawSequence) && rawSequence.length
		? rawSequence
		: [fallbackDots];

	return sequence.map(stepDots => {
		const dots = Array.isArray(stepDots) ? stepDots.slice() : [];
		return {
			dots,
			dotMask: dotsToMask(dots),
			perkinsKeys: dotsToPerkinsKeys(dots)
		};
	});
}

function dedupeInputs(inputs) {
	const seen = new Set();
	const result = [];

	for (const input of inputs.map(value => String(value || "").trim().toLowerCase())) {
		if (!input || seen.has(input)) continue;
		seen.add(input);
		result.push(input);
	}

	return result;
}

function makeItem(id, announceText, dots, modes, standardKey = null, options = {}) {
	const {
		acceptedInputs: rawAcceptedInputs = [],
		perkinsSequence: rawPerkinsSequence,
		...restOptions
	} = options;
	const acceptedInputs = Array.isArray(rawAcceptedInputs) ? rawAcceptedInputs : [];
	const acceptedTextInputs = [id];
	if (standardKey) {
		acceptedTextInputs.push(standardKey);
	}
	acceptedTextInputs.push(...acceptedInputs);
	const perkinsSequence = normalizePerkinsSequence(rawPerkinsSequence, dots);

	return {
		id,
		modeTags: modes,
		displayLabel: id,
		announceText,
		dots,
		dotMask: dotsToMask(dots),
		perkinsKeys: dotsToPerkinsKeys(dots),
		perkinsSequence,
		perkinsSequenceMasks: perkinsSequence.map(step => step.dotMask),
		perkinsSequenceDots: perkinsSequence.map(step => step.dots.slice()),
		expectedPerkinsCellCount: perkinsSequence.length,
		standardKey,
		acceptedTextInputs: dedupeInputs(acceptedTextInputs),
		...restOptions
	};
}

function makeTypingItem(key, announceText, modes) {
	return {
		id: key,
		modeTags: modes,
		displayLabel: key,
		announceText,
		dots: [],
		dotMask: 0,
		perkinsKeys: [],
		standardKey: key
		,
		acceptedTextInputs: [String(key).toLowerCase()]
	};
}

function makeSequenceItem(id, announceText, sequenceDots, modes, acceptedInputs = []) {
	const finalDots = Array.isArray(sequenceDots) && sequenceDots.length
		? sequenceDots[sequenceDots.length - 1]
		: [];
	return makeItem(id, announceText, finalDots, modes, null, {
		perkinsSequence: sequenceDots,
		acceptedInputs
	});
}
const grade1Letters = [
	makeItem("a","a",[1],["grade1Letters","grade1LettersNumbers"],"a",{ nato: "Alpha" }),
	makeItem("b","b",[1,2],["grade1Letters","grade1LettersNumbers"],"b",{ nato: "Bravo" }),
	makeItem("c","c",[1,4],["grade1Letters","grade1LettersNumbers"],"c",{ nato: "Charlie" }),
	makeItem("d","d",[1,4,5],["grade1Letters","grade1LettersNumbers"],"d",{ nato: "Delta" }),
	makeItem("e","e",[1,5],["grade1Letters","grade1LettersNumbers"],"e",{ nato: "Echo" }),
	makeItem("f","f",[1,2,4],["grade1Letters","grade1LettersNumbers"],"f",{ nato: "Foxtrot" }),
	makeItem("g","g",[1,2,4,5],["grade1Letters","grade1LettersNumbers"],"g",{ nato: "Golf" }),
	makeItem("h","h",[1,2,5],["grade1Letters","grade1LettersNumbers"],"h",{ nato: "Hotel" }),
	makeItem("i","i",[2,4],["grade1Letters","grade1LettersNumbers"],"i",{ nato: "India" }),
	makeItem("j","j",[2,4,5],["grade1Letters","grade1LettersNumbers"],"j",{ nato: "Juliet" }),
	makeItem("k","k",[1,3],["grade1Letters","grade1LettersNumbers"],"k",{ nato: "Kilo" }),
	makeItem("l","l",[1,2,3],["grade1Letters","grade1LettersNumbers"],"l",{ nato: "Lima" }),
	makeItem("m","m",[1,3,4],["grade1Letters","grade1LettersNumbers"],"m",{ nato: "Mike" }),
	makeItem("n","n",[1,3,4,5],["grade1Letters","grade1LettersNumbers"],"n",{ nato: "November" }),
	makeItem("o","o",[1,3,5],["grade1Letters","grade1LettersNumbers"],"o",{ nato: "Oscar" }),
	makeItem("p","p",[1,2,3,4],["grade1Letters","grade1LettersNumbers"],"p",{ nato: "Papa" }),
	makeItem("q","q",[1,2,3,4,5],["grade1Letters","grade1LettersNumbers"],"q",{ nato: "Quebec" }),
	makeItem("r","r",[1,2,3,5],["grade1Letters","grade1LettersNumbers"],"r",{ nato: "Romeo" }),
	makeItem("s","s",[2,3,4],["grade1Letters","grade1LettersNumbers"],"s",{ nato: "Sierra" }),
	makeItem("t","t",[2,3,4,5],["grade1Letters","grade1LettersNumbers"],"t",{ nato: "Tango" }),
	makeItem("u","u",[1,3,6],["grade1Letters","grade1LettersNumbers"],"u",{ nato: "Uniform" }),
	makeItem("v","v",[1,2,3,6],["grade1Letters","grade1LettersNumbers"],"v",{ nato: "Victor" }),
	makeItem("w","w",[2,4,5,6],["grade1Letters","grade1LettersNumbers"],"w",{ nato: "Whiskey" }),
	makeItem("x","x",[1,3,4,6],["grade1Letters","grade1LettersNumbers"],"x",{ nato: "X-ray" }),
	makeItem("y","y",[1,3,4,5,6],["grade1Letters","grade1LettersNumbers"],"y",{ nato: "Yankee" }),
	makeItem("z","z",[1,3,5,6],["grade1Letters","grade1LettersNumbers"],"z",{ nato: "Zulu" })
];

const grade1Numbers = [
	makeItem("1","1",[1],["grade1Numbers","grade1LettersNumbers"],"1", { perkinsSequence: [[3,4,5,6], [1]] }),
	makeItem("2","2",[1,2],["grade1Numbers","grade1LettersNumbers"],"2", { perkinsSequence: [[3,4,5,6], [1,2]] }),
	makeItem("3","3",[1,4],["grade1Numbers","grade1LettersNumbers"],"3", { perkinsSequence: [[3,4,5,6], [1,4]] }),
	makeItem("4","4",[1,4,5],["grade1Numbers","grade1LettersNumbers"],"4", { perkinsSequence: [[3,4,5,6], [1,4,5]] }),
	makeItem("5","5",[1,5],["grade1Numbers","grade1LettersNumbers"],"5", { perkinsSequence: [[3,4,5,6], [1,5]] }),
	makeItem("6","6",[1,2,4],["grade1Numbers","grade1LettersNumbers"],"6", { perkinsSequence: [[3,4,5,6], [1,2,4]] }),
	makeItem("7","7",[1,2,4,5],["grade1Numbers","grade1LettersNumbers"],"7", { perkinsSequence: [[3,4,5,6], [1,2,4,5]] }),
	makeItem("8","8",[1,2,5],["grade1Numbers","grade1LettersNumbers"],"8", { perkinsSequence: [[3,4,5,6], [1,2,5]] }),
	makeItem("9","9",[2,4],["grade1Numbers","grade1LettersNumbers"],"9", { perkinsSequence: [[3,4,5,6], [2,4]] }),
	makeItem("0","0",[2,4,5],["grade1Numbers","grade1LettersNumbers"],"0", { perkinsSequence: [[3,4,5,6], [2,4,5]] })
];

const grade2Symbols = [
	makeItem("er","E R",[1,2,4,5,6],["grade2Symbols"], null, { acceptedInputs: ["}"] }),
	makeItem("ed","E D",[1,2,4,6],["grade2Symbols"], null, { acceptedInputs: ["$"] }),
	makeItem("gh","G H",[1,2,6],["grade2Symbols"], null, { acceptedInputs: ["<"] }),
	makeItem("ar","A R",[3,4,5],["grade2Symbols"], null, { acceptedInputs: [">"] }),
	makeItem("ow","O W",[2,4,6],["grade2Symbols"], null, { acceptedInputs: ["{"] }),
	makeItem("ou","O U",[1,2,5,6],["grade2Symbols"], null, { acceptedInputs: ["|", "out"] }),
	makeItem("st","S T",[3,4],["grade2Symbols"], null, { acceptedInputs: ["/", "still"] }),
	makeItem("ch","C H",[1,6],["grade2Symbols"], null, { acceptedInputs: ["*", "child"] }),
	makeItem("wh","W H",[1,5,6],["grade2Symbols"], null, { acceptedInputs: [":"] }),
	makeItem("ing","I N G",[3,4,6],["grade2Symbols"], null, { acceptedInputs: ["+"] }),
	makeItem("dis","dis",[2,5,6],["grade2Symbols"], null, { acceptedInputs: ["4", "."] }),
	makeItem("con","con",[2,5],["grade2Symbols"], null, { acceptedInputs: ["3", ":"] }),
	makeItem("of","Of",[1,2,3,5,6],["grade2Symbols"], null, { acceptedInputs: ["("] }),
	makeItem("with","with",[2,3,4,5,6],["grade2Symbols"], null, { acceptedInputs: [")"] }),
	makeItem("and","and",[1,2,3,4,6],["grade2Symbols"], null, { acceptedInputs: ["&"] }),
	makeItem("for","for",[1,2,3,4,5,6],["grade2Symbols"], null, { acceptedInputs: ["="] }),
	makeItem("the","The",[2,3,4,6],["grade2Symbols"], null, { acceptedInputs: ["!"] })
];

const grade2Words = [
	makeItem("but","But",[1,2],["grade2Words"], null, { acceptedInputs: ["b"] }),
	makeItem("can","Can",[1,4],["grade2Words"], null, { acceptedInputs: ["c"] }),
	makeItem("do","Do",[1,4,5],["grade2Words"], null, { acceptedInputs: ["d"] }),
	makeItem("every","Every",[1,5],["grade2Words"], null, { acceptedInputs: ["e"] }),
	makeItem("from","From",[1,2,4],["grade2Words"], null, { acceptedInputs: ["f"] }),
	makeItem("go","Go",[1,2,4,5],["grade2Words"], null, { acceptedInputs: ["g"] }),
	makeItem("have","Have",[1,2,5],["grade2Words"], null, { acceptedInputs: ["h"] }),
	makeItem("just","Just",[2,4,5],["grade2Words"], null, { acceptedInputs: ["j"] }),
	makeItem("knowledge","Knowledge",[1,3],["grade2Words"], null, { acceptedInputs: ["k"] }),
	makeItem("like","Like",[1,2,3],["grade2Words"], null, { acceptedInputs: ["l"] }),
	makeItem("more","More",[1,3,4],["grade2Words"], null, { acceptedInputs: ["m"] }),
	makeItem("not","Not",[1,3,4,5],["grade2Words"], null, { acceptedInputs: ["n"] }),
	makeItem("people","People",[1,2,3,4],["grade2Words"], null, { acceptedInputs: ["p"] }),
	makeItem("quite","Quite",[1,2,3,4,5],["grade2Words"], null, { acceptedInputs: ["q"] }),
	makeItem("rather","Rather",[1,2,3,5],["grade2Words"], null, { acceptedInputs: ["r"] }),
	makeItem("so","So",[2,3,4],["grade2Words"], null, { acceptedInputs: ["s"] }),
	makeItem("that","That",[2,3,4,5],["grade2Words"], null, { acceptedInputs: ["t"] }),
	makeItem("us","Us",[1,3,6],["grade2Words"], null, { acceptedInputs: ["u"] }),
	makeItem("very","Very",[1,2,3,6],["grade2Words"], null, { acceptedInputs: ["v"] }),
	makeItem("will","Will",[2,4,5,6],["grade2Words"], null, { acceptedInputs: ["w"] }),
	makeItem("it","It",[1,3,4,6],["grade2Words"], null, { acceptedInputs: ["x"] }),
	makeItem("you","You",[1,3,4,5,6],["grade2Words"], null, { acceptedInputs: ["y"] }),
	makeItem("as","As",[1,3,5,6],["grade2Words"], null, { acceptedInputs: ["z"] }),
	makeItem("this","This",[1,4,5,6],["grade2Words"], null, { acceptedInputs: ["?"] }),
	makeItem("which","Which",[1,5,6],["grade2Words"], null, { acceptedInputs: ["w", ":"] }),
	makeItem("child","Child",[1,6],["grade2Words"], null, { acceptedInputs: ["c", "*"] }),
	makeItem("shall","Shall",[1,4,6],["grade2Words"], null, { acceptedInputs: ["s", "%"] })
];

const grade2Dot5Initials = [
	makeSequenceItem("day", "Day", [[5], [1,4,5]], ["grade2Dot5Initials"]),
	makeSequenceItem("ever", "Ever", [[5], [1,5]], ["grade2Dot5Initials"]),
	makeSequenceItem("father", "Father", [[5], [1,2,4]], ["grade2Dot5Initials"]),
	makeSequenceItem("here", "Here", [[5], [1,2,5]], ["grade2Dot5Initials"]),
	makeSequenceItem("know", "Know", [[5], [1,3]], ["grade2Dot5Initials"]),
	makeSequenceItem("lord", "Lord", [[5], [1,2,3]], ["grade2Dot5Initials"]),
	makeSequenceItem("mother", "Mother", [[5], [1,3,4]], ["grade2Dot5Initials"]),
	makeSequenceItem("name", "Name", [[5], [1,3,4,5]], ["grade2Dot5Initials"]),
	makeSequenceItem("one", "One", [[5], [1,3,5]], ["grade2Dot5Initials"]),
	makeSequenceItem("part", "Part", [[5], [1,2,3,4]], ["grade2Dot5Initials"]),
	makeSequenceItem("question", "Question", [[5], [1,2,3,4,5]], ["grade2Dot5Initials"]),
	makeSequenceItem("right", "Right", [[5], [1,2,3,5]], ["grade2Dot5Initials"]),
	makeSequenceItem("some", "Some", [[5], [2,3,4]], ["grade2Dot5Initials"]),
	makeSequenceItem("time", "Time", [[5], [2,3,4,5]], ["grade2Dot5Initials"]),
	makeSequenceItem("there", "There", [[5], [2,3,4,6]], ["grade2Dot5Initials"]),
	makeSequenceItem("through", "Through", [[5], [1,4,5,6]], ["grade2Dot5Initials"]),
	makeSequenceItem("under", "Under", [[5], [1,3,6]], ["grade2Dot5Initials"]),
	makeSequenceItem("where", "Where", [[5], [1,5,6]], ["grade2Dot5Initials"]),
	makeSequenceItem("work", "Work", [[5], [2,4,5,6]], ["grade2Dot5Initials"]),
	makeSequenceItem("young", "Young", [[5], [1,3,4,5,6]], ["grade2Dot5Initials"]),
	makeSequenceItem("character", "Character", [[5], [1,6]], ["grade2Dot5Initials"]),
	makeSequenceItem("ought", "Ought", [[5], [1,2,5,6]], ["grade2Dot5Initials"])
];

const grade2Dot45Initials = [
	makeSequenceItem("upon", "Upon", [[4,5], [1,3,6]], ["grade2Dot45Initials"]),
	makeSequenceItem("word", "Word", [[4,5], [2,4,5,6]], ["grade2Dot45Initials"]),
	makeSequenceItem("these", "These", [[4,5], [2,3,4,6]], ["grade2Dot45Initials"]),
	makeSequenceItem("those", "Those", [[4,5], [1,4,5,6]], ["grade2Dot45Initials"]),
	makeSequenceItem("whose", "Whose", [[4,5], [1,5,6]], ["grade2Dot45Initials"])
];

const grade2Suffixes = [
	makeSequenceItem("ance", "A N C E", [[4,6], [1,5]], ["grade2Suffixes"], ["-ance", "ε"]),
	makeSequenceItem("sion", "S I O N", [[4,6], [1,3,4,5]], ["grade2Suffixes"], ["-sion"]),
	makeSequenceItem("less", "L E S S", [[4,6], [2,3,4]], ["grade2Suffixes"], ["-less"]),
	makeSequenceItem("ound", "O U N D", [[4,6], [1,4,5]], ["grade2Suffixes"], ["-ound"]),
	makeSequenceItem("ount", "O U N T", [[4,6], [2,3,4,5]], ["grade2Suffixes"], ["-ount"]),
	makeSequenceItem("ence", "E N C E", [[5,6], [1,5]], ["grade2Suffixes"], ["-ence"]),
	makeSequenceItem("ong", "O N G", [[5,6], [1,2,4,5]], ["grade2Suffixes"], ["-ong"]),
	makeSequenceItem("ful", "F U L", [[5,6], [1,2,4]], ["grade2Suffixes"], ["-ful"]),
	makeSequenceItem("tion", "T I O N", [[5,6], [2,3,4,5]], ["grade2Suffixes"], ["-tion"]),
	makeSequenceItem("ness", "N E S S", [[5,6], [1,3,4,5]], ["grade2Suffixes"], ["-ness"]),
	makeSequenceItem("ment", "M E N T", [[5,6], [1,3,4]], ["grade2Suffixes"], ["-ment"]),
	makeSequenceItem("ity", "I T Y", [[5,6], [1,3,4,5,6]], ["grade2Suffixes"], ["-ity"])
];

const grade2Dot456Initials = [
	makeSequenceItem("cannot", "Cannot", [[4,5,6], [1,4]], ["grade2Dot456Initials"]),
	makeSequenceItem("had", "Had", [[4,5,6], [1,2,5]], ["grade2Dot456Initials"]),
	makeSequenceItem("many", "Many", [[4,5,6], [1,3,4]], ["grade2Dot456Initials"]),
	makeSequenceItem("spirit", "Spirit", [[4,5,6], [2,3,4]], ["grade2Dot456Initials"]),
	makeSequenceItem("their", "Their", [[4,5,6], [2,3,4,6]], ["grade2Dot456Initials"]),
	makeSequenceItem("world", "World", [[4,5,6], [2,4,5,6]], ["grade2Dot456Initials"])
];

const typingSimpleHomeRowItems = [
	makeTypingItem("a", "a", ["typingSimpleHomeRow"]),
	makeTypingItem("s", "s", ["typingSimpleHomeRow"]),
	makeTypingItem("d", "d", ["typingSimpleHomeRow"]),
	makeTypingItem("f", "f", ["typingSimpleHomeRow"]),
	makeTypingItem("j", "j", ["typingSimpleHomeRow"]),
	makeTypingItem("k", "k", ["typingSimpleHomeRow"]),
	makeTypingItem("l", "l", ["typingSimpleHomeRow"]),
	makeTypingItem(";", "semicolon", ["typingSimpleHomeRow"])
];

const typingHomeRowItems = [
	makeTypingItem("a", "a", ["typingHomeRow", "typingHomeTopRow", "typingHomeBottomRow"]),
	makeTypingItem("s", "s", ["typingHomeRow", "typingHomeTopRow", "typingHomeBottomRow"]),
	makeTypingItem("d", "d", ["typingHomeRow", "typingHomeTopRow", "typingHomeBottomRow"]),
	makeTypingItem("f", "f", ["typingHomeRow", "typingHomeTopRow", "typingHomeBottomRow"]),
	makeTypingItem("g", "g", ["typingHomeRow", "typingHomeTopRow", "typingHomeBottomRow"]),
	makeTypingItem("h", "h", ["typingHomeRow", "typingHomeTopRow", "typingHomeBottomRow"]),
	makeTypingItem("j", "j", ["typingHomeRow", "typingHomeTopRow", "typingHomeBottomRow"]),
	makeTypingItem("k", "k", ["typingHomeRow", "typingHomeTopRow", "typingHomeBottomRow"]),
	makeTypingItem("l", "l", ["typingHomeRow", "typingHomeTopRow", "typingHomeBottomRow"]),
	makeTypingItem(";", "semicolon", ["typingHomeRow", "typingHomeTopRow", "typingHomeBottomRow"]),
	makeTypingItem("'", "apostrophe", ["typingHomeRow", "typingHomeTopRow", "typingHomeBottomRow"])
];

const typingTopRowItems = [
	makeTypingItem("q", "q", ["typingHomeTopRow"]),
	makeTypingItem("w", "w", ["typingHomeTopRow"]),
	makeTypingItem("e", "e", ["typingHomeTopRow"]),
	makeTypingItem("r", "r", ["typingHomeTopRow"]),
	makeTypingItem("t", "t", ["typingHomeTopRow"]),
	makeTypingItem("y", "y", ["typingHomeTopRow"]),
	makeTypingItem("u", "u", ["typingHomeTopRow"]),
	makeTypingItem("i", "i", ["typingHomeTopRow"]),
	makeTypingItem("o", "o", ["typingHomeTopRow"]),
	makeTypingItem("p", "p", ["typingHomeTopRow"]),
	makeTypingItem("[", "left bracket", ["typingHomeTopRow"]),
	makeTypingItem("]", "right bracket", ["typingHomeTopRow"]),
	makeTypingItem("\\", "backslash", ["typingHomeTopRow"])
];

const typingBottomRowItems = [
	makeTypingItem("z", "z", ["typingHomeBottomRow"]),
	makeTypingItem("x", "x", ["typingHomeBottomRow"]),
	makeTypingItem("c", "c", ["typingHomeBottomRow"]),
	makeTypingItem("v", "v", ["typingHomeBottomRow"]),
	makeTypingItem("b", "b", ["typingHomeBottomRow"]),
	makeTypingItem("n", "n", ["typingHomeBottomRow"]),
	makeTypingItem("m", "m", ["typingHomeBottomRow"]),
	makeTypingItem(",", "comma", ["typingHomeBottomRow"]),
	makeTypingItem(".", "period", ["typingHomeBottomRow"]),
	makeTypingItem("/", "slash", ["typingHomeBottomRow"])
];

const brailleOnlyRegistry = [
	...grade1Letters,
	...grade1Numbers,
	...grade2Symbols,
	...grade2Words,
	...grade2Dot5Initials,
	...grade2Dot45Initials,
	...grade2Suffixes,
	...grade2Dot456Initials
];

const brailleRegistry = [
	...brailleOnlyRegistry,
	...typingSimpleHomeRowItems,
	...typingHomeRowItems,
	...typingTopRowItems,
	...typingBottomRowItems
];

function getBrailleItemsForMode(modeId) {
	if (modeId === "grade1Invasion") {
		return [...grade1Letters, ...grade1Numbers];
	}

	if (modeId === "grade2Invasion") {
		return [
			...grade2Symbols,
			...grade2Words,
			...grade2Dot5Initials,
			...grade2Dot45Initials,
			...grade2Suffixes,
			...grade2Dot456Initials
		];
	}

	if (modeId === "letters-aj") {
		return brailleRegistry.filter(item =>
			item.modeTags?.includes("grade1Letters") &&
			isLetterInRange(item.id, "J")
		);
	}

	if (modeId === "letters-at") {
		return brailleRegistry.filter(item =>
			item.modeTags?.includes("grade1Letters") &&
			isLetterInRange(item.id, "T")
		);
	}

	return brailleRegistry.filter(item => item.modeTags.includes(modeId));
}

export {
	brailleRegistry,
	getBrailleItemsForMode,
	grade1Letters,
	grade1Numbers,
	grade2Symbols,
	grade2Words,
	grade2Dot5Initials,
	grade2Dot45Initials,
	grade2Suffixes,
	grade2Dot456Initials
};
