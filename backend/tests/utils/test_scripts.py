from kitconcept.intranet.utils.scripts import parse_answers
from pathlib import Path

import pytest


@pytest.fixture
def answers_file():
    path = Path(__file__).parent / "default.json"
    return path


@pytest.mark.parametrize(
    "key,value,expected",
    (
        ("site_id", "", "Plone"),
        ("site_id", "Site", "Site"),
        ("title", "Foo Bar", "Foo Bar"),
        ("description", "A new site", "A new site"),
        (
            "description",
            "",
            "A Plone Intranet distribution provided by kitconcept GmbH",
        ),
        ("available_languages", "", ["en"]),
        ("available_languages", ["de"], ["de"]),
        ("portal_timezone", "", "Europe/Berlin"),
        ("portal_timezone", "UTC", "UTC"),
        ("workflow", "", "public"),
        ("workflow", "private", "private"),
        ("setup_content", "", True),
        ("setup_content", "f", False),
    ),
)
def test_parse_answers(answers_file, key: str, value: str, expected: str | bool):
    answers = {key: value}
    result = parse_answers(answers_file, answers)
    assert result[key] == expected
