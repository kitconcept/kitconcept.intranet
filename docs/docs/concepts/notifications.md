---
myst:
  html_meta:
    description: "Why and when the notification center notifies you, and what it deliberately leaves out."
    keywords: "notifications, notification center, authors, unread, explanation"
doc_type: explanation
audience: editor
status: draft
last_updated: 2026-11-16
---

# Notifications

The notification center answers one question: *what happened to my content while I wasn't looking?*
This page explains whom it notifies, about what, and why it leaves some things out.

## Notifications follow authorship

You're notified about content you **author**.
Here, an author is anyone listed in the item's **Creators** field.
When you create a page, you're its first creator.
Editors can add more creators in the **Ownership** tab of the page's edit form, and every one of them gets notified.

:::{note}
The **Authors** field of {doc}`content ownership <content-ownership>` is a different field, and doesn't decide who gets notified.
:::

Authorship is the simplest signal that a page matters to you.
It needs no setup: everyone who has ever created a page already has something to be notified about.
To follow content you didn't create, you {doc}`watch </features/watch-content>` it instead.
See {ref}`notifications-and-watching` below.

## What counts as activity

Three things a colleague can do to your content create a notification:

**A like**
: A colleague likes your page.
  Taking a like back creates nothing.

**An edit**
: A colleague saves changes to your page.
  Adding or removing a page *inside* yours doesn't count: only changes to the page itself.

**A state change**
: A colleague runs a workflow transition, such as publish, submit for review, or retract.
  The notification names the new state, for example *Published*.

Each notification says why you got it: "You are an author of this item."

## What doesn't notify you

Some activity is left out on purpose, to keep the list worth reading.

- **Your own actions.**
  You know what you did.
- **Repeated edits.**
  People often save a page several times in a row.
  Edits by the same person on the same page within 15 minutes merge into one notification, which moves back to the top with the latest time.
  Once you've read it, the next edit creates a new one.
- **Types you switched off.**
  Your {doc}`preferences </how-to-guides/notifications/choose-notifications>` decide which types you get.
  They're personal, and apply from the moment you change them.

## Content you can't see

A notification links to a page.
If you can no longer view that page, because it was deleted or made private, the notification is hidden.
It doesn't count as unread either.
If you get access again, the notification is back.

This keeps the notification center from showing titles of content you're not allowed to see.

## Read and unread

New notifications are unread.
They're marked as read when you open their page from the notification, click their check mark, or use **Mark all as read**.
The badge on the bell counts only unread notifications you can still see.

## How fresh the bell is

The bell doesn't receive notifications the instant they happen.
It asks for new ones when you log in, whenever you open another page, every minute while a page stays open, and when you open the dropdown.
So a new notification shows up within a minute at most.

Browser tabs in the background don't ask.
When you switch back to a tab, its bell updates right away.

## How long notifications are kept

Each person keeps their 200 newest notifications.
When a new one arrives, the oldest beyond 200 is dropped.

(notifications-and-watching)=

## Notifications and watching

The intranet has two ways to keep you informed about content.
They're separate features, and work side by side.

| | Notification center | Watching |
|-|---------------------|----------|
| **Which content** | Content you author | Content you chose to watch |
| **Setup** | None | Select the eye on each item |
| **What you hear about** | Likes, edits, and state changes | Edits, publishing, and check-ins |
| **Only published content** | No, any state | Yes |
| **Where** | The bell and `/notifications` | An email for each change |
| **Turn off** | Per type, in the preferences | Per item, with the eye |

If you watch a page you also author, you get both: a notification in the bell and an email.

Watched content doesn't show up in the bell yet.

## What's not there yet

The notification center is a first version.
It doesn't send emails, doesn't group notifications into threads, and doesn't list content you watch.
These may come in later versions.

## See also

- {doc}`/tutorials/follow-activity-on-your-content`
- {doc}`/how-to-guides/notifications/read-notifications`
- {doc}`/features/notification-center`
- {doc}`content-ownership`
- {doc}`/features/watch-content`
