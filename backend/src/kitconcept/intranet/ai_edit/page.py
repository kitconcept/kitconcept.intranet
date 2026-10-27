"""The page and block types the browser sends (spec §5, §6).

The browser's harness projects the live form into ``page`` and describes
the block types in ``block_types``; it also validates everything the
model proposes. The server only checks the shape here, before rendering
both into the prompt: malformed parts are dropped, not repaired. The
server reads and writes no content.

``page``::

    {"fields": {"title": "...", "description": "..."},
     "blocks": [{"id": "...", "ref": "b5", "type": "gridBlock",
                 "fields": {"text": "..."}, "styling": {"theme": "grey"},
                 "readonly": false, "selected": false,
                 "locked": {"text": "round_trip"},
                 "description": "...",
                 "children": [...]}]}

``block_types``::

    {"slate": {"fields": ["text"], "styling": {"theme": ["default", "grey"]},
               "insertable": true}}
"""

import re


# A block ref as the harness assigns it: b5, b5.1, b5.1.2
REF_RE = re.compile(r"b[1-9][0-9]*(\.[1-9][0-9]*)*")
# A block type (Volto's @type)
TYPE_RE = re.compile(r"[\w.-]{1,64}")
# A field or styling name, also used as an element name in the prompt
NAME_RE = re.compile(r"[A-Za-z_][\w-]{0,63}")
# An allowed styling value
VALUE_RE = re.compile(r"[\w.:-]{1,64}")

# Containers nest a few levels at most; deeper input is dropped
MAX_DEPTH = 6


def _is_name(value) -> bool:
    return isinstance(value, str) and bool(NAME_RE.fullmatch(value))


def _strings(mapping) -> dict[str, str]:
    """A mapping of names to string values, other entries dropped."""
    if not isinstance(mapping, dict):
        return {}
    return {k: v for k, v in mapping.items() if _is_name(k) and isinstance(v, str)}


def _clean_block(block, depth: int) -> dict | None:
    if not isinstance(block, dict):
        return None
    ref, block_type = block.get("ref"), block.get("type")
    if not (isinstance(ref, str) and REF_RE.fullmatch(ref)):
        return None
    if not (isinstance(block_type, str) and TYPE_RE.fullmatch(block_type)):
        block_type = ""
    cleaned = {
        "ref": ref,
        "type": block_type,
        "fields": _strings(block.get("fields")),
        "styling": _strings(block.get("styling")),
        "readonly": block.get("readonly") is True,
        "selected": block.get("selected") is True,
        "locked": sorted(k for k in _strings(block.get("locked"))),
        # Content the page does not show (a table): not empty
        "hidden": block.get("hidden") is True,
        # Cannot be deleted (Volto's required blocks)
        "required": block.get("required") is True,
        "description": block.get("description")
        if isinstance(block.get("description"), str)
        else "",
    }
    children = block.get("children")
    if isinstance(children, list) and depth < MAX_DEPTH:
        cleaned["children"] = _clean_blocks(children, depth + 1)
    return cleaned


def _clean_blocks(blocks, depth: int = 1) -> list[dict]:
    if not isinstance(blocks, list):
        return []
    cleaned = [_clean_block(block, depth) for block in blocks]
    return [block for block in cleaned if block]


def clean_page(page) -> dict | None:
    """The page as the prompt shows it, or None when it is not a page."""
    if not isinstance(page, dict):
        return None
    return {
        "fields": _strings(page.get("fields")),
        "blocks": _clean_blocks(page.get("blocks")),
    }


def clean_block_types(block_types) -> dict[str, dict]:
    """The block types for the prompt's ``<types>``; malformed ones dropped."""
    if not isinstance(block_types, dict):
        return {}
    cleaned = {}
    for name, entry in block_types.items():
        if not (isinstance(name, str) and TYPE_RE.fullmatch(name)):
            continue
        if not isinstance(entry, dict):
            continue
        fields = entry.get("fields")
        fields = [f for f in fields if _is_name(f)] if isinstance(fields, list) else []
        required = entry.get("required")
        styling = entry.get("styling")
        cleaned[name] = {
            "fields": fields,
            # Fields a new block must have; all others are optional (D54)
            "required": [f for f in required if f in fields]
            if isinstance(required, list)
            else [],
            "styling": {
                field: [
                    v for v in values if isinstance(v, str) and VALUE_RE.fullmatch(v)
                ]
                for field, values in (
                    styling.items() if isinstance(styling, dict) else []
                )
                if _is_name(field) and isinstance(values, list)
            },
            "insertable": entry.get("insertable") is True,
        }
    return cleaned


def count_blocks(blocks: list[dict]) -> int:
    """The number of blocks, nested ones included (for the log)."""
    return sum(1 + count_blocks(block.get("children", [])) for block in blocks)


def names_in(page: dict, block_types: dict) -> set[str]:
    """Every field and styling name of a request: they are element names in
    the prompt, so page text must not contain them as tags."""
    names = set(page["fields"])

    def walk(blocks):
        for block in blocks:
            names.update(block["fields"], block["styling"])
            walk(block.get("children", []))

    walk(page["blocks"])
    for entry in block_types.values():
        names.update(entry["fields"], entry["styling"])
    return names
