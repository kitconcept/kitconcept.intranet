from kitconcept.intranet.testing.logo import TEST_LOGO
from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME
from typing import Any

import pytest


@pytest.fixture(scope="class")
def answers():
    return {
        "site_id": "public",
        "title": "Intranet",
        "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
        "workflow": "public",
        "available_languages": ["de", "en"],
        "portal_timezone": "Europe/Berlin",
        "site_logo": TEST_LOGO,
        "setup_content": True,
        "authentication": {"provider": "internal"},
    }


class TestSiteCreation:
    @pytest.fixture(autouse=True)
    def _setup(self, site):
        self.site = site

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ["id", "public"],
        ],
    )
    def test_properties(self, attr, expected):
        assert getattr(self.site, attr) == expected

    @pytest.mark.parametrize(
        "record,oper,expected",
        [
            ("plone.site_title", "eq", "Intranet"),
            ("plone.default_language", "eq", "de"),
            ("plone.available_languages", "eq", ["de", "en"]),
            ("plone.site_logo", "starts", b"filenameb64"),
        ],
    )
    def test_registry_portal_settings(
        self, registry_checker, record: str, oper: str, expected: Any
    ):
        """Test registry settings."""
        registry_checker(record, oper, expected)

    @pytest.mark.parametrize(
        "path,title,portal_type,review_state",
        [
            ("/", "Intranet", "Plone Site", "published"),
        ],
    )
    def test_content_created(self, path, title, portal_type, review_state):
        with api.env.adopt_user(SITE_OWNER_NAME):
            content = api.content.get(path=path)
        assert content.title == title
        assert content.portal_type == portal_type
        assert api.content.get_state(content) == review_state

    @pytest.mark.parametrize(
        "path,permission,role,expected",
        [
            ("/", "View", "Anonymous", True),
        ],
    )
    def test_content_permission_role(
        self, roles_permission, path, permission, role, expected
    ):
        with api.env.adopt_user(SITE_OWNER_NAME):
            content = api.content.get(path=path)
        roles = roles_permission(content, permission)
        assert (role in roles) is expected
