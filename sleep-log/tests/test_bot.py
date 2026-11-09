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
        self.notes = {}  # kind -> current cell text
        self.note_writes = []

    def read_note(self, day, kind):
        return self.notes.get(kind, "")

    def write_note(self, day, kind, text, replace):
        self.note_writes.append((day, kind, text, replace))
        return self.notes.get(kind, "")

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


def run_cmd(kind, update, ctx, text):
    asyncio.run(bot.note_cmd(kind)(update(text), ctx))


def test_remark_with_text_replaces_and_echoes_old_text():
    ctx, sheet, _, replies, update = make()
    sheet.notes["remark"] = "old words"
    run_cmd("remark", update, ctx, "/remark new words")
    assert sheet.note_writes[0][1:] == ("remark", "new words", True)
    assert "replaced" in replies[-1] and "old words" in replies[-1]
    assert ctx.chat_data == {}


def test_positive_and_negative_add_and_keep_line_breaks():
    ctx, sheet, _, replies, update = make()
    run_cmd("positive", update, ctx, "/positive slept well\nfelt calm")
    run_cmd("negative", update, ctx, "/negative@clzhsleeplogbot headache")
    assert [w[1:] for w in sheet.note_writes] == [
        ("positive", "slept well\nfelt calm", False),
        ("negative", "headache", False),
    ]
    assert "Negative observation saved" in replies[-1]


def test_bare_command_shows_cell_then_next_message_writes():
    ctx, sheet, _, replies, update = make()
    sheet.notes["remark"] = "typo here"
    run_cmd("remark", update, ctx, "/remark")
    assert "typo here" in replies[-1] and "replace it" in replies[-1] and not sheet.note_writes
    asyncio.run(bot.on_text(update("fixed"), ctx))
    assert sheet.note_writes[0][1:] == ("remark", "fixed", True)
    assert ctx.chat_data == {}


def test_bare_command_skip_changes_nothing():
    ctx, sheet, _, replies, update = make()
    run_cmd("positive", update, ctx, "/positive")
    assert "No positive observation" in replies[-1]
    asyncio.run(bot.on_text(update("skip"), ctx))
    assert not sheet.note_writes and ctx.chat_data == {}


def test_note_commands_leave_a_log_in_progress_alone():
    ctx, sheet, _, replies, update = make()
    asyncio.run(bot.cmd_log(update("/log"), ctx))
    run_cmd("positive", update, ctx, "/positive")
    assert "Finish /log" in replies[-1] and ctx.chat_data["step"] == "sleep"
    run_cmd("positive", update, ctx, "/positive good day")
    assert sheet.note_writes[0][2] == "good day" and ctx.chat_data["step"] == "sleep"


def test_unanswered_note_command_does_not_block_morning_question():
    ctx, _, fbot, _, update = make()
    run_cmd("remark", update, ctx, "/remark")
    asyncio.run(bot.morning(ctx))
    assert fbot.sent == [bot.Q_SLEEP] and ctx.chat_data["step"] == "sleep"


def test_newer_inline_note_drops_an_unanswered_one():
    ctx, sheet, _, _, update = make()
    run_cmd("remark", update, ctx, "/remark")
    run_cmd("positive", update, ctx, "/positive good day")
    assert ctx.chat_data == {} and len(sheet.note_writes) == 1


def test_strangers_cannot_use_note_commands():
    ctx, sheet, _, replies, update = make(chat_id=999)
    run_cmd("remark", update, ctx, "/remark hello")
    assert not sheet.note_writes and not replies
