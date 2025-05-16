from kitconcept.intranet import _types as t
from kitconcept.intranet.utils.authentication import oidc as utils

import pytest


@pytest.fixture
def answers() -> t.AnswersOIDC:
    return {
        "provider": "keycloak",
        "oidc-issuer": "http://localhost:8180/realms/intranet",
        "oidc-client_id": "plone",
        "oidc-client_secret": "12345678",
        "oidc-site-url": "http://localhost:3000",
        "oidc-scope": ["openid", "profile", "email"],
    }


@pytest.mark.parametrize(
    "key,expected",
    [
        ["issuer", "http://localhost:8180/realms/intranet"],
        ["client_id", "plone"],
        ["client_secret", "12345678"],
        ["redirect_uris", ("http://localhost:3000/login-oidc/oidc",)],
        ["create_restapi_ticket", True],
    ],
)
def test__prepare_answers(answers, key: str, expected: str | list[str] | bool):
    func = utils._prepare_answers
    result = func(answers)
    assert result[key] == expected
