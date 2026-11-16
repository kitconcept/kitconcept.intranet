from kitconcept.intranet.behaviors.watchers import IWatchers
from kitconcept.intranet.utils import watch_notifier
from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME

import pytest
import transaction


PASSWORD = "secret-password"  # noqa: S105

USERS = (
    # username, fullname, roles
    ("alice", "Alice Watcher", ("Member",)),
    ("bob", "Bob Editor", ("Member", "Editor", "Contributor")),
    ("carol", "Carol Reader", ("Member",)),
    ("dora", "Dora Reviewer", ("Member", "Reviewer", "Editor")),
)


@pytest.fixture()
def functional_portal(functional):
    portal = functional["portal"]
    with api.env.adopt_user(SITE_OWNER_NAME):
        doc = api.content.create(portal, type="Document", id="doc1", title="Doc 1")
        api.content.transition(doc, "publish")
        api.content.create(portal, type="Document", id="private", title="Private")
        for username, fullname, roles in USERS:
            api.user.create(
                email=f"{username}@example.org",
                username=username,
                password=PASSWORD,
                roles=roles,
                properties={"fullname": fullname},
            )
    transaction.commit()
    yield portal


@pytest.fixture()
def user_request(request_factory):
    def factory(username: str):
        return request_factory(basic_auth=(username, PASSWORD))

    return factory


@pytest.fixture()
def mails(monkeypatch) -> list:
    """Emails sent by the watch notifier."""
    sent = []
    monkeypatch.setattr(watch_notifier, "send_mail", sent.append)
    return sent


@pytest.fixture()
def watch():
    """Let users watch an item directly, without the REST API."""

    def func(obj, *userids):
        for userid in userids:
            IWatchers(obj).add(userid)
        obj.reindexObject(idxs=["watchers"])
        transaction.commit()

    return func


@pytest.fixture()
def disable_watching():
    api.portal.set_registry_record("kitconcept.intranet.enable_content_watching", False)
    transaction.commit()
