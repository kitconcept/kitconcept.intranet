from zope.component.hooks import site as site_wrapper

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
def site(create_site, answers, solr_service):
    site = create_site(answers)
    with site_wrapper(site):
        yield site
