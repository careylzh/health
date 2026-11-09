# AGENTS.md — the one rulebook for every coding agent

This file is **tool-agnostic**: Codex, Claude Code, Cursor, Gemini, Aider, or a human all
start here. `CLAUDE.md` only imports this file and adds Claude-specific glue — never put a
rule there that other agents also need. Keep this file short and true; long-form detail lives
in the docs it links to.

## Read order (every session, before touching code)
1. **This file** — rules, commands, invariants.
2. **`HANDOFF.md`** — current state: what is deployed, what is half-done, what is next.
3. **`TODO.md`** — the open work queue. Pick from the top unless the user says otherwise.
4. **`KNOWN_ISSUES.md`** — traps that are known and not yet fixed.
5. The **`docs/decisions/`** record for any area you are about to change.

## What this is
**Pink of Health** — a tiny, mobile-first web app that presents Carey's personal health log
(sleep first; appetite and mood next) to doctors and friends **in 30–60 seconds**. Data is
pulled live, read-only, from a Google Sheet (one tab per year). Human overview: `README.md`.

## Product rules (these outrank "nice to have")
- **Concise above all.** One idea per screen. Big number, short label, done. No raw note dumps,
  no paragraphs, no dense tables. If a screen needs scrolling to be understood, split it.
- **Mobile first**, then iPad, then desktop. Test at 375 px wide before anything else.
- **Bilingual UI** (English / 中文). Every user-visible string goes through `src/i18n.ts`;
  no hard-coded copy in components. Add both languages in the same change.
- **Honest numbers.** Never invent or smooth data. A night with no entry is "not logged",
  not zero. Show how a number was computed when it could be misread.
- **Read-only, no backend, no secrets.** The sheet is fetched client-side. Never commit API
  keys, tokens or a copy of the health data. Test fixtures must be synthetic.
- **Privacy.** The site is public. Do not surface medication names or verbatim private notes on
  screen without an explicit decision record saying the user wants that.

## Commands
```bash
npm ci              # install (use the lockfile; never `npm install` in CI)
npm run dev         # local dev server (http://localhost:5173/health/)
npm test            # unit tests (Vitest) — must pass before any commit
npm run build       # typecheck + production build into dist/
npm run preview     # serve the production build locally
scripts/version.sh current|bump <patch|minor|major>|tag
```
Check real exit codes: `npm test > /tmp/t.log 2>&1; echo "EXIT=$?"` — a piped `tail` always
exits 0.

## Invariants — do not break
- **The sheet tab is chosen by the current calendar year** (`String(new Date().getFullYear())`),
  and the previous year is also fetched so "past week/month" works across New Year. Never
  hard-code `"2026"` anywhere outside tests.
- **A missing tab silently returns the FIRST tab** from the Google `gviz` endpoint — it does
  not 404. Any year-fetch must survive that (see `docs/decisions/0002-data-source.md`).
- **Vite `base` is `/health/`** (GitHub Pages project site). Asset URLs must be relative to it.
- **Parsing logic lives in pure functions** (`src/data/`) with unit tests. UI components do not
  parse strings.

## Working conventions
- **Small, separate commits** — one milestone per commit, then push. Never bundle unrelated
  work. Message style: `area: what changed` (e.g. `data: parse fragmented sleep segments`).
- **Branching:** trivial fixes may go straight to `main`; anything multi-step goes on a branch
  and merges when tests and build are green.
- **Parallel agents happen.** Before committing, look at `git status`; stage paths explicitly
  (`git add <paths>`), never `git add -A` over files you did not touch.
- **Verify, don't claim.** A ticked box or "PASS" means you observed it: test output, a
  screenshot at mobile width, the deployed URL loading. A green build is not proof a UI works.
- **Record decisions.** Any choice a future agent might re-litigate (stack, data rules, a
  rejected approach) gets a short record in `docs/decisions/NNNN-title.md`.
- **Update the living docs as you go:** `HANDOFF.md` (state), `TODO.md` (queue),
  `CHANGELOG.md` (dated history), `KNOWN_ISSUES.md` (traps). Stale docs are bugs.
- **When something goes wrong**, add a dated entry to `docs/analysis/POSTMORTEM.md`:
  what happened, root cause, the rule that prevents it. Then add the rule here if it is general.

## Working from a cloud session (Claude mobile app or claude.ai/code)
No SSH, no live-sheet access and no secrets are available there, and none are needed. Run the tests
(bot: `cd sleep-log && python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt &&
.venv/bin/python -m pytest -q`). **Merging to `main` deploys:** the site always, and the bot when
`sleep-log/` changes (decision 0007). Afterwards, check the run in GitHub Actions; a green run shows
the deploy finished, not that a feature works, so ask Carey to try it in Telegram or on the site.

## Roles (optional specialist personas)
Tool-neutral role briefs live in `agents/roles/`. Any agent can adopt one by reading it:
- `qa-inspector` — "how do you actually know?" before commit / before deploy.
- `presentation-steward` — owns concise UI, responsive layout, theme, i18n.
- `data-steward` — owns sheet fetching, parsing rules, and their tests.
- `version-steward` — semantic version bump + tag before a release.
- `repo-butler` — conservative tidying of stray files and stale docs.

Claude Code exposes these as subagents via `.claude/agents/`. In Codex or any other tool, say
"act as the `<role>` described in `agents/roles/<role>.md`".

## Where to look
`HANDOFF.md` · `TODO.md` · `KNOWN_ISSUES.md` · `CHANGELOG.md` · `docs/decisions/` ·
`docs/architecture/OVERVIEW.md` · `docs/analysis/POSTMORTEM.md`
