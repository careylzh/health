# 0006 — Pastel green background, brand pink kept
**Date:** 2026-11-06 · **Status:** accepted

## Context
After the hearts went (0005), Carey asked for a green background. The name and the pink logo stay.

## Decision
- **Green:** the page gradient (`--bg-1..3`), the top-bar fade, the card border, the drifting
  crosses (`--float-*`) and the favicon tile.
- **Pink (`--accent`, `--accent-soft`):** the logo cross, the pulse, the big numbers, the toggle,
  and the chart's main, broken and back-to-sleep bars. "Pink of Health" stays the name.
- Unbroken nights stay light green (`--unbroken`), which reads as "good" and sits on white cards.

## Consequences
- Background colours are tokens in `src/styles.css` `:root`. Change the tokens, never inline hex.
