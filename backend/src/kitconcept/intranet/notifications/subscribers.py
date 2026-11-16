"""Turn content events into notifications for the content's authors."""

from .storage import add_notification
from .storage import touch
from Acquisition import aq_base
from plone import api
from zope.container.interfaces import IContainerModifiedEvent
from zope.lifecycleevent.interfaces import IObjectAddedEvent

import logging


logger = logging.getLogger(__name__)


def _actor() -> str | None:
    if api.user.is_anonymous():
        return None
    return api.user.get_current().getId()


def _authors(obj) -> list[str]:
    list_creators = getattr(aq_base(obj), "listCreators", None)
    return list(obj.listCreators()) if list_creators is not None else []


def _touch_authors(obj) -> None:
    """Invalidate the cached notification lists of the item's authors.

    Notifications about an item only ever go to its authors, so theirs are
    the only lists that show its title, URL or visibility.
    """
    for userid in _authors(obj):
        try:
            touch(userid)
        except Exception:
            logger.exception("Could not update notifications of %s", userid)


def notify_authors(obj, type_: str, extra: dict | None = None) -> None:
    """Add a notification of ``type_`` about ``obj`` for each of its authors."""
    actor = _actor()
    for userid in _authors(obj):
        try:
            if not actor or add_notification(userid, type_, actor, obj, extra) is None:
                # No notification (own action, opted out, anonymous), but the
                # item's title or state may have changed in their list.
                touch(userid)
        except Exception:
            # A notification must never break saving content.
            logger.exception("Could not store notification for %s", userid)


def modified(obj, event) -> None:
    if IContainerModifiedEvent.providedBy(event):
        # A child was added or removed: not an edit of this item.
        return
    notify_authors(obj, "modified")


def moved(obj, event) -> None:
    """Moved, renamed or deleted: the URL or visibility in lists changed."""
    if IObjectAddedEvent.providedBy(event):
        # Newly created: nobody has notifications about it yet.
        return
    _touch_authors(obj)


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
