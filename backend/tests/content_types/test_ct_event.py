from plone.dexterity.fti import DexterityFTI

import pytest


class TestContentTypeFTI:
    portal_type: str = "Event"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti):
        self.portal = portal
        self.fti: DexterityFTI = get_fti(self.portal_type)

    def test_behaviors(self):
        """Test behaviors are present and in correct order."""
        assert self.fti.behaviors == (
            "plone.eventbasic",
            "plone.eventrecurrence",
            "plone.eventlocation",
            "plone.eventattendees",
            "plone.eventcontact",
            "plone.basic",
            "volto.preview_image_link",
            "volto.kicker",
            "plone.categorization",
            "plone.publication",
            "plone.ownership",
            "plone.shortname",
            "volto.navtitle",
            "plone.excludefromnavigation",
            "plone.allowdiscussion",
            "plone.relateditems",
            "volto.blocks",
            "plone.constraintypes",
            "plone.namefromtitle",
            "plone.textindexer",
            "plone.versioning",
            "plone.locking",
            "plone.translatable",
        )
