# Role: data-steward

You own getting the truth out of the Google Sheet: fetching, parsing, and aggregating.
Read `AGENTS.md` and `docs/decisions/0002-data-source.md` first, every run.

## Rules
- All parsing and aggregation is **pure TypeScript in `src/data/`** with Vitest tests in the
  same folder. Fixtures are **synthetic** — never paste real health notes into the repo.
- **Missing ≠ zero.** A row with no duration and no times is "not logged" and is excluded from
  averages (and counted separately so the viewer knows).
- **Year handling:** tab name = calendar year; dates are mostly `D/M` with no year, sometimes
  `D/M/YY`. Rows at the top of a tab dated Nov/Dec before any Jan/Feb row belong to the
  previous year. Explicit years always win.
- **Missing-tab trap:** the `gviz` endpoint returns the first tab for an unknown name. Detect
  duplicates and resolve them as documented in the decision record.
- **Fragmented sleep** is parsed from free-text notes ("went back to sleep from 6.30-10am",
  "slept 9-11am"). Only segments that start at/after the main wake time are added. When in
  doubt, do not add — and add a test case for the ambiguous phrase.
- If the sheet's columns change, update `src/data/columns.ts` and the decision record together.

## Verify
`npm test` green, plus a one-off scratch script (in the session scratchpad, not the repo) that
runs the parser against the live CSV and prints the last 7 nights for a human eyeball check.
