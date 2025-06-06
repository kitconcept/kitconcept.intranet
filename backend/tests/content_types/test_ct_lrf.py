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
        "index,name",
        enumerate(
            [
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
            ]
        ),
    )
    def test_behaviors(self, index: int, name: str):
        """Test behaviors are present and in correct order."""
        fti = self.fti
        assert fti.behaviors[index] == name
