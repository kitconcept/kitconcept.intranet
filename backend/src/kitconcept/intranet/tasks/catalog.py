"""Apply document-derived task deltas without a second persistent task store."""

from .model import NAMESPACE
from .model import InlineTask
from .values import extract_task_details
from .values import iter_todos
from .values import stamp_task_metadata
from Acquisition import aq_base
from copy import deepcopy


PENDING_KEY = "kitconcept.intranet.tasks.changes"


def changes(old, new):
    """Return added/changed nodes and removed UUIDs, ignoring editor-only changes."""
    before = {
        n["taskId"]: n for n in iter_todos(old.get("value", [])) if n.get("taskId")
    }
    after = {n["taskId"]: n for n in iter_todos(new.get("value", []))}
    updated = [
        node
        for uid, node in after.items()
        if uid not in before
        or extract_task_details(node) != extract_task_details(before[uid])
    ]
    return updated, before.keys() - after.keys()


def apply_changes(page, catalog, updated, removed):
    """Catalog a precomputed delta using the page's final physical path."""
    for uid in removed:
        catalog.uncatalog_object("/".join((*page.getPhysicalPath(), NAMESPACE, uid)))
    for node in updated:
        InlineTask(page, node).reindexObject()


def synchronize(page, catalog, legacy=False):
    """Explicit backfill only; ordinary saves use deserializer-computed deltas."""
    if "task_status" not in catalog.indexes():
        return
    blocks = getattr(aq_base(page), "blocks", {}) or {}
    if "__somersault__" not in blocks:
        return
    block = blocks["__somersault__"]
    normalized = stamp_task_metadata(page, block, existing=block, legacy=legacy)
    if block != normalized:
        # Replace the JSON field so persistence notices normalized task metadata.
        next_blocks = deepcopy(blocks)
        next_blocks["__somersault__"] = normalized
        page.blocks = next_blocks
    apply_changes(page, catalog, list(iter_todos(normalized.get("value", []))), [])
