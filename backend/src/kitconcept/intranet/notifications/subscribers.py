"""Turn content events into notifications for the content's authors."""

from .storage import add_notification
from Acquisition import aq_base
from plone import api
from zope.container.interfaces import IContainerModifiedEvent

import logging


logger = logging.getLogger(__name__)


def _actor() -> str | None:
    if api.user.is_anonymous():
        return None
    return api.user.get_current().getId()


def _authors(obj) -> list[str]:
    list_creators = getattr(aq_base(obj), "listCreators", None)
    return list(obj.listCreators()) if list_creators is not None else []


def notify_authors(obj, type_: str, extra: dict | None = None) -> None:
    """Add a notification of ``type_`` about ``obj`` for each of its authors."""
    actor = _actor()
    if not actor:
        return
    for userid in _authors(obj):
        try:
            add_notification(userid, type_, actor, obj, extra)
        except Exception:
            # A notification must never break saving content.
            logger.exception("Could not store notification for %s", userid)


def modified(obj, event) -> None:
    if IContainerModifiedEvent.providedBy(event):
        # A child was added or removed: not an edit of this item.
        return
    notify_authors(obj, "modified")


def transitioned(obj, event) -> None:
    if event.transition is None:
        # Initial state on creation, no real transition.
        return
    notify_authors(
        obj,
        "transition",
        {
            "transition": event.transition.id,
            "review_state": event.new_state.id,
            "review_state_title": event.new_state.title or event.new_state.id,
        },
    )
