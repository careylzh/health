"""Conversation flow with a fake sheet and fake Telegram objects (no network, no credentials)."""
import asyncio
from datetime import date
from types import SimpleNamespace
from zoneinfo import ZoneInfo

from sleep_log import bot

CHAT = 42


class FakeSheet:
    def __init__(self, logged=False):
        self.writes = []
        self.is_logged = logged

    def write_entry(self, day, sleep, wake, remarks):
        self.writes.append((day, sleep, wake, remarks))
        return ("23:00", "", "")

    def logged(self, day):
        return self.is_logged

    def week(self, today):
        return (7.25, 5)


class FakeBot:
    def __init__(self):
        self.sent = []

    async def send_message(self, chat_id, text):
        self.sent.append(text)


def make(chat_id=CHAT):
    sheet, fbot = FakeSheet(), FakeBot()
    ctx = SimpleNamespace(
        bot=fbot, chat_data={},
        bot_data={"tz": ZoneInfo("Asia/Singapore"), "chat_id": CHAT, "sheet": sheet, "at": "08:00"},
        job=SimpleNamespace(chat_id=CHAT),
    )
    replies = []

    def update(text):
        async def reply_text(t):
            replies.append(t)
        return SimpleNamespace(effective_chat=SimpleNamespace(id=chat_id),
                               message=SimpleNamespace(text=text, reply_text=reply_text))
    return ctx, sheet, fbot, replies, update


def test_morning_flow_writes_and_reports_week():
    ctx, sheet, fbot, replies, update = make()
    asyncio.run(bot.morning(ctx))
    assert fbot.sent == [bot.Q_SLEEP]
    asyncio.run(bot.on_text(update("11.30pm"), ctx))
    assert replies[-1] == bot.Q_WAKE
    asyncio.run(bot.on_text(update("7am"), ctx))
    assert replies[-1] == bot.Q_REMARKS and not sheet.writes
    asyncio.run(bot.on_text(update("woke once at 3"), ctx))
    day, s, w, r = sheet.writes[0]
    assert (s, w, r) == ("23:30", "07:00", "woke once at 3")
    assert isinstance(day, date)
    assert "slept 23:30, woke 07:00" in replies[-1]
    assert "sleep was 23:00" in replies[-1]
    assert "avg 7.2 h (5 of 7 nights logged)" in replies[-1]
    assert ctx.chat_data == {}


def test_both_times_in_one_message_and_bad_input():
    ctx, sheet, _, replies, update = make()
    asyncio.run(bot.morning(ctx))
    asyncio.run(bot.on_text(update("dunno"), ctx))
    assert "didn't get" in replies[-1] and not sheet.writes
    asyncio.run(bot.on_text(update("23:30 06:45"), ctx))
    assert replies[-1] == bot.Q_REMARKS
    asyncio.run(bot.on_text(update("skip"), ctx))
    assert sheet.writes[0][1:] == ("23:30", "06:45", None)


def test_skip_leaves_cell_unchanged():
    ctx, sheet, _, _, update = make()
    asyncio.run(bot.morning(ctx))
    asyncio.run(bot.on_text(update("skip"), ctx))
    asyncio.run(bot.on_text(update("07:00"), ctx))
    asyncio.run(bot.on_text(update("skip"), ctx))
    assert sheet.writes[0][1:] == (None, "07:00", None)


def test_strangers_cannot_write():
    ctx, sheet, _, replies, update = make(chat_id=999)
    ctx.chat_data.update(step="wake", day="2026-11-03", sleep="23:00")
    asyncio.run(bot.on_text(update("07:00"), ctx))
    assert not sheet.writes and not replies


def test_morning_question_skipped_when_today_already_logged():
    ctx, sheet, fbot, _, _ = make()
    sheet.is_logged = True
    asyncio.run(bot.morning(ctx))
    assert fbot.sent == [] and ctx.chat_data == {}


def test_morning_does_not_interrupt_a_log_in_progress():
    ctx, sheet, fbot, _, update = make()
    asyncio.run(bot.cmd_log(update("/log"), ctx))
    asyncio.run(bot.on_text(update("23:00"), ctx))
    asyncio.run(bot.morning(ctx))
    assert fbot.sent == [bot.Q_SLEEP] and ctx.chat_data["step"] == "wake"


def test_morning_asks_when_sheet_check_fails():
    ctx, sheet, fbot, _, _ = make()
    def boom(day):
        raise RuntimeError("network")
    sheet.logged = boom
    asyncio.run(bot.morning(ctx))
    assert fbot.sent == [bot.Q_SLEEP]


def test_remark_only_is_saved():
    ctx, sheet, _, replies, update = make()
    asyncio.run(bot.morning(ctx))
    asyncio.run(bot.on_text(update("skip"), ctx))
    asyncio.run(bot.on_text(update("skip"), ctx))
    asyncio.run(bot.on_text(update("napped 2pm"), ctx))
    assert sheet.writes[0][1:] == (None, None, "napped 2pm")
    assert "Remark saved." in replies[-1]
