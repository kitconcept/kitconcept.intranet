from plone import api

import pytest


CONTENTS = [
    {
        "type": "Person",
        "id": "john-doe",
        "first_name": "John",
        "last_name": "Doe",
        "academic_title": "",
        "responsibilities": ["Onboarding", "IT-Support"],
    },
]


@pytest.mark.portal(
    content=CONTENTS,
    roles=["Manager"],
)
class TestIndexer:
    @pytest.fixture(autouse=True)
    def _setup(self, portal_class):
        self.portal = portal_class

    @pytest.mark.parametrize(
        "responsibility,results",
        [
            ("Onboarding", 1),
            ("IT-Support", 1),
        ],
    )
    def test_search(self, responsibility: str, results: int):
        brains = api.content.find(responsibilities=responsibility, portal_type="Person")
        assert len(brains) == results
