---
myst:
  html_meta:
    description: "How watching content works: where watchers are stored, how changes become emails, and why it is built this way."
    keywords: "watch, watchers, notifications, email, transaction hooks, annotation, OOTreeSet, plone.app.iterate, developer"
doc_type: explanation
audience: developer
status: draft
last_updated: 2026-11-16
---

# Watching content

This page explains how the watch content feature is put together and why. For
what the feature does, see {doc}`/features/watch-content`. For the exact API and
schema, see the reference pages listed at the end.

## The moving parts

| Part | Where | Role |
|------|-------|------|
| `kitconcept.intranet.watchers` behavior | `behaviors/watchers.py` | Marks a type as watchable (`IWatchable`) and adapts it to `IWatchers`, which stores the user IDs. |
| `@watch` service and `watch` expander | `services/watch.py` | Lets the current user read and toggle their own watch state. |
| Event subscribers | `subscribers/watchers.py` | Turn edits, publishing and check-ins into queued changes; clear watchers on copies. |
| Watch notifier | `utils/watch_notifier.py` | Collects the changes of a transaction, builds the emails and sends them after commit. |
| `watchers` index and "Watched by me" | `indexers/watchers.py`, `queryparser.py`, `catalog.xml`, `registry/querystring.xml` | Let listings query the content a user watches. |
| `WatchButton` | `frontend/…/components/WatchButton/` | The toggle in the UI. |

## Storing watchers privately

Likes keep their user IDs in a schema field (`votes`), so they are part of the
content serialization: anyone who can read the item can read who liked it.

Watchers are different. Who follows which page can say a lot about a person,
and intranets in Germany are typically reviewed by a works council. So the user
IDs are stored in an **annotation** (`kitconcept.intranet.watchers`), not in a
schema field. The behavior is a **marker** with no fields, and nothing
serializes the annotation. The only way to learn about watchers through the API
is the `watch` component, and it returns a single boolean: whether the
**current** user watches the item.

The IDs live in a `BTrees.OOBTree.OOTreeSet`:

- Two users watching the same popular page at the same time is a normal
  write conflict on a plain list. A tree set resolves concurrent inserts of
  different keys, so these don't turn into `ConflictError` retries.
- Toggling never fires `IObjectModifiedEvent` and only reindexes `watchers`, so
  watching doesn't bump `modified` or create a new version.

## From a change to an email

A single save in Plone often fires **several** events: the REST API fires
`IObjectModifiedEvent`, and other subscribers (task cataloging, content review,
versioning) may react and fire more. Sending an email per event would spam
watchers. Sending it directly from the event handler would also send emails for
saves that are later rolled back.

So the notifier works per **transaction**:

1. **Queue.** The subscribers call `queue_change(obj)`. The first call in a
   transaction stores a `PendingChanges` object on the transaction
   (`transaction.set_data`) and registers a before-commit and an after-commit
   hook. Every change is stored by UID, so an item changed several times in one
   transaction is queued once. The editor's user ID and the change note (from
   the request annotation that `plone.app.versioningbehavior` writes) are kept
   with it.
2. **Build, before commit.** The before-commit hook runs while the content, the
   request and the security context are still available. For each queued item
   it checks that the item still exists and is published, works out the
   recipients and composes one email per recipient. Any exception is logged and
   the emails are dropped—a notification problem must never abort the save.
3. **Send, after commit.** The after-commit hook sends the emails only if the
   transaction committed. Each email is sent on its own with
   `api.portal.send_email(..., immediate=True)`; a failure is logged per
   recipient.

Sending after commit, rather than handing the emails to the transactional mail
delivery, keeps SMTP errors out of the two-phase commit, where an exception can
no longer be rolled back cleanly. After commit, a failed email is just logged.

### Which events count

| Event | Handled as |
|-------|------------|
| `IObjectModifiedEvent` | A change, except `IContainerModifiedEvent`: adding, removing or ordering children is not a change of the item itself. |
| `IAfterTransitionEvent` to `published` | A change (the item became visible to its watchers). Creation (`transition is None`) is ignored. |
| `plone.app.iterate` `IAfterCheckinEvent` | A change of the baseline; the check-in message becomes the change note. |
| `IObjectCopiedEvent` | Not a change: the copy's watchers are cleared. |

### Who gets an email

Recipients are computed at build time, not at watch time, so permission changes
since the user started watching are respected:

- the item must be **published** (content without a workflow follows its parent,
  and the View check below covers it);
- the watcher must still **exist**, have an **email** address and have the
  **View** permission on the item (`api.user.has_permission`);
- the **editor** (the user who made the change) is skipped.

## Copies and working copies

A copy is new content nobody chose to watch, but a ZODB copy also copies
annotations. The `IObjectCopiedEvent` subscriber clears the watchers on the
copy before it's added and indexed.

Working copies need the opposite. `plone.app.iterate` copies the baseline's
annotations to the working copy on checkout and back on check-in. Because the
annotation holds the **same** `OOTreeSet` object, both point to one set:
someone who starts watching the original during a checkout is still a watcher
after check-in. The working copy itself is never notified—it isn't published
and the notifier skips `IWorkingCopy`—and the indexer leaves it out of
"Watched by me."

## "Watched by me"

The `watchers` `KeywordIndex` holds the user IDs; items without watchers are
not indexed. The listing criterion uses its own query operation,
`plone.app.querystring.operation.string.watchedByCurrentUser`, instead of
Plone's `currentUser`: for anonymous users `currentUser` produces a query
without a value, and the catalog then **ignores** the criterion and returns
everything. The intranet operation returns a value that matches nothing.

## The frontend

The content request asks for the `watch` expander (`apiExpanders` in
`config/settings.ts`), so the page knows the current user's state without an
extra request. `WatchButton` renders nothing unless the feature is enabled
(`@site`), the content has the `watch` component (that is, the behavior) and
the user is logged in.

On Document, News Item, Event, WikiPage and Workspace the page shows the **About
this content** box instead of the content interactions bar, so the button is
rendered in both places: labelled in the box header, eye-only in the bar.

The eye is an inline SVG drawn with `currentColor`, not an SVG file rendered
through Volto's `Icon`. The SVG loader rewrites file icons (it drops root
attributes and, without an explicit fill, the `fill-rule` that cuts the iris and
pupil), which broke the pressed, inverted state.

## Upgrading existing sites

Upgrade step `20261116001` installs the behavior on the five types, adds the
`watchers` index and the query operation and field, and sets
`kitconcept.intranet.enable_content_watching` to `False`. The index starts
empty—nobody watches anything yet—so no reindexing is needed.

## Known limits

- Every save of a published item sends an email; there is no throttling and no
  "minor change" option yet.
- The email is plain text, built in Python (`compose()` in
  `utils/watch_notifier.py`); it isn't a template site admins can edit.
- Emails are sent during the request, one per recipient. Items with a large number of watchers would make that save slower.

## See also

- {doc}`/features/watch-content`
- {doc}`/developer/reference/api/watch`
- {doc}`/developer/reference/behaviors/watchers`
- {doc}`/developer/reference/components/watch-button`
