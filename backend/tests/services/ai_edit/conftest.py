from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME

import pytest
import transaction


PASSWORD = "secret12345"  # noqa: S105

CONTENTS = [
    {"type": "Document", "id": "doc", "title": "Document"},
    {"type": "Document", "id": "own-doc", "title": "Own document"},
]

USERS = [
    {"username": "editor", "roles": ["Member", "Editor"]},
    {"username": "contributor", "roles": ["Member", "Contributor"]},
    {"username": "member", "roles": ["Member"]},
    # Can edit in some workflow states, but is not granted the assistant
    {"username": "reviewer", "roles": ["Member", "Reviewer"]},
    # Gets the local Owner role on own-doc only
    {"username": "owner", "roles": ["Member"]},
]


@pytest.fixture()
def functional_portal(functional):
    portal = functional["portal"]
    with api.env.adopt_user(SITE_OWNER_NAME):
        for item in CONTENTS:
            api.content.create(portal, **item)
        for user in USERS:
            api.user.create(
                email=f"{user['username']}@example.org",
                username=user["username"],
                password=PASSWORD,
                roles=user["roles"],
            )
        api.user.grant_roles(username="owner", obj=portal["own-doc"], roles=["Owner"])
    transaction.commit()
    yield portal


@pytest.fixture()
def user_request(request_factory):
    def func(username: str):
        return request_factory(basic_auth=(username, PASSWORD))

    return func


@pytest.fixture()
def payload():
    """A request as the browser's harness sends it (spec §5)."""
    return {
        "language": "en",
        "messages": [{"role": "user", "content": "Improve the title"}],
        "page": {
            "fields": {"title": "Old title", "description": ""},
            "blocks": [
                {
                    "id": "block-1",
                    "ref": "b1",
                    "type": "slate",
                    "fields": {"text": "Some text"},
                    "styling": {"theme": "default"},
                    "readonly": False,
                    "selected": True,
                },
                {
                    "id": "block-2",
                    "ref": "b2",
                    "type": "slate",
                    "fields": {"text": "| a |"},
                    "styling": {},
                    "readonly": False,
                    "selected": False,
                    "locked": {"text": "round_trip"},
                },
            ],
        },
        "block_types": {
            "slate": {
                "fields": ["text"],
                "styling": {"theme": ["default", "grey"]},
                "insertable": True,
            }
        },
    }
