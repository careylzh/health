# 0005 — Site symbol: a medical cross, not a heart
**Date:** 2026-11-06 · **Status:** accepted

## Context
The ♥ logo, the beating ♥ by the average, and the drifting pink hearts made the site look like a
dating or romance site. The audience is doctors and friends.

## Decision
- One symbol everywhere: a **rounded medical cross** (`src/Cross.tsx`). It is used for the top-bar
  logo, the pulse on the loading screen and by the average, the favicon, and the drifting
  background (`src/CrossField.tsx`), which keeps the same motion and pastel tones.
- The pulse is a slow single swell (2.4 s), not a heartbeat double-beat. Reduced motion stops it.
- Carey chose the cross over an ECG trace, moon + zzz, and clipboard + heart.

## Rejected
- **Using SF Symbols themselves.** Apple's licence only allows them in apps for Apple platforms.
  They cannot be shipped on a public website, so the cross is an original SVG drawn in that style.
- Keeping the hearts in the background only: the hearts were the main "dating site" signal.

## Consequences
- Do not reintroduce hearts as decoration. "Pink of Health" stays the name and the pink theme stays.
- Any new icon must be original SVG or come from an openly licensed set, never SF Symbols.
