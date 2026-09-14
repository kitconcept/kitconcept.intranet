from collections.abc import Generator
from kitconcept.intranet.content.subsite import ISubsite
from kitconcept.intranet.content.subsite import Subsite
from plone import api
from plone.dexterity.fti import DexterityFTI
from Products.CMFPlone.Portal import PloneSite
from zope.component import createObject

import pytest


@pytest.fixture(scope="class")
def portal(app_class, create_site, answers) -> Generator[PloneSite]:
    site = create_site(app=app_class, answers=answers)
    yield site


@pytest.fixture(scope="class")
def portal_type() -> str:
    return "Subsite"


@pytest.fixture(scope="class")
def payload(portal_type) -> dict:
    return {
        "type": portal_type,
        "id": "my-other-subsite",
        "title": "My Subsite",
        "description": "Description of my subsite",
    }


class TestSubsite:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti, portal_type) -> None:
        self.portal = portal
        self.fti: DexterityFTI = get_fti(portal_type)

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "Subsite"),
            ("description", ""),
            ("allow_discussion", False),
            ("global_allow", True),
            ("filter_content_types", True),
            ("add_permission", "kitconcept.intranet.siteadminsonly"),
            (
                "allowed_content_types",
                (
                    "Document",
                    "File",
                    "Image",
                    "Link",
                ),
            ),
        ],
    )
    def test_fti(self, attr: str, expected):
        assert isinstance(self.fti, DexterityFTI)
        assert getattr(self.fti, attr) == expected

    def test_factory(self):
        factory = self.fti.factory
        obj = createObject(factory)
        assert obj is not None
        assert isinstance(obj, Subsite)

    @pytest.mark.parametrize(
        "idx,behavior",
        enumerate((
            "plone.basic",
            "volto.preview_image_link",
            "volto.kicker",
            "kitconcept.intranet.location",
            "plone.categorization",
            "plone.publication",
            "plone.ownership",
            "plone.shortname",
            "volto.navtitle",
            "plone.excludefromnavigation",
            "volto.blocks",
            "voltolighttheme.header",
            "voltolighttheme.theme",
            "voltolighttheme.footer",
            "kitconcept.footer",
            "plone.constraintypes",
            "plone.namefromtitle",
            "plone.versioning",
            "plone.locking",
            "plone.translatable",
            "plone.navigationroot",
        )),
    )
    def test_behaviors(self, idx, behavior):
        assert self.fti.behaviors[idx] == behavior

    def test_create(self, site_owner_name, portal_type):
        container = self.portal
        with api.env.adopt_user(site_owner_name):
            content = api.content.create(
                container=container,
                type=portal_type,
                title="My Subsite",
                id="my-subsite",
            )

        assert content.portal_type == portal_type
        assert content.aq_parent == container
        assert ISubsite.providedBy(content)

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
            content_instance.title = "Subsite Redux"
            notify_modified(content_instance)
        history_data = history(content_instance)
        assert len(history_data) == 2  # Initial + modified version
        version = last_version(content_instance)
        assert version.comment is None
        assert version.version_id == 1
