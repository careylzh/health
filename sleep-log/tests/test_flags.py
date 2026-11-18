"""Colour flags and yearly rollover — synthetic rows only, never real health data."""
from datetime import date

from sleep_log.flags import (
    FLAGS_HEADER,
    classify,
    duration_formulas,
    flag_rows,
    flags_by_day,
    rollover_target,
    row_flag,
    row_spans,
    shift_formula,
    template_title,
    year_days,
)

# Google Sheets' preset palette, as the API returns it (missing keys mean 0).
DARK_RED_2 = {"red": 0.6}
RED = {"red": 1}
DARK_RED_1 = {"red": 0.8}
LIGHT_RED_1 = {"red": 0.88, "green": 0.4, "blue": 0.4}
LIGHT_RED_2 = {"red": 0.92, "green": 0.6, "blue": 0.6}
LIGHT_RED_3 = {"red": 0.96, "green": 0.8, "blue": 0.8}
DARK_GREEN_2 = {"red": 0.22, "green": 0.46, "blue": 0.11}
DARK_GREEN_1 = {"red": 0.42, "green": 0.66, "blue": 0.31}
LIGHT_GREEN_1 = {"red": 0.58, "green": 0.77, "blue": 0.49}
LIGHT_GREEN_2 = {"red": 0.71, "green": 0.84, "blue": 0.66}
LIGHT_ORANGE_3 = {"red": 0.99, "green": 0.9, "blue": 0.8}
YELLOW = {"red": 1, "green": 1}
WHITE = {"red": 1, "green": 1, "blue": 1}


def test_classify_follows_the_colour_key():
    for c in (DARK_RED_2, RED, DARK_RED_1):
        assert classify(c) == "severe"
    for c in (LIGHT_RED_1, LIGHT_RED_2, LIGHT_RED_3):
        assert classify(c) == "nosleep"
    for c in (DARK_GREEN_2, DARK_GREEN_1, LIGHT_GREEN_1, LIGHT_GREEN_2):
        assert classify(c) == "good"
    for c in (LIGHT_ORANGE_3, YELLOW, WHITE, None, {}):
        assert classify(c) is None


def test_row_flag_prefers_the_date_cell_then_the_majority():
    assert row_flag([DARK_RED_2] + [LIGHT_GREEN_1] * 8) == "severe"
    assert row_flag([WHITE, LIGHT_GREEN_2, WHITE, LIGHT_GREEN_2]) == "good"
    assert row_flag([None, LIGHT_RED_2, LIGHT_GREEN_1]) == "nosleep"  # tie -> more serious
    assert row_flag([LIGHT_ORANGE_3, LIGHT_ORANGE_3]) is None
    assert row_flag([]) is None


def test_row_spans_single_days_ranges_and_carry_over():
    cells = ["16/12", "18/12-22/12", "21/1/26-10/2/26", "3/3", "28/12-2/1", "note text", "", "31/2"]
    assert row_spans(cells, 2026) == [
        (date(2025, 12, 16), date(2025, 12, 16)),
        (date(2025, 12, 18), date(2025, 12, 22)),
        (date(2026, 1, 21), date(2026, 2, 10)),
        (date(2026, 3, 3), date(2026, 3, 3)),
        (date(2026, 12, 28), date(2027, 1, 2)),  # after a Jan–Oct row: this year's Dec, into next Jan
        None, None, None,
    ]


def test_flags_by_day_expands_ranges_and_keeps_both_flags_of_a_day():
    dates = ["Dates", "1/3", "2/3-4/3", "4/3", "5/3", "4/3"]
    colours = [[], [LIGHT_GREEN_1], [LIGHT_GREEN_1], [DARK_RED_2], [WHITE], [LIGHT_GREEN_2]]
    got = flags_by_day([(dates, colours, 2026)])
    assert got == {
        date(2026, 3, 1): {"good"}, date(2026, 3, 2): {"good"}, date(2026, 3, 3): {"good"},
        date(2026, 3, 4): {"severe", "good"},
    }
    rows = flag_rows(got)
    assert rows[0] == FLAGS_HEADER
    assert rows[1] == ["2026-03-01", "good"]
    assert rows[-2:] == [["2026-03-04", "severe"], ["2026-03-04", "good"]]


def test_flags_tab_never_carries_note_text():
    dates = ["Dates", "1/3"]
    colours = [[], [DARK_RED_2]]
    rows = flag_rows(flags_by_day([(dates, colours, 2026)]))
    assert rows[1:] == [["2026-03-01", "severe"]]


def test_rollover_on_new_years_eve_and_catch_up():
    assert rollover_target(date(2026, 12, 31), ["2026", "notes"]) == 2027
    assert rollover_target(date(2026, 12, 31), ["2027", "2026"]) is None
    assert rollover_target(date(2026, 12, 30), ["2026"]) is None
    assert rollover_target(date(2027, 1, 3), ["2026"]) == 2027  # bot was down on 31 Dec


def test_template_is_the_newest_earlier_year_tab():
    assert template_title(2027, ["2026", "Literature", "2025", "flags"]) == "2026"
    assert template_title(2027, ["Literature"]) is None


def test_year_days_counts_leap_years():
    assert len(year_days(2027)) == 365
    assert len(year_days(2028)) == 366
    assert year_days(2027)[0] == date(2027, 1, 1)


def test_shift_formula_moves_only_that_row():
    assert shift_formula("=(G119 - F119 + (G119 < F119)) * 24", 119, 2) == "=(G2 - F2 + (G2 < F2)) * 24"
    assert shift_formula("=G119*$B$1+G1190+H$119", 119, 5) == "=G5*$B$1+G1190+H$119"


def test_duration_formulas_fall_back_to_the_standard_one():
    assert duration_formulas(None, 0, 2, 2) == [
        "=(G2 - F2 + (G2 < F2)) * 24", "=(G3 - F3 + (G3 < F3)) * 24",
    ]
    assert duration_formulas("=G9-F9", 9, 2, 1) == ["=G2-F2"]
