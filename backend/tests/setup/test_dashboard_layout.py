from kitconcept.intranet.upgrades import DASHBOARD_MODEL_SOURCE
from kitconcept.intranet.upgrades import set_dashboard_layout
from plone import api
from plone.dexterity.interfaces import IDexterityFTI
from zope.component import getUtility

import pytest


CUSTOM_MODEL_SOURCE = DASHBOARD_MODEL_SOURCE.replace("'title'", "'teaser'")


class TestDashboardLayout:
    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal
        self.fti = getUtility(IDexterityFTI, name="Dashboard")
        original = self.fti.model_source
        yield
        # The generated schema lives in memory and survives the transaction
        # abort, so restore it through the FTI to keep other tests isolated.
        self.fti.manage_changeProperties(model_source=original)

    def _customize(self):
        """Edit the default layout as the types control panel would."""
        self.fti.manage_changeProperties(model_source=CUSTOM_MODEL_SOURCE)

    def test_default_layout_set_on_install(self):
        assert self.fti.model_source == DASHBOARD_MODEL_SOURCE
        assert "blocks" in self.fti.lookupSchema()

    def test_sets_layout_when_missing(self):
        self.fti.manage_changeProperties(model_source="")
        set_dashboard_layout(None)
        assert self.fti.model_source == DASHBOARD_MODEL_SOURCE
        assert "blocks" in self.fti.lookupSchema()

    def test_keeps_customized_layout(self):
        self._customize()
        set_dashboard_layout(None)
        assert self.fti.model_source == CUSTOM_MODEL_SOURCE

    def test_typeinfo_import_keeps_customized_layout(self):
        self._customize()
        setup_tool = api.portal.get_tool("portal_setup")
        setup_tool.runImportStepFromProfile(
            "profile-kitconcept.intranet:default", "typeinfo"
        )
        fti = getUtility(IDexterityFTI, name="Dashboard")
        assert fti.model_source == CUSTOM_MODEL_SOURCE
