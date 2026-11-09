"""Sheet note writes against a fake worksheet. Synthetic rows only; no network or credentials."""
from datetime import date

import pytest

from sleep_log.sheet import Sheet

HEADER = ["Dates", "Pharm", "Positive Observations", "Negative observations ", "Duration",
          "Sleep time", "Wake time", "reasons", "remarks"]
DAY = date(2026, 3, 2)


class FakeWorksheet:
    def __init__(self, rows):
        self.rows = rows
        self.cells = []  # (a1, value, mode), in write order

    def get_all_values(self):
        return self.rows

    def update_cell(self, row, col, value):
        self.cells.append(((row, col), value, None))

    def update(self, range_name, values, value_input_option):
        self.cells.append((range_name, values[0][0], value_input_option))


def sheet_with(rows):
    ws = FakeWorksheet(rows)
    sheet = Sheet.__new__(Sheet)
    sheet._tab = lambda year, fallback: ws
    return sheet, ws


def rows_with_day():
    # Short row on purpose: the API can omit trailing empty cells.
    return [HEADER, ["1/3"], ["2/3", "", "good", "", "", "", "", "", "old remark"]]


def test_remark_replaces_cell_i_as_raw_text():
    sheet, ws = sheet_with(rows_with_day())
    assert sheet.write_note(DAY, "remark", " =new ", replace=True) == "old remark"
    assert ws.cells == [("I3", "=new", "RAW")]


def test_positive_adds_below_existing_text_in_c():
    sheet, ws = sheet_with(rows_with_day())
    assert sheet.write_note(DAY, "positive", "calm", replace=False) == "good"
    assert ws.cells == [("C3", "good\ncalm", "RAW")]


def test_negative_writes_d_on_a_short_row():
    sheet, ws = sheet_with([HEADER, ["2/3"]])
    assert sheet.write_note(DAY, "negative", "tired", replace=False) == ""
    assert ws.cells == [("D2", "tired", "RAW")]


def test_missing_date_is_added_first():
    sheet, ws = sheet_with([HEADER, ["1/3"]])
    sheet.write_note(DAY, "positive", "calm", replace=False)
    assert ws.cells == [((3, 1), "2/3", None), ("C3", "calm", "RAW")]


def test_wrong_header_refuses_to_write():
    sheet, ws = sheet_with([["Dates", "", "Something else"], ["2/3"]])
    with pytest.raises(RuntimeError, match="Column C"):
        sheet.write_note(DAY, "positive", "calm", replace=False)
    assert ws.cells == []


def test_read_note():
    sheet, _ = sheet_with(rows_with_day())
    assert sheet.read_note(DAY, "remark") == "old remark"
    assert sheet.read_note(DAY, "negative") == ""
    assert sheet.read_note(date(2026, 3, 9), "remark") == ""
