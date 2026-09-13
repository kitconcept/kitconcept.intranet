from plone import api
from plone.restapi.interfaces import ISerializeToJson
from Products.CMFPlone.Portal import PloneSite
from zope.component import getMultiAdapter

import pytest


class TestPersonSerializer:
    @pytest.fixture(autouse=True)
    def _setup(self, portal: PloneSite) -> None:
        self.portal = portal

    def test_person_is_folderish(self, portal):
        with api.env.adopt_roles(["Manager"]):
            person = api.content.create(
                container=portal,
                type="Person",
                id="jane-doe",
                given_name="Jane",
                family_name="Doe",
            )
            api.content.create(container=person, type="Image", id="portrait")
        result = getMultiAdapter((person, portal.REQUEST), ISerializeToJson)()
        assert result["is_folderish"] is True
        assert result["items_total"] == 1
        # the vocabulary enrichment must survive
        assert "locations" in result
        assert "organisational_units" in result
