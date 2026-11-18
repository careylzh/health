"""Pure helpers for cell-colour flags and the yearly tab rollover (decision 0008).

Carey shades rows in the year tab by hand:
- strong red (red, dark red 1–3)    -> "severe"  (e.g. psychotic symptoms that day)
- light red (light red 1–3)         -> "nosleep" (no sleep the night before)
- any green                         -> "green"   (no fixed meaning: a good streak, OR starting /
                                                  changing a med or supplement; decision 0009)
Other colours (orange, yellow, blue…) are not part of the key and are ignored.

The web app cannot see cell colours (the gviz feed has values only), so the bot writes a small
`flags` tab: ISO date, flag and, for green rows only, a short note saying what the row was (its
pharmacology cell, else its positive observation). The note is the same text as in the year tab
(equally link-readable); the web app shows it only behind the passcode.
"""
from __future__ import annotations

import re
from collections import Counter
from datetime import date, timedelta

FLAGS_TAB = "flags"
FLAGS_HEADER = ["Date", "Flag", "Note", "Written by the Sleep Log bot from cell colours; edits here are overwritten"]
FLAG_RANK = {"severe": 3, "nosleep": 2, "green": 1}  # sort order; a day can carry several flags
NOTE_MAX = 140

_DATE = r"(\d{1,2})/(\d{1,2})(?:/(\d{2}|\d{4}))?"
_SPAN = re.compile(rf"^{_DATE}(?:\s*[-–~]\s*{_DATE})?$")

DEFAULT_DURATION_FORMULA = "=(G{r} - F{r} + (G{r} < F{r})) * 24"


def classify(rgb: dict | None) -> str | None:
    """A Sheets backgroundColor {red, green, blue} (0–1, missing keys = 0) -> flag or None."""
    if not rgb:
        return None
    r, g, b = (float(rgb.get(k, 0)) for k in ("red", "green", "blue"))
    if min(r, g, b) > 0.95:  # white / no fill
        return None
    if r - max(g, b) > 0.15 and abs(g - b) < 0.12:  # red family (not orange: green ≈ blue)
        return "severe" if g < 0.3 else "nosleep"
    if g - max(r, b) > 0.08:  # green family
        return "green"
    return None


def row_flag(colours: list[dict | None]) -> str | None:
    """Flag for one row from its cells' colours: the date cell (A) if it is in the key, else the
    most common flag among the other cells (ties -> the more serious one)."""
    if colours:
        first = classify(colours[0])
        if first:
            return first
    counts = Counter(f for f in (classify(c) for c in colours[1:]) if f)
    if not counts:
        return None
    return max(counts, key=lambda f: (counts[f], FLAG_RANK[f]))


def _year(m3: str | None) -> int | None:
    return None if not m3 else int(m3) + (2000 if len(m3) == 2 else 0)


def row_spans(date_cells: list[str], tab_year: int) -> list[tuple[date, date] | None]:
    """(first, last) day for each date cell. Accepts 'D/M', 'D/M/YY(YY)' and ranges such as
    '18/12-22/12' or '21/1/26-10/2/26'. Year rules match logic.row_dates: an explicit year wins;
    Nov/Dec before any Jan–Oct row is last year's carry-over. A range's end takes the start's year,
    plus one if it would otherwise end before it starts."""
    out: list[tuple[date, date] | None] = []
    seen_jan_oct = False
    for cell in date_cells:
        m = _SPAN.match((cell or "").strip())
        if not m:
            out.append(None)
            continue
        d1, mo1 = int(m[1]), int(m[2])
        y1 = _year(m[3]) or (tab_year - 1 if mo1 >= 11 and not seen_jan_oct else tab_year)
        if mo1 <= 10:
            seen_jan_oct = True
        try:
            start = date(y1, mo1, d1)
            if m[4]:
                d2, mo2 = int(m[4]), int(m[5])
                y2 = _year(m[6]) or y1
                end = date(y2, mo2, d2)
                if end < start and not m[6]:
                    end = date(y2 + 1, mo2, d2)
            else:
                end = start
        except ValueError:
            out.append(None)
            continue
        out.append((start, end) if end >= start and (end - start).days <= 366 else None)
    return out


def green_note(pharm: str, positive: str) -> str:
    """What a green row was about: its pharmacology cell, or its positive observation when the
    pharmacology cell is empty or only a time such as "(10.30pm)". One line, at most NOTE_MAX."""
    def clean(t: str) -> str:
        return re.sub(r"\s+", " ", (t or "")).strip(" ,;/-")

    p = clean(pharm)
    if not re.search(r"[a-z]{3,}", re.sub(r"\b[ap]\.?m\b", "", p, flags=re.I), re.I):
        p = ""
    text = p or clean(positive)
    return text if len(text) <= NOTE_MAX else text[: NOTE_MAX - 1].rstrip() + "…"


Row = tuple[str, list[dict | None], str, str]  # date cell, A–I colours, pharmacology (B), positive (C)


def flags_by_day(tabs: list[tuple[list[Row], int]]) -> dict[date, dict[str, list[str]]]:
    """Merge (rows, tab year) tabs into day -> {flag: [notes]}. rows[0] is the header.
    A flagged range row flags every day in it. Two rows for one day can give it two flags
    (a light-red no-sleep row and a green "started a new supplement" row). Only green rows
    carry a note."""
    out: dict[date, dict[str, list[str]]] = {}
    for rows, year in tabs:
        body = rows[1:]
        for span, (_, cols, pharm, positive) in zip(row_spans([r[0] for r in body], year), body):
            flag = row_flag(cols) if span else None
            if not flag:
                continue
            note = green_note(pharm, positive) if flag == "green" else ""
            day = span[0]
            while day <= span[1]:
                notes = out.setdefault(day, {}).setdefault(flag, [])
                if note and note not in notes:
                    notes.append(note)
                day += timedelta(days=1)
    return out


def flag_rows(flags: dict[date, dict[str, list[str]]]) -> list[list[str]]:
    """The `flags` tab contents: header, then one row per (day, flag), oldest first, the more
    serious flag first within a day. Notes of one day's green rows are joined with " · "."""
    rows = [
        [d.isoformat(), f, " · ".join(flags[d][f])]
        for d in sorted(flags)
        for f in sorted(flags[d], key=lambda f: -FLAG_RANK[f])
    ]
    return [FLAGS_HEADER] + rows


# --- Yearly tab rollover ---------------------------------------------------------------------

def rollover_target(today: date, titles: list[str]) -> int | None:
    """Which year tab to create today, if any: next year's on 31 Dec, or this year's if it is
    somehow still missing (the bot was down over New Year). None when nothing is needed."""
    if (today.month, today.day) == (12, 31) and str(today.year + 1) not in titles:
        return today.year + 1
    if str(today.year) not in titles:
        return today.year
    return None


def template_title(target: int, titles: list[str]) -> str | None:
    """The newest year tab before `target` to copy (headers, formats, formulas)."""
    years = [int(t) for t in titles if re.fullmatch(r"\d{4}", t) and int(t) < target]
    return str(max(years)) if years else None


def year_days(year: int) -> list[date]:
    d, out = date(year, 1, 1), []
    while d.year == year:
        out.append(d)
        d += timedelta(days=1)
    return out


def shift_formula(formula: str, from_row: int, to_row: int) -> str:
    """Re-point a one-row formula ('=(G119 - F119 + …') at another row. Only cell references on
    `from_row` change; absolute rows ($5) and other rows stay as they are."""
    return re.sub(
        rf"(?<![A-Za-z$])(\$?[A-Z]{{1,3}})(?<!\$){from_row}(?!\d)",
        lambda m: f"{m[1]}{to_row}",
        formula,
    )


def duration_formulas(template_formula: str | None, template_row: int, first_row: int, n: int) -> list[str]:
    """Duration (E) formulas for rows first_row … first_row+n-1, copied from the template's."""
    if not template_formula or not template_formula.startswith("="):
        return [DEFAULT_DURATION_FORMULA.format(r=r) for r in range(first_row, first_row + n)]
    return [shift_formula(template_formula, template_row, r) for r in range(first_row, first_row + n)]
