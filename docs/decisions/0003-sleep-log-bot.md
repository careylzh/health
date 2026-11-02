# 0003 — Sleep Log Telegram bot (writes to the sheet)
**Date:** 2026-11-03 · **Status:** accepted

## Context
Carey asked for a Telegram bot that asks every day at 08:00 when they slept and woke, writes the
answers to columns F/G of the sheet, and reports the week's average sleep. The website stays
read-only with no secrets (decision 0002). Writing to the sheet needs credentials.

## Decision
- A **separate subfolder `sleep-log/`** in Python (`python-telegram-bot` + `gspread`). It is not
  part of the Vite site, the site's build, or its deploy.
- It writes through a **Google service account** that has Editor access to the sheet. The JSON key
  and the bot token live only in `sleep-log/.env` / `service-account.json`, both gitignored.
- It uses **long polling**, so there is no public URL or webhook. The bot has to run on a machine
  that is on at 08:00.
- **Only the configured chat id** can use the bot. Other chats only get their own chat id back.
- **Row = today's date** (the wake-up day; the columns say "last night"). If there is no row, the
  date goes into the first empty row after the last dated one. It writes F and G only. Duration
  (E) is left alone because the sheet computes or hand-fills it.
- **Tab:** the tab named after the current year, as on the website. The Sheets API raises an
  error for a missing tab instead of returning the first one. If that tab is missing, the bot uses
  the configured gid (`483177940`, the only tab on 2026-11-03). The previous year's tab is read by
  name only, for weeks that cross New Year.
- Before writing, it checks that the **F/G headers** say "sleep" and "wake". If they don't, it
  refuses to write.
- **Average** = the same rule as the website (Duration if > 0, else F→G). Unlogged nights are left
  out, and the reply says "n of 7 nights logged".

## Rejected
- Cloudflare Worker / GitHub Actions cron: no server to run, but Actions cron is often late, and a
  Worker would need hand-rolled Google JWT signing. Too much for one user.
- Writing Duration (E) as well: the user asked for F and G only.
