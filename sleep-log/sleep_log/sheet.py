"""Google Sheet access through a service account (the only part that needs credentials)."""
from __future__ import annotations

import logging
from datetime import date

import gspread

from .logic import (
    COL_DATE,
    COL_SLEEP,
    COL_WAKE,
    check_header,
    find_row,
    free_row,
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

    def write_times(self, day: date, sleep: str | None, wake: str | None) -> tuple[str, str]:
        """Write sleep/wake into F/G of the row for `day` (adding the date if missing).
        None leaves that cell as it is. Returns the previous (F, G) values."""
        ws = self._tab(day.year, fallback=True)
        if ws is None:
            raise RuntimeError(f"No tab for {day.year} in the sheet")
        rows = ws.get_all_values()
        if reason := check_header(rows[0] if rows else []):
            raise RuntimeError(reason)
        i = find_row(rows, day.year, day)
        old = ("", "")
        if i is None:
            i = free_row(rows, day.year)
            ws.update_cell(i + 1, COL_DATE + 1, f"{day.day}/{day.month}")
        else:
            row = rows[i] + [""] * 9
            old = (row[COL_SLEEP], row[COL_WAKE])
        n = i + 1  # sheet rows are 1-based
        for col, value in ((COL_SLEEP, sleep), (COL_WAKE, wake)):
            if value is not None:
                a1 = gspread.utils.rowcol_to_a1(n, col + 1)
                # USER_ENTERED so "23:30" becomes a time value, like the hand-typed cells.
                ws.update(range_name=a1, values=[[value]], value_input_option="USER_ENTERED")
        return old

    def week(self, today: date) -> tuple[float | None, int]:
        """Average main sleep over the 7 days ending today (current + previous year tabs)."""
        tabs = []
        for year, fallback in ((today.year, True), (today.year - 1, False)):
            ws = self._tab(year, fallback)
            if ws is not None:
                tabs.append((ws.get_all_values(), year))
        return week_average(nightly_hours(tabs), today)
