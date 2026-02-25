import pytest


@pytest.fixture(scope="class")
def portal(portal_class):
    yield portal_class


class TestReviewPost:
    @pytest.fixture(autouse=True)
    def _setup(self, api_manager_request, api_anon_request):
        self.api_session = api_manager_request
        self.anon_api_session = api_anon_request

    def test_response_not_reviewable(self):
        resp = self.api_session.post("/@review")
        assert resp.status_code == 404

    def test_response_no_action(self):
        resp = self.api_session.post("/aktuelles/@review")
        assert resp.status_code == 400

    def test_response_anonymous(self):
        resp = self.anon_api_session.post("/aktuelles/@review")
        assert resp.status_code == 401

    def test_response_unknown_action(self):
        resp = self.api_session.post("/aktuelles/@review/foobar")
        assert resp.status_code == 400
