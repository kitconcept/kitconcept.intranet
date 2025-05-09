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
        "title": "Intranet",
        "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
        "workflow": "restricted",
        "default_language": "en",
        "portal_timezone": "Europe/Berlin",
        "setup_content": True,
    }


@pytest.fixture()
def answers_public():
    return {
        "site_id": "public",
        "title": "Intranet",
        "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
        "workflow": "public",
        "default_language": "en",
        "portal_timezone": "Europe/Berlin",
        "setup_content": True,
    }


@pytest.fixture()
def roles_permission():
    def func(context, permission: str) -> list[str]:
        report = context.rolesOfPermission(permission)
        return [role["name"] for role in report if role["selected"]]

    return func


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
    def _create_site(self, create_site, answers):
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
            ["plone.site_title", "Intranet"],
        ],
    )
    def test_registry_entries(self, key, expected):
        assert api.portal.get_registry_record(key) == expected

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
            ("/", "View", "Authenticated", True),
        ],
    )
    def test_content_permission_role(
        self, roles_permission, path, permission, role, expected
    ):
        with api.env.adopt_user(SITE_OWNER_NAME):
            content = api.content.get(path=path)
        roles = roles_permission(content, permission)
        assert (role in roles) is expected


class TestCreationPublicSite(TestCreationSite):
    @pytest.fixture(autouse=True)
    def _create_site(self, create_site, answers_public):
        self.site = create_site(answers_public)

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ["id", "public"],
        ],
    )
    def test_properties(self, attr, expected):
        site = self.site
        assert getattr(site, attr) == expected

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
