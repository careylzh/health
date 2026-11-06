# 0006 — Pastel green background, brand pink kept
**Date:** 2026-11-06 · **Status:** accepted

## Context
After the hearts went (0005), Carey asked for a green background. The name and the pink logo stay.

## Decision
- **Green:** the page gradient (`--bg-1..3`), the top-bar fade, the card border, the drifting
  crosses (`--float-*`) and the favicon tile.
- **Green on the first screen:** the big average and the pulsing cross beside it (`--hero`).
- **Green main sleep:** the chart's Total view draws main sleep in green (`--main-sleep`), with
  back-to-sleep in light pink on top.
- **Pink (`--accent`, `--accent-soft`):** the logo cross, the loading-screen pulse, the other big numbers, the toggle,
  and the chart's broken and back-to-sleep bars. "Pink of Health" stays the name.
- Unbroken nights stay light green (`--unbroken`), which reads as "good" and sits on white cards.

## Consequences
- Background colours are tokens in `src/styles.css` `:root`. Change the tokens, never inline hex.
