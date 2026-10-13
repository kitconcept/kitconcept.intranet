"""Extract meaningful todo data and stamp server-owned document metadata."""

from contextlib import suppress
from copy import deepcopy
from datetime import UTC
from datetime import date
from datetime import datetime
from plone import api
from uuid import UUID
from uuid import uuid4


def iter_todos(value):
    """Walk document children only, never the block's discussions."""
    if isinstance(value, list):
        for child in value:
            yield from iter_todos(child)
    elif isinstance(value, dict):
        if value.get("listStyleType") == "todo":
            yield value
        yield from iter_todos(value.get("children", []))


def inline_nodes(node):
    """Walk one task's text, excluding nested todos indexed as separate tasks."""
    yield node
    for child in node.get("children", []):
        if isinstance(child, dict) and child.get("listStyleType") != "todo":
            yield from inline_nodes(child)


def extract_task_details(node):
    """Extract plain text, distinct mentions, first valid date, and checked state."""
    text = []
    users = []
    due = None
    for child in inline_nodes(node):
        if child.get("type") in {"mention", "date"}:
            value = child.get("value", "")
            if isinstance(value, str):
                text.append(value)
            if child.get("type") == "mention" and isinstance(child.get("key"), str):
                users.append(child["key"])
            elif child.get("type") == "date" and due is None:
                with suppress(TypeError, ValueError):
                    due = date.fromisoformat(value).isoformat()
        elif isinstance(child.get("text"), str):
            text.append(child["text"])
    return {
        "text": "".join(text).strip(),
        "assignees": tuple(sorted(set(users))),
        "due": due,
        "checked": bool(node.get("checked")),
    }


def valid_uuid(value):
    """Accept existing UUID strings without trusting arbitrary editor node IDs."""
    try:
        UUID(value)
        return True
    except ValueError, TypeError, AttributeError:
        return False


def stamp_task_metadata(context, block, existing=None, legacy=False, reset=False):
    """Return a copy with trusted task identity, authorship, and timestamps.

    Existing nodes are authoritative for server-owned metadata. Legacy backfills
    retain stored metadata and fall back to the page creator; copies reset it.
    """
    block = deepcopy(block)
    old = {n.get("taskId"): n for n in iter_todos((existing or {}).get("value", []))}
    seen = set()
    now = datetime.now(UTC).isoformat()
    user = api.user.get_current()
    creator = context.Creator() if legacy else (user.getId() if user else None)
    for node in iter_todos(block.get("value", [])):
        task_id = node.get("taskId") or node.get("id")
        if reset or not valid_uuid(task_id) or task_id in seen:
            task_id = str(uuid4())
        node["taskId"] = task_id
        seen.add(task_id)
        previous = old.get(task_id)
        # Do not accept client-supplied creators or timestamps for newly added tasks.
        trusted = previous if previous is not None else (node if legacy else {})
        was_checked = bool(trusted.get("checked"))
        unchanged = previous is not None and extract_task_details(
            node
        ) == extract_task_details(previous)
        node["taskCreator"] = trusted.get("taskCreator") or creator or context.Creator()
        node["taskCreated"] = trusted.get("taskCreated") or now
        node["taskModified"] = (
            (trusted.get("taskModified") or now) if unchanged else now
        )
        if node.get("checked"):
            # Preserve completion time across edits; reopening clears it below.
            node["taskCompleted"] = (
                trusted.get("taskCompleted") if was_checked else None
            ) or now
        else:
            node.pop("taskCompleted", None)
    return block
