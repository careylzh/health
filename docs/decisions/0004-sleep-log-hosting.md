# 0004 — Sleep Log bot runs on a DigitalOcean droplet
**Date:** 2026-11-04 · **Status:** accepted

## Context
The bot uses long polling (0003), so a process must be running at 08:00 SGT. It only ever ran inside
a Claude session, so no 08:00 message arrived. The Mac is not on 24/7.

## Decision
A DigitalOcean droplet that Carey created: `sleep-log-tele-bot`, 165.245.190.59, SGP1, Ubuntu 24.04,
512 MB (plus a 1 GB swapfile so pip doesn't run out of memory). The bot runs as a system user
`sleeplog` from `/opt/sleep-log` under systemd (`sleep-log/deploy/sleep-log.service`) with
`Restart=always` and a sandbox (ProtectSystem=strict, ProtectHome, NoNewPrivileges). The secrets
(`.env`, `service-account.json`) are copied by `deploy/deploy.sh` over SSH, mode 600. They are
never in git. The service account and its Google project (`sleep-log-513522`) still provide sheet
access. Nothing runs on GCP.

## Rejected
- **The Mac (launchd):** it is not always on, and Carey ruled it out.
- **GCP e2-micro:** the earlier plan. Compute Engine and billing were never set up, and Carey picked
  DigitalOcean.
- **Cloud Run / serverless:** scales to zero, which doesn't work with long polling.

## Consequences
- Only one poller may run. Starting the bot anywhere else (the Mac, a Claude session) makes Telegram
  return 409 Conflict and both instances miss updates. Stop the droplet service first:
  `systemctl stop sleep-log`.
- The droplet clock is UTC. The bot uses `TIMEZONE` from `.env`, so 08:00 is still SGT.
- To verify a deploy, use `systemctl is-active sleep-log`, the journal, and a 409 on
  `getUpdates` from elsewhere. Don't assume it worked.
