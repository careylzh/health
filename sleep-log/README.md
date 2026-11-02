# Sleep Log — Telegram bot

Every morning at **08:00** (Asia/Singapore) the bot asks:

1. 🌙 What time did you sleep last night?
2. ☀️ What time did you wake up?

It writes the answers to **column F (Sleep time)** and **column G (Wake time)** of today's row in
the health sheet, then replies with the **average sleep over the past 7 days**:

```
Saved 3/11: slept 23:30, woke 07:00.
Past 7 days: avg 6.8 h (5 of 7 nights logged).
```

- **Today's row** is the row dated today (the row for the night that just ended). If today has no
  row, the bot puts the date in the first empty row after the last dated one.
- **Times:** `23:30`, `23.30`, `2330`, `11.30pm`, `7am`. Without am/pm it reads a 24-hour clock.
  You can send both times in one message (`23:30 7:00`). `skip` leaves that cell as it is.
- **Weekly average:** the 7 days ending today, counting logged nights only. It uses the same rule
  as the website: the Duration column if it is above 0, otherwise the time from F to G. Extra naps
  in the notes are not counted. A night with no entry is left out, not counted as 0.
- Commands: `/log` asks now · `/week` shows the average · `/cancel` stops asking.
- Only your own chat (`TELEGRAM_CHAT_ID`) can use it. Anyone else gets their chat id back and
  nothing else.

## Setup (one time)

1. **Bot:** in Telegram, message **@BotFather** → `/newbot` → name **Sleep Log**, plus a username
   ending in `bot`. Copy the token. (The bot also sets its name to "Sleep Log" when it starts.)
2. **Google service account** (lets the bot write to the sheet):
   - console.cloud.google.com → create a project → enable the **Google Sheets API**.
   - IAM → Service accounts → create one → Keys → *Add key* → JSON. Save the file here as
     `service-account.json`. It is gitignored. **Never commit it.**
   - Open the sheet → **Share** → paste the service account's email
     (`…@….iam.gserviceaccount.com`) → **Editor**.
3. **Install and configure:**
   ```bash
   cd sleep-log
   python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
   cp .env.example .env        # paste the bot token
   .venv/bin/python -m sleep_log.bot
   ```
   Send `/start` to your bot. It replies with your chat id. Put that in `.env` as
   `TELEGRAM_CHAT_ID`, restart the bot, then send `/log` to try the full flow.

## Keeping it running

The bot has to be running at 08:00, because it polls Telegram and has no webhook or public URL.

- **On this Mac:** replace `REPO` in `com.careylzh.sleeplog.plist` with the absolute path to this
  folder, then:
  ```bash
  cp com.careylzh.sleeplog.plist ~/Library/LaunchAgents/
  launchctl load ~/Library/LaunchAgents/com.careylzh.sleeplog.plist
  ```
  If the Mac is asleep at 08:00, the question should come when it wakes, up to noon. This has not
  been checked on a real sleep/wake cycle. For a reliable 08:00, use an always-on machine.
- **Always-on machine** (Raspberry Pi, small VPS): the same three install commands, then run the
  bot under `systemd` or `tmux`.

## Tests

```bash
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q
```
Tests use synthetic rows and a fake sheet and Telegram. They need no network or credentials.
