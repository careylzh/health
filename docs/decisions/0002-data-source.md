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
  Nov/Dec that appear **before** any Jan–Oct row (carry-over at the top of the tab) → previous
  year. (Was "before the first Jan/Feb row" — that misfiled a tab with no Jan/Feb rows.)
- **Duplicate dates** (e.g. a note-only row + a data row): merge — the row with sleep data wins
  for numbers; notes are concatenated.
- **Main sleep hours:** the `Duration` column if > 0. If it is 0/empty but both times exist,
  compute from the times (wrapping past midnight). If it is 0/empty with no times → **not logged**
  (excluded from averages, counted separately).
- **Extra (fragmented) sleep:** regex over `remarks` + observations for time ranges introduced by
  a sleep word — slept/sleep/asleep/nap/dozed/back to bed/睡 (e.g. "went back to sleep from
  6.30-10am", "fell back asleep 7-9am", "6.30am-8.15am slept again", "又睡了7点到9点"). Separators:
  - – ~ to till until and 到 至. Negated sleep is never a segment: "couldn't sleep 2-4am",
  "tried to sleep 6-8am but couldn't", "no sleep from 4-6am", 睡不着. Pinned by `segments.test.ts`.
  A range is added only if it starts at or after the main wake time (± 0) and before 14:00.
  A night with ≥ 1 extra segment is **fragmented**.
- **Mood / appetite / body bullets — no AI, no tokens.** Computed in the browser on every load:
  keyword regexes (`src/data/keywords.ts`, EN + 中文, with negation stripping such as "did not
  wake up feeling unrested") tag each day → tags are counted over the range → the top counts fill
  fixed templates in `src/i18n.ts`. Plain day counts only ("Mood: anxiety 3 days, upbeat 2 days"),
  no tone claims. Every template is ≤ 10 words EN / ≤ 20 chars ZH, enforced by `src/i18n.test.ts`.
  Never verbatim notes.
- **Negation (all tags):** a match is dropped when a negator (not, no, never, without, hardly,
  n't forms with or without the apostrophe: didn't/didnt, won't/wont…) sits ≤ 3 words before it in
  the same clause with no contrast word between ("but", "and", "though", a comma). "or"/"nor"
  carry the negation ("no headache or nausea"). 中文: 不/没/没有/并不… directly before. "X-free"
  counts as negated. Negated *rested* becomes *unrested* ("didn't sleep well"); other tags just drop.
  Coverage is pinned by `src/data/semantics.test.ts` (phrases that must / must not fire).
- **Appetite — one state per day, four states** (user decision 2026-11-02: keep the nuance of
  mixed notes, but never call a change "bad"):
  - *good* — a good state or a return to it: good/fine/normal/back/improved, "ate well", 胃口好.
  - *dipped* — a change downward, not a bad state: dip/drop/lower/reduced/less, "ate less",
    "not as hungry", 胃口下降/变差.
  - *poor* — an explicitly bad state: poor/bad/low/gone, "no appetite", "lost my appetite",
    "barely ate", "skipped lunch", "not good", 胃口差, 食欲不振, 不想吃.
  - *mixed* — good together with dipped or poor on the same day ("generally good, with a dip").
  Words count when they sit in the clause that names appetite, or in a following clause that
  carries on ("…, with the exception of a dip", "…, but lower at night") unless that clause has
  moved to another subject ("…, but less anxious"). Strength words (slightly, a lot) do not change
  the state. Negation flips: "did not drop" → good, "won't improve" → poor. The column a note sits
  in (Positive/Negative) is not used — the words decide. Pinned by `keywords.test.ts`.
- **Time phrases decide which days a tag lands on** (user decision 2026-11-02: "guess time
  phrases but be as precise as you can"). Rules live in `src/data/timeref.ts`, pinned by
  `timeref.test.ts`:
  - "past/last N days", "for N days", 过去/最近 N 天 → the N days *ending on the row* ("past 2 days"
    on 2 Nov = 1–2 Nov). "yesterday"/昨天 → the day before only. "N days ago" → that day only.
    "since yesterday/Friday" → from then to the row. "past week" → 7 days; "this week" → Monday to
    the row; bare "last week" → the previous Mon–Sun. "last night"/昨晚 → the row (the night it logs).
  - Vague counts are not guessed ("a few days", "lately", 这几天) → the row only.
  - A span tied to another event ("for 8 days *before* the symptoms", "3 days *of* meds") is not
    a time for the tag → the row only.
  - A tag takes the phrase in its own clause, else one that opens the sentence on its own.
  - Exceptions: "generally good, with the exception of a dip in the past 2 days" → those 2 days
    are *dipped*; the general "good" names no specific day and is not counted.
  - A named day without a row becomes a note-only day (sleep stays "not logged").
- **Night quality dot:** rested (rested tag, not fragmented) · restless (unrested / woke often /
  cold sweat / nausea) · mixed (both, or fragmented). No dot when the notes say nothing.
- **Not displayed:** the pharmacology column and verbatim notes (privacy; site is public).

## How the "backend" works
There is none. GitHub Pages serves static files; on every page load or refresh the viewer's
browser fetches the CSV straight from Google (`cache: "no-store"`). The sheet *is* the database —
edit it and the next refresh shows the change. The ↻ "Updated hh:mm" button re-fetches in place.

## Rejected
- An LLM to summarise notes — needs a key/tokens and a server; deterministic tallies are enough.
- Sheets API v4 with an API key — needs a secret in a public bundle for no gain.
- Publishing the sheet "to the web" — not needed; link-sharing + gviz works.
- Treating `0.00` as zero sleep — most such rows are pre-filled future placeholders.

## Consequences
If the sheet's column headers are renamed, update `src/data/columns.ts` (matching is
case/whitespace-insensitive on a key phrase) and this record.
