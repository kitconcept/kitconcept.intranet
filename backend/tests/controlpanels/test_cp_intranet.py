from Products.CMFPlone.PloneControlPanel import PloneConfiglet
from Products.CMFPlone.PloneControlPanel import PloneControlPanel

import pytest


class TestCPIntranet:
    configlet_id: str = "IntranetSettings"
    action: PloneConfiglet

    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal
        tool: PloneControlPanel = portal.portal_controlpanel
        actions = {a.getAction(portal)["id"]: a for a in tool.listActions()}
        self.action = actions[self.configlet_id]

    def test_configlet_present(self, controlpanel_actions):
        """Test if configlet is present."""
        assert self.configlet_id in controlpanel_actions

    def test_configlet_visible(self):
        """Test if configlet is visible."""
        assert bool(self.action.visible) is True

    def test_configlet_permission(self):
        """Test permission to view the configlet."""
        assert self.action.permissions == ("Manage portal",)
