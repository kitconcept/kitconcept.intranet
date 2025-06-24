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
            ["github/propertymap/email", "email"],
            ["github/propertymap/link", "home_page"],
            ["github/propertymap/name", "fullname"],
            ["github/propertymap/location", "location"],
            ["github/propertymap/avatar_url", "portrait"],
            ["github/propertymap/username", "github_username"],
            ["github/consumer_key", "gh-32510011"],
            ["github/consumer_secret", "12345678"],
            ["github/scope", ["read:user", "user:email"]],
            ["github/access_headers/User-Agent", "Plone (kitconcept.intranet)"],
        ],
    )
    def test_authomatic_settings(
        self, site, traverse, authomatic_config, path, expected
    ):
        config = authomatic_config(site)
        assert traverse(config, path) == expected
