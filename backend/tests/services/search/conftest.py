from Acquisition import aq_parent
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
    functional_portal_class, create_site, answers, solr_settings
) -> Generator[PloneSite]:
    app = aq_parent(functional_portal_class)
    site = create_site(app=app, answers=answers)
    for key, value in solr_settings.items():
        api.portal.set_registry_record(key, value)
    activate_and_reindex(site, clear=True)
    transaction.commit()
    yield site
