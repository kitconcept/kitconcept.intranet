from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME

import pytest
import transaction


PASSWORD = "secret12345"  # noqa: S105

CONTENTS = [
    {"type": "Document", "id": "published-doc", "title": "Published", "publish": True},
    {"type": "Document", "id": "private-doc", "title": "Private", "publish": False},
    {"type": "News Item", "id": "news", "title": "News", "publish": True},
]

USERS = [
    {"username": "editor", "roles": ["Member", "Editor"]},
    {"username": "siteadmin", "roles": ["Member", "Site Administrator"]},
]


@pytest.fixture()
def functional_portal(functional):
    portal = functional["portal"]
    with api.env.adopt_user(SITE_OWNER_NAME):
        for item in CONTENTS:
            payload = {k: v for k, v in item.items() if k != "publish"}
            content = api.content.create(portal, **payload)
            if item["publish"]:
                api.content.transition(content, "publish")
        for user in USERS:
            api.user.create(
                email=f"{user['username']}@example.org",
                username=user["username"],
                password=PASSWORD,
                roles=user["roles"],
            )
    transaction.commit()
    yield portal


@pytest.fixture()
def user_request(request_factory):
    def func(username: str):
        return request_factory(basic_auth=(username, PASSWORD))

    return func


@pytest.fixture()
def review_state():
    def func(path: str) -> str | None:
        with api.env.adopt_roles(["Manager"]):
            obj = api.content.get(path=path)
            return api.content.get_state(obj, default=None)

    return func


@pytest.fixture()
def chain_for():
    def func(portal_type: str) -> tuple:
        wftool = api.portal.get_tool("portal_workflow")
        return tuple(wftool.getChainForPortalType(portal_type))

    return func
