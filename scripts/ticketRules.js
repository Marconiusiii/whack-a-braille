"use strict";

function scoreToTickets(scoreValue) {
	if (scoreValue >= 200) return 20;
	if (scoreValue >= 150) return 15;
	if (scoreValue >= 100) return 10;
	if (scoreValue >= 50) return 5;
	return 0;
}

export { scoreToTickets };
