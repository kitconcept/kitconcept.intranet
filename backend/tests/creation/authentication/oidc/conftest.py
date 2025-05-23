import pytest


@pytest.fixture()
def answers():
    return {
        "site_id": "intranet",
        "title": "Intranet",
        "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
        "workflow": "public",
        "default_language": "en",
        "portal_timezone": "Europe/Berlin",
        "setup_content": True,
        "authentication": {
            "provider": "oidc",
            "oidc-issuer": "http://localhost:8180/realms/intranet",
            "oidc-client_id": "plone",
            "oidc-client_secret": "12345678",
            "oidc-site-url": "http://localhost:3000",
            "oidc-scope": ["openid", "profile", "email"],
        },
    }
