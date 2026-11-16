"""Seed demo activity for the notification center (work item 215).

Creates a "Benachrichtigungen Demo" page with three subpages authored by
Anna Becker (``a.becker``), then lets colleagues from the example content
like, edit, publish and retract them. The notifications are spread over
today, yesterday and last week, and a few are marked as read, so the bell,
the dropdown and every part of the overview page have something to show.

Part of the example content: the distribution's post handler runs it when
a site is created with ``setup_content``. Log in as ``a.becker`` (see the
demo users in the README) to see the result.

The notification times are relative to when the demo was created. Run
``make notifications-demo`` to refresh them on an existing site: it resets
the demo, removing the demo pages and the demo users' notifications and
creating them anew.
"""

from datetime import timedelta
from kitconcept.intranet import logger
from kitconcept.intranet.notifications import storage
from kitconcept.intranet.notifications.switch import notifications_enabled
from kitconcept.intranet.notifications.subscribers import notify_authors
from plone import api
from Products.CMFPlone.Portal import PloneSite
from zope.event import notify
from zope.lifecycleevent import ObjectModifiedEvent


AUTHOR = "a.becker"
# Everyone taking part in the demo; all are example content users.
DEMO_USERS = (AUTHOR, "b.yilmaz", "d.schmidt", "e.roth", "f.meier", "c.beck")

CONTAINER_ID = "benachrichtigungen-demo"
CONTAINER_TITLE = "Benachrichtigungen Demo"
PAGES = {
    "reiserichtlinie-2027": "Reiserichtlinie 2027",
    "onboarding-leitfaden": "Onboarding-Leitfaden",
    "it-sicherheit-faq": "IT-Sicherheit FAQ",
}


def _users_exist() -> bool:
    return all(api.user.get(userid=userid) for userid in DEMO_USERS)


def _reset(site: PloneSite) -> None:
    if CONTAINER_ID in site.objectIds():
        api.content.delete(site[CONTAINER_ID], check_linkintegrity=False)
    root = storage._root()
    if root is not None:
        for userid in DEMO_USERS:
            root["items"].pop(userid, None)


def _like(obj, userid: str) -> None:
    with api.env.adopt_user(username=userid):
        votes = list(obj.votes or [])
        if userid not in votes:
            votes.append(userid)
            obj.votes = votes
            notify_authors(obj, "like")


def _edit(obj, userid: str, description: str) -> None:
    with api.env.adopt_user(username=userid):
        obj.description = description
        notify(ObjectModifiedEvent(obj))
        obj.reindexObject()


def _transition(obj, userid: str, transition: str) -> None:
    with api.env.adopt_user(username=userid):
        api.content.transition(obj=obj, transition=transition)


def _age(userid: str, ages: list[timedelta | None]) -> None:
    """Backdate the user's notifications (newest first) and mark old ones read.

    ``ages`` lines up with the stored list; ``None`` keeps an entry as is.
    Entries older than a day are marked as read.
    """
    root = storage._root()
    items = root["items"].get(userid, []) if root is not None else []
    now = storage._now()
    for item, age in zip(items, ages, strict=False):
        if age is None:
            continue
        item["created"] = (now - age).isoformat()
        if age >= timedelta(days=1):
            item["read"] = True


def create_notifications_demo(site: PloneSite) -> int:
    """Create the demo. Return the number of notifications for ``AUTHOR``."""
    if not _users_exist():
        logger.info("Example content users missing, skipping notifications demo")
        return 0
    if not notifications_enabled():
        logger.info("Notification center is turned off, skipping notifications demo")
        return 0
    with api.env.adopt_roles(["Manager"]):
        _reset(site)
        with api.env.adopt_user(username=AUTHOR):
            container = api.content.create(
                container=site,
                type="Document",
                id=CONTAINER_ID,
                title=CONTAINER_TITLE,
                description="Seiten von Anna Becker mit Aktivität von Kolleg:innen.",
                # Demo pages only: keep them out of the main navigation.
                exclude_from_nav=True,
            )
            pages = {
                page_id: api.content.create(
                    container=container,
                    type="Document",
                    id=page_id,
                    title=title,
                    enable_likes=True,
                )
                for page_id, title in PAGES.items()
            }
        _transition(container, "c.beck", "publish")
        travel = pages["reiserichtlinie-2027"]
        onboarding = pages["onboarding-leitfaden"]
        security = pages["it-sicherheit-faq"]

        # Oldest first: the store keeps the newest at the top.
        _like(security, "e.roth")  # last week, read
        _transition(travel, "c.beck", "publish")  # yesterday, read
        _like(onboarding, "d.schmidt")  # yesterday, read
        _edit(onboarding, "e.roth", "Ergänzt um die IT-Ausstattung.")
        # Two quick edits by the same person collapse into one notification.
        _edit(onboarding, "f.meier", "Erste Woche überarbeitet.")
        _edit(onboarding, "f.meier", "Erste Woche und Ansprechpersonen.")
        _transition(security, "c.beck", "publish")
        _transition(security, "c.beck", "retract")
        _like(travel, "d.schmidt")
        _like(travel, "b.yilmaz")

        # Notifications for AUTHOR, newest first:
        #   b.yilmaz like, d.schmidt like, c.beck retract, c.beck publish,
        #   f.meier edit, e.roth edit, d.schmidt like, c.beck publish (travel),
        #   e.roth like (security), c.beck publish (container).
        _age(
            AUTHOR,
            [
                timedelta(minutes=4),
                timedelta(minutes=35),
                timedelta(hours=1, minutes=10),
                timedelta(hours=1, minutes=20),
                timedelta(hours=2),
                timedelta(hours=3, minutes=30),
                timedelta(days=1, hours=2),
                timedelta(days=1, hours=5),
                timedelta(days=6),
                timedelta(days=7),
            ],
        )
    count = len(storage.get_notifications(AUTHOR))
    logger.info(
        f"Created notifications demo at {site[CONTAINER_ID].absolute_url()}: "
        f"{count} notifications for {AUTHOR}"
    )
    return count
