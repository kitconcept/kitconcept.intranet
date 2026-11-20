from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME

import pytest
import transaction


PASSWORD = "secret-password-123"  # noqa: S105


@pytest.fixture()
def functional_portal(functional):
    portal = functional["portal"]
    with api.env.adopt_user(SITE_OWNER_NAME):
        for username in ("author", "editor"):
            api.user.create(
                email=f"{username}@example.org",
                username=username,
                password=PASSWORD,
                roles=("Member", "Contributor", "Editor", "Reviewer"),
                properties={"fullname": username.capitalize()},
            )
    with api.env.adopt_user("author"):
        doc = api.content.create(portal, type="Document", id="doc1", title="Doc 1")
        doc.enable_likes = True
    transaction.commit()
    yield portal


@pytest.fixture()
def portal(functional_portal):
    return functional_portal


@pytest.fixture()
def author_session(portal, request_factory):
    return request_factory(basic_auth=("author", PASSWORD))


@pytest.fixture()
def editor_session(portal, request_factory):
    return request_factory(basic_auth=("editor", PASSWORD))
