from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME
from plone.distribution.api import site as site_api
from Products.CMFPlone.Portal import PloneSite
from zope.component.hooks import setSite

import pytest


@pytest.fixture()
def answers():
    return {
        "site_id": "intranet",
        "title": "My Site",
        "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",
        "default_language": "en",
        "portal_timezone": "Europe/Berlin",
        "setup_content": True,
    }


@pytest.fixture
def create_site(app, distribution_name):
    def func(answers: dict) -> PloneSite:
        with api.env.adopt_user(SITE_OWNER_NAME):
            site = site_api.create(app, distribution_name, answers)
            setSite(site)
        return site

    return func


class TestCreationSite:
    @pytest.fixture(autouse=True)
    def _create_site(self, create_site, answers, solr_service):
        self.site = create_site(answers)

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ["id", "intranet"],
        ],
    )
    def test_properties(self, attr, expected):
        site = self.site
        assert getattr(site, attr) == expected

    @pytest.mark.parametrize(
        "key,expected",
        [
            ["plone.site_title", "My Site"],
        ],
    )
    def test_registry_entries(self, key, expected):
        assert api.portal.get_registry_record(key) == expected
