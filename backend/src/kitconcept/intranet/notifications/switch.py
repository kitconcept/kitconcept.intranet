"""Turn the notification center off for a site, or pause it for one job."""

from collections.abc import Iterator
from contextlib import contextmanager
from plone import api

import threading


SETTING = "kitconcept.intranet.enable_notification_center"

_local = threading.local()


def notifications_enabled() -> bool:
    """Whether the notification center is on in the Intranet Settings."""
    return bool(api.portal.get_registry_record(SETTING, default=False))


def notifications_are_paused() -> bool:
    """Whether the current thread runs inside ``notifications_paused()``."""
    return getattr(_local, "depth", 0) > 0


def notifications_active() -> bool:
    """Whether content events should create or update notifications now."""
    return not notifications_are_paused() and notifications_enabled()


@contextmanager
def notifications_paused() -> Iterator[None]:
    """Create no notifications for what happens inside the block.

    For scripts and batch jobs that change many items. Only the current
    thread is affected: other requests keep notifying as usual, and nothing
    is queued to be sent afterwards. Blocks may be nested.

        with notifications_paused():
            for brain in api.content.find(portal_type="Document"):
                ...
    """
    _local.depth = getattr(_local, "depth", 0) + 1
    try:
        yield
    finally:
        _local.depth -= 1
