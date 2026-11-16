"""Storage of notifications and notification preferences.

Everything lives in one annotation on the site root: a BTree of per-user
lists, so writes for different users do not conflict. Only the newest
``MAX_PER_USER`` notifications are kept.

Each user with notifications also has a version number, changed whenever
their list may look different. The REST service builds its ETag from it, so
a poll that finds nothing new is answered with 304 Not Modified.
"""

from BTrees.OOBTree import OOBTree
from datetime import UTC
from datetime import datetime
from datetime import timedelta
from persistent.list import PersistentList
from persistent.mapping import PersistentMapping
from plone import api
from zope.annotation.interfaces import IAnnotations

import uuid


ANNOTATION_KEY = "kitconcept.intranet.notifications"
MAX_PER_USER = 200
# Repeated edits by the same actor on the same item merge into one entry.
COLLAPSE_WINDOW = timedelta(minutes=15)

NOTIFICATION_TYPES = ("like", "modified", "transition")
DEFAULT_SETTINGS = dict.fromkeys(NOTIFICATION_TYPES, True)


def _now() -> datetime:
    return datetime.now(UTC)


def _root(create: bool = False) -> PersistentMapping | None:
    annotations = IAnnotations(api.portal.get())
    root = annotations.get(ANNOTATION_KEY)
    if root is None and create:
        root = PersistentMapping({"items": OOBTree(), "settings": OOBTree()})
        annotations[ANNOTATION_KEY] = root
    if root is not None and create and "versions" not in root:
        # Sites created before versions existed get them on the next write.
        root["versions"] = OOBTree()
    return root


def get_version(userid: str) -> int:
    """Return the version of the user's notifications, 0 if never changed."""
    root = _root()
    if root is None or "versions" not in root:
        return 0
    return root["versions"].get(userid, 0)


def touch(userid: str) -> None:
    """Change the user's version, so cached notification lists are refetched.

    Only users who have notifications have a version: for everyone else,
    there is nothing a cached list could get wrong.
    """
    root = _root()
    if root is None or userid not in root["items"]:
        return
    root = _root(create=True)
    root["versions"][userid] = root["versions"].get(userid, 0) + 1


def get_settings(userid: str) -> dict:
    root = _root()
    stored = root["settings"].get(userid, {}) if root is not None else {}
    return {**DEFAULT_SETTINGS, **dict(stored)}


def update_settings(userid: str, values: dict) -> dict:
    root = _root(create=True)
    current = get_settings(userid)
    for name in NOTIFICATION_TYPES:
        if name in values:
            current[name] = bool(values[name])
    root["settings"][userid] = PersistentMapping(current)
    return current


def get_notifications(userid: str) -> list[dict]:
    """Return the user's notifications, newest first."""
    root = _root()
    if root is None:
        return []
    return [dict(item) for item in root["items"].get(userid, [])]


def add_notification(
    userid: str,
    type_: str,
    actor: str,
    obj,
    extra: dict | None = None,
) -> dict | None:
    """Store a notification for ``userid`` unless they opted out of the type."""
    if userid == actor or not get_settings(userid).get(type_, True):
        return None
    root = _root(create=True)
    items = root["items"].get(userid)
    if items is None:
        items = root["items"][userid] = PersistentList()
    now = _now()
    uid = api.content.get_uuid(obj)
    if type_ == "modified":
        for item in items:
            if (
                item["type"] == type_
                and item["uid"] == uid
                and item["actor"] == actor
                and not item["read"]
                and now - datetime.fromisoformat(item["created"]) < COLLAPSE_WINDOW
            ):
                # Merge: bump the existing entry back to the top.
                items.remove(item)
                item["created"] = now.isoformat()
                item["title"] = obj.Title()
                items.insert(0, item)
                touch(userid)
                return dict(item)
            # Items are newest first: stop once outside the window.
            if now - datetime.fromisoformat(item["created"]) >= COLLAPSE_WINDOW:
                break
    item = PersistentMapping({
        "id": uuid.uuid4().hex,
        "type": type_,
        "actor": actor,
        "uid": uid,
        "title": obj.Title(),
        "created": now.isoformat(),
        "read": False,
        **(extra or {}),
    })
    items.insert(0, item)
    del items[MAX_PER_USER:]
    touch(userid)
    return dict(item)


def mark_read(userid: str, ids: list[str] | None = None) -> int:
    """Mark the given notifications (all when ``ids`` is None) as read."""
    root = _root()
    if root is None:
        return 0
    wanted = None if ids is None else set(ids)
    count = 0
    for item in root["items"].get(userid, []):
        if not item["read"] and (wanted is None or item["id"] in wanted):
            item["read"] = True
            count += 1
    if count:
        touch(userid)
    return count
