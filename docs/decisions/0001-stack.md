# 0001 — Stack: Vite + React + TypeScript on GitHub Pages
**Date:** 2026-11-02 · **Status:** accepted

## Context
A static, read-only presentation page that must load fast on phones and be hosted for free.
The reference look is careylzh/geobe (Vite + React, CSS-animated floating shapes).

## Decision
Vite + React 19 + TypeScript, Vitest for unit tests, plain CSS with custom properties, no UI or
chart library (charts are hand-rolled SVG). Deployed to GitHub Pages by GitHub Actions
(`base: "/health/"`).

## Rejected
- **Three.js** for the background — a heavy dependency for a decorative effect; CSS-animated
  hearts look the same on a phone and cost nothing. Revisit only for a real 3D feature.
- **Chart libraries** (Recharts/Chart.js) — one bar chart doesn't justify ~100 KB.
- **A backend / Sheets API key** — the sheet is link-shared and the `gviz` CSV endpoint sends
  CORS headers, so no server or secret is needed.

## Consequences
No server: anything private in the sheet is as public as the sheet link. Keep logic in pure
functions so it stays testable without a browser.
