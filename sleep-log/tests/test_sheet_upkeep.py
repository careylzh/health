"""Flag sync and yearly rollover against a fake workbook. Synthetic rows; no network."""
from datetime import date

import gspread

from sleep_log.flags import FLAGS_HEADER
from sleep_log.sheet import Sheet

SEVERE = {"red": 0.6}
GREEN = {"red": 0.58, "green": 0.77, "blue": 0.49}


class FakeWs:
    def __init__(self, title, rows=None, wid=1, row_count=10, col_count=9, e_col=None):
        self.title, self.id, self.row_count, self.col_count = title, wid, row_count, col_count
        self.rows = rows or []
        self.e_col = e_col or []
        self.calls = []

    def get_all_values(self):
        return self.rows

    def col_values(self, col, value_render_option=None):
        return self.e_col

    def clear(self):
        self.calls.append(("clear",))
        self.rows = []

    def update(self, range_name, values, value_input_option):
        self.calls.append(("update", range_name, values, value_input_option))

    def add_rows(self, n):
        self.calls.append(("add_rows", n))
        self.row_count += n

    def batch_clear(self, ranges):
        self.calls.append(("batch_clear", ranges))

    def format(self, rng, fmt):
        self.calls.append(("format", rng, fmt))


class FakeBook:
    def __init__(self, tabs, grid=None):
        self.tabs = {t.title: t for t in tabs}
        self.grid = grid or {}
        self.calls = []

    def worksheets(self):
        return list(self.tabs.values())

    def worksheet(self, title):
        if title not in self.tabs:
            raise gspread.WorksheetNotFound(title)
        return self.tabs[title]

    def add_worksheet(self, title, rows, cols):
        self.tabs[title] = FakeWs(title, wid=99)
        return self.tabs[title]

    def fetch_sheet_metadata(self, params):
        title = params["ranges"].split("!")[0].strip("'")
        return {"sheets": [{"data": [{"rowData": self.grid.get(title, [])}]}]}

    def duplicate_sheet(self, src_id, insert_sheet_index, new_sheet_name):
        self.calls.append(("duplicate", src_id, insert_sheet_index, new_sheet_name))
        self.tabs[new_sheet_name] = FakeWs(new_sheet_name, wid=7, row_count=200, col_count=28)
        return self.tabs[new_sheet_name]

    def batch_update(self, body):
        self.calls.append(("batch_update", body))


def cell(text, bg=None):
    c = {"formattedValue": text}
    if bg:
        c["effectiveFormat"] = {"backgroundColor": bg}
    return c


def sheet_on(book):
    s = Sheet.__new__(Sheet)
    s._book, s._fallback_gid = book, None
    return s


def test_sync_flags_writes_dates_and_flags_only():
    grid = {"2026": [
        {"values": [cell("Dates")]},
        {"values": [cell("1/3", SEVERE), cell("private words", SEVERE)]},
        {"values": [cell("2/3"), cell("x", GREEN), cell("y", GREEN)]},
        {"values": [cell("3/3"), cell("plain")]},
    ]}
    book = FakeBook([FakeWs("2026")], grid)
    assert sheet_on(book).sync_flags(date(2026, 3, 5)) == 2
    upd = [c for c in book.tabs["flags"].calls if c[0] == "update"][0]
    assert upd[2] == [FLAGS_HEADER, ["2026-03-01", "severe"], ["2026-03-02", "good"]]
    assert upd[3] == "RAW"
    assert "private" not in repr(book.tabs["flags"].calls)


def test_sync_flags_skips_the_write_when_nothing_changed():
    grid = {"2026": [{"values": [cell("Dates")]}, {"values": [cell("1/3", SEVERE)]}]}
    flags = FakeWs("flags", rows=[FLAGS_HEADER, ["2026-03-01", "severe"]])
    book = FakeBook([FakeWs("2026"), flags], grid)
    assert sheet_on(book).sync_flags(date(2026, 3, 5)) is None
    assert flags.calls == []


def test_ensure_year_tab_copies_the_template_on_new_years_eve():
    tpl = FakeWs("2026", wid=5, e_col=["Duration", "=(G2 - F2 + (G2 < F2)) * 24", "=(G3 - F3 + (G3 < F3)) * 24"])
    book = FakeBook([tpl, FakeWs("Literature", wid=6)])
    s = sheet_on(book)
    assert s.ensure_year_tab(date(2026, 12, 30)) is None
    assert s.ensure_year_tab(date(2026, 12, 31)) == "2027"
    assert book.calls[0] == ("duplicate", 5, 0, "2027")
    new = book.tabs["2027"]
    kinds = [c[0] for c in new.calls]
    assert kinds == ["add_rows", "batch_clear", "format", "update", "update"]
    assert new.calls[1][1] == ["A2:AB366"]  # entries cleared below the header, all columns
    dates = new.calls[3]
    assert dates[1] == "A2:A366" and dates[2][0] == ["2027-01-01"] and dates[2][-1] == ["2027-12-31"]
    formulas = new.calls[4]
    assert formulas[2][0] == ["=(G2 - F2 + (G2 < F2)) * 24"]
    assert formulas[2][-1] == ["=(G366 - F366 + (G366 < F366)) * 24"]
    bg = book.calls[1][1]["requests"][0]["repeatCell"]
    assert bg["range"]["startRowIndex"] == 1  # the header row keeps its colour
    # Running again the same day does nothing: the tab now exists.
    assert s.ensure_year_tab(date(2026, 12, 31)) is None
