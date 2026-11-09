# 0007 — Build and deploy from a Claude cloud session
**Date:** 2026-11-09 · **Status:** accepted

## Context
Carey wants to build and deploy from the Claude mobile app, which runs Claude Code in a cloud
session. The site already deploys on push to `main`. The bot only deployed from the Mac, with
`sleep-log/deploy/deploy.sh` and root SSH.

## Decision
- A push to `main` that touches `sleep-log/` runs `.github/workflows/deploy-bot.yml`: pytest, then
  deploy. A failing test stops the deploy.
- GitHub holds one secret, `SLEEP_LOG_DEPLOY_KEY`. On the droplet that key is limited to a forced
  command, `/usr/local/bin/sleep-log-deploy` (`deploy/remote-deploy.sh`), with `restrict`. The key
  cannot open a shell.
- The deploy script clones public `main` and copies it as the `sleeplog` user. It does not install
  the systemd unit, so a push cannot gain root. Unit changes still need `deploy.sh` from the Mac.
- The bot token and Google key stay on the droplet and never go to GitHub or a cloud session.
- One-time setup is `deploy/setup-actions-deploy.sh`, run by Carey, which also lists how to undo it.

## Rejected
- **Keys in a Claude cloud environment.** Its environment variables can be read by any command in
  the session and the docs warn against secrets there. The docs describe an HTTP/HTTPS proxy and
  don't mention SSH. The droplet already has the bot's secrets, so a session doesn't need them.
- **Root SSH key in a GitHub secret.** A leak would give a root shell on the droplet.

## Consequences
- Actions logs are public on this repo, so the deploy must never print the journal or bot output.
- Cloud sessions cannot read the bot's logs or touch the live sheet. Check those from the Mac.
- A deploy between 08:00 and 12:00 SGT can send the morning question again if today isn't logged.
