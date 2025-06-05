from plone.dexterity.fti import DexterityFTI

import pytest


class TestContentTypeFTI:
    portal_type: str = "Event"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti):
        self.portal = portal
        self.fti: DexterityFTI = get_fti(self.portal_type)

    @pytest.mark.parametrize(
        "name,expected,index",
        [
            ("plone.eventbasic", True, 0),
            ("plone.eventrecurrence", True, 1),
            ("plone.eventlocation", True, 2),
            ("plone.eventattendees", True, 3),
            ("plone.eventcontact", True, 4),
            ("plone.basic", True, 5),
            ("volto.preview_image_link", True, 6),
            ("volto.kicker", True, 7),
            ("plone.categorization", True, 8),
            ("plone.publication", True, 9),
            ("plone.ownership", True, 10),
            ("plone.shortname", True, 11),
            ("volto.navtitle", True, 12),
            ("plone.excludefromnavigation", True, 13),
            ("plone.allowdiscussion", True, 14),
            ("plone.relateditems", True, 15),
            ("volto.blocks", True, 16),
            ("plone.constraintypes", True, 17),
            ("plone.namefromtitle", True, 18),
            ("plone.textindexer", True, 19),
            ("plone.versioning", True, 20),
            ("plone.locking", True, 21),
            ("plone.translatable", True, 22),
        ],
    )
    def test_behavior(self, name: str, expected: bool, index: int):
        """Test behavior is present or not."""
        fti = self.fti
        behaviors = fti.behaviors
        assert (name in behaviors) is expected
        assert behaviors[index] == name if expected else True
