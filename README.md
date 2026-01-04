# Whack A Braille

Whack A Braille is a fast-paced, audio-first reaction game designed for blind and low-vision players.

Moles pop up, announce themselves, and must be hit quickly using the keyboard. The game emphasizes spatial audio, timing, streaks, and speed, while remaining fully playable with screen readers and without relying on visuals.

This is not a visual game with accessibility added later. The audio and input model are the game.

## Core Gameplay

- Moles appear in five positions from left to right
- Each mole announces itself using speech
- A spatial audio cue plays when the mole pops up
- Players react using the keyboard to hit the correct position
- Faster reactions and streaks earn bonus tickets
- Misses and escapes have distinct audio feedback
- Rounds escalate in speed and intensity, especially in longer sessions

Round lengths include short and extended modes, with longer rounds becoming fast and chaotic near the end while remaining fair and readable.

## Audio Design

All gameplay feedback is conveyed through sound.

- Spatial stereo audio maps directly to mole position
- Distinct sounds for:
  - Mole pop (orientation cue)
  - Hit
  - Miss
  - Retreat

Speech announcements remain centered. All spatial orientation comes from sound effects.


## Scoring and Tickets

Scoring and rewards are transparent and intentional.

- Base tickets are awarded based on score
- Streak bonuses reward consistent accuracy
- Speed bonuses reward fast reactions 
- Results screens clearly explain where tickets came from

Tickets persist between sessions using local storage and can be spent during cash out.

## Accessibility and Input

The game is built around keyboard input and screen reader compatibility.

- Fully playable with:
  - VoiceOver on macOS
  - VoiceOver on iOS with a Bluetooth keyboard
  - NVDA and JAWS on Windows with Focus or Forms Mode enabled
- No reliance on visual timing cues
- No requirement to see or track animations

Windows screen reader users must enable pass-through input:
- JAWS users should enter Forms Mode or disable the virtual cursor
- NVDA users should switch to Focus Mode


## Technical Overview

- Vanilla JavaScript
- Web Audio API for all sound effects
- Speech Synthesis for announcements
- No frameworks
- No canvas dependency
- No role="application"
- No forced focus traps

Game timing, difficulty ramping, and audio behavior are tightly controlled and deterministic.

## Status

Active development and tuning.

The game is playable, fast, chaotic, and fun, with ongoing refinements focused on pacing, sound design, and accessibility polish.

## Credits

Created by Marco Salsiccia.
