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

    def test_behaviors(self):
        """Test behaviors are present and in correct order."""
        assert self.fti.behaviors == (
            "volto.preview_image_link",
            "volto.kicker",
            "collective.person.person",
            "collective.contact_behaviors.contact_info",
            "kitconcept.core.additional_contact_info",
            "volto.blocks.editable.layout",
            "plone.namefromtitle",
            "plone.shortname",
            "volto.navtitle",
            "plone.excludefromnavigation",
            "plone.relateditems",
            "plone.versioning",
            "plone.locking",
            "plone.translatable",
        )
