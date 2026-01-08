"use strict";

const prizeCatalog = [
	{
		id: "tier1_invisibleMole",
		label: "One Invisible Stuffed Mole",
		minTickets: 0,
		maxTickets: 9,
		category: "joke"
	},
{
	id: "tier1_leftSock",
	label: "One Left Sock (The Right One Is Missing)",
	minTickets: 0,
	maxTickets: 9,
	category: "absurd"
},
{
	id: "tier1_encouragingNod",
	label: "An Encouraging Nod From the Arcade Manager",
	minTickets: 0,
	maxTickets: 9,
	category: "encouragement"
},
{
	id: "tier1_fingerTrap",
	label: "A slightly broken Chinese Finger Trap",
	minTickets: 0,
	maxTickets: 9,
	category: "joke"
},
{
	id: "tier1_practiceRound",
	label: "Permission to Claim That Was a Practice Round",
	minTickets: 0,
	maxTickets: 9,
	category: "meta"
},
{
	id: "tier1_buttonMash",
	label: "A keyboard key You Definitely Pressed Too Hard",
	minTickets: 0,
	maxTickets: 9,
	category: "absurd"
},
	{
		id: "tier1_nothingCoupon",
		label: "A Coupon for Absolutely Nothing",
		minTickets: 0,
		maxTickets: 9,
		category: "joke"
	},
	{
		id: "tier1_imaginaryTickets",
		label: "A Pocket Full of Imaginary Tickets",
		minTickets: 0,
		maxTickets: 9,
		category: "joke"
	},
	{
		id: "tier1_tryingCertificate",
		label: "A Certificate of Trying Your Best",
		minTickets: 0,
		maxTickets: 9,
		category: "encouragement"
	},
	{
		id: "tier1_arcadeToken",
		label: "One Slightly Used Arcade Token (Non-Refundable)",
		minTickets: 0,
		maxTickets: 9,
		category: "joke"
	},
	{
		id: "tier1_niceTry",
		label: "A Whispered Nice Try From the Machine",
		minTickets: 0,
		maxTickets: 9,
		category: "encouragement"
	},
	{
		id: "tier1_highFive",
		label: "A Virtual High Five",
		minTickets: 0,
		maxTickets: 9,
		category: "encouragement"
	},
	{
		id: "tier1_gotAway",
		label: "One Mole That Definitely Got Away",
		minTickets: 0,
		maxTickets: 9,
		category: "joke"
	},
	{
		id: "tier1_whiff",
		label: "A Commemorative Whiff Sound",
		minTickets: 0,
		maxTickets: 9,
		category: "joke"
	},
	{
		id: "tier1_noScreenshot",
		label: "A Screenshot You Can't Take",
		minTickets: 0,
		maxTickets: 9,
		category: "absurd"
	},
	{
		id: "tier1_mysteryPrize",
		label: "A Mystery Prize (It's This One)",
		minTickets: 0,
		maxTickets: 9,
		category: "joke"
	},
	{
		id: "tier1_bigButton",
		label: "A Button That Does Nothing (But It's Big)",
		minTickets: 0,
		maxTickets: 9,
		category: "absurd"
	},
	{
		id: "tier1_patOnBack",
		label: "A Digitally Rendered Pat on the Back",
		minTickets: 0,
		maxTickets: 9,
		category: "encouragement"
	},
	{
		id: "tier1_sticker",
		label: "A Sticker You Can't Peel",
		minTickets: 0,
		maxTickets: 9,
		category: "absurd"
	},
	{
		id: "tier1_receiptShrug",
		label: "A Receipt That Says ¯\\_(ツ)_/¯",
		minTickets: 0,
		maxTickets: 9,
		category: "joke"
	},
	{
		id: "tier1_hatForHat",
		label: "A Hat for Your Other Hat",
		minTickets: 0,
		maxTickets: 9,
		category: "absurd"
	},
	{
		id: "tier1_closeFeeling",
		label: "The Feeling That You Were Close",
		minTickets: 0,
		maxTickets: 9,
		category: "encouragement"
	},
{
	id: "tier2_moleRespect",
	label: "The Mole's Reluctant Respect",
	minTickets: 10,
	maxTickets: 24,
	category: "brag"
},
{
	id: "tier2_secretHandshake",
	label: "A Secret Handshake You Almost Remember",
	minTickets: 10,
	maxTickets: 24,
	category: "joke"
},
{
	id: "tier2_certPart",
	label: "A Certificate of Participation",
	minTickets: 10,
	maxTickets: 24,
	category: "meta"
},
{
	id: "tier2_arcadeLore",
	label: "2 stuffed invisible moles",
	minTickets: 10,
	maxTickets: 24,
	category: "absurd"
},
{
	id: "tier2_confetti",
	label: "A Modest Amount of Digital Confetti",
	minTickets: 10,
	maxTickets: 24,
	category: "encouragement"
},
	{
		id: "tier2_roundChampion",
		label: "Official Arcade Champion (Of This Round Only)",
		minTickets: 10,
		maxTickets: 24,
		category: "brag"
	},
	{
		id: "tier2_moleWhistle",
		label: "A Golden Mole Whistle",
		minTickets: 10,
		maxTickets: 24,
		category: "joke"
	},
	{
		id: "tier2_lastTicket",
		label: "The Last Ticket Before the Good Stuff",
		minTickets: 10,
		maxTickets: 24,
		category: "meta"
	},
	{
		id: "tier2_popcorn",
		label: "A Bag of Hypothetical Popcorn",
		minTickets: 10,
		maxTickets: 24,
		category: "absurd"
	},
	{
		id: "tier2_escapeDot",
		label: "One Braille Dot That Escaped",
		minTickets: 10,
		maxTickets: 24,
		category: "joke"
	},
	{
		id: "tier2_signedPortrait",
		label: "A Signed Portrait of the Mole (Signature Illegible)",
		minTickets: 10,
		maxTickets: 24,
		category: "joke"
	},
	{
		id: "tier2_badge",
		label: "A Totally Legit Winner Badge",
		minTickets: 10,
		maxTickets: 24,
		category: "brag"
	},
	{
		id: "tier2_bragCoupon",
		label: "A Coupon for Free Bragging Rights",
		minTickets: 10,
		maxTickets: 24,
		category: "brag"
	},
	{
		id: "tier2_soundOfVictory",
		label: "The Sound of Victory (In Your Head)",
		minTickets: 10,
		maxTickets: 24,
		category: "absurd"
	},
	{
		id: "tier2_hiddenMap",
		label: "A Map to Where the Mole Hid",
		minTickets: 10,
		maxTickets: 24,
		category: "joke"
	},
	{
		id: "tier2_ribbon",
		label: "A Digital Ribbon That Says Hey, Not Bad",
		minTickets: 10,
		maxTickets: 24,
		category: "encouragement"
	},
{
	id: "tier3_whackDiploma",
	label: "An Official Diploma in Advanced Whacking",
	minTickets: 25,
	maxTickets: 49,
	category: "title"
},
{
	id: "tier3_moleUnion",
	label: "Notice That the Moles Are Considering Unionizing",
	minTickets: 25,
	maxTickets: 49,
	category: "joke"
},
{
	id: "tier3_arcadeJacket",
	label: "A braille-bedazzled Jacket That Definitely Says Arcade Legend",
	minTickets: 25,
	maxTickets: 49,
	category: "brag"
},
{
	id: "tier3_focusAura",
	label: "A Faint Aura of Intense Typing Focus",
	minTickets: 25,
	maxTickets: 49,
	category: "encouragement"
},
{
	id: "tier3_trophyShelf",
	label: "A Shelf to Hold All Your Imaginary Trophies",
	minTickets: 25,
	maxTickets: 49,
	category: "absurd"
},
	{
		id: "tier3_whackologist",
		label: "Certified Braille Whackologist",
		minTickets: 25,
		maxTickets: 49,
		category: "title"
	},
	{
		id: "tier3_warpedCane",
		label: "A SLightly Warped White Cane",
		minTickets: 25,
		maxTickets: 49,
		category: "absurd"
	},
	{
		id: "tier3_goldTrophy",
		label: "A Solid Gold Imaginary Trophy",
		minTickets: 25,
		maxTickets: 49,
		category: "brag"
	},
	{
		id: "tier3_bigKeys",
		label: "The Keys to the Arcade (Do Not Duplicate)",
		minTickets: 25,
		maxTickets: 49,
		category: "brag"
	},
	{
		id: "tier3_confidenceBag",
		label: "A Bag of Premium Confidence",
		minTickets: 25,
		maxTickets: 49,
		category: "encouragement"
	},
	{
		id: "tier3_resignation",
		label: "The Mole's Resignation Letter",
		minTickets: 25,
		maxTickets: 49,
		category: "joke"
	},
	{
		id: "tier3_bigTrophy",
		label: "A Trophy That's Way Too Big",
		minTickets: 25,
		maxTickets: 49,
		category: "absurd"
	},
	{
		id: "tier3_fidget",
		label: "A Nifty Fidget Spinner",
		minTickets: 25,
		maxTickets: 49,
		category: "absurd"
	},
{
	id: "tier4_arcadeMyth",
	label: "Arcade Myth Status (Stories May Be Exaggerated)",
	minTickets: 50,
	maxTickets: 99,
	category: "legend"
},
{
	id: "tier4_moleStrategy",
	label: "3 Invisible Stuffed Moles",
	minTickets: 50,
	maxTickets: 99,
	category: "absurd"
},
{
	id: "tier4_applauseTrack",
	label: "A Looping Applause Track That Follows You",
	minTickets: 50,
	maxTickets: 99,
	category: "brag"
},
{
	id: "tier4_finalBossEnergy",
	label: "Noticeable Final Boss Energy",
	minTickets: 50,
	maxTickets: 99,
	category: "title"
},
{
	id: "tier4_nfbChcikenEnergy",
	label: "Delicious NFB Banquet Rubber Chicken",
	minTickets: 50,
	maxTickets: 99,
	category: "title"
},
	{
		id: "tier4_grandMaster",
		label: "Grand Master of the Whack Arts",
		minTickets: 50,
		maxTickets: 99,
		category: "title"
	},
	{
		id: "tier4_moleCommander",
		label: "Supreme Mole Commander",
		minTickets: 50,
		maxTickets: 99,
		category: "title"
	},
	{
		id: "tier4_hallOfFame",
		label: "A Hall of Fame Induction (Unofficial)",
		minTickets: 50,
		maxTickets: 99,
		category: "brag"
	},
	{
		id: "tier4_slowClap",
		label: "A Dramatic Slow Clap (Looping)",
		minTickets: 50,
		maxTickets: 99,
		category: "absurd"
	},
{
	id: "tier5_arcadeImmortal",
	label: "Permanent Arcade Immortality (Locally Recognized)",
	minTickets: 100,
	maxTickets: null,
	category: "legend"
},
{
	id: "tier5_molePeaceTreaty",
	label: "A Historic Peace Treaty With the Moles",
	minTickets: 100,
	maxTickets: null,
	category: "legend"
},
{
	id: "tier5_infiniteTickets",
	label: "Infinite Tickets That You Are Asked Not to Redeem",
	minTickets: 100,
	maxTickets: null,
	category: "legend"
},
{
	id: "tier5_pileOfMoles",
	label: "A Considerable Pile of Invisible Stuffed Moles",
	minTickets: 100,
	maxTickets: null,
	category: "legend"
},
	{
		id: "tier5_eternalGlory",
		label: "Eternal Arcade Glory",
		minTickets: 100,
		maxTickets: null,
		category: "legend"
	},
	{
		id: "tier5_moleKing",
		label: "The Mole King's Crown",
		minTickets: 100,
		maxTickets: null,
		category: "legend"
	},
	{
		id: "tier5_verifiedLegend",
		label: "A Legend Status That No One Can Verify",
		minTickets: 100,
		maxTickets: null,
		category: "legend"
	},
	{
		id: "tier5_finalWow",
		label: "A Plaque That Just Says Wow",
		minTickets: 100,
		maxTickets: null,
		category: "legend"
	},
	{
		id: "tier5_brava",
		label: "A Shiny Brava Oven filled with Chicken Nuggets",
		minTickets: 100,
		maxTickets: null,
		category: "legend"
	},
	{
		id: "tier5_brlStylus",
		label: "Louis Braille's Original Stylus",
		minTickets: 100,
		maxTickets: null,
		category: "legend"
	},
	{
		id: "tier5_microbraille",
		label: "A Japanese MicroBraille Slate",
		minTickets: 100,
		maxTickets: null,
		category: "legend"
	},
	{
		id: "tier5_3Dpuzzle",
		label: "A Challenging 3D Wave Puzzle",
		minTickets: 100,
		maxTickets: null,
		category: "legend"
	}
];

export { prizeCatalog };
