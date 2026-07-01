from Acquisition import aq_parent
from collections.abc import Generator
from Products.CMFPlone.Portal import PloneSite

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
def functional_portal(
    functional_portal_class, create_site, answers
) -> Generator[PloneSite, None, None]:
    app = aq_parent(functional_portal_class)
    site = create_site(app=app, answers=answers)
    yield site


class TestSiteGetRestricted:
    """@site serves public bootstrap data and must work for anonymous users
    even when the restricted workflow removes View from the site root."""

    @pytest.fixture(autouse=True)
    def _setup(self, functional_portal, anon_request):
        self.portal = functional_portal
        self.api_session = anon_request

    def test_site_get_anonymous(self):
        response = self.api_session.get("/@site")
        assert response.status_code == 200
        data = response.json()
        assert data["plone.site_title"] == "Intranet"

    def test_site_root_still_requires_authentication(self):
        response = self.api_session.get("/")
        assert response.status_code == 401
