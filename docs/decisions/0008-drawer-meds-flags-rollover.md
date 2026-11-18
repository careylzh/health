# 0008 — Drawer pages: highlighted days, medication behind a passcode, yearly tab rollover
**Date:** 2026-11-18 · **Status:** accepted

## Context
Carey asked for three things (2026-11-17):
1. A medication page showing lithium dose changes ("Li 200mg/400mg") and as-needed mirtazapine
   ("Mirt 7.5/3.75/15mg") from the pharmacology column.
2. A page for days highlighted in the sheet. Strong red means severe (e.g. psychotic symptoms
   surfacing), light red means no sleep the night before, green means a good sign (a
   no-lost-sleep streak, starting a new med or supplement).
3. The app should use `2027` automatically when the year turns. The `2026` template should be
   copied to `2027` on the last day of the year.

The site is public, and AGENTS.md keeps medication names off it without a record like this one.
The gviz feed (decision 0002) has cell values only, no colours (checked against the live sheet).

## Decision
- **Navigation:** a ☰ drawer (left) with three pages: Sleep (the original four screens),
  Highlighted days, Medication. The range dropdown and EN/中文 toggle apply to all of them.
- **Medication is behind a passcode.** Carey chose this over neutral labels or showing names openly.
  Only a salted PBKDF2-SHA256 hash is in the bundle (`src/passcodeHash.ts`, written by
  `node scripts/set-passcode.mjs`). The passcode is never in the repo. Unlocking is remembered on
  that device until "Lock" is pressed or the passcode changes. **It is a curtain, not a lock.** The
  sheet is link-readable and the bundle is public, so it only keeps casual viewers out.
- **Medication rules** (`src/data/meds.ts`, pinned by `meds.test.ts`). These read only the
  pharmacology column, clause by clause (split on , ; / line break "then" "and"):
  - Lithium = `Li`/`lithium` as a whole word, plus a dose in mg. `missed`/`skipped`/`forgot` makes
    it a missed night. Carey's shorthand "resumed 200mg" (the whole clause, no drug named) counts
    as lithium. "resume 400mg for the next 6 months if…" is a plan, not a dose, so it is not counted.
  - Runs: consecutive lithium notes with the same state (dose, or missed). Days with nothing
    written do not break a run. A run ends only when the noted state changes.
  - Mirtazapine = `mirt`/`mirtazapine`. The dose is the first number after it ("Mirt 15",
    "Mirt (7.5mg)"). "from X to 0mg" is a stop, not a dose. Each night counts once per range.
  - A blank day is "not noted", never "not taken". The page says so.
- **Highlighted days:** the Sleep Log bot reads the background colours of the current and previous
  year tabs (Sheets API, service account) every 30 min. It writes a `flags` tab with `Date`
  (ISO, text) and `Flag` (`severe` | `nosleep` | `good`), and nothing else: **no note text**.
  - Colour key (`sleep_log/flags.py`): red family with green < 0.3 → severe (red, dark red 1–3);
    other reds → nosleep (light red 1–3); green family → good. Orange, yellow and others are not
    in the key and are ignored.
  - A row's flag is its date cell's colour if that is in the key, otherwise the most common flag
    among its other cells. A range date ("18/12-22/12") flags every day in it.
  - A day can carry two flags: two rows for one date, e.g. light red for no sleep and green for
    starting TCM. The grid splits the square and the counts include both.
  - The web app reads `sheet=flags` through gviz. Anything without the exact `Date, Flag` header
    (gviz's first-tab fallback when the tab is missing) is "not synced yet".
- **Yearly rollover:** the bot checks daily at 00:10 SGT and once at start-up. On 31 Dec, if
  `<next year>` is missing, it copies the newest year tab to position 0 under that name. It then:
  - clears every entry below the header;
  - resets backgrounds to white below the header;
  - writes every date of the new year in column A (format `d/m`);
  - writes the template's Duration formula into column E for each row.
  If the bot was down on 31 Dec, it creates the current year's tab when it starts. It messages the
  chat when done. The web app already picks the tab by the calendar year (decision 0002).

## Rejected
- Showing drug names openly, or only neutral labels: Carey chose the passcode.
- Sheets API from the browser to read colours: it needs an API key in a public bundle (see 0002).
- Fetching the `htmlview` page for colours: it has no CORS and its HTML is fragile.
- Showing note text for highlighted days: Carey chose labels and counts only.
- One flag per day ("most serious wins"): it hid good signs on days with a no-sleep row.

## Consequences
- The flags page shows "not synced yet" until the bot with this change is deployed.
- The meds page says "not set up" until Carey runs `node scripts/set-passcode.mjs` and pushes.
- New colours or new medication wording need a test and a line here.
- The `flags` tab is the bot's: hand edits are overwritten on the next sync.
