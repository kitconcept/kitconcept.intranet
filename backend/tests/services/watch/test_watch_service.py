from plone import api

import pytest
import transaction


WATCHED_BY_ME = {
    "query": [
        {
            "i": "watchers",
            "o": "plone.app.querystring.operation.string.watchedByCurrentUser",
        }
    ]
}


class TestWatchService:
    @pytest.fixture(autouse=True)
    def _setup(self, functional_portal, user_request, anon_request):
        self.portal = functional_portal
        self.alice = user_request("alice")
        self.anon = anon_request

    def test_anonymous_cannot_watch(self):
        response = self.anon.post("/doc1/@watch")
        assert response.status_code == 401

    def test_get_not_watching(self):
        response = self.alice.get("/doc1/@watch")
        assert response.status_code == 200
        assert response.json()["watching"] is False

    def test_toggle(self):
        response = self.alice.post("/doc1/@watch")
        assert response.status_code == 200
        assert response.json()["watching"] is True
        assert self.alice.get("/doc1/@watch").json()["watching"] is True

        response = self.alice.post("/doc1/@watch")
        assert response.json()["watching"] is False
        assert self.alice.get("/doc1/@watch").json()["watching"] is False

    def test_watching_is_per_user(self, user_request):
        self.alice.post("/doc1/@watch")
        carol = user_request("carol")
        assert carol.get("/doc1/@watch").json()["watching"] is False

    def test_watch_does_not_modify_content(self):
        before = self.alice.get("/doc1").json()["modified"]
        self.alice.post("/doc1/@watch")
        assert self.alice.get("/doc1").json()["modified"] == before

    def test_expander(self):
        self.alice.post("/doc1/@watch")
        data = self.alice.get("/doc1?expand=watch").json()
        assert data["@components"]["watch"]["watching"] is True

    def test_watchers_not_serialized(self):
        self.alice.post("/doc1/@watch")
        data = self.alice.get("/doc1").json()
        assert "watchers" not in data
        assert "watching" not in data["@components"]["watch"]

    def test_disabled(self, disable_watching):
        assert self.alice.get("/doc1/@watch").status_code == 404
        assert self.alice.post("/doc1/@watch").status_code == 404


class TestWatchedByMe:
    @pytest.fixture(autouse=True)
    def _setup(self, functional_portal, user_request, anon_request):
        self.portal = functional_portal
        self.alice = user_request("alice")
        self.carol = user_request("carol")
        self.anon = anon_request

    def _titles(self, session):
        response = session.post("/@querystring-search", json=WATCHED_BY_ME)
        assert response.status_code == 200
        return [item["title"] for item in response.json()["items"]]

    def test_catalog_index(self):
        self.alice.post("/doc1/@watch")
        transaction.begin()
        catalog = api.portal.get_tool("portal_catalog")
        brains = catalog.unrestrictedSearchResults(watchers="alice")
        assert [brain.getId for brain in brains] == ["doc1"]

    def test_watched_by_me(self):
        self.alice.post("/doc1/@watch")
        assert self._titles(self.alice) == ["Doc 1"]
        assert self._titles(self.carol) == []

    def test_unwatched_item_leaves_the_list(self):
        self.alice.post("/doc1/@watch")
        self.alice.post("/doc1/@watch")
        assert self._titles(self.alice) == []

    def test_anonymous_gets_nothing(self):
        self.alice.post("/doc1/@watch")
        assert self._titles(self.anon) == []
