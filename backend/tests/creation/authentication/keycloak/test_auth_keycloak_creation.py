from plone import api

import pytest


class TestSiteCreation:
    @pytest.fixture(autouse=True)
    def _setup(self, create_site, answers):
        self.portal = create_site(answers)

    @pytest.mark.parametrize(
        "profile_id",
        [
            "profile-pas.plugins.oidc:default",
            "profile-pas.plugins.keycloakgroups:default",
        ],
    )
    def test_profile_installed(self, profile_last_version, profile_id):
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
    def test_oidc_settings(self, attr, expected):
        plugin = self.portal.acl_users.oidc
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
    def test_keycloak_groups_settings(self, key, expected):
        key = f"keycloak_groups.{key}"
        value = api.portal.get_registry_record(key)
        assert value == expected
