from kitconcept.intranet.upgrades.v20260729001 import SOLR_PROFILE_ID
from kitconcept.intranet.upgrades.v20260729001 import upgrade_kitconcept_solr
from Products.GenericSetup.tool import UNKNOWN

import pytest


class TestUpgradeKitconceptSolr:
    """The upgrade step cascades the kitconcept.solr profile upgrade.

    The default test site is created without Solr support
    (setup_solr: False), which is exactly the bail-out scenario; the
    upgrade scenario installs the profile and rolls its version back to
    simulate an existing deployment.
    """

    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal
        self.setup_tool = portal.portal_setup

    def test_bails_out_when_not_installed(self):
        assert self.setup_tool.getLastVersionForProfile(SOLR_PROFILE_ID) == UNKNOWN
        upgrade_kitconcept_solr(self.setup_tool)
        # still not installed: the step must not import the profile
        assert self.setup_tool.getLastVersionForProfile(SOLR_PROFILE_ID) == UNKNOWN

    def test_upgrades_installed_profile(self):
        setup_tool = self.setup_tool
        setup_tool.runAllImportStepsFromProfile(f"profile-{SOLR_PROFILE_ID}")
        # simulate a deployment installed before the AI search support
        setup_tool.setLastVersionForProfile(SOLR_PROFILE_ID, "1003")
        assert setup_tool.hasPendingUpgrades(SOLR_PROFILE_ID)

        upgrade_kitconcept_solr(setup_tool)

        assert not setup_tool.hasPendingUpgrades(SOLR_PROFILE_ID)
        version = setup_tool.getLastVersionForProfile(SOLR_PROFILE_ID)
        assert version == ("1004",)
        # the 1003 -> 1004 step adds the AI search toggle registry record
        from plone import api

        assert api.portal.get_registry_record("kitconcept.solr.rag_enabled") is False

    def test_noop_when_already_up_to_date(self):
        setup_tool = self.setup_tool
        setup_tool.runAllImportStepsFromProfile(f"profile-{SOLR_PROFILE_ID}")
        assert not setup_tool.hasPendingUpgrades(SOLR_PROFILE_ID)
        upgrade_kitconcept_solr(setup_tool)
        assert not setup_tool.hasPendingUpgrades(SOLR_PROFILE_ID)
