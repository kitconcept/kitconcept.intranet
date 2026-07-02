from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME

import pytest
import transaction


CONTENTS = [
    {
        "type": "Document",
        "id": "doc1",
        "title": "Document 1",
    },
]


@pytest.fixture()
def functional_portal(functional):
    portal = functional["portal"]
    container = portal
    with api.env.adopt_user(SITE_OWNER_NAME):
        for payload in CONTENTS:
            container = api.content.create(container, **payload)
            api.content.transition(container, "publish")
        api.user.create(email="jdoe@example.org", username="jdoe")
    transaction.commit()
    yield portal
