from collections.abc import Generator
from kitconcept.solr.reindex_helpers import activate_and_reindex
from plone import api
from Products.CMFPlone.Portal import PloneSite

import pytest
import transaction


@pytest.fixture(scope="class")
def answers():
    return {
        "site_id": "solr",
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
def functional_portal(
    functional_app_class, create_site, answers, solr_settings
) -> Generator[PloneSite]:
    site = create_site(app=functional_app_class, answers=answers)
    for key, value in solr_settings.items():
        api.portal.set_registry_record(key, value)
    activate_and_reindex(site, clear=True)
    transaction.commit()
    yield site
