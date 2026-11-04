"""Sleep Log — a Telegram bot that asks for last night's sleep and wake time and a remark every
morning, writes them to columns F, G and I of the health sheet, and replies with the past week's
average. If today is already logged, the morning question is skipped.

Run:  python -m sleep_log.bot   (settings come from environment variables / .env, see README)
"""
from __future__ import annotations

import asyncio
import logging
import os
from datetime import date, datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

from .logic import parse_time, split_times
from .sheet import Sheet

BOT_NAME = "Sleep Log"
Q_SLEEP = "🌙 What time did you sleep last night? (e.g. 23:30 or 11.30pm)"
Q_WAKE = "☀️ What time did you wake up?"
Q_REMARKS = "📝 Any remarks for last night? (or 'skip')"
CATCH_UP = timedelta(hours=4)  # ask late (up to 12:00 for 08:00) if the bot was down at ASK_AT
HELP = (
    "I ask at {at} every day.\n"
    "/log — answer now · /week — past 7 days · /cancel — stop asking\n"
    "If today is already logged, I don't ask that morning.\n"
    "Times without am/pm are 24 h. Reply 'skip' to leave one blank."
)

log = logging.getLogger("sleep_log")


def load_env(path: Path) -> None:
    """Tiny .env reader (KEY=value lines) so no extra dependency is needed."""
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def env(name: str, default: str | None = None) -> str:
    v = os.environ.get(name, default)
    if v is None:
        raise SystemExit(f"Missing setting {name} (see .env.example)")
    return v


def today(ctx: ContextTypes.DEFAULT_TYPE) -> date:
    return datetime.now(ctx.bot_data["tz"]).date()


def allowed(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> bool:
    return update.effective_chat is not None and update.effective_chat.id == ctx.bot_data["chat_id"]


def fmt_week(avg: float | None, n: int) -> str:
    if avg is None:
        return "Past 7 days: no nights logged."
    nights = "night" if n == 1 else "nights"
    return f"Past 7 days: avg {avg:.1f} h ({n} of 7 {nights} logged)."


async def ask(chat_id: int, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    # The date is fixed when asking, so an answer sent after midnight still lands on the right row.
    ctx.chat_data.update(step="sleep", day=today(ctx).isoformat(), sleep=None, wake=None)
    await ctx.bot.send_message(chat_id, Q_SLEEP)


async def morning(ctx: ContextTypes.DEFAULT_TYPE) -> None:
    """The daily question — skipped when today's row already has sleep and wake time
    (answered earlier with /log, or typed into the sheet by hand)."""
    sheet: Sheet = ctx.bot_data["sheet"]
    day = today(ctx)
    try:
        done = await asyncio.to_thread(sheet.logged, day)
    except Exception:  # can't read the sheet: asking is safer than staying silent
        log.exception("couldn't check whether %s is logged; asking anyway", day)
        done = False
    if done:
        log.info("%s already logged; skipping the morning question", day)
        return
    if ctx.chat_data.get("step"):
        log.info("a /log is in progress; not interrupting it")
        return
    await ask(ctx.job.chat_id, ctx)


async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not allowed(update, ctx):
        # Lets the owner find their chat id during setup; nobody else can do anything.
        log.info("/start from chat id %s (not the configured chat)", update.effective_chat.id)
        await update.message.reply_text(f"Your chat id is {update.effective_chat.id}.")
        return
    await update.message.reply_text(HELP.format(at=ctx.bot_data["at"]))


async def cmd_log(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if allowed(update, ctx):
        await ask(update.effective_chat.id, ctx)


async def cmd_cancel(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if allowed(update, ctx):
        ctx.chat_data.clear()
        await update.message.reply_text("OK, nothing saved.")


async def cmd_week(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not allowed(update, ctx):
        return
    sheet: Sheet = ctx.bot_data["sheet"]
    avg, n = await asyncio.to_thread(sheet.week, today(ctx))
    await update.message.reply_text(fmt_week(avg, n))


async def on_text(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not allowed(update, ctx):
        return
    step = ctx.chat_data.get("step")
    text = update.message.text.strip()
    if step is None:
        await update.message.reply_text("Send /log to record last night.")
        return

    skip = text.lower() in ("skip", "-", "?")
    if step == "sleep":
        both = split_times(text)
        if len(both) == 2:  # "23:30 7:00" answers both questions at once
            ctx.chat_data.update(sleep=both[0], wake=both[1], step="remarks")
            await update.message.reply_text(Q_REMARKS)
            return
        t = None if skip else parse_time(text)
        if t is None and not skip:
            await update.message.reply_text("I didn't get that time. Try 23:30 or 11.30pm (or 'skip').")
            return
        ctx.chat_data.update(sleep=t, step="wake")
        await update.message.reply_text(Q_WAKE)
    elif step == "wake":
        t = None if skip else parse_time(text)
        if t is None and not skip:
            await update.message.reply_text("I didn't get that time. Try 07:00 or 7am (or 'skip').")
            return
        ctx.chat_data.update(wake=t, step="remarks")
        await update.message.reply_text(Q_REMARKS)
    elif step == "remarks":
        await save(update, ctx, None if skip else text)


async def save(update: Update, ctx: ContextTypes.DEFAULT_TYPE, remarks: str | None) -> None:
    sheet: Sheet = ctx.bot_data["sheet"]
    day = date.fromisoformat(ctx.chat_data["day"])
    sleep, wake = ctx.chat_data.get("sleep"), ctx.chat_data.get("wake")
    ctx.chat_data.clear()
    if sleep is None and wake is None and remarks is None:
        await update.message.reply_text("Nothing to save.")
        return
    try:
        old = await asyncio.to_thread(sheet.write_entry, day, sleep, wake, remarks)
        avg, n = await asyncio.to_thread(sheet.week, today(ctx))
    except Exception as e:  # tell the user rather than failing silently
        log.exception("sheet write failed")
        await update.message.reply_text(f"⚠️ Couldn't update the sheet: {e}")
        return
    lines = [f"Saved {day.day}/{day.month}: slept {sleep or '—'}, woke {wake or '—'}."]
    replaced = [f"{lbl} was {o}" for lbl, o, new in (("sleep", old[0], sleep), ("wake", old[1], wake)) if o and new]
    if replaced:
        lines.append("(" + ", ".join(replaced) + ")")
    if remarks is not None:
        lines.append("Remark added." if old[2].strip() and old[2].strip() != remarks.strip() else "Remark saved.")
    lines.append(fmt_week(avg, n))
    await update.message.reply_text("\n".join(lines))


async def post_init(app: Application) -> None:
    try:
        await app.bot.set_my_name(BOT_NAME)
    except Exception:  # rate-limited or unchanged; the BotFather name still applies
        log.info("set_my_name skipped")


def main() -> None:
    load_env(Path(__file__).resolve().parent.parent / ".env")
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)  # its log lines contain the bot token

    tz = ZoneInfo(env("TIMEZONE", "Asia/Singapore"))
    hh, mm = (int(x) for x in env("ASK_AT", "08:00").split(":"))
    chat_id = int(env("TELEGRAM_CHAT_ID", "0") or 0)
    gid = env("SHEET_FALLBACK_GID", "483177940")

    app = Application.builder().token(env("TELEGRAM_BOT_TOKEN")).post_init(post_init).build()
    app.bot_data.update(
        tz=tz,
        at=f"{hh:02d}:{mm:02d}",
        chat_id=chat_id,
        sheet=Sheet(
            env("SHEET_ID", "12db7k6f9WWKvmAUTc88vLocgiRUHWAgPxtoF8DnjGEU"),
            env("GOOGLE_CREDENTIALS_FILE", "service-account.json"),
            int(gid) if gid else None,
        ),
    )
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("log", cmd_log))
    app.add_handler(CommandHandler("week", cmd_week))
    app.add_handler(CommandHandler("cancel", cmd_cancel))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_text))

    if chat_id:
        # misfire grace: if the machine was asleep at 8:00, still ask when it wakes (same morning).
        app.job_queue.run_daily(
            morning, time(hh, mm, tzinfo=tz), chat_id=chat_id, name="morning",
            job_kwargs={"misfire_grace_time": int(CATCH_UP.total_seconds()), "coalesce": True},
        )
        # If the bot (re)starts after ASK_AT but within the catch-up window, ask now — morning()
        # still skips it when today is already logged.
        now = datetime.now(tz)
        ask_at = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
        if ask_at < now < ask_at + CATCH_UP:
            app.job_queue.run_once(morning, 5, chat_id=chat_id, name="catch-up")
    else:
        log.warning("TELEGRAM_CHAT_ID not set: send /start to the bot to get it, then restart.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
