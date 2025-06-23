import pytest


class TestSiteCreation:
    @pytest.mark.parametrize(
        "profile_id",
        [
            "profile-pas.plugins.oidc:default",
        ],
    )
    def test_profile_installed(self, site, profile_last_version, profile_id):
        result = profile_last_version(profile_id)
        assert isinstance(result, str)
        assert result != ""

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("issuer", "http://localhost:8180/realms/intranet"),
            ("client_id", "plone"),
            ("client_secret", "12345678"),
            ("scope", ["openid", "profile", "email"]),
            ["redirect_uris", ("http://localhost:3000/login-oidc/oidc",)],
            ["create_restapi_ticket", True],
        ],
    )
    def test_oidc_settings(self, site, attr, expected):
        plugin = site.acl_users.oidc
        value = getattr(plugin, attr, None)
        assert value == expected
