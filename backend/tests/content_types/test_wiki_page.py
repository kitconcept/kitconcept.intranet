from collections.abc import Generator
from plone import api
from plone.api.exc import InvalidParameterError
from plone.app.testing.interfaces import SITE_OWNER_NAME
from plone.dexterity.fti import DexterityFTI
from Products.CMFPlone.Portal import PloneSite

import pytest


@pytest.fixture(scope="class")
def portal(app_class, create_site, answers) -> Generator[PloneSite]:
    site = create_site(app=app_class, answers=answers)
    yield site


class TestWikiPage:
    portal_type: str = "WikiPage"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti) -> None:
        self.portal = portal
        self.fti: DexterityFTI = get_fti(self.portal_type)

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

    def test_behaviors(self):
        assert self.fti.behaviors == (
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
        )

    def test_wikipage_requires_workspace_container(self):
        with api.env.adopt_user(SITE_OWNER_NAME):
            with pytest.raises(InvalidParameterError):
                api.content.create(
                    container=self.portal,
                    type=self.portal_type,
                    title="Root Wiki Page",
                )

            workspace = api.content.create(
                container=self.portal,
                type="Workspace",
                title="Team Workspace",
            )
            page = api.content.create(
                container=workspace,
                type=self.portal_type,
                title="Workspace Wiki Page",
            )

        assert page.portal_type == self.portal_type
        assert page.aq_parent == workspace
