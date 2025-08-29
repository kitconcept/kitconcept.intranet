import pytest


@pytest.fixture(scope="class")
def answers():
    return {
        "site_id": "intranet",
        "title": "Intranet",
        "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
        "workflow": "public",
        "available_languages": ["en"],
        "portal_timezone": "Europe/Berlin",
        "setup_content": False,
        "authentication": {
            "provider": "authomatic-github",
            "authomatic-github-consumer_key": "gh-32510011",
            "authomatic-github-consumer_secret": "12345678",
            "authomatic-github-scope": ["read:user", "user:email"],
        },
    }
