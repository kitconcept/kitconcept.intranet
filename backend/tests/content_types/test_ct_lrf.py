from Acquisition import aq_parent
from collections.abc import Generator
from kitconcept.intranet.testing.logo import TEST_LOGO
from plone.dexterity.fti import DexterityFTI
from Products.CMFPlone.Portal import PloneSite

import pytest


@pytest.fixture(scope="session")
def answers() -> dict:
    return {
        "site_id": "plone2",
        "title": "Intranet",
        "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
        "available_languages": ["de", "en"],
        "default_language": "de",
        "portal_timezone": "Europe/Berlin",
        "site_logo": TEST_LOGO,
        "workflow": "public",
        "setup_content": False,
        "authentication": {"provider": "internal"},
    }


@pytest.fixture(scope="class")
def portal(portal_class, create_site, answers) -> Generator[PloneSite, None, None]:
    app = aq_parent(portal_class)
    site = create_site(app=app, answers=answers)
    yield site


class TestContentTypeFTI:
    portal_type: str = "LRF"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti) -> None:
        self.portal = portal
        self.fti: DexterityFTI = get_fti(self.portal_type)

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "Language Root Folder"),
            ("global_allow", False),
        ],
    )
    def test_fti(self, attr: str, expected):
        """Test FTI values."""
        fti = self.fti

        assert isinstance(fti, DexterityFTI)
        assert getattr(fti, attr) == expected

    def test_behaviors(self):
        """Test behaviors are present and in correct order."""
        assert self.fti.behaviors == (
            "plone.basic",
            "volto.preview_image_link",
            "plone.categorization",
            "plone.publication",
            "plone.ownership",
            "volto.blocks",
            "plone.constraintypes",
            "plone.namefromtitle",
            "plone.navigationroot",
            "plone.locking",
            "plone.versioning",
            "plone.translatable",
        )
