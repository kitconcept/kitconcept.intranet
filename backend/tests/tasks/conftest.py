from plone import api

import pytest


@pytest.fixture
def portal(integration):
    yield integration["portal"]


@pytest.fixture
def make_user():
    def create(username, fullname):
        with api.env.adopt_roles(["Manager"]):
            return api.user.create(
                username=username,
                email=f"{username}@example.com",
                properties={"fullname": fullname},
            )

    return create


@pytest.fixture
def make_plate_mention():
    def mention(mention_id, user_id="mentioned-user"):
        return {
            "type": "mention",
            "key": user_id,
            "mentionId": mention_id,
            "value": "Mentioned User",
            "children": [{"text": ""}],
        }

    return mention
