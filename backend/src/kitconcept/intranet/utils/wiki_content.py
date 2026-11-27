"""Helpers to build Wiki Page content (Plate values) in Python.

Pure data, no Plone imports. Used by the demo content modules
(``diff_demo_content``, ``table_demo_content``) for the distribution's post
handler and for the REST scripts in ``scripts/``.

A Wiki Page stores its content as a Plate value in the ``main`` region,
``blocks["main"]["value"]``, with ``"@type": "plate"`` (kitconcept.plate
1.0.0a43; older pages use the legacy ``__somersault__`` block, see
https://github.com/plone/aurora/issues/379). The editor also expects a ``title``
block in ``blocks`` whose id is listed in ``blocks_layout["items"]`` (the
example content is exported like that); a page with an empty layout opens
fine but crashes the editor on Save (``Form.onSubmit`` looks the layout
items up in ``blocks``). ``blocks()`` and ``blocks_layout()`` produce that
skeleton.
"""

from __future__ import annotations

from dataclasses import dataclass


# kitconcept.plate.regions.MAIN_REGION and PLATE_TYPE, repeated here so this
# module stays free of imports for the REST scripts.
MAIN_REGION = "main"
PLATE_TYPE = "plate"
TITLE_BLOCK_ID = "3f3a2b1c-6d4e-4f5a-9b8c-7d6e5f4a3b2c"

# The editor writes these on every paragraph and heading, and a ``blockWidth``
# on every other top-level block (title, list items, callouts, tables, …).
# Content stored without them would show "Width: not set → Standard" on every
# block in the diff of its first save in the editor.
BLOCK_DEFAULTS = {"align": "start", "blockWidth": "default"}

# The width steps of a wiki table (the block widths the frontend allows for
# tables): text width, medium, wide, full width.
TABLE_WIDTHS = ("default", "medium", "layout", "full")

# The one alignment a wiki table stores (``tableAlign``); left-aligned is
# the property's absence (work item 836).
TABLE_ALIGNS = ("center",)


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
    return node("title", "title", [text(value)], blockWidth="default")


def cell(node_id: str, *runs, header: bool = False, **props) -> dict:
    """A table cell holding one paragraph; ``runs`` as in ``paragraph``."""
    return node(
        "th" if header else "td", node_id, [paragraph(f"{node_id}-p", *runs)], **props
    )


def row(node_id: str, *cells: dict) -> dict:
    return node("tr", node_id, list(cells))


@dataclass(frozen=True)
class Span:
    """Cell content merged across ``cols`` columns (Plate's ``colSpan``)."""

    content: str | dict | tuple
    cols: int


@dataclass(frozen=True)
class Sum:
    """A footer cell that shows the sum of its column (``calc: "sum"``).

    ``content`` is the sum as the editor writes it; the editor recomputes it
    whenever the table changes.
    """

    content: str | dict | tuple


def table(
    node_id: str,
    header: list,
    rows: list[list],
    col_sizes=None,
    footer: list | None = None,
    width: str | None = None,
    table_width: int | None = None,
    align: str | None = None,
) -> dict:
    """A table with a header row and, with ``footer``, a footer row.

    ``header``, every entry of ``rows`` and ``footer`` are lists of cell
    contents: a string, a tuple of runs (strings and ``text(...)`` dicts with
    marks), a ``Span`` for a merged cell (the row then lists fewer cells), or
    in the footer a ``Sum`` for a cell that shows its column's sum.

    ``width`` is the table's width step (``blockWidth``): ``"default"``
    (text width), ``"medium"``, ``"layout"`` (wide) or ``"full"`` (full
    width). Without it the table has no ``blockWidth`` and stays in the text
    column.
    """

    def runs(content):
        if isinstance(content, Span | Sum):
            content = content.content
        return content if isinstance(content, tuple) else (content,)

    def span(content):
        props = {"colSpan": content.cols} if isinstance(content, Span) else {}
        if isinstance(content, Sum):
            props["calc"] = "sum"
        return props

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
                    cell(f"{node_id}-r{r}c{c}", *runs(content), **span(content))
                    for c, content in enumerate(values)
                ),
            )
        )
    if footer is not None:
        children.append(
            node(
                "tr",
                f"{node_id}-f",
                [
                    cell(f"{node_id}-f{c}", *runs(content), **span(content))
                    for c, content in enumerate(footer)
                ],
                footer=True,
            )
        )
    return node(
        "table", node_id, children, **table_props(col_sizes, width, table_width, align)
    )


def table_props(
    col_sizes=None,
    width: str | None = None,
    table_width: int | None = None,
    align: str | None = None,
) -> dict:
    """The width and alignment properties of a table node, see ``table``."""
    props = {"colSizes": col_sizes} if col_sizes else {}
    if width is not None:
        if width not in TABLE_WIDTHS:
            raise ValueError(f"Unknown table width {width!r}")
        props["blockWidth"] = width
    if table_width is not None:
        if not col_sizes or sum(col_sizes) != table_width:
            raise ValueError(
                f"The column sizes {col_sizes!r} do not add up to the table "
                f"width {table_width!r}"
            )
        props.setdefault("blockWidth", "default")
        props["tableWidth"] = table_width
    if align is not None:
        if align not in TABLE_ALIGNS:
            raise ValueError(f"Unknown table alignment {align!r}")
        props["tableAlign"] = align
    return props


def blocks(value: list[dict]) -> dict:
    """The ``blocks`` field of a Wiki Page holding ``value`` as Plate content."""
    return {
        TITLE_BLOCK_ID: {"@type": "title"},
        MAIN_REGION: {"@type": PLATE_TYPE, "value": value},
    }


def blocks_layout() -> dict:
    """The ``blocks_layout`` field matching ``blocks()``."""
    return {"items": [TITLE_BLOCK_ID]}
