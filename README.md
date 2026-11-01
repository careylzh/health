# Pink of Health 🌸

A small, mobile-first page for showing my recent health log to doctors and friends in under a
minute. It reads live from my Google Sheet (one tab per year) and shows:

- **Average sleep per night** for the past week / 2 weeks / month (dropdown)
- **Night-by-night chart**
- **Fragmented sleep**: how many nights I went back to sleep after waking, and how much that added
- **Mood & appetite at a glance**: short tallies taken from my notes

English / 中文 toggle in the corner. Works on phone, iPad and desktop.

**Live:** https://careylzh.github.io/health/

## Run locally
```bash
npm ci
npm run dev      # http://localhost:5173/health/
npm test
```

## How the sheet is read
- Tab = the current year (`2026`, then `2027` automatically next year); last year's tab is merged
  so "past week" works across New Year.
- Columns used: `Dates`, `Duration slept last night(estimated)`, `Sleep time`, `Wake time`,
  `Positive Observations`, `Negative observations`, `remarks`.
- Extra sleep like "went back to sleep from 6.30-10am" in the notes is added to that night.
- Rules and edge cases: [docs/decisions/0002-data-source.md](docs/decisions/0002-data-source.md).

## For coding agents
Start at [AGENTS.md](AGENTS.md) (Codex, Claude Code, anything else).
