"""Refresh the notification center demo of the example content.

Site creation with example content seeds the demo already; this script
resets it so the notification times are recent again. Log in as
``a.becker`` afterwards (see the demo users in the README).

Usage in a terminal:
    zconsole run instance/etc/zope.conf ./scripts/notifications_demo.py

Usage in a Docker container:
    ./docker-entrypoint.sh run scripts/notifications_demo.py
"""

from kitconcept.intranet.utils.notifications_demo import create_notifications_demo
from zope.component import hooks

import os
import transaction


def main(app):
    portal = app[os.getenv("PLONE_SITE_ID", "Plone")]
    with hooks.site(portal):
        count = create_notifications_demo(portal)
    transaction.commit()
    print(f"Notifications demo ready: {count} notifications for a.becker.")


if __name__ == "__main__":
    main(globals()["app"])
