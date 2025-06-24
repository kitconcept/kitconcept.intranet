import pytest


class TestSiteCreation:
    @pytest.mark.parametrize(
        "profile_id",
        [
            "profile-pas.plugins.authomatic:default",
        ],
    )
    def test_profile_installed(self, site, profile_last_version, profile_id):
        result = profile_last_version(profile_id)
        assert isinstance(result, str)
        assert result != ""

    @pytest.mark.parametrize(
        "path,expected",
        [
            ["google/id", 1],
            ["google/propertymap/email", "email"],
            ["google/propertymap/link", "home_page"],
            ["google/propertymap/name", "fullname"],
            ["google/propertymap/picture", "portrait"],
            ["google/consumer_key", "google-12345"],
            ["google/consumer_secret", "12345678"],
            ["google/scope", ["profile", "email"]],
            [
                "google/access_headers/User-Agent",
                "Plone (kitconcept.intranet)",
            ],
        ],
    )
    def test_authomatic_settings(
        self, site, traverse, authomatic_config, path, expected
    ):
        config = authomatic_config(site)
        assert traverse(config, path) == expected
