from plone.dexterity.fti import DexterityFTI

import pytest


class TestContentTypeFTI:
    portal_type: str = "Link"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti):
        self.portal = portal
        self.fti: DexterityFTI = get_fti(self.portal_type)

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "Link"),
            ("global_allow", True),
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
            "volto.kicker",
            "plone.categorization",
            "plone.publication",
            "plone.ownership",
            "plone.shortname",
            "volto.navtitle",
            "plone.excludefromnavigation",
            "plone.namefromtitle",
            "plone.versioning",
            "plone.locking",
            "plone.translatable",
        )
