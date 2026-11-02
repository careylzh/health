# HANDOFF — current state

Rules and commands → [AGENTS.md](AGENTS.md). Open work → [TODO.md](TODO.md). History →
[CHANGELOG.md](CHANGELOG.md). This file is only **what is true right now** — rewrite it, don't append.

## Deployed
| Where | Version | Note |
|---|---|---|
| GitHub Pages — https://careylzh.github.io/health/ | see `package.json` | deployed by `.github/workflows/deploy.yml` on every push to `main` |

## State (2026-11-02)
- Agent structure in place (AGENTS.md + role briefs + Claude wrappers).
- Feature 1 built and pushed: four snap-scrolling screens — average hours (hero), night-by-night
  stacked chart with quality dots, broken-sleep count, and four at-a-glance bullets. Range dropdown
  (7/14/30/90 days), EN/中文 toggle, refresh button. 74 Vitest tests.
- Verified 2026-11-02: preview build against the LIVE sheet at 375 px and 800 px, EN + 中文; month
  average 7.5 h over 22 logged nights hand-checked against the sheet. Not yet walked on a real
  phone/iPad (TODO #1).
- No backend: the browser fetches the sheet CSV on every load (see decision 0002).
- `sleep-log/` (2026-11-03): **Sleep Log** Telegram bot (@clzhsleeplogbot). It asks for sleep and
  wake time at 08:00 SGT, writes F/G and replies with the 7-day average (decision 0003). Verified
  2026-11-03: `/log` wrote 22:00 / 03:00 to the 3/11 row of the live sheet, and the sheet's formula
  set Duration to 5.00. Service account `sleep-log@sleep-log-513522.iam.gserviceaccount.com` has
  Editor access. The token and key live only in `sleep-log/.env` and `service-account.json`
  (gitignored, on Carey's Mac). **Not yet run as a lasting service:** it ran from a Claude session.

## Next
Top of [TODO.md](TODO.md).
