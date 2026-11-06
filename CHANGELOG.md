# Changelog

Dated history, newest first. Versions follow `scripts/version.sh` (semantic).

## [Unreleased]

### 2026-11-06 — Medical cross replaces hearts
- The logo, the pulse by the average, the loading screen, the favicon and the drifting background
  now use a rounded medical cross instead of hearts, so the site no longer reads as a dating site
  (decision 0005). The cross is original SVG, because SF Symbols may not be used on the web.

### 2026-11-06 — Chart view toggle: total, broken, back to sleep
- The night-by-night chart has a three-way toggle. **Total** shows total sleep per night with the
  average and quality dots. **Broken** highlights nights with back-to-sleep segments. **Back to
  sleep** shows only the extra hours, with the average over broken nights. The choice is
  remembered per viewer. EN + 中文. Checked at 375 px against the live sheet.

### 2026-11-04 — Sleep Log bot hosted on DigitalOcean
- The bot runs 24/7 on droplet `sleep-log-tele-bot` (SGP1) under systemd, as user `sleeplog`
  (decision 0004). Added `sleep-log/deploy/` (unit file and `deploy.sh`). The README no longer
  points to the Mac for hosting.

### 2026-11-04 — Sleep Log: remarks question, skip when already logged
- After sleep and wake, the bot asks for a remark and writes it to column I (remarks). It adds the
  remark below any text already in the cell and never replaces it. `skip` leaves the cell alone.
- The 08:00 question is skipped when today's row already has sleep and wake time (from `/log`
  earlier, or typed into the sheet by hand). If the bot starts after 08:00 and before 12:00, it
  asks then.
- Found 2026-11-04: no 08:00 message arrived because the bot wasn't running anywhere (it only ever
  ran inside the 3 Nov Claude session).

### 2026-11-03 — Sleep Log Telegram bot
- New `sleep-log/` folder: a Telegram bot that asks at 08:00 when you slept and woke, writes
  columns F/G of today's row, and replies with the past 7 days' average (logged nights only).

### 2026-11-02 — time phrases place tags on the days they name
- "a dip in the past 2 days" on 2 Nov now counts on 1 and 2 Nov; "depressed yesterday" counts on
  the day before. Vague phrases ("a few days", "lately") are not guessed. Spans tied to another
  event ("for 8 days before the symptoms") don't move a tag.
- "generally good, except a dip the past 2 days" → 2 dipped days (the general "good" has no day).
- Real sheet: past week now reads "Appetite dipped on 2 days".

### 2026-11-02 — appetite: good / mixed / dipped / poor, one state per day
- A "dip" or "drop" is now *dipped*, not *poor*; *poor* needs explicitly bad words.
- A day with good and a dip/poor is *mixed* and counted once (was counted as good AND poor).
- Bullets: "Appetite mixed on 1 day: good with a dip", "Appetite: 3 good, 1 mixed".
  Night detail shows one state ("mixed appetite") instead of two contradicting tags.

### 2026-11-02 — copy: "1 day", not "1 days"
- English bullets now pluralise correctly in every appetite and mood variant.

### 2026-11-02 — year inference fix + end-to-end aggregation tests
- Bug: Nov/Dec rows were filed under last year until a Jan/Feb row appeared, so a tab without
  Jan/Feb rows dropped this year's November from "past week". Now Nov/Dec are last year's only at
  the top of a tab, before any Jan–Oct row. Real sheet: every date unchanged.
- `src/data/aggregate.test.ts`: rows → nights → summary → bullets, with duplicate dates, note-only
  days, negated symptoms, naps, segments before waking and an out-of-range day.

### 2026-11-02 — broken sleep: more phrasings, negated sleep excluded
- Now read: "fell back asleep 7-9am", "dozed off", "back to bed", "till/until/between … and",
  "6.30am-8.15am slept again", 中文 "又睡了7点到9点".
- "couldn't sleep 2-4am", "tried to sleep … but couldn't", "no sleep from 4-6am" are no longer
  counted as extra sleep. Real sheet unchanged (7 broken nights, 22.5 extra hours).

### 2026-11-02 — mood / body / sleep tags: negation and wider vocabulary
- One negation rule for every tag: "didn't feel anxious", "no headache or nausea", "little to no
  anxiety", "stress-free", 不焦虑 no longer count; "didn't sleep well" counts as unrested.
- Wider vocabulary (EN + 中文): insomnia, couldn't/couldnt sleep, groggy, migraine, threw up,
  night sweats, constipated, frustrated, panic, nervous, felt better, 失眠, 头疼, 恶心, 盗汗, 紧张…
- Word-boundary fixes: "presentation" / "ranger" no longer count as irritable, "unhappy" no
  longer counts as happy, "stomach was fine" no longer counts as a gut problem.
- `src/data/semantics.test.ts`: phrases that must and must not trigger each tag.

### 2026-11-02 — appetite matching understands natural phrasing
- "Appetite" plus a describing word anywhere in the same sentence, in either order, now counts
  ("Appetite generally good", "a dip in appetite"). A sentence can count as both good and poor.
- "not hungry" now counts as poor, not good. Added 中文 phrases: 胃口差/不好, 食欲不振, 不想吃, 吃不下.
- Day-level only: "a dip the past 2 days" counts on the row it is written on.
- Negation: didn't / did not / won't / will not / wasn't / never / no longer / hardly / barely …
  flip the word that follows ("did not drop" → good, "won't improve" → poor, "didn't eat much" → poor).

### 2026-11-02 — v0.1.0: first feature — sleep presenter
- Agent-agnostic structure: `AGENTS.md` (canonical), `CLAUDE.md` import, tool-neutral role briefs
  in `agents/roles/` with Claude wrappers in `.claude/agents/`, living docs, decision records.
- Vite + React + TS scaffold, GitHub Pages deploy workflow, `scripts/version.sh`.
- Data: year-tab loader (current + previous year; survives gviz's first-tab fallback), parser
  (empty rows excluded, back-to-sleep segments from remarks), stats, deterministic bullets.
- UI: hero average, night-by-night chart with quality dots, broken-sleep screen, at-a-glance
  bullets (≤ 10 words), EN/中文, pastel pink floating-hearts theme.
- Bug caught by tests before shipping: pre-filled future placeholder rows made the year check
  read the current tab as last year's; now only logged nights count.
