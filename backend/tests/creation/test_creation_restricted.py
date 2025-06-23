from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME

import pytest


@pytest.fixture(scope="class")
def answers():
    return {
        "site_id": "intranet",
        "title": "Intranet",
        "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
        "workflow": "restricted",
        "default_language": "en",
        "portal_timezone": "Europe/Berlin",
        "setup_content": True,
        "authentication": {"provider": "internal"},
    }


class TestSiteCreation:

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ["id", "intranet"],
        ],
    )
    def test_properties(self, site, attr, expected):
        assert getattr(site, attr) == expected

    @pytest.mark.parametrize(
        "key,expected",
        [
            ["plone.site_title", "Intranet"],
        ],
    )
    def test_registry_entries(self, site, key, expected):
        assert api.portal.get_registry_record(key) == expected

    @pytest.mark.parametrize(
        "path,title,portal_type,review_state",
        [
            ("/", "Intranet", "Plone Site", "published"),
        ],
    )
    def test_content_created(self, site, path, title, portal_type, review_state):
        with api.env.adopt_user(SITE_OWNER_NAME):
            content = api.content.get(path=path)
        assert content.title == title
        assert content.portal_type == portal_type
        assert api.content.get_state(content) == review_state

    @pytest.mark.parametrize(
        "path,permission,role,expected",
        [
            ("/", "View", "Authenticated", True),
        ],
    )
    def test_content_permission_role(
        self, site, roles_permission, path, permission, role, expected
    ):
        with api.env.adopt_user(SITE_OWNER_NAME):
            content = api.content.get(path=path)
        roles = roles_permission(content, permission)
        assert (role in roles) is expected
