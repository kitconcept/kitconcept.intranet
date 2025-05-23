from kitconcept.intranet import _types as t
from kitconcept.intranet.utils.authentication import authomatic as utils

import pytest


@pytest.fixture
def answers_factory():
    def func(provider: str) -> t.AnswersAuthomatic:
        if provider == "google":
            return {
                "provider": "authomatic-google",
                "authomatic-google-consumer_key": "google-12345",
                "authomatic-google-consumer_secret": "12345678",
                "authomatic-google-scope": ["profile", "email"],
            }
        elif provider == "github":
            return {
                "provider": "authomatic-github",
                "authomatic-github-consumer_key": "gh-32510011",
                "authomatic-github-consumer_secret": "12345678",
                "authomatic-github-scope": ["read:user", "user:email"],
            }

    return func


@pytest.mark.parametrize(
    "provider,path,expected",
    [
        ["google", "google/id", 1],
        ["google", "google/propertymap/email", "email"],
        ["google", "google/propertymap/link", "home_page"],
        ["google", "google/propertymap/name", "fullname"],
        ["google", "google/propertymap/picture", "portrait"],
        ["google", "google/consumer_key", "google-12345"],
        ["google", "google/consumer_secret", "12345678"],
        ["google", "google/scope", ["profile", "email"]],
        ["google", "google/access_headers/User-Agent", "Plone (kitconcept.intranet)"],
        ["github", "github/id", 1],
        ["github", "github/propertymap/email", "email"],
        ["github", "github/propertymap/link", "home_page"],
        ["github", "github/propertymap/name", "fullname"],
        ["github", "github/propertymap/location", "location"],
        ["github", "github/propertymap/avatar_url", "portrait"],
        ["github", "github/propertymap/username", "github_username"],
        ["github", "github/consumer_key", "gh-32510011"],
        ["github", "github/consumer_secret", "12345678"],
        ["github", "github/scope", ["read:user", "user:email"]],
        ["github", "github/access_headers/User-Agent", "Plone (kitconcept.intranet)"],
    ],
)
def test__prepare_json_config(
    answers_factory, traverse, provider: str, path: str, expected: str | list[str] | int
):
    answers = answers_factory(provider)
    func = utils._prepare_json_config
    result = func(answers)
    assert isinstance(result, dict)
    assert traverse(result, path) == expected
