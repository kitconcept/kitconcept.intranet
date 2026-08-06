from collections.abc import Generator
from plone import api
from plone.api.exc import InvalidParameterError
from plone.dexterity.fti import DexterityFTI
from Products.CMFPlone.Portal import PloneSite

import pytest


@pytest.fixture(scope="class")
def portal(app_class, create_site, answers) -> Generator[PloneSite]:
    site = create_site(app=app_class, answers=answers)
    yield site


@pytest.fixture(scope="class")
def portal_type() -> str:
    return "WikiPage"


@pytest.fixture(scope="class")
def container(portal, content_factory):
    """Return the container used to create the content instance under test."""
    payload = {
        "type": "Workspace",
        "id": "my-workspace",
    }
    return content_factory(portal, payload)


@pytest.fixture(scope="class")
def payload(portal_type) -> dict:
    return {
        "type": portal_type,
        "id": "my-other-wiki-page",
        "title": "My other wiki page",
        "description": "Description of my other wiki page",
    }


class TestWikiPage:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti, portal_type) -> None:
        self.portal = portal
        self.fti: DexterityFTI = get_fti(portal_type)

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "Wiki Page"),
            ("description", "A Plate-powered wiki page."),
            ("allow_discussion", False),
            ("global_allow", False),
            ("filter_content_types", True),
            (
                "allowed_content_types",
                (
                    "WikiPage",
                    "File",
                    "Image",
                ),
            ),
        ],
    )
    def test_fti(self, attr: str, expected):
        assert isinstance(self.fti, DexterityFTI)
        assert getattr(self.fti, attr) == expected

    @pytest.mark.parametrize(
        "idx,behavior",
        enumerate((
            "plone.basic",
            "volto.preview_image_link",
            "plone.categorization",
            "plone.publication",
            "plone.ownership",
            "plone.relateditems",
            "plone.shortname",
            "volto.navtitle",
            "plone.excludefromnavigation",
            "plone.allowdiscussion",
            "volto.blocks",
            "plone.constraintypes",
            "plone.namefromtitle",
            "plone.versioning",
            "plone.locking",
            "plone.translatable",
            "kitconcept.intranet.clm",
        )),
    )
    def test_behaviors(self, idx, behavior):
        assert self.fti.behaviors[idx] == behavior

    def test_wikipage_requires_workspace_container(
        self, site_owner_name, content_factory, portal_type, payload
    ):
        with api.env.adopt_user(site_owner_name):
            with pytest.raises(InvalidParameterError):
                content_factory(self.portal, payload)

            workspace = content_factory(
                self.portal,
                {"type": "Workspace", "title": "Team Workspace"},
            )
            page = content_factory(workspace, payload)

        assert page.portal_type == portal_type
        assert page.aq_parent == workspace

    def test_versionable(self, portal_type, versionable_content_types):
        assert portal_type in versionable_content_types

    def test_create_initial_version_after_adding(self, last_version, content_instance):
        version = last_version(content_instance)
        assert version.comment.default == "Initial version"
        assert version.version_id == 0

    def test_create_version_on_save(
        self, notify_modified, history, last_version, content_instance
    ):
        with api.env.adopt_roles(["Manager"]):
            content_instance.title = "Wiki Redux"
            notify_modified(content_instance)
        history_data = history(content_instance)
        assert len(history_data) == 2  # Initial + modified version
        version = last_version(content_instance)
        assert version.comment is None
        assert version.version_id == 1
