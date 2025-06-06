from plone.dexterity.fti import DexterityFTI

import pytest


class TestContentTypeFTI:
    portal_type: str = "Plone Site"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti):
        self.portal = portal
        self.fti: DexterityFTI = get_fti(self.portal_type)

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "Plone Site"),
            ("klass", "Products.CMFPlone.Portal.PloneSite"),
            ("global_allow", False),
        ],
    )
    def test_fti(self, attr: str, expected):
        """Test FTI values."""
        fti = self.fti

        assert isinstance(fti, DexterityFTI)
        assert getattr(fti, attr) == expected

    @pytest.mark.parametrize(
        "index,name",
        enumerate([
            "volto.preview_image_link",
            "voltolighttheme.header",
            "voltolighttheme.theme",
            "voltolighttheme.footer",
            "kitconcept.footer",
            "kitconcept.sticky_menu",
            "plonegovbr.socialmedia.settings",
            "plone.basic",
            "plone.relateditems",
            "plone.locking",
            "volto.blocks",
        ]),
    )
    def test_behaviors(self, index: int, name: str):
        """Test behaviors are present and in correct order."""
        fti = self.fti
        assert fti.behaviors[index] == name
