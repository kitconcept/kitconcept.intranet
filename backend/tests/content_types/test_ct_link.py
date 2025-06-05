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

    @pytest.mark.parametrize(
        "name,expected,index",
        [
            ("plone.basic", True, 0),
            ("volto.preview_image_link", True, 1),
            ("volto.kicker", True, 2),
            ("plone.categorization", True, 3),
            ("plone.publication", True, 4),
            ("plone.ownership", True, 5),
            ("plone.shortname", True, 6),
            ("volto.navtitle", True, 7),
            ("plone.excludefromnavigation", True, 8),
            ("plone.namefromtitle", True, 9),
            ("plone.versioning", True, 10),
            ("plone.locking", True, 11),
            ("plone.translatable", True, 12),
        ],
    )
    def test_behavior(self, name: str, expected: bool, index: int):
        """Test behavior is present or not."""
        fti = self.fti
        behaviors = fti.behaviors
        assert (name in behaviors) is expected
        assert behaviors[index] == name if expected else True
