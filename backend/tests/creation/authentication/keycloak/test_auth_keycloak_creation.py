import pytest


class TestSiteCreation:
    @pytest.mark.parametrize(
        "profile_id",
        [
            "profile-pas.plugins.oidc:default",
            "profile-pas.plugins.keycloakgroups:default",
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

    @pytest.mark.parametrize(
        "key,expected",
        [
            ["enabled", True],
            ["server_url", "http://localhost:8180"],
            ["realm_name", "intranet"],
            ["client_id", "plone"],
            ["client_secret", "12345678"],
        ],
    )
    def test_keycloak_groups_settings(self, get_registry, site, key, expected):
        key = f"keycloak_groups.{key}"
        value = get_registry(site, key)
        assert value == expected
