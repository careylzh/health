# 0002 — Reading the Google Sheet
**Date:** 2026-11-02 · **Status:** accepted

## Context
Sheet `12db7k6f9WWKvmAUTc88vLocgiRUHWAgPxtoF8DnjGEU`, one tab per year ("2026", "2027", …),
filled by hand. Columns (row 1): `Dates`, `Pharmacology last night`, `Positive Observations`,
`Negative observations `, `Duration slept last night(estimated)`, `Sleep time`, `Wake time`,
`reasons for change`, `remarks`.

## Decision
- **Fetch:** `https://docs.google.com/spreadsheets/d/<id>/gviz/tq?tqx=out:csv&sheet=<YEAR>` —
  CORS-enabled for any origin, no key. Fetch **current year and previous year**.
- **Missing tab:** gviz returns the first tab for an unknown name. If both responses are
  byte-identical, only one tab really exists: keep the year under which its dates are not in
  the future (dates > today + 1 day ⇒ wrong year).
- **Dates:** `D/M` or `D/M/YY(YY)`. Explicit year wins. Otherwise the tab year, except rows dated
  Nov/Dec that appear **before** the first Jan/Feb row in the tab → previous year.
- **Duplicate dates** (e.g. a note-only row + a data row): merge — the row with sleep data wins
  for numbers; notes are concatenated.
- **Main sleep hours:** the `Duration` column if > 0. If it is 0/empty but both times exist,
  compute from the times (wrapping past midnight). If it is 0/empty with no times → **not logged**
  (excluded from averages, counted separately).
- **Extra (fragmented) sleep:** regex over `remarks` + observations for time ranges introduced by
  "sleep/slept" (e.g. "went back to sleep from 6.30-10am", "Slept 9-11am", "slept from 5.30-8.30am").
  A range is added only if it starts at or after the main wake time (± 0) and before 14:00.
  A night with ≥ 1 extra segment is **fragmented**.
- **Mood / appetite / body tallies:** keyword counts over the observation columns (EN + 中文),
  shown as "n of N days" — never verbatim notes.
- **Not displayed:** the pharmacology column and verbatim notes (privacy; site is public).

## Rejected
- Sheets API v4 with an API key — needs a secret in a public bundle for no gain.
- Publishing the sheet "to the web" — not needed; link-sharing + gviz works.
- Treating `0.00` as zero sleep — most such rows are pre-filled future placeholders.

## Consequences
If the sheet's column headers are renamed, update `src/data/columns.ts` (matching is
case/whitespace-insensitive on a key phrase) and this record.
