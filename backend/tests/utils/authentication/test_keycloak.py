from kitconcept.intranet import _types as t
from kitconcept.intranet.utils.authentication import keycloak as utils

import pytest


@pytest.fixture
def answers() -> t.AnswersKeycloak:
    return {
        "provider": "keycloak",
        "oidc-server_url": "http://localhost:8180",
        "oidc-realm_name": "intranet",
        "oidc-client_id": "plone",
        "oidc-client_secret": "12345678",
        "oidc-site-url": "http://localhost:3000",
        "oidc-scope": ["openid", "profile", "email"],
    }


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
def test__answers_to_keycloak_groups(
    answers, key: str, expected: str | list[str] | bool
):
    func = utils._answers_to_keycloak_groups
    result = func(answers)
    assert result[key] == expected


@pytest.mark.parametrize(
    "key,expected",
    [
        ["oidc-issuer", "http://localhost:8180/realms/intranet"],
        ["oidc-client_id", "plone"],
        ["oidc-client_secret", "12345678"],
        ["oidc-scope", ["openid", "profile", "email"]],
    ],
)
def test__answers_to_oidc(answers, key: str, expected: str | list[str] | bool):
    func = utils._answers_to_oidc
    result = func(answers)
    assert result[key] == expected
