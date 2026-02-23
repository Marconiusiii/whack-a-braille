# Whack A Braille

Whack A Braille is an audio-first, keyboard-driven braille reaction game designed primarily for blind and low-vision players. The game emphasizes speed, accuracy, and spatial awareness using speech synthesis, spatialized audio cues, and multiple input modes.

The game is fully playable without vision and is built with accessibility and screen reader users as a first-class audience.

## Core Gameplay

Moles appear one at a time and announce a braille character, number, symbol, or word sign depending on the selected mode. Players must respond quickly using their chosen input method before the mole retreats.

Scoring rewards:
- Accurate hits
- Streaks of correct responses
- Fast reaction times

Tickets earned during gameplay can be redeemed for prizes at the Prize Counter.

## Input Modes

- QWERTY Keyboard
- Perkins-style braille keyboard input (F D S J K L chord entry)

Global keyboard shortcuts:
- Backtick (`) repeats the current target without affecting gameplay

## Braille Modes

- Grade 1 Letters A–J
- Grade 1 Letters A–T
- Grade 1 All Letters
- Grade 1 Numbers
- Grade 1 Letters and Numbers
- Grade 2 Symbols
- Grade 2 Word Signs
- Everything (advanced mixed mode)

Everything mode mixes Grade 1 and Grade 2 content and locks input to Perkins mode.

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
- Restart training or return home at completion
- Keyboard shortcut `\` ends training early

Training mode disables round length selection and ticket earning.

## Speech and Audio

- Uses system speech synthesis
- Voice selector includes a System default option
- Voice loading is resilient to delayed browser voice availability
- Language-filtered voice list with fallback to all available voices
- Adjustable speech rate via percentage-based control
- Optional Character Echo for Grade 1 letters
- Spatialized audio cues indicate mole position
- Independent audio styles selectable via Game Audio settings
- Optional timer music that accelerates as rounds progress

All speech and audio settings persist across sessions.

## Prize System

- Earn tickets through gameplay
- Redeem tickets for randomly selected prizes
- Prize shelf persists across sessions
- Duplicate prizes increment quantity instead of duplicating entries
- Clearing the Prize Shelf announces "Prize Shelf Cleared" to screen readers
- Prize catalog includes expanded multi-tier joke, brag, title, and legend rewards

## Accessibility Notes

- Designed for screen reader users
- Fully keyboard operable
- No reliance on visual-only cues
- Tested with VoiceOver on macOS and iOS
- Works with external braille displays and keyboards that emit keyboard-style input
- State transitions actively manage focus for Home, Results, and Prize Counter headings

## Development

This project is written in vanilla JavaScript with no frameworks.

Key files:
- app.js: UI wiring and state management
- gameLoop.js: gameplay timing and logic
- inputEngine.js: keyboard and braille input handling
- speechEngine.js: speech synthesis management
- audioEngine.js: non-speech audio and spatialization
- brailleRegistry.js: braille data definitions
- ticketRules.js: shared ticket conversion thresholds
- prizeCatalog.js: prize tier definitions and reward content

## License

MIT License
