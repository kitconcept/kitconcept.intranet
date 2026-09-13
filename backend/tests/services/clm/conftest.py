from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME

import pytest
import transaction


NESTED_CONTENTS = [
    {
        "type": "Document",
        "id": "document",
        "title": "My Document",
    },
    {
        "type": "Document",
        "id": "nested_document",
        "title": "My Nested Document",
    },
    {
        "type": "Document",
        "id": "nested_nested_document",
        "title": "My Nested Nested Document",
    },
]


@pytest.fixture()
def functional_portal(functional):
    portal = functional["portal"]
    container = portal
    with api.env.adopt_user(SITE_OWNER_NAME):
        for payload in NESTED_CONTENTS:
            container = api.content.create(container, **payload)
    transaction.commit()
    yield portal
