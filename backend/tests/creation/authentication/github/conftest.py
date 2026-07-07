import pytest


@pytest.fixture(scope="class")
def answers():
    return {
        "site_id": "site",
        "title": "Site",
        "description": "Site created with A CMS solution for public websites. Created by kitconcept.",  # noQA: E501
        "available_languages": ["en"],
        "default_language": "en",
        "portal_timezone": "Europe/Berlin",
        "setup_content": False,
        "setup_solr": False,
        "authentication": {
            "provider": "authomatic-github",
            "authomatic-github-consumer_key": "gh-32510011",
            "authomatic-github-consumer_secret": "12345678",
            "authomatic-github-scope": ["read:user", "user:email"],
        },
    }
