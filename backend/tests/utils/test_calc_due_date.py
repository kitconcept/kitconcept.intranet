from datetime import date
from kitconcept.intranet.utils.calc_due_date import calc_due_date
from plone import api


def test_1_day():
    result = calc_due_date(date(2024, 1, 1), "1d")
    assert result == date(2024, 1, 2)


def test_7_days():
    result = calc_due_date(date(2024, 1, 1), "7d")
    assert result == date(2024, 1, 8)


def test_days_across_month_boundary():
    result = calc_due_date(date(2024, 1, 30), "5d")
    assert result == date(2024, 2, 4)


def test_days_across_year_boundary():
    result = calc_due_date(date(2023, 12, 30), "3d")
    assert result == date(2024, 1, 2)


def test_1_week():
    result = calc_due_date(date(2024, 1, 1), "1w")
    assert result == date(2024, 1, 8)


def test_2_weeks():
    result = calc_due_date(date(2024, 1, 1), "2w")
    assert result == date(2024, 1, 15)


def test_weeks_across_month_boundary():
    result = calc_due_date(date(2024, 1, 25), "2w")
    assert result == date(2024, 2, 8)


def test_1_month():
    result = calc_due_date(date(2024, 1, 15), "1m")
    assert result == date(2024, 2, 15)


def test_6_months():
    result = calc_due_date(date(2024, 1, 15), "6m")
    assert result == date(2024, 7, 15)


def test_month_end_clamping():
    """Jan 31 + 1 month → Feb 29 (2024 is a leap year)."""
    result = calc_due_date(date(2024, 1, 31), "1m")
    assert result == date(2024, 2, 29)


def test_months_across_year_boundary():
    result = calc_due_date(date(2024, 11, 1), "3m")
    assert result == date(2025, 2, 1)


def test_1_year():
    result = calc_due_date(date(2024, 3, 10), "1y")
    assert result == date(2025, 3, 10)


def test_2_years():
    result = calc_due_date(date(2024, 3, 10), "2y")
    assert result == date(2026, 3, 10)


def test_leap_day_year_handling():
    """Feb 29 + 1 year → Feb 28 (2025 is not a leap year)."""
    result = calc_due_date(date(2024, 2, 29), "1y")
    assert result == date(2025, 2, 28)


def test_falls_back_to_registry_interval(portal):
    result = calc_due_date(date(2024, 1, 1))
    assert result == date(2024, 7, 1)


def test_none_interval_triggers_registry(portal):
    result = calc_due_date(base_date=date(2024, 1, 1), interval=None)
    assert result == date(2024, 7, 1)


def test_registry_record_key_is_correct(portal):
    result = api.portal.get_registry_record(
        "kitconcept.intranet.content_review_default_interval"
    )
    assert result == "6m"
