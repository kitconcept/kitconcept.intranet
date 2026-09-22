"""Helpers to build Wiki Page content (Plate values) in Python.

Pure data, no Plone imports. Used by the demo content modules
(``diff_demo_content``, ``table_demo_content``) for the distribution's post
handler and for the REST scripts in ``scripts/``.

A Wiki Page stores its content as a Plate value in
``blocks["__somersault__"]["value"]``. The editor also expects a ``title``
block in ``blocks`` whose id is listed in ``blocks_layout["items"]`` (the
example content is exported like that); a page with an empty layout opens
fine but crashes the editor on Save (``Form.onSubmit`` looks the layout
items up in ``blocks``). ``blocks()`` and ``blocks_layout()`` produce that
skeleton.
"""

from __future__ import annotations


SOMERSAULT_KEY = "__somersault__"
TITLE_BLOCK_ID = "3f3a2b1c-6d4e-4f5a-9b8c-7d6e5f4a3b2c"

# The editor writes these on every block; without them a later change would
# read "not set → Centred" instead of "Left → Centred" in the diff.
BLOCK_DEFAULTS = {"align": "start", "blockWidth": "default"}


def text(value: str, **marks) -> dict:
    return {"text": value, **marks}


def node(kind: str, node_id: str, children: list, **props) -> dict:
    return {"type": kind, "id": node_id, "children": children, **props}


def paragraph(node_id: str, *runs, **props) -> dict:
    children = [text(run) if isinstance(run, str) else run for run in runs]
    return node("p", node_id, children, **{**BLOCK_DEFAULTS, **props})


def heading(node_id: str, value: str, level: int = 2) -> dict:
    return node(f"h{level}", node_id, [text(value)], **BLOCK_DEFAULTS)


def title(value: str) -> dict:
    return node("title", "title", [text(value)])


def cell(node_id: str, *runs, header: bool = False, **props) -> dict:
    """A table cell holding one paragraph; ``runs`` as in ``paragraph``."""
    return node(
        "th" if header else "td", node_id, [paragraph(f"{node_id}-p", *runs)], **props
    )


def row(node_id: str, *cells: dict) -> dict:
    return node("tr", node_id, list(cells))


def table(node_id: str, header: list, rows: list[list], col_sizes=None) -> dict:
    """A table with a header row.

    ``header`` and every entry of ``rows`` are lists of cell contents: a
    string, or a tuple of runs (strings and ``text(...)`` dicts with marks).
    """

    def runs(content):
        return content if isinstance(content, tuple) else (content,)

    children = [
        row(
            f"{node_id}-h",
            *(
                cell(f"{node_id}-h{c}", *runs(content), header=True)
                for c, content in enumerate(header)
            ),
        )
    ]
    for r, values in enumerate(rows):
        children.append(
            row(
                f"{node_id}-r{r}",
                *(
                    cell(f"{node_id}-r{r}c{c}", *runs(content))
                    for c, content in enumerate(values)
                ),
            )
        )
    props = {"colSizes": col_sizes} if col_sizes else {}
    return node("table", node_id, children, **props)


def blocks(value: list[dict]) -> dict:
    """The ``blocks`` field of a Wiki Page holding ``value`` as Plate content."""
    return {
        TITLE_BLOCK_ID: {"@type": "title"},
        SOMERSAULT_KEY: {"@type": SOMERSAULT_KEY, "value": value},
    }


def blocks_layout() -> dict:
    """The ``blocks_layout`` field matching ``blocks()``."""
    return {"items": [TITLE_BLOCK_ID]}
