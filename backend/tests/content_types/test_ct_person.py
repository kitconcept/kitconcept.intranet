from plone.dexterity.fti import DexterityFTI

import pytest


class TestContentTypeFTI:
    portal_type: str = "Person"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti):
        self.portal = portal
        self.fti: DexterityFTI = get_fti(self.portal_type)

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "Person"),
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
            ("volto.preview_image_link", True, 0),
            ("collective.person.person", True, 1),
            ("collective.contact_behaviors.contact_info", True, 2),
            ("kitconcept.core.additional_contact_info", True, 3),
            ("volto.blocks.editable.layout", True, 4),
            ("plone.namefromtitle", True, 5),
            ("plone.shortname", True, 6),
            ("plone.excludefromnavigation", True, 7),
            ("plone.relateditems", True, 8),
            ("plone.versioning", True, 9),
            ("plone.locking", True, 10),
            ("plone.translatable", True, 11),
        ],
    )
    def test_behavior(self, name: str, expected: bool, index: int):
        """Test behavior is present or not."""
        fti = self.fti
        behaviors = fti.behaviors
        assert (name in behaviors) is expected
        assert behaviors[index] == name if expected else True
