---
myst:
  html_meta:
    description: "Reference for the kitconcept.intranet.watchers behavior, the IWatchers adapter, the watchers index and the watch notification events."
    keywords: "IWatchable, IWatchers, behavior, watchers, watch, index, querystring, developer"
doc_type: reference
audience: developer
status: draft
last_updated: 2026-11-16
---

# Watchers Behavior

The watchers behavior makes a content type watchable. It has **no schema
fields**: the user IDs of the watchers are stored in an annotation and are never
serialized.

## Behavior

| | |
|---|---|
| **Name** | `kitconcept.intranet.watchers` |
| **Title** | Watch content |
| **Marker interface** | `kitconcept.intranet.behaviors.watchers.IWatchable` |
| **Fields** | none |
| **Enabled on** | Document, News Item, Event, File, Image |

Enable it on another type by adding the behavior to the type's FTI:

```xml
<property name="behaviors" purge="false">
  <element value="kitconcept.intranet.watchers" />
</property>
```

## `IWatchers` adapter

`kitconcept.intranet.behaviors.watchers.IWatchers`, adapting `IWatchable`.

```python
from kitconcept.intranet.behaviors.watchers import IWatchers

watchers = IWatchers(obj)
watchers.add("jane.doe")
watchers.is_watching("jane.doe")  # True
watchers.userids()                # ["jane.doe"]
watchers.remove("jane.doe")
watchers.clear()
```

| Method | Returns | Description |
|--------|---------|-------------|
| `userids()` | `list[str]` | User IDs of the watchers, sorted. |
| `is_watching(userid)` | `bool` | Whether the user watches the item. |
| `add(userid)` | `None` | Start watching. |
| `remove(userid)` | `None` | Stop watching; no error if the user doesn't watch. |
| `clear()` | `None` | Remove all watchers. |

The adapter doesn't reindex. After changing watchers, call
`obj.reindexObject(idxs=["watchers"])`.

**Storage:** annotation key `kitconcept.intranet.watchers`, holding a
`BTrees.OOBTree.OOTreeSet` of user IDs (created on first `add`).

## Catalog

| Name | Type | Indexed value |
|------|------|---------------|
| `watchers` | `KeywordIndex` | User IDs of the watchers. Not indexed when there are none, or for working copies. |

There is no metadata column.

## Query operation and field

| Registry record | Value |
|-----------------|-------|
| `plone.app.querystring.field.watchers` | Field **Watched by** (group *Metadata*) |
| `plone.app.querystring.operation.string.watchedByCurrentUser` | Operation **Watched by me**, implemented by `kitconcept.intranet.queryparser._watchedByCurrentUser` |

The operation queries `watchers` with the current user's ID, and with a value
that matches nothing for anonymous users.

## Event subscribers

Registered for `IWatchable` in `subscribers/configure.zcml`:

| Event | Handler | Effect |
|-------|---------|--------|
| `IObjectModifiedEvent` | `content_modified` | Queues a notification, except for `IContainerModifiedEvent`. |
| `IAfterTransitionEvent` | `content_transitioned` | Queues a notification when the new state is `published`. |
| `plone.app.iterate` `IAfterCheckinEvent` | `content_checked_in` | Queues a notification for the baseline; the check-in message is the change note. |
| `IObjectCopiedEvent` | `content_copied` | Clears the watchers of the copy. |

Queued notifications are handled by `kitconcept.intranet.utils.watch_notifier`;
see {doc}`/developer/concepts/watch-content` for the rules.

## Setting

| Registry record | Type | Default |
|-----------------|------|---------|
| `kitconcept.intranet.enable_content_watching` | Boolean | `True` for new sites; set to `False` by upgrade step `20261116001` |

## See also

- {doc}`/developer/concepts/watch-content`
- {doc}`/developer/reference/api/watch`
- {doc}`/developer/reference/components/watch-button`
