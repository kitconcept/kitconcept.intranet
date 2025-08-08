from kitconcept.solr.reindex_helpers import activate_and_reindex
from plone import api
from zope.component.hooks import site as site_wrapper

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
        "setup_content": True,
        "authentication": {"provider": "internal"},
        "setup_solr": True,
    }


@pytest.fixture(scope="class")
def site(create_site, answers, solr_settings):
    site = create_site(answers)
    with site_wrapper(site):
        for key, value in solr_settings.items():
            api.portal.set_registry_record(key, value)
        activate_and_reindex(site, clear=True)
        transaction.commit()
        yield site
