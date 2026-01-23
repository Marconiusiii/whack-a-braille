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
- Perkins-style braille keyboard input

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
  - No scoring or tickets
  - Optional braille dot speech
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
- Configurable mole count
- Optional spoken braille dot patterns
- Restart training or return home at completion

Training mode disables round length selection and ticket earning.

## Speech and Audio

- Uses system speech synthesis
- Voice selection filtered by system language
- Adjustable speech rate via percentage-based control
- Spatialized audio cues indicate mole position
- Independent audio styles selectable via Game Audio settings

All speech and audio settings persist across sessions.

## Prize System

- Earn tickets through gameplay
- Redeem tickets for randomly selected prizes
- Prize shelf persists across sessions
- Duplicate prizes increment quantity instead of duplicating entries

## Accessibility Notes

- Designed for screen reader users
- Fully keyboard operable
- No reliance on visual-only cues
- Tested with VoiceOver on macOS and iOS
- Works with external braille displays and keyboards

## Development

This project is written in vanilla JavaScript with no frameworks.

Key files:
- app.js: UI wiring and state management
- gameLoop.js: gameplay timing and logic
- inputEngine.js: keyboard and braille input handling
- speechEngine.js: speech synthesis management
- audioEngine.js: non-speech audio and spatialization
- brailleRegistry.js: braille data definitions

## License

MIT License
