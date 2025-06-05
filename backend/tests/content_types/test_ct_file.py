from plone.dexterity.fti import DexterityFTI

import pytest


class TestContentTypeFTI:
    portal_type: str = "File"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti):
        self.portal = portal
        self.fti: DexterityFTI = get_fti(self.portal_type)

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "File"),
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
            ("plone.categorization", True, 0),
            ("plone.publication", True, 1),
            ("plone.ownership", True, 2),
            ("volto.preview_image_link", True, 3),
            ("volto.kicker", True, 4),
            ("plone.shortname", True, 5),
            ("plone.relateditems", True, 6),
            ("plone.namefromfilename", True, 7),
            ("plone.versioning", True, 8),
            ("plone.locking", True, 9),
        ],
    )
    def test_behavior(self, name: str, expected: bool, index: int):
        """Test behavior is present or not."""
        fti = self.fti
        behaviors = fti.behaviors
        assert (name in behaviors) is expected
        assert behaviors[index] == name if expected else True
