from plone import api

import pytest


class TestIndexer:
    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal

    @pytest.mark.parametrize("token,results", [("97e82b07b5444728b1517de15c79fefb", 5)])
    def test_search(self, token: str, results: str):
        brains = api.content.find(location_reference=token, portal_type="Event")
        assert len(brains) == results
