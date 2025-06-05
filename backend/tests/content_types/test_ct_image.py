from plone.dexterity.fti import DexterityFTI

import pytest


class TestContentTypeFTI:
    portal_type: str = "Image"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti):
        self.portal = portal
        self.fti: DexterityFTI = get_fti(self.portal_type)

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "Image"),
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
            ("volto.kicker", True, 0),
            ("plone.categorization", True, 1),
            ("plone.publication", True, 2),
            ("plone.ownership", True, 3),
            ("plone.shortname", True, 4),
            ("plone.relateditems", True, 5),
            ("plone.namefromfilename", True, 6),
            ("plone.versioning", True, 7),
            ("plone.locking", True, 8),
        ],
    )
    def test_behavior(self, name: str, expected: bool, index: int):
        """Test behavior is present or not."""
        fti = self.fti
        behaviors = fti.behaviors
        assert (name in behaviors) is expected
        assert behaviors[index] == name if expected else True
