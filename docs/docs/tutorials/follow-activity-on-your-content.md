---
myst:
  html_meta:
    description: "Tutorial: use the notification center to follow what colleagues do with the pages you author."
    keywords: "tutorial, notifications, notification center, bell, likes, edits, workflow"
doc_type: tutorial
audience: editor
status: draft
difficulty: beginner
estimated_time: "15 minutes"
last_updated: 2026-11-16
---

# Follow activity on your content

In this tutorial, you use the notification center to find out what colleagues did with your pages while you were away.
You read your notifications, mark them as read, receive a new one as it happens, and switch off a type you don't need.

You work with the demo content, as Anna Becker, an author who owns three pages.
By the end, you'll know every part of the notification center.

## Before you start

You need:

- an intranet site created with the example content, for example the {doc}`demo stack </developer/how-to-guides/run-demo-stack>`;
- two browser windows, for example a normal and a private window, so you can be two people at once.

All demo users have the password `password`.

## Log in as Anna

1.  In the first window, log in as `a.becker`.
2.  Look at the tools bar at the top right of the page.
    Next to the search, there's a bell with a red badge.
    The badge says how many notifications you haven't read yet: **6**.

```{image} /_static/images/notification-center/bell-dropdown.png
:alt: The header bell with an unread badge and the dropdown of the latest notifications
:width: 400px
```

## Read your latest notifications

1.  Click the bell.
    A dropdown opens with your five latest notifications.
2.  Read the first entry.
    Each entry tells you **who** did **what** to **which page**, and **when**, for example that Ben liked one of your pages, and how long ago.
3.  Find an entry that says a colleague *edited* a page.
    Below it, there's a **View changes** link.
    You'll use it in a moment.
4.  Click the title of any page in the dropdown.

The page opens and the dropdown closes.
The badge on the bell now shows **5**: following a notification's link marks it as read.

## Open the overview page

1.  Click the bell again, then **See all notifications** at the bottom of the dropdown.
    The `/notifications` page opens.
2.  Notice the groups: **Today**, **Yesterday**, and an older date.
    Unread entries have a tinted background and a dot.
3.  Read the small text under an entry: "You are an author of this item."
    It tells you why you got the notification.

```{image} /_static/images/notification-center/overview.png
:alt: The notifications overview page with notifications grouped by day
```

## Mark notifications as read

1.  Click the check mark on the right of an unread entry.
    The tint goes away, and the badge on the bell drops by one.
2.  Switch to the **Unread** tab.
    Only unread entries are listed.
3.  Mark one more as read.
    It leaves the list right away.
4.  Click **Mark all as read**.
    The badge disappears and the tab shows "No unread notifications."

## See what changed

1.  Switch back to the **All** tab.
2.  On an entry that says a colleague edited a page, click **View changes**.

The page's version history opens, where you can compare the versions.

## Get a new notification

Now a colleague does something with one of Anna's pages.

1.  In the second window, log in as `b.yilmaz`.
2.  Open `/benachrichtigungen-demo/onboarding-leitfaden` and click the **Like** button below the page.
3.  Back in Anna's window, open any other page.

The bell shows a new unread notification from Ben about the page *Onboarding-Leitfaden*.
If you stay on the same page instead, the bell updates by itself within a minute.

## Choose what you're notified about

Anna doesn't want to hear about likes any more.

1.  Go to `/notifications` and click the gear button next to **Mark all as read**.
2.  Clear **Someone likes content I author**.
    The change is saved right away.
3.  As Ben, like another of Anna's pages, for example `/benachrichtigungen-demo/it-sicherheit-faq`.
4.  As Anna, open any page.

No new notification arrives.
Edits and state changes still notify Anna.

```{image} /_static/images/notification-center/preferences.png
:alt: The notification preferences popover with one checkbox per notification type
:width: 600px
```

## Your own changes

1.  As Anna, edit one of your demo pages and save it.

You don't get a notification for it: your own actions never notify you.

## What you've learned

You've used every part of the notification center:

- the bell, its badge, and the dropdown of the latest notifications;
- the overview page, with its day groups and the **Unread** tab;
- marking one or all notifications as read;
- the **View changes** link to the version history;
- the preferences behind the gear button.

## Next steps

- {doc}`/how-to-guides/notifications/read-notifications`
- {doc}`/how-to-guides/notifications/choose-notifications`
- {doc}`/concepts/notifications`, to learn when you get a notification and when you don't.
