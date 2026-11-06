# HANDOFF — current state

Rules and commands → [AGENTS.md](AGENTS.md). Open work → [TODO.md](TODO.md). History →
[CHANGELOG.md](CHANGELOG.md). This file is only **what is true right now** — rewrite it, don't append.

## Deployed
| Where | Version | Note |
|---|---|---|
| GitHub Pages — https://careylzh.github.io/health/ | see `package.json` | deployed by `.github/workflows/deploy.yml` on every push to `main` |
| Sleep Log bot — DigitalOcean droplet `sleep-log-tele-bot` (165.245.190.59) | `main` @ deploy time | systemd `sleep-log`; ship with `sleep-log/deploy/deploy.sh` (decision 0004) |

## State (2026-11-04)
- Agent structure in place (AGENTS.md + role briefs + Claude wrappers).
- Feature 1 built and pushed: four snap-scrolling screens — average hours (hero), night-by-night
  stacked chart with quality dots, broken-sleep count, and four at-a-glance bullets. Range dropdown
  (7/14/30/90 days), EN/中文 toggle, refresh button. 2026-11-06: the chart has a Total / Broken /
  Back-to-sleep view toggle (decision 0002). The symbol is now a medical cross, not hearts
  (decision 0005). 74 Vitest tests.
- Verified 2026-11-02: preview build against the LIVE sheet at 375 px and 800 px, EN + 中文; month
  average 7.5 h over 22 logged nights hand-checked against the sheet. Not yet walked on a real
  phone/iPad (TODO #1).
- No backend: the browser fetches the sheet CSV on every load (see decision 0002).
- `sleep-log/` (2026-11-03): **Sleep Log** Telegram bot (@clzhsleeplogbot). It asks for sleep and
  wake time at 08:00 SGT, writes F/G and replies with the 7-day average (decision 0003). Verified
  2026-11-03: `/log` wrote 22:00 / 03:00 to the 3/11 row of the live sheet, and the sheet's formula
  set Duration to 5.00. Service account `sleep-log@sleep-log-513522.iam.gserviceaccount.com` has
  Editor access. The token and key live only in `sleep-log/.env` and `service-account.json`
  (gitignored; on Carey's Mac and the droplet). 2026-11-04: added a remarks question (column I) and skips the
  08:00 question when today is already logged (34 pytest tests; checked read-only against the live
  sheet). **Deployed 2026-11-04** on the DigitalOcean droplet
  (decision 0004). Verified: systemd active and enabled, scheduler added the `morning` job, the droplet
  read the sheet's tab list with the service account, and Telegram returned a 409 to a second poller.
  **Not yet seen:** a real 08:00 SGT question (first one due 2026-11-05).

## Next
Top of [TODO.md](TODO.md).
