---
myst:
  html_meta:
    description: "Architecture of the notification center: events, storage, read-time filtering, and polling, with the trade-offs behind them."
    keywords: "notifications, architecture, annotations, events, subscribers, polling, design"
doc_type: explanation
audience: developer
status: draft
last_updated: 2026-11-16
---

# Notification center architecture

The notification center is deliberately small.
It's an MVP that shows the feature end to end, and leaves room for the parts that will come later: notifications about watched content, email delivery, and real-time updates.
This page explains how the pieces fit together, and why they're built the way they are.

## Overview

```text
 content event                      backend                                 frontend
 ─────────────                      ───────                                 ────────
 IObjectModifiedEvent ─┐
 IAfterTransitionEvent ─┼─► notify_authors(obj, type) ─► add_notification ─► site root annotation
 @vote (like)  ─────────┘     one call per creator          per-user list          │
                                                                                   │
                         GET @notifications ◄── filter by catalog permissions ◄────┘
                                │
                                ▼
                 NotificationsPoller (login, navigation, every 60 s)
                                │
                                ▼
                 state.notifications ─► NotificationBell, /notifications
```

1.  Something happens to a content item: it's edited, it goes through a workflow transition, or it gets a like.
2.  The backend creates one notification per **creator** of the item, unless the creator is the person who acted.
3.  The notifications are stored per user on the site root.
4.  The frontend asks for them regularly and shows them in the bell and on the overview page.

## Producing notifications

Notifications come from two event subscribers and one explicit call, all in `kitconcept.intranet.notifications`:

| Source | Type | Where |
|--------|------|-------|
| `IObjectModifiedEvent` on `IDexterityContent` | `modified` | `subscribers.modified` |
| `IAfterTransitionEvent` on `IDexterityContent` | `transition` | `subscribers.transitioned` |
| Adding a like in the `@vote` service | `like` | `services/votes.py` calls `notify_authors(context, "like")` |

Likes have no event of their own, so the `@vote` service calls `notify_authors` itself, only when a like is **added**.

Two kinds of events are ignored:

- `IContainerModifiedEvent`, fired on a container when a child is added or removed.
  For an author, that isn't an edit of their page.
- The `IAfterTransitionEvent` fired on creation, which has no transition.
  It sets the initial state; nobody did anything.

`notify_authors` never raises.
A failure to store a notification is logged, and the edit, transition, or like goes through.
Notifications are a side effect; they must never block real work.

### Who is notified

The recipients are the item's Dublin Core **creators**, from `listCreators()`.
Creators are always there, are maintained by Plone, and editors can change them in the **Ownership** tab.
The CLM behavior's `authors` field was not used: only site administrators can edit it, and it's often empty, while every item has at least one creator.

The actor is never notified about their own action.
Anonymous actions notify nobody: there's nobody to name.

## Storage

Everything is stored in one annotation on the site root, under the key `kitconcept.intranet.notifications`:

```text
PersistentMapping
├── "items":    OOBTree  userid → PersistentList[PersistentMapping]   (newest first)
└── "settings": OOBTree  userid → PersistentMapping {type: bool}
```

Each stored notification holds `id`, `type`, `actor`, `uid`, `title`, `created`, `read`, and, for transitions, `transition`, `review_state`, and `review_state_title`.

Why this shape:

- **One entry per user in a B-tree.**
  Writes for different users touch different persistent objects, so two people liking two different pages at the same time rarely conflict.
- **No catalog, no content objects.**
  Notifications aren't content: they don't need workflows, permissions, URLs, or search.
  Storing them as content would make every like and edit write several catalog indexes.
- **A cap of 200 per user** (`MAX_PER_USER`).
  The oldest entries are dropped on insert, so storage stays bounded without a cleanup job.
- **References by UID.**
  The stored `title` is only a fallback; the title and URL are resolved when the list is read, so renames and moves are reflected.

The trade-off is that you can't query the data across users, for example for everything Ben did today.
The MVP doesn't need that.
If a later version does, the storage can move to a dedicated table or a catalog without changing the REST API.

## Merging repeated edits

Editors often save a page several times in a few minutes.
`add_notification` merges a new `modified` notification into an existing one when all of these hold:

- same item, same actor, same type;
- the existing one is unread;
- it was created less than 15 minutes ago (`COLLAPSE_WINDOW`).

The existing entry moves back to the top with the new time and title.
Once the recipient reads it, the next edit starts a new notification, because they've seen the earlier one.

Likes and transitions aren't merged: each is a distinct event the author cares about.

## Permissions at read time

`GET @notifications` resolves every stored UID through the catalog as the **current user**, with `api.content.find(UID=...)`.
Entries whose item the user can't find are skipped, and aren't counted as unread.

This is checked on read, not on write, because permissions change.
A page can be retracted, moved into a private workspace, or deleted after the notification was created.
Filtering on read means a notification never leaks the title of content the user may no longer see, and comes back if access is restored.

The same lookup provides the current URL, title, and portal type, and the actor's full name is looked up once per actor per request.
Workflow state titles are stored untranslated and translated with the `plone` domain in the request's language, so a user sees "Veröffentlicht" or "Published" depending on their language, whoever triggered the transition.

## Preferences

Preferences are a map of notification type to boolean, defaulting to `true` for every type.
They're checked when a notification is **created**, so switching a type off doesn't hide the ones already there.
That's simpler to reason about: what's in your list is what happened while the type was on.

## Delivery by polling

The frontend has no push channel.
`NotificationsPoller`, an app extra, fetches the five latest notifications and the unread count:

- when the user token appears, for example after login;
- on every route change;
- every 60 seconds while the page is open.

Opening the bell's dropdown fetches again.

Polling was chosen over WebSockets or server-sent events because it works with every Plone deployment as is: no extra service, no sticky sessions, no proxy configuration.
The request is cheap, one annotation read and one catalog query.
The cost is a delay of up to a minute when the user stays on one page.

The fetching lives in the poller, not in the bell, because the Volto Light Theme header renders the `headerTools` slot more than once.
A bell that fetched by itself would fire one request per rendered copy.

## Frontend state

All notification data is in `state.notifications`.
Lists are stored under `subrequests`, `latest` for the bell and `list` for the overview page, so both can be on screen with different batch sizes.
The unread count is global, and is updated from every list response.

Marking as read updates every list, so the bell and the page stay consistent without fetching again.
The count only drops by notifications that were still unread, so clicking a read one again doesn't lower it.

## Relation to watching

{doc}`Watching content <watch-content>` is a separate feature that reacts to the same events.
The two pipelines don't share code or storage:

| | Notification center | Watching |
|-|---------------------|----------|
| Recipients | The item's creators | The item's watchers, from the `kitconcept.intranet.watchers` annotation |
| Events | `IObjectModifiedEvent`, `IAfterTransitionEvent`, likes in `@vote` | `IObjectModifiedEvent`, `IAfterTransitionEvent` to `published`, `IAfterCheckinEvent` |
| Content state | Any | Published only |
| When | Synchronously, in the event subscriber | Queued per transaction; built in a before-commit hook, sent after a successful commit |
| Output | A stored entry, read through `@notifications` | An email |
| Opt out | Per type, `@notifications-settings` | Per item, `@watch` |

A user who authors and watches an item gets both a bell notification and an email for the same edit.

Watched content isn't in the notification center yet.
The natural place to join them is `_build_mails()` in `kitconcept.intranet.utils.watch_notifier`.
It runs in a before-commit hook, once per changed item, and already has the item, the editor, and the watchers who can view the item.
Calling `storage.add_notification()` there, for each recipient and with a new type such as `watched`, would store the entries in the same transaction as the change.
The overview page would then need a second reason line, "You watch this item."
Watch emails are only built for published content; a bell entry for watched content could follow the same rule or not, which is a product decision.

## Limits and future work

Known limits of the MVP:

- **Only creators are notified.**
  Watchers get emails from the watch feature, but nothing in the bell.
  Watching whole areas isn't supported by either feature.
- **No email.**
  The notification center itself sends none.
  An email digest would read from the same storage.
- **No real-time push.**
  The REST API stays the same if push is added; the poller would only become a fallback.
- **No cleanup beyond the cap.**
  Notifications of deleted users stay in storage.
- **Notifications are created synchronously**, in the same transaction as the change.
  For pages with many creators this is a few extra writes; a queue would only pay off with large fan-out, such as watched areas.

To add a type within the current design, see {doc}`/developer/how-to-guides/add-notification-type`.

## See also

- {doc}`/developer/reference/api/notifications`
- {doc}`/developer/reference/components/notifications`
- {doc}`/concepts/notifications`
- {doc}`security-model`
- {doc}`watch-content`
