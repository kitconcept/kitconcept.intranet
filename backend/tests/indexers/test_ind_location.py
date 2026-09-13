from plone import api

import pytest


LOCATIONS = [
    {
        "type": "Location",
        "id": "bonn",
        "title": "Bonn",
        "_plone.uuid": "97e82b07b5444728b1517de15c79fefb",
    },
]
EVENTS = [
    {
        "type": "Event",
        "id": f"event-{idx}",
        "title": f"Event {idx}",
        "location_reference": ["97e82b07b5444728b1517de15c79fefb"],
        "_plone.uuid": f"{idx}7e82b07b5444728b1517de15c79fef{idx}",
    }
    for idx in range(1, 7)
]
CONTENTS = [*LOCATIONS, *EVENTS]


@pytest.mark.portal(
    content=CONTENTS,
    roles=["Manager"],
)
class TestIndexer:
    @pytest.fixture(autouse=True)
    def _setup(self, portal_class):
        self.portal = portal_class

    @pytest.mark.parametrize("token,results", [("97e82b07b5444728b1517de15c79fefb", 6)])
    def test_search(self, token: str, results: str):
        brains = api.content.find(
            location_reference=token, portal_type="Event", unrestricted=True
        )
        assert len(brains) == results
