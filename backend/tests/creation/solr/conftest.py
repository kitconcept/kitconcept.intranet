from Acquisition import aq_parent
from collections.abc import Generator
from Products.CMFPlone.Portal import PloneSite

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
        "authentication": {"provider": "internal"},
        "setup_solr": True,
    }


@pytest.fixture(scope="class")
def portal(
    portal_class, create_site, answers, solr_service
) -> Generator[PloneSite, None, None]:
    app = aq_parent(portal_class)
    site = create_site(app=app, answers=answers)
    yield site
