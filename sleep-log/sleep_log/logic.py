"""Pure helpers: parse answers, find the sheet row for a date, compute the weekly average.

No network here — everything is unit-tested in tests/test_logic.py. The date and duration rules
mirror the web app (docs/decisions/0002-data-source.md) so both report the same numbers.
"""
from __future__ import annotations

import re
from datetime import date, timedelta

# Column indexes (0-based) in the year tab. Written: C/D (observations), F/G (times), I (remarks).
COL_DATE, COL_POSITIVE, COL_NEGATIVE, COL_DURATION, COL_SLEEP, COL_WAKE, COL_REMARKS = 0, 2, 3, 4, 5, 6, 8

# The columns /remark, /positive and /negative write to. Each key must appear in that column's header.
NOTE_COLS = {"remark": COL_REMARKS, "positive": COL_POSITIVE, "negative": COL_NEGATIVE}

_TIME = re.compile(
    r"^(?P<h>\d{1,2})(?:[:.]?(?P<m>\d{2}))?(?::\d{2})?\s*(?P<ap>am|pm|a\.m\.|p\.m\.)?$", re.I
)


def parse_time(text: str) -> str | None:
    """'23:30', '23.30', '2330', '11.30pm', '7am', '7' -> 'HH:MM'. Without am/pm it is a 24 h clock."""
    t = text.strip().lower()
    if t in ("midnight",):
        return "00:00"
    if t in ("noon",):
        return "12:00"
    m = _TIME.match(t)
    if not m:
        return None
    h, mins, ap = int(m["h"]), int(m["m"] or 0), m["ap"]
    if mins > 59:
        return None
    if ap:
        if not 1 <= h <= 12:
            return None
        if ap.startswith("a"):
            h = 0 if h == 12 else h
        else:
            h = 12 if h == 12 else h + 12
    elif h > 23:
        return None
    return f"{h:02d}:{mins:02d}"


def split_times(text: str) -> list[str]:
    """All clock times in a message, e.g. '23:30 7am' or '23:30 - 07:00' -> ['23:30', '07:00']."""
    parts = re.split(r"\s*(?:,|-|–|to|and|/)\s*|\s+(?![ap]\.?m)", text.strip(), flags=re.I)
    out = [parse_time(p) for p in parts if p]
    return [t for t in out if t] if all(out) else []


def clock_minutes(cell: str) -> int | None:
    """A time cell as minutes after midnight. Accepts '01:00', '1:00:00', '1:00 AM'."""
    m = re.match(r"^\s*(\d{1,2})[:.](\d{2})(?::\d{2})?\s*([ap]\.?m\.?)?\s*$", cell or "", re.I)
    if not m:
        return None
    h, mins = int(m[1]), int(m[2])
    if m[3]:
        if not 1 <= h <= 12:
            return None
        h = (0 if h == 12 else h) if m[3].lower().startswith("a") else (12 if h == 12 else h + 12)
    if h > 23 or mins > 59:
        return None
    return h * 60 + mins


def span_hours(start: int, end: int) -> float:
    """Hours from start to end clock minutes, wrapping past midnight."""
    return ((end - start) % 1440) / 60


def row_hours(row: list[str]) -> float | None:
    """Main sleep for a row: the Duration column if > 0, else computed from the times, else None."""
    def cell(i: int) -> str:
        return row[i].strip() if i < len(row) else ""

    try:
        d = float(cell(COL_DURATION))
        if d > 0:
            return d
    except ValueError:
        pass
    s, w = clock_minutes(cell(COL_SLEEP)), clock_minutes(cell(COL_WAKE))
    if s is None or w is None:
        return None
    return span_hours(s, w) or None


def row_dates(rows: list[list[str]], tab_year: int) -> list[date | None]:
    """Dates for each row (rows[0] is the header -> None).

    'D/M' takes the tab year, except Nov/Dec rows before any Jan–Oct row (carry-over at the top of
    a tab) -> previous year. 'D/M/YY' or 'D/M/YYYY' uses its own year.
    """
    out: list[date | None] = [None]
    seen_jan_oct = False
    for row in rows[1:]:
        cell = row[COL_DATE].strip() if row else ""
        m = re.match(r"^(\d{1,2})/(\d{1,2})(?:/(\d{2}|\d{4}))?$", cell)
        if not m:
            out.append(None)
            continue
        d, mo = int(m[1]), int(m[2])
        if m[3]:
            y = int(m[3]) + (2000 if len(m[3]) == 2 else 0)
        else:
            y = tab_year - 1 if mo >= 11 and not seen_jan_oct else tab_year
        if mo <= 10:
            seen_jan_oct = True
        try:
            out.append(date(y, mo, d))
        except ValueError:
            out.append(None)
    return out


def find_row(rows: list[list[str]], tab_year: int, day: date) -> int | None:
    """Index into rows of the row for `day`. With duplicates, prefer one that has times, else the last."""
    dates = row_dates(rows, tab_year)
    hits = [i for i, d in enumerate(dates) if d == day]
    if not hits:
        return None
    with_times = [i for i in hits if any(_cell(rows[i], c) for c in (COL_SLEEP, COL_WAKE))]
    return with_times[0] if with_times else hits[-1]


def free_row(rows: list[list[str]], tab_year: int) -> int:
    """Where a missing date goes: the first row after the last dated row whose date cell is empty,
    else a new row at the end. Returned as an index into rows (may equal len(rows))."""
    dates = row_dates(rows, tab_year)
    last = max((i for i, d in enumerate(dates) if d), default=0)
    for i in range(last + 1, len(rows)):
        if not _cell(rows[i], COL_DATE):
            return i
    return len(rows)


def nightly_hours(tabs: list[tuple[list[list[str]], int]]) -> dict[date, float]:
    """Merge (rows, tab_year) tabs into date -> main sleep hours. Unlogged nights are absent."""
    out: dict[date, float] = {}
    for rows, year in tabs:
        for row, d in zip(rows, row_dates(rows, year)):
            h = row_hours(row) if d else None
            if d and h is not None and d not in out:
                out[d] = h
    return out


def week_average(nights: dict[date, float], today: date) -> tuple[float | None, int]:
    """Average over the 7 days ending today, logged nights only -> (average or None, nights logged)."""
    hs = [nights[d] for d in (today - timedelta(days=k) for k in range(7)) if d in nights]
    return (sum(hs) / len(hs) if hs else None, len(hs))


def check_header(header: list[str]) -> str | None:
    """None if F/G/I look like the sleep, wake and remarks columns, else a reason not to write."""
    f, g = _cell(header, COL_SLEEP).lower(), _cell(header, COL_WAKE).lower()
    if "sleep" not in f or "wake" not in g:
        return f"Columns F/G are '{f}' / '{g}', expected sleep time / wake time — not writing."
    i = _cell(header, COL_REMARKS).lower()
    if "remark" not in i:
        return f"Column I is '{i}', expected remarks — not writing."
    return None


def check_note_header(header: list[str], kind: str) -> str | None:
    """None if the column for this note kind has the expected header, else a reason not to write."""
    col = NOTE_COLS[kind]
    name = _cell(header, col).lower()
    if kind not in name:
        return f"Column {'ABCDEFGHI'[col]} is '{name}', expected {kind} — not writing."
    return None


def is_logged(row: list[str]) -> bool:
    """True when a row already has both sleep and wake time, so the morning question is not needed."""
    return bool(_cell(row, COL_SLEEP) and _cell(row, COL_WAKE))


def merge_remarks(old: str, new: str) -> str:
    """Add a new remark below what is already in the cell. Hand-typed remarks are never replaced."""
    old, new = old.strip(), new.strip()
    if not old or old == new:
        return new
    return f"{old}\n{new}"


def _cell(row: list[str], i: int) -> str:
    return row[i].strip() if i < len(row) else ""
