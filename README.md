# Whack A Braille

Whack A Braille is an audio-first, keyboard-driven braille reaction game designed primarily for blind and low-vision players. The game emphasizes speed, accuracy, and spatial awareness using speech synthesis, spatialized audio cues, and multiple input modes.

The game is fully playable without vision and is built with accessibility and screen reader users as a first-class audience.

## Core Gameplay

Moles appear one at a time and announce a braille character, number, symbol, or word sign depending on the selected mode. Players must respond quickly using their chosen input method before the mole retreats.

Scoring rewards:
- Accurate hits
- Streaks of correct responses
- Fast reaction times

Tickets earned during gameplay are saved into a persistent ticket bank and can be redeemed later at the Prize Counter.

## Input Modes

- QWERTY Keyboard
- Perkins-style braille keyboard input (F D S J K L chord entry)
- Braille Display mode for translated 8-dot braille input across all Mole Chooser modes
- Mobile Braille Entry field for screen reader braille input on phones/tablets
- In Perkins mode, Grade 1 numbers now require the number sign followed by the correct number cell instead of allowing the matching letter cell alone

Game Settings now use a Mole Chooser select menu that rebuilds based on the chosen Keyboard Input Mode:
- QWERTY shows typing modes and Grade 1 modes
- Perkins Home Row hides the QWERTY typing-only modes
- Braille Display hides the QWERTY typing-only modes and keeps Grade 1 and Grade 2 options available
- In Braille Display mode, incoming translated characters, contractions, and Grade 2 punctuation aliases are matched directly to the active mole target
- On desktop, Braille Display mode uses a dedicated gameplay text field so translated display input can be captured during the round

Global keyboard shortcuts:
- Backtick (`) repeats the current target without affecting gameplay

## Braille Modes

- Simple Home Row
- QWERTY Home Row
- QWERTY Home Row + Top Row
- QWERTY Home Row + Bottom Row
- Grade 1 Invasion
- Grade 1 Letters A–J
- Grade 1 Letters A–T
- Grade 1 All Letters
- Grade 1 Numbers
- Grade 1 Letters and Numbers
- Grade 2 Symbols
- Grade 2 Word Signs
- Grade 2 Dot 5 Initial-Letter Contractions
- Grade 2 Dots 4 5 Initial-Letter Contractions
- Grade 2 Dots 4 6 Final-Letter Contractions
- Grade 2 Dots 4 5 6 Initial-Letter Contractions
- Grade 2 Invasion

Grade 1 Invasion draws each mole from the full Grade 1 pool as it appears, including numbers. Grade 2 Invasion does the same with the full Grade 2 pool, including the newer multi-cell contraction families. Invasion rounds also use a rotating set of funny spoken intros before the round begins, and the round start waits for the spoken intro timing instead of a fixed delay.

## Spatial Mole Mapping

Spatial Mole Mapping is available in Game Settings and is enabled by default.

- When enabled, typing and eligible Grade 1 targets appear in stereo lanes that match keyboard neighborhoods.
- When disabled, lane placement is more random for an extra challenge.
- Grade 2 modes and Grade 2 Invasion do not use spatial mapping.
- Spawn logic also reduces long same-lane streaks so one lane is less likely to repeat too many times in a row.

## Difficulty Modes

- Training
  - Untimed
  - No scoring, tickets, or penalties
  - Optional braille dot speech
  - 15-mole practice sequence
  - Designed as a typing and braille learning tool
- Beginner
- Normal
- Supreme Mole Whacker

Difficulty affects timing, speed, and overall intensity.

## Training Mode

Training mode is designed as a learning environment rather than a game.

Features:
- No timer
- No misses or penalties
- Fixed 15-mole sequence
- Optional spoken braille dot patterns
- Multi-cell braille targets are announced cell by cell so number signs and multi-cell contractions are spoken clearly
- Restart training or return home at completion
- Keyboard shortcut `\` ends training early
- Exit Round button finishes the current round and moves straight to Results

Training mode disables round length selection and ticket earning.

## Mobile Braille Input

Whack A Braille includes a mobile-only Braille Entry field in the game area for:
- iOS VoiceOver Braille Screen Input users
- Android TalkBack Braille Keyboard users

How it works:
- Type your letter/number/contraction in Braille Entry while the round is active
- Some devices commit input immediately
- If input is buffered, press Return to submit

Desktop behavior is unchanged: hardware keyboard input still uses QWERTY and Perkins key events.

## Speech and Audio

- Uses system speech synthesis
- Voice selector includes a System default option
- Voice loading is resilient to delayed browser voice availability
- Language-filtered voice list with fallback to all available voices
- Adjustable speech rate via percentage-based control
- Adjustable speech volume via percentage-based control
- Optional Character Echo for Grade 1 letters
- Spatialized audio cues indicate mole position
- Independent audio styles selectable via Game Audio settings
- Optional timer music that accelerates as rounds progress
- Prize claims trigger tier-based musical fanfares with shimmering chime glissandos
- Mole hit feedback has been retuned for a stronger arcade feel

All speech and audio settings persist across sessions.

## Prize System

- Earn tickets through gameplay and keep them in a persistent local ticket bank
- Redeem tickets for randomly selected prizes from Home or after a round
- Prize claims deduct only the selected prize cost instead of clearing the whole bank
- If you have 0 tickets, the prize choices and Claim button stay hidden until you earn some
- Prize shelf persists across sessions
- Duplicate prizes increment quantity instead of duplicating entries
- Prize shelf entries are buttons that open a detail modal
- Prize detail view includes claimed date, tier, ticket cost, flavor text, and total owned when applicable
- Individual prizes can be removed from the shelf one at a time
- Clearing the Prize Shelf announces "Prize Shelf Cleared" to screen readers
- Prize catalog includes expanded multi-tier joke, brag, title, and legend rewards, including new coffee and tea themed prizes

## Accessibility Notes

- Designed for screen reader users
- Fully keyboard operable
- No reliance on visual-only cues
- Tested with VoiceOver on macOS and iOS
- Works with external braille displays and keyboards that emit keyboard-style input
- Includes mobile screen reader braille text-entry support through the Braille Entry field
- State transitions actively manage focus for Home, Results, and Prize Counter headings

## Development

This project is written in vanilla JavaScript with no frameworks.

Key files:
- app.js: UI wiring and state management
- gameLoop.js: gameplay timing and logic
- inputEngine.js: keyboard event input and text-attempt emission
- speechEngine.js: speech synthesis management
- audioEngine.js: non-speech audio, spatialization, and prize fanfares
- brailleRegistry.js: braille data definitions and invasion-mode pools
- ticketRules.js: shared ticket conversion thresholds
- prizeCatalog.js: prize tier definitions, flavor text, and reward content

## License

MIT License
