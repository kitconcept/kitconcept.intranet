from plone import api

import pytest


ORG_UNITS = [
    {
        "type": "Organisational Unit",
        "id": "robotics",
        "title": "Institute of Robotics and Mechatronics(Organisational unit)",
        "_plone.uuid": "1a22eddf0e7941a0962cbfaa785e4b4d",
    },
]
DOCS = [
    {
        "type": "Document",
        "id": f"doc-{idx}",
        "title": f"Document {idx}",
        "organisational_unit_reference": ["1a22eddf0e7941a0962cbfaa785e4b4d"],
        "_plone.uuid": f"{idx}1a22eddf0e7941a0962cbfaa785e4b4d{idx}",
    }
    for idx in range(1, 3)
]
CONTENTS = [*ORG_UNITS, *DOCS]


@pytest.mark.portal(
    content=CONTENTS,
    roles=["Manager"],
)
class TestIndexer:
    @pytest.fixture(autouse=True)
    def _setup(self, portal_class):
        self.portal = portal_class

    @pytest.mark.parametrize("token,results", [("1a22eddf0e7941a0962cbfaa785e4b4d", 2)])
    def test_search(self, token: str, results: str):
        brains = api.content.find(
            organisational_unit_reference=token,
            portal_type="Document",
            unrestricted=True,
        )
        assert len(brains) == results
