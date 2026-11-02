"""Synthetic rows only — never copy real health data into tests."""
from datetime import date

import pytest

from sleep_log.logic import (
    check_header,
    clock_minutes,
    find_row,
    free_row,
    nightly_hours,
    parse_time,
    row_dates,
    row_hours,
    split_times,
    week_average,
)

HEADER = ["Dates", "Pharm", "Pos", "Neg", "Duration", "Sleep time", "Wake time", "reasons", "remarks"]


def r(d="", dur="", s="", w=""):
    return [d, "", "", "", dur, s, w, "", ""]


@pytest.mark.parametrize(
    "text,want",
    [
        ("23:30", "23:30"), ("23.30", "23:30"), ("2330", "23:30"), ("7", "07:00"),
        ("7am", "07:00"), ("11.30pm", "23:30"), ("11:30 PM", "23:30"), ("12am", "00:00"),
        ("12pm", "12:00"), ("midnight", "00:00"), ("0:15", "00:15"),
        ("25:00", None), ("13pm", None), ("7:75", None), ("late", None), ("", None),
    ],
)
def test_parse_time(text, want):
    assert parse_time(text) == want


def test_split_times():
    assert split_times("23:30 7am") == ["23:30", "07:00"]
    assert split_times("11 pm - 7 am") == ["23:00", "07:00"]
    assert split_times("23:30") == ["23:30"]
    assert split_times("around 11") == []


def test_clock_minutes_formats():
    assert clock_minutes("01:00") == 60
    assert clock_minutes("1:00:00") == 60
    assert clock_minutes("10:30 PM") == 22 * 60 + 30
    assert clock_minutes("") is None


def test_row_hours_duration_then_times_else_not_logged():
    assert row_hours(r("1/11", "6.50", "00:00", "06:30")) == 6.5
    assert row_hours(r("2/11", "0.00", "22:00", "01:30")) == 3.5  # wraps midnight
    assert row_hours(r("3/11", "0.00")) is None  # placeholder is not zero sleep
    assert row_hours(r("3/11")) is None


def test_row_dates_carry_over_and_explicit_year():
    rows = [HEADER, r("16/12"), r("2/1"), r("5/12"), r("1/3/25"), r("x")]
    assert row_dates(rows, 2026) == [None, date(2025, 12, 16), date(2026, 1, 2), date(2026, 12, 5), date(2025, 3, 1), None]


def test_find_row_prefers_row_with_times_else_last():
    rows = [HEADER, r("27/10"), r("27/10", "5", "01:00", "06:00"), r("28/10"), r("28/10")]
    assert find_row(rows, 2026, date(2026, 10, 27)) == 2
    assert find_row(rows, 2026, date(2026, 10, 28)) == 4
    assert find_row(rows, 2026, date(2026, 10, 29)) is None


def test_free_row_uses_blank_placeholder_rows_else_appends():
    rows = [HEADER, r("1/11"), r("2/11"), r("", "0.00"), r("", "0.00")]
    assert free_row(rows, 2026) == 3
    assert free_row([HEADER, r("1/11")], 2026) == 2


def test_week_average_counts_logged_nights_only():
    cur = [HEADER, r("1/1", "8"), r("3/1", "0.00"), r("4/1", "", "23:00", "06:00")]
    prev = [HEADER, r("5/3", "9"), r("20/12", "9"), r("29/12", "6")]  # only 29 Dec is in the week
    nights = nightly_hours([(cur, 2026), (prev, 2025)])
    avg, n = week_average(nights, date(2026, 1, 4))
    assert n == 3
    assert avg == pytest.approx((8 + 7 + 6) / 3)
    assert week_average({}, date(2026, 1, 4)) == (None, 0)


def test_check_header():
    assert check_header(HEADER) is None
    assert check_header(["Dates", "", "", "", "", "remarks", "x"]) is not None
