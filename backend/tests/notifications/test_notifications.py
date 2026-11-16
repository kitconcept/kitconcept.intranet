from kitconcept.intranet.notifications import notifications_enabled
from kitconcept.intranet.notifications import notifications_paused
from kitconcept.intranet.notifications.switch import notifications_are_paused
from kitconcept.intranet.notifications.switch import SETTING
from kitconcept.intranet.upgrades.v20261116002 import (
    disable_notification_center_for_upgraded_sites,
)
from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME
from zope.event import notify
from zope.lifecycleevent import ObjectModifiedEvent

import pytest
import threading
import transaction


def _notifications(session, **params):
    response = session.get("/@notifications", params=params)
    assert response.status_code == 200, response.text
    return response.json()


class TestNotifications:
    def test_anonymous_is_unauthorized(self, portal, anon_request):
        assert anon_request.get("/@notifications").status_code == 401

    def test_empty(self, author_session):
        data = _notifications(author_session)
        assert data["items"] == []
        assert data["unread"] == 0

    def test_like_notifies_author(self, author_session, editor_session):
        assert editor_session.post("/doc1/@vote").status_code == 200
        data = _notifications(author_session)
        assert data["unread"] == 1
        item = data["items"][0]
        assert item["type"] == "like"
        assert item["actor"] == {"id": "editor", "fullname": "Editor"}
        assert item["title"] == "Doc 1"
        assert item["@id"].endswith("/doc1")
        assert item["read"] is False
        # The person who liked gets nothing.
        assert _notifications(editor_session)["unread"] == 0

    def test_unlike_does_not_notify(self, author_session, editor_session):
        editor_session.post("/doc1/@vote")
        editor_session.post("/doc1/@vote")
        assert _notifications(author_session)["unread"] == 1

    def test_edits_by_same_actor_collapse(self, author_session, editor_session):
        for title in ("Doc 1 (a)", "Doc 1 (b)"):
            response = editor_session.patch("/doc1", json={"title": title})
            assert response.status_code == 204
        data = _notifications(author_session)
        modified = [i for i in data["items"] if i["type"] == "modified"]
        assert len(modified) == 1
        assert modified[0]["title"] == "Doc 1 (b)"

    def test_own_edit_does_not_notify(self, author_session):
        author_session.patch("/doc1", json={"title": "Mine"})
        assert _notifications(author_session)["items"] == []

    def test_transition_notifies_author(self, author_session, editor_session):
        response = editor_session.post("/doc1/@workflow/publish")
        assert response.status_code == 200
        items = _notifications(author_session)["items"]
        transitions = [i for i in items if i["type"] == "transition"]
        assert len(transitions) == 1
        assert transitions[0]["review_state"] == "published"

    def test_mark_one_and_all_as_read(self, author_session, editor_session):
        editor_session.post("/doc1/@vote")
        editor_session.post("/doc1/@workflow/publish")
        data = _notifications(author_session)
        assert data["unread"] == 2
        first = data["items"][0]["id"]

        response = author_session.patch("/@notifications", json={"ids": [first]})
        assert response.status_code == 204
        data = _notifications(author_session)
        assert data["unread"] == 1
        assert _notifications(author_session, unread_only=1)["items_total"] == 1

        author_session.patch("/@notifications", json={})
        assert _notifications(author_session)["unread"] == 0

    def test_batching(self, author_session, editor_session):
        editor_session.post("/doc1/@vote")
        editor_session.post("/doc1/@workflow/publish")
        data = _notifications(author_session, b_size=1)
        assert data["items_total"] == 2
        assert len(data["items"]) == 1

    def test_deleted_content_is_hidden(self, portal, author_session, editor_session):
        editor_session.post("/doc1/@vote")
        # Sync with what the HTTP thread committed before changing content.
        transaction.begin()
        with api.env.adopt_user(SITE_OWNER_NAME):
            api.content.delete(portal._getOb("doc1"), check_linkintegrity=False)
        transaction.commit()
        data = _notifications(author_session)
        assert data["items"] == []
        assert data["unread"] == 0


class TestNotificationSettings:
    def test_defaults(self, author_session):
        response = author_session.get("/@notifications-settings")
        assert response.json() == {"like": True, "modified": True, "transition": True}

    def test_opt_out(self, author_session, editor_session):
        response = author_session.patch(
            "/@notifications-settings", json={"like": False}
        )
        assert response.status_code == 200
        assert response.json()["like"] is False
        editor_session.post("/doc1/@vote")
        assert _notifications(author_session)["items"] == []

    def test_unknown_type(self, author_session):
        response = author_session.patch("/@notifications-settings", json={"x": 1})
        assert response.status_code == 400


class TestNotificationsETag:
    """Polls that find nothing new are answered with 304 Not Modified."""

    @staticmethod
    def _poll(session, etag=None, **params):
        headers = {"If-None-Match": etag} if etag else {}
        return session.get("/@notifications", params=params, headers=headers)

    def test_etag_and_revalidation_headers(self, author_session):
        response = self._poll(author_session)
        assert response.status_code == 200
        assert response.headers["ETag"].startswith('"')
        assert response.headers["Cache-Control"] == "private, no-cache"

    def test_unchanged_list_is_not_modified(self, author_session, editor_session):
        editor_session.post("/doc1/@vote")
        etag = self._poll(author_session).headers["ETag"]
        response = self._poll(author_session, etag)
        assert response.status_code == 304
        assert response.content == b""
        assert response.headers["ETag"] == etag

    def test_weak_and_listed_etags_match(self, author_session):
        etag = self._poll(author_session).headers["ETag"]
        assert self._poll(author_session, f"W/{etag}").status_code == 304
        assert self._poll(author_session, f'"other", {etag}').status_code == 304
        assert self._poll(author_session, '"other"').status_code == 200

    def test_etag_depends_on_query_and_user(self, author_session, editor_session):
        etag = self._poll(author_session).headers["ETag"]
        assert self._poll(author_session, etag, b_size=5).status_code == 200
        assert self._poll(editor_session, etag).status_code == 200

    def test_new_notification_changes_etag(self, author_session, editor_session):
        etag = self._poll(author_session).headers["ETag"]
        editor_session.post("/doc1/@vote")
        response = self._poll(author_session, etag)
        assert response.status_code == 200
        assert response.json()["unread"] == 1

    def test_mark_read_changes_etag(self, author_session, editor_session):
        editor_session.post("/doc1/@vote")
        etag = self._poll(author_session).headers["ETag"]
        author_session.patch("/@notifications", json={})
        response = self._poll(author_session, etag)
        assert response.status_code == 200
        assert response.json()["unread"] == 0

    def test_own_edit_changes_etag(self, author_session, editor_session):
        # The author's own retitling creates no notification, but their
        # list shows the new title.
        editor_session.post("/doc1/@vote")
        etag = self._poll(author_session).headers["ETag"]
        author_session.patch("/doc1", json={"title": "Doc One"})
        response = self._poll(author_session, etag)
        assert response.status_code == 200
        assert response.json()["items"][0]["title"] == "Doc One"

    def test_rename_changes_etag(self, portal, author_session, editor_session):
        editor_session.post("/doc1/@vote")
        etag = self._poll(author_session).headers["ETag"]
        transaction.begin()
        with api.env.adopt_user(SITE_OWNER_NAME):
            api.content.rename(obj=portal["doc1"], new_id="doc-renamed")
        transaction.commit()
        response = self._poll(author_session, etag)
        assert response.status_code == 200
        assert response.json()["items"][0]["@id"].split(chr(47))[-1] == "doc-renamed"

    def test_delete_changes_etag(self, portal, author_session, editor_session):
        editor_session.post("/doc1/@vote")
        etag = self._poll(author_session).headers["ETag"]
        transaction.begin()
        with api.env.adopt_user(SITE_OWNER_NAME):
            api.content.delete(obj=portal["doc1"], check_linkintegrity=False)
        transaction.commit()
        response = self._poll(author_session, etag)
        assert response.status_code == 200
        assert response.json()["unread"] == 0


def _set_enabled(value: bool) -> None:
    transaction.begin()
    api.portal.set_registry_record(SETTING, value)
    transaction.commit()


class TestNotificationCenterSetting:
    def test_on_by_default(self, portal):
        assert notifications_enabled() is True

    @pytest.mark.parametrize(
        "method,path",
        (
            ("get", "/@notifications"),
            ("patch", "/@notifications"),
            ("get", "/@notifications-settings"),
            ("patch", "/@notifications-settings"),
        ),
    )
    def test_endpoints_are_not_found_when_off(self, author_session, method, path):
        _set_enabled(False)
        response = getattr(author_session, method)(path, json={})
        assert response.status_code == 404

    def test_anonymous_gets_not_found_when_off(self, portal, anon_request):
        _set_enabled(False)
        assert anon_request.get("/@notifications").status_code == 404

    def test_nothing_is_created_when_off(self, author_session, editor_session):
        _set_enabled(False)
        assert editor_session.post("/doc1/@vote").status_code == 200
        assert editor_session.patch("/doc1", json={"title": "Off"}).status_code == 204
        assert editor_session.post("/doc1/@workflow/publish").status_code == 200
        _set_enabled(True)
        assert _notifications(author_session)["items"] == []

    def test_notifications_are_kept_while_off(self, author_session, editor_session):
        editor_session.post("/doc1/@vote")
        _set_enabled(False)
        _set_enabled(True)
        assert _notifications(author_session)["unread"] == 1

    def test_upgrade_step_turns_it_off(self, portal):
        transaction.begin()
        disable_notification_center_for_upgraded_sites(None)
        transaction.commit()
        assert notifications_enabled() is False


class TestNotificationsPaused:
    def _edit(self, portal, title):
        transaction.begin()
        with api.env.adopt_user("editor"):
            doc = portal["doc1"]
            doc.title = title
            notify(ObjectModifiedEvent(doc))
        transaction.commit()

    def test_paused_block_creates_nothing(self, portal, author_session):
        with notifications_paused():
            assert notifications_are_paused()
            self._edit(portal, "Batch")
        assert not notifications_are_paused()
        assert _notifications(author_session)["items"] == []

    def test_notifies_again_after_the_block(self, portal, author_session):
        with notifications_paused():
            self._edit(portal, "Batch")
        self._edit(portal, "Manual")
        items = _notifications(author_session)["items"]
        assert [item["type"] for item in items] == ["modified"]

    def test_nested_blocks(self, portal):
        with notifications_paused():
            with notifications_paused():
                pass
            assert notifications_are_paused()
        assert not notifications_are_paused()

    def test_resumes_after_an_error(self, portal):
        with pytest.raises(RuntimeError), notifications_paused():
            raise RuntimeError
        assert not notifications_are_paused()

    def test_only_the_current_thread_is_paused(self, portal):
        seen = []
        with notifications_paused():
            thread = threading.Thread(
                target=lambda: seen.append(notifications_are_paused())
            )
            thread.start()
            thread.join()
        assert seen == [False]
