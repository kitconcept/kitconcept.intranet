import pytest


@pytest.fixture(scope="class")
def answers():
    return {
        "site_id": "intranet",
        "title": "Intranet",
        "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
        "workflow": "restricted",
        "available_languages": ["en"],
        "portal_timezone": "Europe/Berlin",
        "setup_content": True,
        "authentication": {"provider": "internal"},
    }


@pytest.fixture(scope="class")
def portal(site):
    yield site


class TestSiteGetRestricted:
    """@site serves public bootstrap data and must work for anonymous users
    even when the restricted workflow removes View from the site root."""

    @pytest.fixture(autouse=True)
    def _setup(self, api_anon_request):
        self.api_session = api_anon_request

    def test_site_get_anonymous(self):
        response = self.api_session.get("/@site")
        assert response.status_code == 200
        data = response.json()
        assert data["plone.site_title"] == "Intranet"

    def test_site_root_still_requires_authentication(self):
        response = self.api_session.get("/")
        assert response.status_code == 401
