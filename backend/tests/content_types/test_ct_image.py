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
        "index,name",
        enumerate([
            "volto.kicker",
            "plone.categorization",
            "plone.publication",
            "plone.ownership",
            "plone.shortname",
            "plone.relateditems",
            "plone.namefromfilename",
            "plone.versioning",
            "plone.locking",
        ]),
    )
    def test_behaviors(self, index: int, name: str):
        """Test behaviors are present and in correct order."""
        fti = self.fti
        assert fti.behaviors[index] == name
