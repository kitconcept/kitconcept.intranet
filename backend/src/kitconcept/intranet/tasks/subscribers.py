"""Maintain task catalog entries when their containing pages change location."""

from .catalog import PENDING_KEY
from .catalog import apply_changes
from .model import TASK_TYPE
from .model import InlineTask
from .values import iter_todos
from .values import stamp_task_metadata
from Acquisition import aq_base
from copy import deepcopy
from Products.CMFCore.utils import getToolByName
from zope.annotation.interfaces import IAnnotations


def modified(context, event):
    """Consume this request's deserializer delta once the page value is stored."""
    annotations = IAnnotations(getattr(context, "REQUEST", None), None)
    if annotations is None:
        return
    pending = annotations.get(PENDING_KEY, {}).pop(aq_base(context), None)
    if pending is not None:
        apply_changes(context, getToolByName(context, "portal_catalog"), *pending)


def moved(context, event):
    """Apply creation deltas and recatalog copied or moved document tasks."""
    if event.newParent is None:
        return
    modified(context, event)
    # Copy and move change paths without REST deserialization.
    if event.oldParent is not None or getattr(
        aq_base(context), "_v_copied_tasks", False
    ):
        context.__dict__.pop("_v_copied_tasks", None)
        block = (getattr(context, "blocks", {}) or {}).get("__somersault__", {})
        for node in iter_todos(block.get("value", [])):
            InlineTask(context, node).reindexObject()


def will_move(context, event):
    """Remove old task paths before a page or ancestor is moved or deleted."""
    if event.oldParent is None:
        return
    catalog = getToolByName(context, "portal_catalog")
    path = "/".join(context.getPhysicalPath())
    for brain in catalog.unrestrictedSearchResults(portal_type=TASK_TYPE, path=path):
        catalog.uncatalog_object(brain.getPath())


def copied(context, event):
    """Give copied todos fresh UUIDs and authorship before indexing the new page."""
    blocks = getattr(aq_base(context), "blocks", {}) or {}
    if "__somersault__" in blocks:
        blocks = deepcopy(blocks)
        blocks["__somersault__"] = stamp_task_metadata(
            context, blocks["__somersault__"], reset=True
        )
        context.blocks = blocks
        context._v_copied_tasks = True
