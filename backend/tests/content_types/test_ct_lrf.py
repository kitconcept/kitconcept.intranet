from plone.dexterity.fti import DexterityFTI

import pytest


@pytest.mark.skip(reason="Only available if plone.app.multilingual is installed")
class TestContentTypeFTI:
    portal_type: str = "LRF"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti):
        self.portal = portal
        self.fti: DexterityFTI = get_fti(self.portal_type)

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "LRF"),
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
            ("plone.basic", True, 0),
            ("volto.preview_image_link", True, 1),
            ("plone.categorization", True, 2),
            ("plone.publication", True, 3),
            ("plone.ownership", True, 4),
            ("volto.blocks", True, 5),
            ("plone.constraintypes", True, 6),
            ("plone.namefromtitle", True, 7),
            ("plone.navigationroot", True, 8),
            ("plone.locking", True, 9),
            ("plone.versioning", True, 10),
            ("plone.translatable", True, 11),
        ],
    )
    def test_behavior(self, name: str, expected: bool, index: int):
        """Test behavior is present or not."""
        fti = self.fti
        behaviors = fti.behaviors
        assert (name in behaviors) is expected
        assert behaviors[index] == name if expected else True
