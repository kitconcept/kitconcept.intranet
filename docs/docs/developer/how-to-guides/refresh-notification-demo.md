---
myst:
  html_meta:
    description: "Create or refresh the notification center demo, so the demo notifications have recent times."
    keywords: "how-to, developer, notifications, demo, example content, seed"
doc_type: how-to
audience: developer
status: draft
last_updated: 2026-11-16
---

# Refresh the notification demo

This guide shows you how to create the notification center demo on an existing site, or refresh it so its notifications look recent again.

## What the demo contains

Sites created with the example content already include the demo.
It consists of:

- a page at `/benachrichtigungen-demo`, hidden from the navigation;
- three child pages authored by Anna Becker (`a.becker`);
- likes, edits, and workflow changes on them by other example users.

Anna gets 10 notifications, 6 of them unread, spread over today, yesterday, and last week.
Log in as `a.becker` with the password `password` to see them.

The notification times are relative to when the demo was created.
After a few days, nothing is in **Today** any more.

## Prerequisites

- A site with the example content, so the demo users exist.
  The demo is skipped when they're missing.
- A local backend checkout, set up with `make -C backend install`.

## Steps

1.  Stop the backend.
    The script opens the database directly, which a running instance with a file storage locks.
2.  Run the demo target:

    ```shell
    make -C backend notifications-demo
    ```

    It targets the site with the ID `Plone`.
    For another site, pass its ID:

    ```shell
    make -C backend notifications-demo PLONE_SITE_ID=intranet
    ```

3.  Start the backend again.

In a backend container, run the script through the entrypoint instead:

```shell
./docker-entrypoint.sh run scripts/notifications_demo.py
```

## Result

The command prints the number of notifications Anna has:

```text
Notifications demo ready: 10 notifications for a.becker.
```

If it reports 0 notifications, the demo users are missing: the site wasn't created with the example content.

The target resets the demo before creating it again:
it deletes `/benachrichtigungen-demo`, and removes the notifications of the demo users.
Their preferences are kept.
Anything else on the site is left as it is.

:::{warning}
The reset removes **all** notifications of the demo users `a.becker`, `b.yilmaz`, `c.beck`, `d.schmidt`, `e.roth`, and `f.meier`, not only the demo ones.
Don't run it on a site where these are real accounts.
:::

## From Python

The demo is created by `create_notifications_demo(site)` in `kitconcept.intranet.utils.notifications_demo`.
The distribution's post handler calls it when a site is created with example content.
Call it from your own scripts or tests, and commit the transaction afterward.

## See also

- {doc}`run-demo-stack`
- {doc}`/tutorials/follow-activity-on-your-content`
- {doc}`/developer/concepts/notifications`
