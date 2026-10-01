from collections.abc import Generator
from plone import api
from plone.dexterity.fti import DexterityFTI
from Products.CMFPlone.Portal import PloneSite

import pytest


@pytest.fixture(scope="class")
def portal(app_class, create_site, answers) -> Generator[PloneSite]:
    site = create_site(app=app_class, answers=answers)
    yield site


@pytest.fixture(scope="class")
def portal_type() -> str:
    return "Workspace"


@pytest.fixture(scope="class")
def payload(portal_type) -> dict:
    return {
        "type": portal_type,
        "id": "my-personal-workspace",
        "title": "My personal workspace",
        "description": "Description of my personal workspace",
    }


class TestWorkspace:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti, portal_type) -> None:
        self.portal = portal
        self.fti: DexterityFTI = get_fti(portal_type)

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "Workspace"),
            ("factory", "Workspace"),
            ("description", "A folderish workspace container."),
            ("schema", "kitconcept.plate.content.workspace.IWorkspace"),
            ("allow_discussion", False),
            ("global_allow", True),
            ("filter_content_types", True),
            ("allowed_content_types", ("WikiPage", "File", "Image")),
        ],
    )
    def test_fti(self, attr: str, expected):
        assert isinstance(self.fti, DexterityFTI)
        assert getattr(self.fti, attr) == expected

    @pytest.mark.parametrize(
        "idx,behavior",
        (
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
                "kitconcept.plate.workspace",
            ))
        ),
    )
    def test_behaviors(self, idx, behavior):
        assert self.fti.behaviors[idx] == behavior

    def test_workspace_creation(self, content_instance, portal_type):
        assert content_instance.portal_type == portal_type
        assert content_instance.aq_parent == self.portal

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
            content_instance.title = "Workspace Redux"
            notify_modified(content_instance)
        history_data = history(content_instance)
        assert len(history_data) == 2  # Initial + modified version
        version = last_version(content_instance)
        assert version.comment is None
        assert version.version_id == 1
