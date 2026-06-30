from plone import api

import pytest


class TestIndexer:
    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal

    @pytest.mark.parametrize(
        "responsibility,results",
        [
            ("Onboarding", 1),
            ("IT-Support", 2),
        ],
    )
    def test_search(self, responsibility: str, results: int):
        brains = api.content.find(responsibilities=responsibility, portal_type="Person")
        assert len(brains) == results
