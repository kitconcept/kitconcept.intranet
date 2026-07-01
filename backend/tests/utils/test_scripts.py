from kitconcept.intranet.utils.scripts import as_bool
from kitconcept.intranet.utils.scripts import as_list
from kitconcept.intranet.utils.scripts import get_environmental_variables

import pytest


@pytest.mark.parametrize(
    "value,expected",
    (
        (None, False),
        (True, True),
        (False, False),
        ("t", True),
        ("true", True),
        ("True", True),
        ("TRUE", True),
        ("y", True),
        ("yes", True),
        ("on", True),
        ("1", True),
        ("  yes  ", True),
        ("", False),
        ("f", False),
        ("false", False),
        ("no", False),
        ("0", False),
        ("maybe", False),
    ),
)
def test_as_bool(value, expected: bool):
    assert as_bool(value) is expected


@pytest.mark.parametrize(
    "value,expected",
    (
        ("", []),
        (None, []),
        ("en", ["en"]),
        ("en,de,fr", ["en", "de", "fr"]),
        ("en, de, fr", ["en", "de", "fr"]),
        ("  en ,  de ", ["en", "de"]),
        ("en,", ["en", ""]),
    ),
)
def test_as_list(value, expected: list[str]):
    assert as_list(value) == expected


class TestGetEnvironmentalVariables:
    def test_empty_when_no_env_vars(self, monkeypatch):
        """No relevant variables set yields an empty mapping."""
        for env_var in (
            "SITE_ID",
            "SITE_TITLE",
            "SITE_AVAILABLE_LANGUAGES",
            "SITE_SETUP_CONTENT",
            "SITE_AUTHENTICATION_PROVIDER",
            "SITE_SETUP_SOLR",
        ):
            monkeypatch.delenv(env_var, raising=False)
        assert get_environmental_variables() == {}

    def test_plain_value(self, monkeypatch):
        monkeypatch.setenv("SITE_ID", "Plone")
        assert get_environmental_variables()["site_id"] == "Plone"

    def test_only_set_keys_are_returned(self, monkeypatch):
        monkeypatch.setenv("SITE_ID", "Plone")
        monkeypatch.delenv("SITE_TITLE", raising=False)
        result = get_environmental_variables()
        assert "site_id" in result
        assert "title" not in result

    def test_empty_string_is_kept(self, monkeypatch):
        """An explicitly empty variable is included (it is not ``marker``)."""
        monkeypatch.setenv("SITE_TITLE", "")
        assert get_environmental_variables()["title"] == ""

    def test_as_list_transform(self, monkeypatch):
        monkeypatch.setenv("SITE_AVAILABLE_LANGUAGES", "en, de")
        assert get_environmental_variables()["available_languages"] == ["en", "de"]

    @pytest.mark.parametrize(
        "value,expected",
        (("1", True), ("false", False)),
    )
    def test_as_bool_transform(self, monkeypatch, value: str, expected: bool):
        monkeypatch.setenv("SITE_SETUP_CONTENT", value)
        assert get_environmental_variables()["setup_content"] is expected

    def test_nested_authentication_keys(self, monkeypatch):
        monkeypatch.setenv("SITE_AUTHENTICATION_PROVIDER", "oidc")
        monkeypatch.setenv(
            "SITE_AUTHENTICATION_OIDC-SERVER_URL", "https://auth.example.com"
        )
        monkeypatch.setenv("SITE_AUTHENTICATION_OIDC-SCOPE", "openid, email")
        result = get_environmental_variables()
        assert result["authentication"] == {
            "provider": "oidc",
            "oidc-server_url": "https://auth.example.com",
            "oidc-scope": ["openid", "email"],
        }

    def test_mixed_plain_and_nested(self, monkeypatch):
        monkeypatch.setenv("SITE_ID", "Plone")
        monkeypatch.setenv("SITE_AUTHENTICATION_PROVIDER", "oidc")
        result = get_environmental_variables()
        assert result["site_id"] == "Plone"
        assert result["authentication"] == {"provider": "oidc"}
