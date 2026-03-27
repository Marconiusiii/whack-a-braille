"use strict";

const prizeCatalog = [
	{
		id: "tier1_invisibleMole",
		label: "One Invisible Stuffed Mole",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "Soft, silent, and impossible to display incorrectly, this invisible plush is a classic starter reward for players with excellent imagination."
	},
	{
		id: "tier1_missedOpportunity",
		label: "A Missed Opportunity You Will Think About Later",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "This prize lingers in the mind with the exact same stubborn energy as the mole you swear you almost hit."
	},
	{
		id: "tier1_extraKey",
		label: "A Key That Does Not Belong to Anything",
		minTickets: 0,
		maxTickets: 9,
		category: "absurd",
		flavorText: "Cold in the hand and rich with mystery, this key opens no doors while suggesting that it absolutely should."
	},
	{
		id: "tier1_loadingBar",
		label: "A Loading Bar That Never Quite Finishes",
		minTickets: 0,
		maxTickets: 9,
		category: "meta",
		flavorText: "Loading... Loading... Loading... Forever 98% away from learning what this prize could actually be."
	},
	{
		id: "tier1_unlabeledButton",
		label: "An Unlabeled Button",
		minTickets: 0,
		maxTickets: 9,
		category: "meta",
		flavorText: "It sits there with perfect confidence, offering infinite possibility and absolutely no instructions nor context."
	},
	{
		id: "tier1_pocketSand",
		label: "Pocket Sand!",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "Perfect for making sudden, panicked getaways!"
	},
	{
		id: "tier1_sandwich",
		label: "A Ham Sandwich (partially eaten)",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "Tasty, but was probably the Arcade manager's lunch before he got called away to clean up after the moles."
	},
	{
		id: "tier1_slap",
		label: "A Slap Bracelet that Slaps Back",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "The 90s wrapped around your wrist, just beware of the pinching!"
	},
	{
		id: "tier1_arcadePizza",
		label: "Lukewarm Arcade Pizza",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "The grease just helps you slip faster across all the arcade game controls."
	},
	{
		id: "tier1_leftSock",
		label: "One Left Sock (The Right One Is Missing)",
		minTickets: 0,
		maxTickets: 9,
		category: "absurd",
		flavorText: "The moles totally stole the other sock, go get it back!"
	},
	{
		id: "tier1_encouragingNod",
		label: "An Encouraging Nod From the Arcade Manager",
		minTickets: 0,
		maxTickets: 9,
		category: "encouragement",
		flavorText: "The respect you deserve after getting through that last round."
	},
	{
		id: "tier1_fingerTrap",
		label: "A slightly broken Chinese Finger Trap",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "Once both fingers are in, there's no escape, at least until you pull the tattered woven paper apart."
	},
	{
		id: "tier1_practiceRound",
		label: "Permission to Claim That Was a Practice Round",
		minTickets: 0,
		maxTickets: 9,
		category: "meta",
		flavorText: "The other players waiting their turn will surely understand."
	},
	{
		id: "tier1_buttonMash",
		label: "A keyboard key You Definitely Pressed Too Hard",
		minTickets: 0,
		maxTickets: 9,
		category: "absurd",
		flavorText: "So it's slightly lower than all the other keys, and sticks whenever you hit it, but still a sign of a job well done against the moles!"
	},
	{
		id: "tier1_nothingCoupon",
		label: "A Coupon for Absolutely Nothing",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "It's truly the thought that counts!"
	},
	{
		id: "tier1_imaginaryTickets",
		label: "A Pocket Full of Imaginary Tickets",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "Somehow turning nothing into something truly aspirational."
	},
	{
		id: "tier1_tryingCertificate",
		label: "A Certificate of Trying Your Best",
		minTickets: 0,
		maxTickets: 9,
		category: "encouragement",
		flavorText: "Think of it as a gentle pat on the back with better shelf presence."
	},
	{
		id: "tier1_arcadeToken",
		label: "One Slightly Used Arcade Token (Non-Refundable)",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "Slightly scratched, the lettering almost entirely rubbed off, but still ready for another trip through an arcade game. What a trooper!"
	},
	{
		id: "tier1_niceTry",
		label: "A Whispered Nice Try From the Machine",
		minTickets: 0,
		maxTickets: 9,
		category: "encouragement",
		flavorText: "A prize perfect for a player who thinks all the people around them heard the same thing."
	},
	{
		id: "tier1_highFive",
		label: "A Virtual High Five",
		minTickets: 0,
		maxTickets: 9,
		category: "encouragement",
		flavorText: "Crisp, encouraging, and completely hygienic, this prize will never leave you hangin'!"
	},
	{
		id: "tier1_gotAway",
		label: "One Mole That Definitely Got Away",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "Once he gets back in the game, you'll nail him in the next round."
	},
	{
		id: "tier1_whiff",
		label: "A Commemorative Whiff Sound",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "Perfect for playing back whenever you think about all those moles you didn't whack."
	},
	{
		id: "tier1_noScreenshot",
		label: "A Screenshot You Can't Take",
		minTickets: 0,
		maxTickets: 9,
		category: "absurd",
		flavorText: "This will live on in your memory, just not in the computer's memory."
	},
	{
		id: "tier1_mysteryPrize",
		label: "A Mystery Prize (It's This One)",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "So absolutely mysterious that even its name will not give it away!"
	},
	{
		id: "tier1_bigButton",
		label: "A Button That Does Nothing (But It's Big)",
		minTickets: 0,
		maxTickets: 9,
		category: "absurd",
		flavorText: "Will take up a good amount of space on your shelf and will wow others with its bigness."
	},
	{
		id: "tier1_patOnBack",
		label: "A Digitally Rendered Pat on the Back",
		minTickets: 0,
		maxTickets: 9,
		category: "encouragement",
		flavorText: "Virtually perfect when in need of virtual comfort."
	},
	{
		id: "tier1_sticker",
		label: "A Sticker You Can't Peel",
		minTickets: 0,
		maxTickets: 9,
		category: "absurd",
		flavorText: "Why won't it just peel?! I give up, where's the tape?"
	},
	{
		id: "tier1_gumball",
		label: "A Gumball that is actually a Jawbreaker",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "5 out of 5 dentists do not recommend this."
	},
	{
		id: "tier1_hatForHat",
		label: "A Hat for Your Other Hat",
		minTickets: 0,
		maxTickets: 9,
		category: "absurd",
		flavorText: "One can always use more hats!"
	},
	{
		id: "tier1_closeFeeling",
		label: "The Feeling That You Were Close",
		minTickets: 0,
		maxTickets: 9,
		category: "encouragement",
		flavorText: "You can wear this around your shoulders while counting how many points you were behind the high score."
	},
	{
		id: "tier1_interimDeputy",
		label: "A Paper Crown That Declares You Interim Mole Deputy",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "Eerily similar to a paper crown given out by a local burger chain, just with a gold star stuck to the front."
	},
	{
		id: "tier1_complimentaryOops",
		label: "One Complimentary Oops",
		minTickets: 0,
		maxTickets: 9,
		category: "meta",
		flavorText: "Turn this in to try something out again for free!"
	},
	{
		id: "tier1_participationTrophy",
		label: "A Tiny Trophy Made Entirely of Participation",
		minTickets: 0,
		maxTickets: 9,
		category: "encouragement",
		flavorText: "Small enough to fit in your palm and humble enough to know exactly why you got it."
	},
	{
		id: "tier1_baggedAir",
		label: "Arcade Air (Freshly Bagged)",
		minTickets: 0,
		maxTickets: 9,
		category: "absurd",
		flavorText: "A crinkly bag of authentic arcade atmosphere, complete with notes of carpet, pizza metallic tokens, and overworked ticket motors."
	},
	{
		id: "tier1_bentStraw",
		label: "A Slightly Bent Victory Straw",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "It used to be straight, but victory apparently got there first and sat on it."
	},
	{
		id: "tier1_niceEffortReceipt",
		label: "A Receipt That Just Says Nice Effort",
		minTickets: 0,
		maxTickets: 9,
		category: "encouragement",
		flavorText: "No total, no signature, no itemized charges. Just a tiny strip of paper confirming that you gave it a real shot."
	},
	{
		id: "tier1_borrowedLuck",
		label: "One Borrowed Luck (Return by Midnight)",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "Use it wisely and do not get attached."
	},
	{
		id: "tier1_lastFry",
		label: "The Last French Fry in the Building",
		minTickets: 0,
		maxTickets: 9,
		category: "absurd",
		flavorText: "Cold, heroic, and found under circumstances no one should ask about."
	},
	{
		id: "tier1_staleGroundCoffee",
		label: "A half-empty bag of stale ground coffee",
		minTickets: 0,
		maxTickets: 9,
		category: "joke",
		flavorText: "Pulled from the Assistant Manager's locker, the aroma promises motivation. The taste promises consequences."
	},
	{
		id: "tier2_nearWin",
		label: "Official Recognition of Being Very Close",
		minTickets: 10,
		maxTickets: 24,
		category: "encouragement",
		flavorText: "Suitable for display whenever you want proof that 'almost' should count a little more."
	},
	{
		id: "tier2_arcadeMap",
		label: "A Tactile Map of the Arcade (Not to Scale)",
		minTickets: 10,
		maxTickets: 24,
		category: "absurd",
		flavorText: "Feel around and find out how to get back to the Whack A Braille game."
	},
	{
		id: "tier2_spokenLegend",
		label: "A Rumor That You Are Pretty Good at This",
		minTickets: 10,
		maxTickets: 24,
		category: "brag",
		flavorText: "No one will say exactly who started it, which only makes it sound more impressive."
	},
	{
		id: "tier2_moleRespect",
		label: "The Mole's Reluctant Respect",
		minTickets: 10,
		maxTickets: 24,
		category: "brag",
		flavorText: "Hard earned, grudgingly granted, and worth twice as much because the moles hated giving it to you."
	},
	{
		id: "tier2_secretHandshake",
		label: "A Secret Handshake You Almost Remember",
		minTickets: 10,
		maxTickets: 24,
		category: "joke",
		flavorText: "You have the first part, just about have the last part, and a very confident guess about the middle that leads to perpetual awkwardness."
	},
	{
		id: "tier2_abacus",
		label: "A Tactile Abacus that's missing some beads",
		minTickets: 10,
		maxTickets: 24,
		category: "joke",
		flavorText: "Still useful for counting, provided you enjoy a little improvisation in your arithmetic."
	},
	{
		id: "tier2_certPart",
		label: "A Certificate of Participation",
		minTickets: 10,
		maxTickets: 24,
		category: "meta",
		flavorText: "Printed on respectable paper with the exact energy of an award handed out five minutes before closing."
	},
	{
		id: "tier2_2stuffedmoles",
		label: "2 stuffed invisible moles",
		minTickets: 10,
		maxTickets: 24,
		category: "absurd",
		flavorText: "Twice the invisible fluff and cuddliness, twice the shelf space somehow taken up."
	},
	{
		id: "tier2_confetti",
		label: "A Modest Amount of Digital Confetti",
		minTickets: 10,
		maxTickets: 24,
		category: "encouragement",
		flavorText: "Not enough to make a mess, but plenty enough to suggest that something nice just happened."
	},
	{
		id: "tier2_slinky",
		label: "A Slightly Tangled Slinky",
		minTickets: 10,
		maxTickets: 24,
		category: "meta",
		flavorText: "It still wants to be majestic. It just needs several minutes, patience, and maybe an engineering team."
	},
	{
		id: "tier2_roundChampion",
		label: "Official Arcade Champion (Of This Round Only)",
		minTickets: 10,
		maxTickets: 24,
		category: "brag",
		flavorText: "A glorious temporary title that expires the second someone else has a better turn."
	},
	{
		id: "tier2_moleWhistle",
		label: "A Golden Mole Whistle",
		minTickets: 10,
		maxTickets: 24,
		category: "joke",
		flavorText: "One sharp blow on this and every mole within earshot pretends not to hear you."
	},
	{
		id: "tier2_lastTicket",
		label: "The Last Ticket Before the Good Stuff",
		minTickets: 10,
		maxTickets: 24,
		category: "meta",
		flavorText: "A tiny paper reminder that the prize you really wanted was just one decent round away."
	},
	{
		id: "tier2_popcorn",
		label: "A Bag of Hypothetical Popcorn",
		minTickets: 10,
		maxTickets: 24,
		category: "absurd",
		flavorText: "Zero kernels, maximum movie-theater optimism. Real fake butter not included."
	},
	{
		id: "tier2_escapeDot",
		label: "One Braille Dot That Escaped",
		minTickets: 10,
		maxTickets: 24,
		category: "joke",
		flavorText: "It was last seen rolling under the machine with a tiny suitcase and a plan. Definitely an A for effort!"
	},
	{
		id: "tier2_signedPortrait",
		label: "A Signed Portrait of the Mole (Signature Illegible)",
		minTickets: 10,
		maxTickets: 24,
		category: "joke",
		flavorText: "The portrait is smug, the autograph is nonsense, and the frame is somehow still flattering."
	},
	{
		id: "tier2_badge",
		label: "A Totally Legit Winner Badge",
		minTickets: 10,
		maxTickets: 24,
		category: "brag",
		flavorText: "Shiny enough to start conversations and official enough that no one should look too closely."
	},
	{
		id: "tier2_bragCoupon",
		label: "A Coupon for Free Bragging Rights",
		minTickets: 10,
		maxTickets: 24,
		category: "brag",
		flavorText: "Redeemable anywhere confidence is accepted as payment."
	},
	{
		id: "tier2_soundOfVictory",
		label: "The Sound of Victory (In Your Head)",
		minTickets: 10,
		maxTickets: 24,
		category: "absurd",
		flavorText: "Impossible to record, impossible to prove, and somehow playing at full volume anyway."
	},
	{
		id: "tier2_slurpee",
		label: "A Slightly Melted Arcade Slurpee",
		minTickets: 10,
		maxTickets: 24,
		category: "joke",
		flavorText: "Solid sugar energy provided in a more liquid form. Beware of brain freeze!"
	},
	{
		id: "tier2_ribbon",
		label: "A Digital Ribbon That Says Hey, Not Bad",
		minTickets: 10,
		maxTickets: 24,
		category: "encouragement",
		flavorText: "A perfect middle ground between wild celebration and a polite nod of approval."
	},
	{
		id: "tier2_moodRing",
		label: "A Groovy Mood Ring",
		minTickets: 10,
		maxTickets: 24,
		category: "meta",
		flavorText: "No matter what color it turns, it somehow still says you should play another round."
	},
	{
		id: "tier2_8ball",
		label: "An Empty Magic 8-Ball",
		minTickets: 10,
		maxTickets: 24,
		category: "meta",
		flavorText: "All signs point to ask again later, because there is literally nothing in there."
	},
	{
		id: "tier2_wafers",
		label: "Slightly Smooshed Necco Wafers",
		minTickets: 10,
		maxTickets: 24,
		category: "meta",
		flavorText: "A candy reward with the texture of chalk and the confidence of a survivor."
	},
	{
		id: "tier2_guideDogParking",
		label: "Validated Guide Dog Parking",
		minTickets: 10,
		maxTickets: 24,
		category: "meta",
		flavorText: "Free dog beds, water, and space where they can make good choices while patiently waiting for you to finish playing games."
	},
	{
		id: "tier2_foamPlane",
		label: "A Fragile Foam Model Plane",
		minTickets: 10,
		maxTickets: 24,
		category: "meta",
		flavorText: "It looks fast sitting still and catastrophic the moment anyone gets ambitious."
	},
	{
		id: "tier2_wristband",
		label: "Limited-Edition Almost-Champion Wristband",
		minTickets: 10,
		maxTickets: 24,
		category: "brag",
		flavorText: "Wear it proudly while explaining that history was robbed by only a few moles."
	},
	{
		id: "tier2_dotCoin",
		label: "A Commemorative Dot Pattern Coin (Value: Emotional)",
		minTickets: 10,
		maxTickets: 24,
		category: "absurd",
		flavorText: "It will buy you nothing except fond feelings and a dramatic pocket rattle."
	},
	{
		id: "tier2_nda",
		label: "Mole-Signed Non-Disclosure Agreement",
		minTickets: 10,
		maxTickets: 24,
		category: "meta",
		flavorText: "Legally binding only if mole handwriting holds up in court."
	},
	{
		id: "tier2_vipPass",
		label: "Arcade VIP Line Pass (Line Not Currently Available)",
		minTickets: 10,
		maxTickets: 24,
		category: "meta",
		flavorText: "A premium express pass for an experience that has not yet developed enough demand to need one."
	},
	{
		id: "tier2_snackBreak",
		label: "A Tactical Snack Break Token",
		minTickets: 10,
		maxTickets: 24,
		category: "joke",
		flavorText: "Best deployed between rounds, preferably before your hands start trying to type on instinct alone."
	},
	{
		id: "tier2_bragPlus",
		label: "Bronze-Level Bragging Rights Plus",
		minTickets: 10,
		maxTickets: 24,
		category: "brag",
		flavorText: "Regular bragging rights with just enough extra shine to justify repeating the story."
	},
	{
		id: "tier2_replayExcuse",
		label: "One Deluxe Replay Excuse",
		minTickets: 10,
		maxTickets: 24,
		category: "joke",
		flavorText: "Ideal for moments when you absolutely need another shot and prefer not to call it that."
	},
	{
		id: "tier2_legendStarter",
		label: "A Pocket-Sized Legend Starter Kit",
		minTickets: 10,
		maxTickets: 24,
		category: "encouragement",
		flavorText: "Small enough to fit in a pocket, yet somehow still packed with the swagger of a player who expects applause on arrival."
	},
	{
		id: "tier2_burntBeans",
		label: "A Bag of Slightly Burnt Coffee Beans",
		minTickets: 10,
		maxTickets: 24,
		category: "joke",
		flavorText: "Each bean carries a smoky note of determination and one poor timing decision."
	},
	{
		id: "tier2_gnawedEspressoBeans",
		label: "Espresso Beans gnawed on by the mole (slightly)",
		minTickets: 10,
		maxTickets: 24,
		category: "joke",
		flavorText: "Proof that the mole got to them first and still could not finish the job."
	},
	{
		id: "tier3_moleHistorian",
		label: "Official Mole Historian Certification",
		minTickets: 25,
		maxTickets: 49,
		category: "title",
		flavorText: "You no longer just whack moles. You preserve the record, annotate the chaos, and cite your sources."
	},
	{
		id: "tier3_arcadeCape",
		label: "A Flowing Arcade Champion Cape",
		minTickets: 25,
		maxTickets: 49,
		category: "brag",
		flavorText: "It swishes dramatically every time you remember your best streak."
	},
	{
		id: "tier3_focusBadge",
		label: "A Badge That Radiates Focus",
		minTickets: 25,
		maxTickets: 49,
		category: "encouragement",
		flavorText: "Pin it on and suddenly everyone assumes you have a plan."
	},
	{
		id: "tier3_couponPile",
		label: "A Whole Pile of Food Court Coupons",
		minTickets: 25,
		maxTickets: 49,
		category: "encouragement",
		flavorText: "Individually underwhelming, collectively powerful, and all expiring at inconvenient times."
	},
	{
		id: "tier3_whackDiploma",
		label: "An Official Diploma in Advanced Whacking",
		minTickets: 25,
		maxTickets: 49,
		category: "title",
		flavorText: "A serious academic document for a skill set that sounds made up until you demonstrate it."
	},
	{
		id: "tier3_moleUnion",
		label: "Notice That the Moles Are Considering Unionizing",
		minTickets: 25,
		maxTickets: 49,
		category: "joke",
		flavorText: "Apparently your work ethic has become a labor issue underground."
	},
	{
		id: "tier3_arcadeJacket",
		label: "A braille-bedazzled Jacket That Definitely Says Arcade Legend",
		minTickets: 25,
		maxTickets: 49,
		category: "brag",
		flavorText: "Every rhinestone and dot pattern insists that subtlety was never the point."
	},
	{
		id: "tier3_focusAura",
		label: "A Faint Aura of Intense Typing Focus",
		minTickets: 25,
		maxTickets: 49,
		category: "encouragement",
		flavorText: "Most visible right before a good streak and right after someone says they were just getting lucky."
	},
	{
		id: "tier3_trophyShelf",
		label: "A Shelf to Hold All Your Imaginary Trophies",
		minTickets: 25,
		maxTickets: 49,
		category: "absurd",
		flavorText: "Finally, a proper place to display achievements too powerful or too ridiculous to remain visible."
	},
	{
		id: "tier3_goldSlinky",
		label: "A Golden Slinky",
		minTickets: 25,
		maxTickets: 49,
		category: "title",
		flavorText: "Too classy to throw down the stairs and far too tempting not to think about it."
	},
	{
		id: "tier3_dinos",
		label: "A Set of Non-Biting Toy Dinosaurs",
		minTickets: 25,
		maxTickets: 49,
		category: "title",
		flavorText: "Friendly enough for a shelf, fierce enough to keep smaller prizes in line."
	},
	{
		id: "tier3_petRock",
		label: "A Pet Rock (batteries not included)",
		minTickets: 25,
		maxTickets: 49,
		category: "title",
		flavorText: "Low maintenance, emotionally distant, and still somehow one of the more dependable prizes here."
	},
	{
		id: "tier3_jellyHat",
		label: "A Jellyfish that's a Hat",
		minTickets: 25,
		maxTickets: 49,
		category: "title",
		flavorText: "Wearing it is not recommended, but imagining the silhouette is absolutely worth your time."
	},
	{
		id: "tier3_hatJelly",
		label: "A Hat that's a Jellyfish",
		minTickets: 25,
		maxTickets: 49,
		category: "title",
		flavorText: "The constant stinging is worth the pretty glow!"
	},
	{
		id: "tier3_whackologist",
		label: "Certified Braille Whackologist",
		minTickets: 25,
		maxTickets: 49,
		category: "title",
		flavorText: "A deeply prestigious-sounding title for a very real skill you have definitely earned the hard way."
	},
	{
		id: "tier3_warpedCane",
		label: "A Slightly Warped White Cane",
		minTickets: 25,
		maxTickets: 49,
		category: "absurd",
		flavorText: "It has seen things, survived things, and now leans a little too far into character."
	},
	{
		id: "tier3_goldTrophy",
		label: "A Solid Gold Imaginary Trophy",
		minTickets: 25,
		maxTickets: 49,
		category: "brag",
		flavorText: "Worth a fortune in theory and still somehow impossible to pawn."
	},
	{
		id: "tier3_bigKeys",
		label: "The Keys to the Arcade (Do Not Duplicate)",
		minTickets: 25,
		maxTickets: 49,
		category: "brag",
		flavorText: "Heavy, official, and deeply tempting even if several of the locks are probably decorative."
	},
	{
		id: "tier3_confidenceBag",
		label: "A Bag of Premium Confidence",
		minTickets: 25,
		maxTickets: 49,
		category: "encouragement",
		flavorText: "Just a few handfuls of this and suddenly every mole seems extremely whackable."
	},
	{
		id: "tier3_resignation",
		label: "The Mole's Resignation Letter",
		minTickets: 25,
		maxTickets: 49,
		category: "joke",
		flavorText: "Short, bitter, and signed with the energy of someone who absolutely lost that round."
	},
	{
		id: "tier3_bigTrophy",
		label: "A Trophy That's Way Too Big",
		minTickets: 25,
		maxTickets: 49,
		category: "absurd",
		flavorText: "You did not measure the shelf, the hallway, or the doorway, and the trophy clearly did not either."
	},
	{
		id: "tier3_fidget",
		label: "A Nifty Fidget Spinner",
		minTickets: 25,
		maxTickets: 49,
		category: "absurd",
		flavorText: "A pocket-sized tornado of distraction for the kind of winner who prefers to keep their hands busy."
	},
	{
		id: "tier3_whackLicense",
		label: "Department of Whacking Professional License",
		minTickets: 25,
		maxTickets: 49,
		category: "title",
		flavorText: "Laminated authority for the seasoned mole specialist who deserves to flash credentials now and then."
	},
	{
		id: "tier3_patch",
		label: "Embroidered Jacket Patch: Dot Strike Specialist",
		minTickets: 25,
		maxTickets: 49,
		category: "title",
		flavorText: "Stitch it on anything and the garment immediately sounds more qualified."
	},
	{
		id: "tier3_nervousMoleCert",
		label: "Official Trainer of Nervous Moles Certificate",
		minTickets: 25,
		maxTickets: 49,
		category: "title",
		flavorText: "Apparently repeatedly whacking them counts as a teaching method."
	},
	{
		id: "tier3_focusGoggles",
		label: "Premium Focus Goggles (Vision Optional)",
		minTickets: 25,
		maxTickets: 49,
		category: "encouragement",
		flavorText: "They will not sharpen your eyesight, but they may sharpen your vibe."
	},
	{
		id: "tier3_goldPracticePass",
		label: "A Gold-Plated Practice Round Pass",
		minTickets: 25,
		maxTickets: 49,
		category: "meta",
		flavorText: "Luxury access to getting better, now with unnecessary but appreciated glamour."
	},
	{
		id: "tier3_commandWhistle",
		label: "Command Whistle of Tactical Bonking",
		minTickets: 25,
		maxTickets: 49,
		category: "brag",
		flavorText: "Blow it once and every nearby object feels like it should line up properly."
	},
	{
		id: "tier3_egoParking",
		label: "One Reserved Parking Space for Your Ego",
		minTickets: 25,
		maxTickets: 49,
		category: "absurd",
		flavorText: "Close to the entrance, dramatically oversized, and marked with your confidence in bold letters."
	},
	{
		id: "tier3_threatBanner",
		label: "Hallway Banner: Local Arcade Threat",
		minTickets: 25,
		maxTickets: 49,
		category: "brag",
		flavorText: "A full-length public warning that you have become a problem for the mole community."
	},
	{
		id: "tier3_lukewarmCoffee",
		label: "A lukewarm cup of coffee",
		minTickets: 25,
		maxTickets: 49,
		category: "joke",
		flavorText: "Not hot enough to wake you up, not cold enough to give up on, and somehow still exactly on brand."
	},
	{
		id: "tier3_allFoamCappuccino",
		label: "A Cappuccino that's All Foam",
		minTickets: 25,
		maxTickets: 49,
		category: "joke",
		flavorText: "A beautiful dome of airy optimism with almost no coffee hiding underneath. Foam mustache guaranteed."
	},
	{
		id: "tier4_arcadeOracle",
		label: "Arcade Oracle Status (Predictions Unreliable)",
		minTickets: 50,
		maxTickets: 99,
		category: "legend",
		flavorText: "You now speak with enough mystery that enthralled people listen first and verify later."
	},
	{
		id: "tier4_echoingName",
		label: "Your Name Echoed Dramatically Across the Arcade",
		minTickets: 50,
		maxTickets: 99,
		category: "absurd",
		flavorText: "A reward for players whose victories deserve acoustics and a startled pause from everyone nearby."
	},
	{
		id: "tier4_arcadeMyth",
		label: "Arcade Myth Status (Stories May Be Exaggerated)",
		minTickets: 50,
		maxTickets: 99,
		category: "legend",
		flavorText: "The facts are already getting fuzzy, which is how you know the legend is working."
	},
	{
		id: "tier4_3stuffedMoles",
		label: "3 Invisible Stuffed Moles",
		minTickets: 50,
		maxTickets: 99,
		category: "absurd",
		flavorText: "At this point you are not collecting plush, you are curating an invisible herd."
	},
	{
		id: "tier4_applauseTrack",
		label: "A Looping Applause Track That Follows You",
		minTickets: 50,
		maxTickets: 99,
		category: "brag",
		flavorText: "It starts the moment you enter the room and stops only when modesty finally wins."
	},
	{
		id: "tier4_finalBossEnergy",
		label: "Noticeable Final Boss Energy",
		minTickets: 50,
		maxTickets: 99,
		category: "title",
		flavorText: "No crown included, just the unmistakable feeling that everyone should prepare themselves."
	},
	{
		id: "tier4_nfbChicken",
		label: "Delicious NFB Banquet Rubber Chicken",
		minTickets: 50,
		maxTickets: 99,
		category: "title",
		flavorText: "Tough, stringy, and chewable only with extreme focus and effort, much like how you won."
	},
	{
		id: "tier4_grandMaster",
		label: "Grand Master of the Whack Arts",
		minTickets: 50,
		maxTickets: 99,
		category: "title",
		flavorText: "A title so large it practically arrives with its own ceremonial fanfare."
	},
	{
		id: "tier4_moleCommander",
		label: "Supreme Mole Commander",
		minTickets: 50,
		maxTickets: 99,
		category: "title",
		flavorText: "The chain of command is unclear, but somehow every mole knows your name now."
	},
	{
		id: "tier4_hallOfFame",
		label: "A Hall of Fame Induction (Unofficial)",
		minTickets: 50,
		maxTickets: 99,
		category: "brag",
		flavorText: "No committee, no plaque wall, just overwhelming confidence that your name belongs there."
	},
	{
		id: "tier4_slowClap",
		label: "A Dramatic Slow Clap (Looping)",
		minTickets: 50,
		maxTickets: 99,
		category: "absurd",
		flavorText: "It starts with one deliberate clap and keeps going until the room becomes about you."
	},
	{
		id: "tier4_vendingMachine",
		label: "4 Free Vending Machine Items (may get stuck)",
		minTickets: 50,
		maxTickets: 99,
		category: "absurd",
		flavorText: "A thrilling prize package with the exact amount of risk needed to stay interesting."
	},
	{
		id: "tier4_magicCane",
		label: "A Magical White Cane that Parts Crowds",
		minTickets: 50,
		maxTickets: 99,
		category: "absurd",
		flavorText: "At last, a mobility tool with a flair for dramatic entrances and suspiciously good personal space management."
	},
	{
		id: "tier4_hoot",
		label: "A Pin that says You're a Hoot!",
		minTickets: 50,
		maxTickets: 99,
		category: "absurd",
		flavorText: "This surely will attract your very own owly parliament of fellow hoots!"
	},
	{
		id: "tier4_pinballWizard",
		label: "Pinball Wizard Badge",
		minTickets: 50,
		maxTickets: 99,
		category: "title",
		flavorText: "Awarded to the rare player whose reflexes suggest they came out of the womb already listening for bonus multipliers."
	},
	{
		id: "tier4_continueToken",
		label: "Unlimited Continue Token",
		minTickets: 50,
		maxTickets: 99,
		category: "legend",
		flavorText: "A tiny coin with dangerously powerful emotional effects."
	},
	{
		id: "tier4_tokenWallet",
		label: "Golden Token Wallet",
		minTickets: 50,
		maxTickets: 99,
		category: "brag",
		flavorText: "For the player whose prize money deserves a home nicer than a pocket full of lint."
	},
	{
		id: "tier4_notFoamCappuccino",
		label: "A Cappuccino that's not mostly Foam",
		minTickets: 50,
		maxTickets: 99,
		category: "absurd",
		flavorText: "A rare and wondrous beverage that actually followed through on the coffee part. Foam mustache still guaranteed."
	},
	{
		id: "tier4_unlikeTeaDrink",
		label: "A Drink not quite entirely unlike tea.",
		minTickets: 50,
		maxTickets: 99,
		category: "absurd",
		flavorText: "Warm, suspicious, and just literary enough to feel expensive."
	},
	{
		id: "tier4_breakfastBlend",
		label: "The Mole's Breakfast Coffee Blend",
		minTickets: 50,
		maxTickets: 99,
		category: "joke",
		flavorText: "Roasted with the jittery urgency of something ground before dawn and hidden from the manager."
	},
	{
		id: "tier4_sillyMilkDrinks",
		label: "Silly milk drinks!",
		minTickets: 50,
		maxTickets: 99,
		category: "joke",
		flavorText: "A whole category of beverages united only by whimsy, dairy, and questionable decision-making."
	},
	{
		id: "tier5_moleTruceDay",
		label: "An Annual Day of Truce Between You and the Moles",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "For one sacred day each year, neither side swings first and everyone pretends this is sustainable."
	},
	{
		id: "tier5_arcadeConstellation",
		label: "A Constellation Named After Your Whacking Technique",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Somewhere overhead, a cluster of stars now captures the exact shape of your best round."
	},
	{
		id: "tier5_arcadeImmortal",
		label: "Permanent Arcade Immortality (Locally Recognized)",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Your legacy is now secured in the only way that matters: loudly, proudly, and within city limits."
	},
	{
		id: "tier5_molePeaceTreaty",
		label: "A Historic Peace Treaty With the Moles",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Signed after long negotiations and several dramatic pauses, this agreement promises almost nothing but symbolism."
	},
	{
		id: "tier5_infiniteTickets",
		label: "Infinite Tickets That You Are Asked Not to Redeem",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "An alarming amount of paper wealth accompanied by one very nervous note from the prize counter."
	},
	{
		id: "tier5_pileOfMoles",
		label: "A Considerable Pile of Invisible Stuffed Moles",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Your collection has advanced from charming to structurally significant."
	},
	{
		id: "tier5_tokenBrick",
		label: "Platinum Token Brick",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Too fancy to spend, too heavy to ignore, and exactly the kind of object that should thunk when set down dramatically."
	},
	{
		id: "tier5_hallJoystick",
		label: "Hall of Fame Joystick",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Worn smooth by legends, polished by storytelling, and absolutely touched by too many arcade pizza fingers."
	},
	{
		id: "tier5_stylusSet",
		label: "Collector Edition Louis Braille Stylus Set",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "A showpiece set with the kind of weight and punchy flair that makes even storage feel ceremonial."
	},
	{
		id: "tier5_platinumGlide",
		label: "A Platinum Glide",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Smooth, gleaming, and far fancier than any mobility tool has a right to be, this glide practically insists on making an entrance."
	},
	{
		id: "tier5_guideDogSnacks2",
		label: "Premium Guide Dog Snacks",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Top-tier treats for top-tier working dogs who have very reasonably come to expect the good stuff."
	},
	{
		id: "tier5_glideTips",
		label: "Lifetime Supply of Metal Glide Tips",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Finally, a reward that says practical luxury with the confidence of a well-stocked cane drawer."
	},
	{
		id: "tier5_moleskinNotebook",
		label: "Moleskin Tactile Notebook",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Ready for lists, plans, and the kind of tactile notes that deserve better paper than a receipt. Not made out of the arcade moles."
	},
	{
		id: "tier5_platinumNLS",
		label: "A Platinum NLS e-Reader",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Prestigious and ever so sparkly during smooth braille refreshes."
	},
	{
		id: "tier5_costaRicanBeans",
		label: "Premium Costa Rican Coffee Beans",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Smooth, fragrant, and suspiciously above the pay grade of any normal arcade counter."
	},
	{
		id: "tier5_perfectCoffeeCup",
		label: "A Perfect cup of delicious coffee.",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Hot, balanced, and so satisfying it feels like the prize counter accidentally got serious for a moment."
	},
	{
		id: "tier5_expressiveLightRoast",
		label: "The Mole's Expressive Light Roast Coffee Blend",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Bright, lively, and full of unnecessary personality, much like the creature who apparently endorsed it."
	},
	{
		id: "tier5_cancunBeans",
		label: "Delicious Coffee Beans from Cancun.",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Sunny, aromatic, and carrying just enough warm vacation energy to improve the shelf around them."
	},
	{
		id: "tier5_goldenPourOver",
		label: "A Golden Pour-Over Coffee Set.",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Slow, elegant, and obviously intended for a winner who enjoys turning caffeine into a ritual."
	},
	{
		id: "tier5_exoticLooseLeafTea",
		label: "Exotic Loose-leaf Teas (infuser not included)",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "The leaves are refined, the aroma is mysterious, and the missing infuser is now your problem."
	},
	{
		id: "tier5_amsterdamSingleOrigin",
		label: "Exclusive Single-Origin Coffee from Amsterdam",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Straight from the canals, a prize with travel-story energy before you even open the bag."
	},
	{
		id: "tier5_eternalGlory",
		label: "Eternal Arcade Glory",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "The score may fade, but the reputation has been instructed to keep going forever."
	},
	{
		id: "tier5_moleKing",
		label: "The Mole King's Crown",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Too regal for subtlety and far too important to wear casually."
	},
	{
		id: "tier5_verifiedLegend",
		label: "A Legend Status That No One Can Verify",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "The lack of proof only makes the story travel faster."
	},
	{
		id: "tier5_finalWow",
		label: "A Plaque That Just Says Wow",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "At a certain level of achievement, complete sentences become unnecessary."
	},
	{
		id: "tier5_brava",
		label: "A Shiny Brava Oven filled with Chicken Fingies",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "A luxury appliance and a chaotic feast prize wrapped into one deeply persuasive package."
	},
	{
		id: "tier5_brlStylus",
		label: "Louis Braille's Original Stylus",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Historically impossible, emotionally priceless, and exactly the sort of artifact a great prize counter should probably not be trusted with."
	},
	{
		id: "tier5_microbraille",
		label: "A Japanese MicroBraille Slate",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Compact, precise, and cool in the quietly serious way that makes other tools straighten up."
	},
	{
		id: "tier5_3Dpuzzle",
		label: "A Challenging 3D Wave Puzzle",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "The kind of tactile brain teaser that dares your hands to be smarter than your impatience."
	},
	{
		id: "tier5_guideDogSnacks",
		label: "Premium Guide Dog Snacks",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "Top-tier treats for top-tier working dogs who have very reasonably come to expect the good stuff."
	},
	{
		id: "tier5_thor",
		label: "Thor's Hammer Mjolnir, for the moles",
		minTickets: 100,
		maxTickets: null,
		category: "legend",
		flavorText: "At last, a properly dramatic tool for settling mole-related disputes in Midgard."
	}
];

export { prizeCatalog };
