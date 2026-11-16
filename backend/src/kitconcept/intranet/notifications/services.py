"""REST API for the current user's notifications and preferences."""

from . import storage
from datetime import UTC
from datetime import datetime
from plone import api
from plone.protect.interfaces import IDisableCSRFProtection
from plone.restapi.deserializer import json_body
from plone.restapi.services import Service
from zExceptions import BadRequest
from zExceptions import Unauthorized
from zope.i18n import translate
from zope.interface import alsoProvides

import hashlib


DEFAULT_BATCH_SIZE = 25


def _current_userid() -> str:
    if api.user.is_anonymous():
        raise Unauthorized("Must be logged in.")
    return api.user.get_current().getId()


def _fullname(userid: str, cache: dict) -> str:
    if userid not in cache:
        user = api.user.get(userid=userid)
        fullname = user.getProperty("fullname", "") if user else ""
        cache[userid] = fullname or userid
    return cache[userid]


def _etag(userid: str, request) -> str:
    """ETag of the user's notification list as this request would render it.

    Changes with the user's notifications (``storage.touch``), the query and
    the language. The hour is part of it as a safety net: changes the
    subscribers don't see, such as new local roles or a renamed actor, show
    up within an hour.
    """
    parts = [
        userid,
        str(storage.get_version(userid)),
        request.get("QUERY_STRING", ""),
        api.portal.get_current_language(),
        datetime.now(UTC).strftime("%Y-%m-%dT%H"),
    ]
    digest = hashlib.sha256("\n".join(parts).encode()).hexdigest()[:32]
    return f'"{digest}"'


def _matches(etag: str, if_none_match: str) -> bool:
    """Whether ``etag`` is in an If-None-Match header, ignoring weakness.

    Proxies that compress the response may turn the ETag into a weak one.
    """
    if not if_none_match:
        return False
    for candidate in if_none_match.split(","):
        candidate = candidate.strip()
        if candidate.startswith("W/"):
            candidate = candidate[2:]
        if candidate in (etag, "*"):
            return True
    return False


class NotificationsGet(Service):
    """List the current user's notifications, newest first.

    Entries about content the user can no longer view are left out.
    Query: ``b_start``, ``b_size``, ``unread_only``.

    Responses carry an ETag and must be revalidated. A request whose
    If-None-Match matches gets 304 Not Modified without a body: the bell
    polls every minute, and most polls find nothing new.
    """

    def reply(self):
        userid = _current_userid()
        etag = _etag(userid, self.request)
        response = self.request.response
        response.setHeader("ETag", etag)
        response.setHeader("Cache-Control", "private, no-cache")
        if _matches(etag, self.request.getHeader("If-None-Match", "")):
            return self.reply_no_content(status=304)
        form = self.request.form
        try:
            b_start = max(int(form.get("b_start", 0)), 0)
            b_size = max(int(form.get("b_size", DEFAULT_BATCH_SIZE)), 0)
        except ValueError as exc:
            raise BadRequest("b_start and b_size must be integers.") from exc
        unread_only = str(form.get("unread_only", "")).lower() in ("1", "true")

        notifications = storage.get_notifications(userid)
        uids = list({item["uid"] for item in notifications})
        brains = api.content.find(UID=uids) if uids else []
        visible = {brain.UID: brain for brain in brains}

        names: dict = {}
        items = []
        unread = 0
        for item in notifications:
            brain = visible.get(item["uid"])
            if brain is None:
                continue
            if not item["read"]:
                unread += 1
            elif unread_only:
                continue
            extra = {}
            if item.get("review_state_title"):
                # Workflow state titles are msgids of the plone domain.
                extra["review_state_title"] = translate(
                    item["review_state_title"], domain="plone", context=self.request
                )
            items.append({
                **item,
                **extra,
                "@id": brain.getURL(),
                "title": brain.Title or item["title"],
                "portal_type": brain.portal_type,
                "actor": {
                    "id": item["actor"],
                    "fullname": _fullname(item["actor"], names),
                },
            })
        return {
            "@id": f"{self.context.absolute_url()}/@notifications",
            "items_total": len(items),
            "unread": unread,
            "items": items[b_start : b_start + b_size],
        }


class NotificationsPatch(Service):
    """Mark notifications as read: ``{"ids": [...]}``, or all without ``ids``."""

    def reply(self):
        userid = _current_userid()
        alsoProvides(self.request, IDisableCSRFProtection)
        data = json_body(self.request) or {}
        ids = data.get("ids")
        if ids is not None and not isinstance(ids, list):
            raise BadRequest("ids must be a list.")
        storage.mark_read(userid, ids)
        return self.reply_no_content()


class NotificationSettingsGet(Service):
    def reply(self):
        return storage.get_settings(_current_userid())


class NotificationSettingsPatch(Service):
    """Update preferences, e.g. ``{"like": false}``."""

    def reply(self):
        userid = _current_userid()
        alsoProvides(self.request, IDisableCSRFProtection)
        data = json_body(self.request) or {}
        unknown = set(data) - set(storage.NOTIFICATION_TYPES)
        if unknown:
            raise BadRequest(f"Unknown notification types: {sorted(unknown)}")
        return storage.update_settings(userid, data)
