"""Upgrade 20261014001: the AI assistant's record, nothing else reset."""

from kitconcept.intranet.controlpanels.intranet import IntranetSiteEndpointExpander
from kitconcept.intranet.upgrades.v20261014001 import add_intranet_settings_records
from plone.registry.interfaces import IRegistry
from zope.component import getUtility

import pytest


RECORD = "kitconcept.intranet.enable_ai_edit"


@pytest.fixture
def registry(portal):
    return getUtility(IRegistry)


def test_adds_the_record_and_keeps_other_values(portal, registry):
    del registry.records[RECORD]
    registry["plone.email_from_name"] = "Changed by an admin"
    registry["kitconcept.intranet.external_search_url"] = "https://search.example"
    add_intranet_settings_records(portal.portal_setup)
    assert registry[RECORD] is False
    assert registry["plone.email_from_name"] == "Changed by an admin"
    assert (
        registry["kitconcept.intranet.external_search_url"] == "https://search.example"
    )


def test_site_endpoint_before_the_upgrade(portal, registry):
    """@site keeps working on a site whose upgrade step has not run."""
    del registry.records[RECORD]
    data = {}
    IntranetSiteEndpointExpander(portal, portal.REQUEST)(data)
    assert data["kitconcept.intranet.ai_edit_available"] is False
    assert "kitconcept.intranet.external_search_url" in data
