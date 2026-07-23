"""Set the demo passwords of the AI test corpus users.

The kitconcept-intranet distribution seeds the fictional demo users at
site creation, so the AI corpus principals import skips them and their
passwords stay unknown. This script aligns them with the password
documented for the AI corpus (permission-trimming tests log in as
``f.meier``).

Usage:
    zconsole run instance/etc/zope.conf ./scripts/ai_content_demo_passwords.py
"""

from zope.component import hooks

import transaction


DEMO_USERS = (
    "a.becker",
    "b.yilmaz",
    "c.nguyen",
    "d.schmidt",
    "e.roth",
    "f.meier",
    "j.halmbach",
)
DEMO_PASSWORD = "intranet-demo-2026"  # noqa: S105


def main(app):
    portal = app.Plone
    with hooks.site(portal):
        source_users = portal.acl_users.source_users
        count = 0
        for user_id in DEMO_USERS:
            if user_id in source_users.getUserIds():
                source_users.doChangeUser(user_id, DEMO_PASSWORD)
                count += 1
            else:
                print(f"User not found, skipped: {user_id}")
        print(f"Set the demo password for {count} users.")
    transaction.commit()


if __name__ == "__main__":
    main(globals()["app"])
