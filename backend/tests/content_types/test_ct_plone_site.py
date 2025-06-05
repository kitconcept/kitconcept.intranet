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
        "name,expected,index",
        [
            ("volto.preview_image_link", True, 0),
            ("voltolighttheme.header", True, 1),
            ("voltolighttheme.theme", True, 2),
            ("voltolighttheme.footer", True, 3),
            ("kitconcept.footer", True, 4),
            ("kitconcept.sticky_menu", True, 5),
            ("plonegovbr.socialmedia.settings", True, 6),
            ("plone.basic", True, 7),
            ("plone.relateditems", True, 8),
            ("plone.locking", True, 9),
            ("volto.blocks", True, 10),
        ],
    )
    def test_behavior(self, name: str, expected: bool, index: int):
        """Test behavior is present or not."""
        fti = self.fti
        behaviors = fti.behaviors
        assert (name in behaviors) is expected
        assert behaviors[index] == name if expected else True
