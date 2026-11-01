# Changelog

Dated history, newest first. Versions follow `scripts/version.sh` (semantic).

## [Unreleased]

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
