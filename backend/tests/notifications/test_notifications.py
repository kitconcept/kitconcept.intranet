from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME

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
