from kitconcept.intranet import PACKAGE_NAME


class TestSetupInstall:
    profile_id: str = f"{PACKAGE_NAME}:default"

    def test_addon_installed(self, installer):
        """Test if kitconcept.intranet is installed."""
        assert installer.is_product_installed(PACKAGE_NAME) is True

    def test_browserlayer(self, browser_layers):
        """Test that IBrowserLayer is registered."""
        from kitconcept.intranet.interfaces import IBrowserLayer

        assert IBrowserLayer in browser_layers

    def test_latest_version(self, profile_last_version):
        """Test latest version of default profile."""
        assert profile_last_version(self.profile_id) == "20250512001"
