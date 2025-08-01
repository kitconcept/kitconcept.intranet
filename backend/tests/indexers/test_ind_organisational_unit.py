from plone import api

import pytest


class TestIndexer:
    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal

    @pytest.mark.parametrize("token,results", [("f1b64d4955074e2086a9d5752e223ace", 1)])
    def test_search(self, token: str, results: str):
        brains = api.content.find(
            organisational_unit_reference=token, portal_type="Document"
        )
        assert len(brains) == results
