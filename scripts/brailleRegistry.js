"use strict";

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

function makeItem(id, announceText, dots, modes, standardKey = null) {
	return {
		id,
		modeTags: modes,
		displayLabel: id,
		announceText,
		dots,
		dotMask: dotsToMask(dots),
		perkinsKeys: dotsToPerkinsKeys(dots),
		standardKey
	};
}

const grade1Letters = [
	makeItem("a","a",[1],["grade1Letters","grade1LettersNumbers"],"a"),
	makeItem("b","b",[1,2],["grade1Letters","grade1LettersNumbers"],"b"),
	makeItem("c","c",[1,4],["grade1Letters","grade1LettersNumbers"],"c"),
	makeItem("d","d",[1,4,5],["grade1Letters","grade1LettersNumbers"],"d"),
	makeItem("e","e",[1,5],["grade1Letters","grade1LettersNumbers"],"e"),
	makeItem("f","f",[1,2,4],["grade1Letters","grade1LettersNumbers"],"f"),
	makeItem("g","g",[1,2,4,5],["grade1Letters","grade1LettersNumbers"],"g"),
	makeItem("h","h",[1,2,5],["grade1Letters","grade1LettersNumbers"],"h"),
	makeItem("i","i",[2,4],["grade1Letters","grade1LettersNumbers"],"i"),
	makeItem("j","j",[2,4,5],["grade1Letters","grade1LettersNumbers"],"j"),
	makeItem("k","k",[1,3],["grade1Letters","grade1LettersNumbers"],"k"),
	makeItem("l","l",[1,2,3],["grade1Letters","grade1LettersNumbers"],"l"),
	makeItem("m","m",[1,3,4],["grade1Letters","grade1LettersNumbers"],"m"),
	makeItem("n","n",[1,3,4,5],["grade1Letters","grade1LettersNumbers"],"n"),
	makeItem("o","o",[1,3,5],["grade1Letters","grade1LettersNumbers"],"o"),
	makeItem("p","p",[1,2,3,4],["grade1Letters","grade1LettersNumbers"],"p"),
	makeItem("q","q",[1,2,3,4,5],["grade1Letters","grade1LettersNumbers"],"q"),
	makeItem("r","r",[1,2,3,5],["grade1Letters","grade1LettersNumbers"],"r"),
	makeItem("s","s",[2,3,4],["grade1Letters","grade1LettersNumbers"],"s"),
	makeItem("t","t",[2,3,4,5],["grade1Letters","grade1LettersNumbers"],"t"),
	makeItem("u","u",[1,3,6],["grade1Letters","grade1LettersNumbers"],"u"),
	makeItem("v","v",[1,2,3,6],["grade1Letters","grade1LettersNumbers"],"v"),
	makeItem("w","w",[2,4,5,6],["grade1Letters","grade1LettersNumbers"],"w"),
	makeItem("x","x",[1,3,4,6],["grade1Letters","grade1LettersNumbers"],"x"),
	makeItem("y","y",[1,3,4,5,6],["grade1Letters","grade1LettersNumbers"],"y"),
	makeItem("z","z",[1,3,5,6],["grade1Letters","grade1LettersNumbers"],"z")
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
	makeItem("of","of",[1,2,3,5,6],["grade2Symbols"]),
	makeItem("with","with",[2,3,4,5,6],["grade2Symbols"]),
	makeItem("and","and",[1,2,3,4,6],["grade2Symbols"]),
	makeItem("for","for",[1,2,3,4,5,6],["grade2Symbols"]),
	makeItem("the","the",[2,3,4,6],["grade2Symbols"])
];

const grade2Words = [
	makeItem("but","but",[1,2],["grade2Words"]),
	makeItem("can","can",[1,4],["grade2Words"]),
	makeItem("do","do",[1,4,5],["grade2Words"]),
	makeItem("every","every",[1,5],["grade2Words"]),
	makeItem("from","from",[1,2,4],["grade2Words"]),
	makeItem("go","go",[1,2,4,5],["grade2Words"]),
	makeItem("have","have",[1,2,5],["grade2Words"]),
	makeItem("just","just",[2,4,5],["grade2Words"]),
	makeItem("knowledge","knowledge",[1,3,4,5],["grade2Words"]),
	makeItem("like","like",[1,2,3],["grade2Words"]),
	makeItem("more","more",[1,3,4],["grade2Words"]),
	makeItem("not","not",[1,3,4,5],["grade2Words"]),
	makeItem("people","people",[1,2,3,4],["grade2Words"]),
	makeItem("quite","quite",[1,2,3,4,5],["grade2Words"]),
	makeItem("rather","rather",[1,2,3,5],["grade2Words"]),
	makeItem("so","so",[2,3,4],["grade2Words"]),
	makeItem("that","that",[2,3,4,5],["grade2Words"]),
	makeItem("us","us",[1,3,6],["grade2Words"]),
	makeItem("very","very",[1,2,3,6],["grade2Words"]),
	makeItem("will","will",[2,4,5,6],["grade2Words"]),
	makeItem("it","it",[1,3,4,6],["grade2Words"]),
	makeItem("you","you",[1,3,4,5,6],["grade2Words"]),
	makeItem("as","as",[1,3,5,6],["grade2Words"]),
	makeItem("this","this",[1,4,5,6],["grade2Words"]),
	makeItem("which","which",[1,5,6],["grade2Words"]),
	makeItem("child","child",[1,6],["grade2Words"]),
	makeItem("shall","shall",[1,4,6],["grade2Words"])
];

const brailleRegistry = [
	...grade1Letters,
	...grade1Numbers,
	...grade2Symbols,
	...grade2Words
];

function getBrailleItemsForMode(modeId) {
	return brailleRegistry.filter(item => item.modeTags.includes(modeId));
}

export {
	brailleRegistry,
	getBrailleItemsForMode
};
