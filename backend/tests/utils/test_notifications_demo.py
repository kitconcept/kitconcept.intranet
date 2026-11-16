from collections.abc import Generator
from kitconcept.intranet.notifications import storage
from kitconcept.intranet.utils import notifications_demo as demo
from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME
from Products.CMFPlone.Portal import PloneSite

import pytest


ROLES = {"c.beck": ("Member", "Contributor", "Editor", "Reviewer")}


@pytest.fixture(scope="class")
def portal(app_class, create_site, answers) -> Generator[PloneSite]:
    site = create_site(app=app_class, answers=answers)
    yield site


@pytest.fixture(scope="class")
def users(portal):
    """The example content users the demo needs."""
    with api.env.adopt_user(SITE_OWNER_NAME):
        for userid in demo.DEMO_USERS:
            api.user.create(
                email=f"{userid}@example.org",
                username=userid,
                password="initial-password-123",  # noqa: S106
                roles=ROLES.get(userid, ("Member", "Contributor", "Editor")),
            )


class TestNotificationsDemo:
    def test_skips_without_users(self, portal):
        assert demo.create_notifications_demo(portal) == 0
        assert demo.CONTAINER_ID not in portal.objectIds()

    def test_creates_activity(self, portal, users):
        assert demo.create_notifications_demo(portal) == 10
        items = storage.get_notifications(demo.AUTHOR)
        assert [item["type"] for item in items] == [
            "like",
            "like",
            "transition",
            "transition",
            "modified",
            "modified",
            "like",
            "transition",
            "like",
            "transition",
        ]
        # The two quick edits by f.meier collapsed into one.
        assert [item["actor"] for item in items if item["type"] == "modified"] == [
            "f.meier",
            "e.roth",
        ]
        unread = [item for item in items if not item["read"]]
        assert len(unread) == 6
        assert items == sorted(items, key=lambda i: i["created"], reverse=True)

    def test_kept_out_of_navigation(self, portal, users):
        demo.create_notifications_demo(portal)
        assert portal[demo.CONTAINER_ID].exclude_from_nav is True

    def test_rerun_resets(self, portal, users):
        demo.create_notifications_demo(portal)
        assert demo.create_notifications_demo(portal) == 10
