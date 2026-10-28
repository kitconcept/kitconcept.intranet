from Products.CMFPlone.PloneControlPanel import PloneConfiglet
from Products.CMFPlone.PloneControlPanel import PloneControlPanel

import pytest


class TestCPMaintenanceBanner:
    configlet_id: str = "maintenance-banner"
    action: PloneConfiglet

    @pytest.fixture(autouse=True)
    def _setup(self, portal) -> None:
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

    @pytest.mark.parametrize(
        "key,expected",
        (
            ("maintenance_banner.show_banner", False),
            ("maintenance_banner.banner_title", "Warning"),
            ("maintenance_banner.date", None),
        ),
    )
    def test_registry_records(self, key, expected):
        from plone import api

        assert api.portal.get_registry_record(key) == expected
