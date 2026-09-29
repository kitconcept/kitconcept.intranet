#!/usr/bin/env python3
"""Export the wiki demo content as JSON fixtures for the Playwright tests.

The acceptance tests reset the site before every test, so they cannot use
the demo pages of the example content. They create the same pages through
the REST API from these fixtures instead, so the tests and the demo stay in
sync. Run it from ``backend/`` after changing the demo content:

    uv run python scripts/export_acceptance_fixtures.py

Writes ``frontend/acceptance/fixtures/wiki-tables.json`` (the two table demo
pages) and ``frontend/acceptance/fixtures/wiki-diff.json`` (the history-diff
demo page: first version and the edits with their change notes).

Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/667
"""

from __future__ import annotations

from kitconcept.intranet.utils import diff_demo_content
from kitconcept.intranet.utils import table_demo_content
from pathlib import Path

import json


FIXTURES = Path(__file__).resolve().parents[2] / "frontend/acceptance/fixtures"


def tables() -> list[dict]:
    return [
        {"id": page_id, "title": title, "blocks": blocks, "blocks_layout": layout}
        for page_id, title, blocks, layout in table_demo_content.pages()
    ]


def diff() -> dict:
    content = diff_demo_content
    return {
        "id": content.PAGE_ID,
        "title": content.PAGE_TITLE,
        "blocks": content.blocks(content.version_0()),
        "blocks_layout": content.blocks_layout(),
        "edits": [
            {"blocks": content.blocks(value), "changeNote": note}
            for value, note in content.edits()
        ],
    }


def write(name: str, data) -> None:
    path = FIXTURES / name
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(f"wrote {path}")


def main() -> None:
    FIXTURES.mkdir(parents=True, exist_ok=True)
    write("wiki-tables.json", tables())
    write("wiki-diff.json", diff())


if __name__ == "__main__":
    main()
