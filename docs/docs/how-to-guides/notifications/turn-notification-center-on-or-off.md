---
myst:
  html_meta:
    description: "Turn the notification center on or off for the whole site in the Intranet Settings."
    keywords: "how-to, notifications, notification center, control panel, intranet settings, admin"
doc_type: how-to
audience: admin
tags: [notifications]
last_updated: 2026-11-16
---

# Turn the notification center on or off

This guide shows you how to turn the notification center on or off for the whole site.

The notification center is on for new sites.
Sites upgraded from an earlier version start with it off.

## Prerequisites

- You're a site administrator.

## Steps

1.  Open the **Site Setup** and click **Intranet Settings**.
2.  Select or clear **Enable Notification Center**.
3.  Click **Save**.

## Result

With the notification center on, logged-in users see the bell in the header and get notifications about content they author.

With it off:

- No notifications are created.
- The bell, the **Notifications** entry in the personal menu, and the `/notifications` page are gone.
- Stored notifications are kept.
  When you turn it on again, users see them again.
  They get no notifications about what happened while it was off.

Users can still choose which notification types they get.
See {doc}`choose-notifications`.

## See also

- {doc}`/features/notification-center`
- {doc}`/reference/control-panel`
- {doc}`/developer/how-to-guides/pause-notifications`
