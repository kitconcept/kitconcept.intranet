---
myst:
  html_meta:
    description: "Notification center feature — a header bell, an overview page, and preferences that tell authors when colleagues like, edit, or change the state of their content."
    keywords: "notifications, notification center, bell, unread, likes, edits, workflow, preferences, MVP"
doc_type: feature
audience: user
status: draft
last_updated: 2026-11-16
---

# Notification Center

:::{admonition} Feature summary
:class: note

**Status:** MVP · **Audience:** all logged-in users ·
**Interim source of truth**—canonical spec will move to the intranet.
:::

## Summary

The notification center tells you what happened to your content while you were
away. A **bell in the header** shows how many notifications you haven't read, a
dropdown shows the latest ones, and the **`/notifications` page** lists all of
them. Each notification says **who** did **what** to **which item**, and **why**
you see it.

In this first version, you're notified about activity on content you **author**:
{doc}`likes <likes-and-content-rating>`, edits, and workflow changes such as
publish or retract. Watching content and areas will add more notification types
later.

## Who it's for

- **Authors**, to notice when colleagues like, edit, publish, or retract their
  content—without checking each page.
- **All logged-in users**, as one place for updates that concern them.

## Capabilities

- A **bell with an unread badge** in the header, also in the compact
  workspace header.
- A **dropdown** with the five latest notifications.
- An **overview page** at `/notifications`, newest first and grouped by day.
- **Mark as read**: one notification, or all at once.
- **Preferences**: switch each notification type on or off.

```{image} /_static/images/notification-center/bell-dropdown.png
:alt: The header bell with an unread badge and the dropdown of the latest notifications
:width: 400px
```

```{image} /_static/images/notification-center/overview.png
:alt: The notifications overview page with notifications grouped by day
```

```{image} /_static/images/notification-center/workspace-header.png
:alt: The bell with its unread badge in the compact workspace header
```

## Behaviour & rules

:::{admonition} For QA and product owners
:class: tip
This section is the behavioural spec. Treat each rule as a testable assertion.
:::

### What creates a notification

| Type | Created when | Who is notified |
|------|--------------|-----------------|
| Like | Someone likes the item through `@vote`. Unliking creates nothing. | The item's creators |
| Edit | Someone edits the item. | The item's creators |
| State change | Someone runs a workflow transition, such as publish or retract. | The item's creators |

- **Your own actions never notify you.**
- **Repeated edits merge.** Edits by the same person on the same item within
  15 minutes become one notification, as long as it's still unread.
- Adding or removing a child item doesn't count as an edit of its container.
- Each user keeps their **200 newest** notifications. Older ones are dropped.

### What you see

- Each entry shows the person's full name, the action, the item's current title
  as a link, and the relative time. Edits add a **View changes** link to the
  item's version history.
- On the overview page, entries also say why you see them ("You are an author
  of this item").
- Unread entries have a tinted background and a dot.
- Entries about content you can no longer view—for example deleted or now
  private—are **hidden** and don't count as unread.

### Reading

- Following an entry's link marks it as read.
- The check button marks one entry as read; **Mark all as read** marks all.
- The **Unread** tab lists unread entries only. Entries you read there leave
  the list right away.

### Freshness

- The bell refreshes when you log in, on every page navigation, and every
  60 seconds while the page stays open. Opening the dropdown refreshes it too.
- There is no real-time push in the MVP.

### Preferences

- The gear button on the overview page opens **Notification preferences**, with
  one checkbox per type. All types are on by default.
- A change is saved right away and applies to **new** notifications only.

```{image} /_static/images/notification-center/preferences.png
:alt: The notification preferences popover with one checkbox per notification type
:width: 600px
```

### Authentication

- Anonymous users see no bell. Opening `/notifications` redirects to the login
  page.

## Configuration

There is no site-wide configuration. Each user sets their own preferences.

## Demo content

Sites created with the example content include notifications for Anna Becker
(`a.becker`): colleagues liked, edited, published, and retracted her pages
under `/benachrichtigungen-demo`. To make the times recent again, stop the
backend and run `make -C backend notifications-demo`.

## REST API

All endpoints are on the site root and need a logged-in user.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `@notifications` | List notifications, newest first, with `items`, `items_total`, and `unread`. Accepts `b_start`, `b_size`, and `unread_only`. |
| `PATCH` | `@notifications` | Mark as read: `{"ids": [...]}` for some, `{}` for all. |
| `GET` | `@notifications-settings` | Read your preferences. |
| `PATCH` | `@notifications-settings` | Update your preferences, for example `{"like": false}`. |

See the {doc}`API reference </developer/reference/api/notifications>` for the full request and response formats.

## Documentation

For users:

- Tutorial: {doc}`/tutorials/follow-activity-on-your-content`
- How-to: {doc}`/how-to-guides/notifications/read-notifications`
- How-to: {doc}`/how-to-guides/notifications/choose-notifications`
- Explanation: {doc}`/concepts/notifications`

For developers:

- Explanation: {doc}`/developer/concepts/notifications`
- How-to: {doc}`/developer/how-to-guides/add-notification-type`
- How-to: {doc}`/developer/how-to-guides/refresh-notification-demo`
- Reference: {doc}`/developer/reference/api/notifications`
- Reference: {doc}`/developer/reference/components/notifications`
