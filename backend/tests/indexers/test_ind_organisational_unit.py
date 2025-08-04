from plone import api

import pytest


class TestIndexer:
    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal

    @pytest.mark.parametrize("token,results", [("1a22eddf0e7941a0962cbfaa785e4b4d", 1)])
    def test_search(self, token: str, results: str):
        brains = api.content.find(
            organisational_unit_reference=token, portal_type="Document"
        )
        assert len(brains) == results
