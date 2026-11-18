"""Google Sheet access through a service account (the only part that needs credentials)."""
from __future__ import annotations

import logging
from datetime import date

import gspread

from .flags import (
    FLAGS_TAB,
    duration_formulas,
    flag_rows,
    flags_by_day,
    rollover_target,
    template_title,
    year_days,
)
from .logic import (
    COL_DATE,
    COL_REMARKS,
    COL_SLEEP,
    COL_WAKE,
    NOTE_COLS,
    check_header,
    check_note_header,
    find_row,
    free_row,
    is_logged,
    merge_remarks,
    nightly_hours,
    week_average,
)

log = logging.getLogger(__name__)


class Sheet:
    def __init__(self, sheet_id: str, creds_file: str, fallback_gid: int | None = None):
        self._book = gspread.service_account(filename=creds_file).open_by_key(sheet_id)
        self._fallback_gid = fallback_gid

    def _tab(self, year: int, fallback: bool) -> gspread.Worksheet | None:
        """The tab named after the year. Unlike gviz, a missing name raises instead of silently
        returning the first tab. Only the current year may fall back to the configured gid."""
        try:
            return self._book.worksheet(str(year))
        except gspread.WorksheetNotFound:
            if fallback and self._fallback_gid is not None:
                log.warning("No tab named %s; using gid %s", year, self._fallback_gid)
                return self._book.get_worksheet_by_id(self._fallback_gid)
            return None

    def write_entry(
        self, day: date, sleep: str | None, wake: str | None, remarks: str | None
    ) -> tuple[str, str, str]:
        """Write sleep/wake into F/G and remarks into I of the row for `day` (adding the date if
        missing). None leaves that cell as it is; remarks are added below any existing text.
        Returns the previous (F, G, I) values."""
        ws = self._tab(day.year, fallback=True)
        if ws is None:
            raise RuntimeError(f"No tab for {day.year} in the sheet")
        rows = ws.get_all_values()
        if reason := check_header(rows[0] if rows else []):
            raise RuntimeError(reason)
        i = find_row(rows, day.year, day)
        old = ("", "", "")
        if i is None:
            i = free_row(rows, day.year)
            ws.update_cell(i + 1, COL_DATE + 1, f"{day.day}/{day.month}")
        else:
            row = rows[i] + [""] * 9
            old = (row[COL_SLEEP], row[COL_WAKE], row[COL_REMARKS])
        if remarks is not None:
            remarks = merge_remarks(old[2], remarks)
        n = i + 1  # sheet rows are 1-based
        for col, value, mode in (
            # USER_ENTERED so "23:30" becomes a time value, like the hand-typed cells.
            (COL_SLEEP, sleep, "USER_ENTERED"),
            (COL_WAKE, wake, "USER_ENTERED"),
            # RAW so a remark starting with "=" or "+" is kept as text, not run as a formula.
            (COL_REMARKS, remarks, "RAW"),
        ):
            if value is not None:
                a1 = gspread.utils.rowcol_to_a1(n, col + 1)
                ws.update(range_name=a1, values=[[value]], value_input_option=mode)
        return old

    def read_note(self, day: date, kind: str) -> str:
        """The current text of a note column for `day` ('' if the row or the text is missing)."""
        ws = self._tab(day.year, fallback=True)
        if ws is None:
            return ""
        rows = ws.get_all_values()
        i = find_row(rows, day.year, day)
        return "" if i is None else (rows[i] + [""] * 9)[NOTE_COLS[kind]].strip()

    def write_note(self, day: date, kind: str, text: str) -> None:
        """Add text on a new line below a note column of the row for `day` (adding the date if
        missing). Existing text is never replaced."""
        ws = self._tab(day.year, fallback=True)
        if ws is None:
            raise RuntimeError(f"No tab for {day.year} in the sheet")
        rows = ws.get_all_values()
        if reason := check_note_header(rows[0] if rows else [], kind):
            raise RuntimeError(reason)
        col = NOTE_COLS[kind]
        i = find_row(rows, day.year, day)
        old = ""
        if i is None:
            i = free_row(rows, day.year)
            ws.update_cell(i + 1, COL_DATE + 1, f"{day.day}/{day.month}")
        else:
            old = (rows[i] + [""] * 9)[col]
        a1 = gspread.utils.rowcol_to_a1(i + 1, col + 1)
        # RAW so text starting with "=" or "+" is kept as text, not run as a formula.
        ws.update(range_name=a1, values=[[merge_remarks(old, text)]], value_input_option="RAW")

    def logged(self, day: date) -> bool:
        """True if the row for `day` already has both sleep and wake time."""
        ws = self._tab(day.year, fallback=True)
        if ws is None:
            return False
        rows = ws.get_all_values()
        i = find_row(rows, day.year, day)
        return i is not None and is_logged(rows[i])

    def week(self, today: date) -> tuple[float | None, int]:
        """Average main sleep over the 7 days ending today (current + previous year tabs)."""
        tabs = []
        for year, fallback in ((today.year, True), (today.year - 1, False)):
            ws = self._tab(year, fallback)
            if ws is not None:
                tabs.append((ws.get_all_values(), year))
        return week_average(nightly_hours(tabs), today)

    # --- Colour flags (decision 0008) -------------------------------------------------------

    def _colours(self, ws: gspread.Worksheet) -> tuple[list[str], list[list[dict | None]]]:
        """Date cells (column A, as shown) and A–I background colours for every row of a tab."""
        meta = self._book.fetch_sheet_metadata(params={
            "ranges": f"'{ws.title}'!A1:I{ws.row_count}",
            "includeGridData": "true",
            "fields": "sheets.data.rowData.values(formattedValue,effectiveFormat.backgroundColor)",
        })
        rows = meta["sheets"][0]["data"][0].get("rowData", [])
        dates, colours = [], []
        for row in rows:
            cells = row.get("values", [])
            dates.append(cells[0].get("formattedValue", "") if cells else "")
            colours.append([c.get("effectiveFormat", {}).get("backgroundColor") for c in cells])
        return dates, colours

    def sync_flags(self, today: date) -> int | None:
        """Rewrite the `flags` tab from the current and previous year tabs' cell colours.
        Returns the number of flagged days, or None when nothing changed."""
        tabs = []
        for year, fallback in ((today.year, True), (today.year - 1, False)):
            ws = self._tab(year, fallback)
            if ws is not None:
                dates, colours = self._colours(ws)
                tabs.append((dates, colours, year))
        rows = flag_rows(flags_by_day(tabs))
        try:
            out = self._book.worksheet(FLAGS_TAB)
        except gspread.WorksheetNotFound:
            out = self._book.add_worksheet(FLAGS_TAB, rows=max(len(rows), 100), cols=3)
        current = [r + [""] * (3 - len(r)) for r in out.get_all_values()]
        want = [r + [""] * (3 - len(r)) for r in rows]
        if current == want:
            return None
        out.clear()
        # RAW so ISO dates stay text and the web app reads exactly "2026-10-30".
        out.update(range_name="A1", values=rows, value_input_option="RAW")
        return len(rows) - 1

    # --- Yearly rollover (decision 0008) ----------------------------------------------------

    def ensure_year_tab(self, today: date) -> str | None:
        """On 31 Dec (or later, if missed) copy the newest year tab as next year's: same header,
        formats and Duration formula; entries and highlight colours cleared; every date of the
        new year filled in. Returns the new tab's title, or None if nothing was needed."""
        titles = [ws.title for ws in self._book.worksheets()]
        target = rollover_target(today, titles)
        if target is None:
            return None
        src_title = template_title(target, titles)
        if src_title is None:
            log.warning("No earlier year tab to copy for %s", target)
            return None
        src = self._book.worksheet(src_title)
        formulas = src.col_values(5, value_render_option="FORMULA")  # column E (Duration)
        tpl_row = max((i for i, f in enumerate(formulas, 1) if str(f).startswith("=")), default=0)
        tpl_formula = formulas[tpl_row - 1] if tpl_row else None

        new = self._book.duplicate_sheet(src.id, insert_sheet_index=0, new_sheet_name=str(target))
        days = year_days(target)
        last = len(days) + 1
        if new.row_count < last:
            new.add_rows(last - new.row_count)
        end_col = gspread.utils.rowcol_to_a1(1, new.col_count).rstrip("1")
        new.batch_clear([f"A2:{end_col}{new.row_count}"])
        self._book.batch_update({"requests": [{
            "repeatCell": {
                "range": {"sheetId": new.id, "startRowIndex": 1, "endRowIndex": new.row_count},
                "cell": {"userEnteredFormat": {"backgroundColor": {"red": 1, "green": 1, "blue": 1}}},
                "fields": "userEnteredFormat.backgroundColor",
            }
        }]})
        new.format(f"A2:A{last}", {"numberFormat": {"type": "DATE", "pattern": "d/m"}})
        new.update(range_name=f"A2:A{last}", values=[[d.isoformat()] for d in days],
                   value_input_option="USER_ENTERED")
        new.update(range_name=f"E2:E{last}", values=[[f] for f in duration_formulas(tpl_formula, tpl_row, 2, len(days))],
                   value_input_option="USER_ENTERED")
        log.info("Created tab %s from %s", target, src_title)
        return str(target)
