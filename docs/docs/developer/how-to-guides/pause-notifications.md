---
myst:
  html_meta:
    description: "Pause notifications while a script or batch job changes many content items."
    keywords: "how-to, developer, notifications, batch, script, migration, notifications_paused"
doc_type: how-to
audience: developer
status: draft
last_updated: 2026-11-16
---

# Pause notifications in a batch job

This guide shows you how to change many content items from a script without notifying their authors.

Each edit, workflow transition, or like creates a notification for the item's creators.
A script that edits thousands of items would flood their bells and write a notification for each change.
`notifications_paused()` turns notifications off for the code inside a `with` block.

## Prerequisites

- A script or upgrade step that runs in the backend, for example started with `bin/zconsole run`.

## Steps

1.  Import the context manager:

    ```python
    from kitconcept.intranet.notifications import notifications_paused
    ```

2.  Run the changes inside the block:

    ```python
    from plone import api

    import transaction


    with notifications_paused():
        for brain in api.content.find(portal_type="Document"):
            obj = brain.getObject()
            api.content.transition(obj=obj, transition="publish")
    transaction.commit()
    ```

## Result

The changes inside the block create no notifications.
Code after the block notifies as usual, also after an error inside the block.

Only the current thread is paused.
Requests served by other threads, for example colleagues editing pages while the script runs, still notify.
Nothing is queued: authors never hear about the changes made inside the block.

Titles and URLs that the job changed appear in existing notifications within the hour.
See {ref}`notifications-switch`.

To turn notifications off for everyone, use the setting instead.
See {doc}`/how-to-guides/notifications/turn-notification-center-on-or-off`.

To check the state in your own code:

```python
from kitconcept.intranet.notifications import notifications_enabled
from kitconcept.intranet.notifications.switch import notifications_active

notifications_enabled()  # the site setting
notifications_active()  # the setting, and not inside notifications_paused()
```

## See also

- {doc}`/developer/concepts/notifications`
- {doc}`refresh-notification-demo`
