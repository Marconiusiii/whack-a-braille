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

function makeItem(id, announceText, dots, modes, standardKey = null, options = {}) {
	return {
		id,
		modeTags: modes,
		displayLabel: id,
		announceText,
		dots,
		dotMask: dotsToMask(dots),
		perkinsKeys: dotsToPerkinsKeys(dots),
		standardKey,
		...options
	};
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
	makeItem("1","1",[1],["grade1Numbers","grade1LettersNumbers"],"1"),
	makeItem("2","2",[1,2],["grade1Numbers","grade1LettersNumbers"],"2"),
	makeItem("3","3",[1,4],["grade1Numbers","grade1LettersNumbers"],"3"),
	makeItem("4","4",[1,4,5],["grade1Numbers","grade1LettersNumbers"],"4"),
	makeItem("5","5",[1,5],["grade1Numbers","grade1LettersNumbers"],"5"),
	makeItem("6","6",[1,2,4],["grade1Numbers","grade1LettersNumbers"],"6"),
	makeItem("7","7",[1,2,4,5],["grade1Numbers","grade1LettersNumbers"],"7"),
	makeItem("8","8",[1,2,5],["grade1Numbers","grade1LettersNumbers"],"8"),
	makeItem("9","9",[2,4],["grade1Numbers","grade1LettersNumbers"],"9"),
	makeItem("0","0",[2,4,5],["grade1Numbers","grade1LettersNumbers"],"0")
];

const grade2Symbols = [
	makeItem("er","E R",[1,2,4,5,6],["grade2Symbols"]),
	makeItem("ed","E D",[1,2,4,6],["grade2Symbols"]),
	makeItem("gh","G H",[1,2,6],["grade2Symbols"]),
	makeItem("ar","A R",[3,4,5],["grade2Symbols"]),
	makeItem("ow","O W",[2,4,6],["grade2Symbols"]),
	makeItem("ou","O U",[1,2,5,6],["grade2Symbols"]),
	makeItem("st","S T",[3,4],["grade2Symbols"]),
	makeItem("ch","C H",[1,6],["grade2Symbols"]),
	makeItem("wh","W H",[1,5,6],["grade2Symbols"]),
	makeItem("ing","I N G",[3,4,6],["grade2Symbols"]),
	makeItem("dis","dis",[2,5,6],["grade2Symbols"]),
	makeItem("con","con",[2,5],["grade2Symbols"]),
	makeItem("of","Of",[1,2,3,5,6],["grade2Symbols"]),
	makeItem("with","with",[2,3,4,5,6],["grade2Symbols"]),
	makeItem("and","and",[1,2,3,4,6],["grade2Symbols"]),
	makeItem("for","for",[1,2,3,4,5,6],["grade2Symbols"]),
	makeItem("the","The",[2,3,4,6],["grade2Symbols"])
];

const grade2Words = [
	makeItem("but","But",[1,2],["grade2Words"]),
	makeItem("can","Can",[1,4],["grade2Words"]),
	makeItem("do","Do",[1,4,5],["grade2Words"]),
	makeItem("every","Every",[1,5],["grade2Words"]),
	makeItem("from","From",[1,2,4],["grade2Words"]),
	makeItem("go","Go",[1,2,4,5],["grade2Words"]),
	makeItem("have","Have",[1,2,5],["grade2Words"]),
	makeItem("just","Just",[2,4,5],["grade2Words"]),
	makeItem("knowledge","Knowledge",[1,3],["grade2Words"]),
	makeItem("like","Like",[1,2,3],["grade2Words"]),
	makeItem("more","More",[1,3,4],["grade2Words"]),
	makeItem("not","Not",[1,3,4,5],["grade2Words"]),
	makeItem("people","People",[1,2,3,4],["grade2Words"]),
	makeItem("quite","Quite",[1,2,3,4,5],["grade2Words"]),
	makeItem("rather","Rather",[1,2,3,5],["grade2Words"]),
	makeItem("so","So",[2,3,4],["grade2Words"]),
	makeItem("that","That",[2,3,4,5],["grade2Words"]),
	makeItem("us","Us",[1,3,6],["grade2Words"]),
	makeItem("very","Very",[1,2,3,6],["grade2Words"]),
	makeItem("will","Will",[2,4,5,6],["grade2Words"]),
	makeItem("it","It",[1,3,4,6],["grade2Words"]),
	makeItem("you","You",[1,3,4,5,6],["grade2Words"]),
	makeItem("as","As",[1,3,5,6],["grade2Words"]),
	makeItem("this","This",[1,4,5,6],["grade2Words"]),
	makeItem("which","Which",[1,5,6],["grade2Words"]),
	makeItem("child","Child",[1,6],["grade2Words"]),
	makeItem("shall","Shall",[1,4,6],["grade2Words"])
];

const brailleRegistry = [
	...grade1Letters,
	...grade1Numbers,
	...grade2Symbols,
	...grade2Words
];

function getBrailleItemsForMode(modeId) {
	if (modeId === "everything") {
		return brailleRegistry.slice();
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
	getBrailleItemsForMode
};
