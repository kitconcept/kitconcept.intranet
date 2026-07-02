from Acquisition import aq_parent
from collections.abc import Generator
from kitconcept.intranet.testing.logo import TEST_LOGO
from Products.CMFPlone.Portal import PloneSite

import pytest


@pytest.fixture(scope="session")
def answers() -> dict:
    return {
        "site_id": "plone2",
        "title": "Intranet",
        "description": "Site created with A Plone distribution for Intranets with Plone. Created by kitconcept.",  # noQA: E501
        "available_languages": ["de", "en"],
        "default_language": "de",
        "portal_timezone": "Europe/Berlin",
        "site_logo": TEST_LOGO,
        "workflow": "public",
        "setup_content": False,
        "setup_solr": False,
        "authentication": {"provider": "internal"},
    }


@pytest.fixture(scope="class")
def portal(portal_class, create_site, answers) -> Generator[PloneSite]:
    app = aq_parent(portal_class)
    site = create_site(app=app, answers=answers)
    yield site
