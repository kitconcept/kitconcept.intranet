"""The ``propose_changes`` tool (spec §7, D23, D57, D58).

One tool carries all changes of an answer as a list of operations:
``set_page_field`` (a page field), ``edit_block`` (fields of one block,
content and styling together), ``replace_text`` (exact words in a field,
the rest kept; D41), ``insert_block``, ``insert_blocks`` (several new
blocks in a row), ``delete_block``, ``move_block``, each with a
``reason`` and optionally a ``category``. Compared in D57 with one tool
per kind of change ("intent"): the same quality, but more prompt tokens
and fewer words for the editor; that toolset was removed (D58,
AI_EDIT_INTENT_TOOLSET.md).

The tool is never executed: its calls go back to the browser, whose
harness validates every operation against the page and the site profile
(components/AIEdit/harness/operations.js) and asks the model once to
repair the invalid ones (D8). This module defines the tool and how to
call it; the rules are shared (``rules.py``).
"""

from kitconcept.intranet.ai_edit.rules import CATEGORIES
from kitconcept.intranet.ai_edit.rules import OPS
from kitconcept.intranet.ai_edit.rules import SHARED_RULES

import copy


NAME = "propose_changes"

# How to call the tool (D57: the rest of the rules is shared). Prose for
# the model, not SQL ("insert ... into" trips ruff's S608); examples use
# placeholders or values no page or case uses (D49).
CALLING = """\
How to use propose_changes: call it once, with all changes of the answer \
in "operations" and your sentences for the user in "message". Operations \
work on two levels:
  Page level, the page itself (its fields title and description, shown \
first):
  - {"op": "set_page_field", "field": "<title or description>", "value": \
"<complete new value>"}: sets a field of the page itself.
  Block level, the blocks of the page:
  - {"op": "edit_block", "block": "<ref>", "fields": {"<field>": \
"<complete new value>"}}: fields of one block; content, styling and \
settings may be changed together.
  - {"op": "insert_block", "after": "<ref>", "type": "<insertable type>", \
"fields": {"<field>": "<value>"}}: a new block after any block, with all \
its values inside "fields"; "type" is required. "into": "<container \
ref>" instead of "after" puts it first into a container.
  - {"op": "insert_blocks", "after": "<ref>", "blocks": [{"type": \
"<type>", "fields": {...}}, {"type": "<type>", "fields": {...}}]}: \
several new blocks in a row after one block, in this order.
  - {"op": "move_block", "block": "<ref>", "after": "<ref>"}: moves a \
block to the place after another block of the same container.
  - {"op": "delete_block", "block": "<ref>"}: removes the block and \
everything inside it.
  Both levels:
  - {"op": "replace_text", "block": "b91", "field": "text", "find": \
"on June 3, 2031", "replace": "on June 12, 2031"}: replaces exact \
words in one field and keeps the rest. With "block", a field of that \
block ("field" defaults to "text"); without "block", a page field. \
"find" is copied exactly from the field as shown and must occur there \
only once: include a few words around it. One operation per place.
"""

INSTRUCTIONS = f"{CALLING}{SHARED_RULES}"

# A field's new value; null clears an optional field (D57)
VALUE = {"type": ["string", "null"]}

PARAMETERS = {
    "type": "object",
    "properties": {
        # Required: the model rarely writes text next to a tool call, but
        # fills required parameters (D46)
        "message": {
            "type": "string",
            "description": (
                "One or two sentences for the user: what you propose and why, "
                "and what they need to check or give you."
            ),
        },
        "operations": {
            "type": "array",
            "description": "All changes of this answer, in order.",
            "items": {
                "type": "object",
                "properties": {
                    "op": {"type": "string", "enum": OPS},
                    "field": {
                        "type": "string",
                        "description": (
                            "set_page_field: a field of the page itself "
                            "(title, description), never a block's. "
                            'replace_text: the field (default "text"; a page '
                            "field without block)."
                        ),
                    },
                    "value": {
                        **VALUE,
                        "description": (
                            "set_page_field: the complete new value; null "
                            "clears an optional field."
                        ),
                    },
                    "block": {
                        "type": "string",
                        "description": (
                            "edit_block, replace_text, delete_block, "
                            'move_block: the ref, e.g. "b91".'
                        ),
                    },
                    "find": {
                        "type": "string",
                        "description": (
                            "replace_text: the exact text to replace, occurring "
                            "once in the field."
                        ),
                    },
                    "replace": {
                        "type": "string",
                        "description": "replace_text: the new text for it.",
                    },
                    "after": {
                        "type": "string",
                        "description": (
                            "insert_block, insert_blocks, move_block: the ref "
                            "of the block it follows."
                        ),
                    },
                    "into": {
                        "type": "string",
                        "description": (
                            "insert_block, insert_blocks: the ref of a "
                            "container; first in it."
                        ),
                    },
                    "type": {
                        "type": "string",
                        "description": (
                            "insert_block (required): a type <types> lists "
                            "as insertable."
                        ),
                    },
                    "fields": {
                        "type": "object",
                        "description": (
                            "edit_block, insert_block: field name -> complete "
                            "new value, only the fields that change; null "
                            "clears an optional field."
                        ),
                        "additionalProperties": VALUE,
                    },
                    "blocks": {
                        "type": "array",
                        "description": (
                            "insert_blocks: the new blocks, in order, each "
                            '{"type": ..., "fields": {...}}.'
                        ),
                        "items": {
                            "type": "object",
                            "properties": {
                                "type": {"type": "string"},
                                "fields": {
                                    "type": "object",
                                    "additionalProperties": VALUE,
                                },
                            },
                            "required": ["type"],
                        },
                    },
                    "reason": {
                        "type": "string",
                        "description": "One short sentence: why this change.",
                    },
                    "category": {"type": "string", "enum": CATEGORIES},
                },
                "required": ["op", "reason"],
            },
        },
    },
    "required": ["message", "operations"],
}

DEFINITION = {
    "type": "function",
    "function": {
        "name": NAME,
        "description": (
            "Propose changes to the page, all in this one call. The user "
            "reviews every change before it is applied."
        ),
        "parameters": PARAMETERS,
    },
}

TOOLS = [DEFINITION]


def tools_for(insertable: list[str]) -> list[dict]:
    """The tool with the request's insertable types as the values of an
    insert's ``type`` (D59): next to the ``insertable:`` line of
    ``<types>``, the model still tried an image block in two of three runs
    of an eval case. A hint only: the gateway does not hold tool arguments
    to the schema, the harness rejects other types."""
    if not insertable:
        return TOOLS
    definition = copy.deepcopy(DEFINITION)
    item = definition["function"]["parameters"]["properties"]["operations"]["items"]
    item["properties"]["type"]["enum"] = list(insertable)
    item["properties"]["blocks"]["items"]["properties"]["type"]["enum"] = list(
        insertable
    )
    return [definition]
