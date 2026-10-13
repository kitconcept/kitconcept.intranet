# Inline tasks

Todos in `blocks.__somersault__.value` are cataloged as `Inline Task` entries.
The document is their authoritative storage: `taskId`, `taskCreator`,
`taskCreated`, `taskModified`, and `taskCompleted` are stamped server-side.
Transient task objects resolve at `<page>/++tasks++items/<taskId>`; no task
objects are persisted separately. Completing a todo records a UTC timestamp;
reopening it removes that timestamp.

Catalog `UID` values are `<page UID>:<taskId>`. The same node UUID pasted into
another page therefore gets a distinct catalog identity without a collision
query or indexing-queue flush. Traversal still uses only the node's `taskId`.

`task_assignees` contains all mentioned user IDs, falling back to the original
creator. `task_due_date` is the first valid inline calendar date, indexed at midnight
UTC. Missing due dates are indexed as `4000-01-01T00:00:00Z`, a sentinel within
DateIndex's integer range, so sorting on `task_due_date` puts undated tasks last.
`task_completed` is a date index; `task_status` is its derived
`open`/`completed` query counterpart. `task_assignees` is index-only; the three
metadata columns are `task_due_date`, `task_completed`, and `task_status`.
`task_source_title` is available through `metadata_fields` but resolved from the
live task object, so page title changes require no task recataloging.

The frontend's `/tasks` route uses the existing site-root
`POST @querystring-search` endpoint with this request body:

```json
{
  "query": [
    {"i": "portal_type", "o": "plone.app.querystring.operation.selection.any", "v": ["Inline Task"]},
    {"i": "task_assignees", "o": "plone.app.querystring.operation.string.currentUser"},
    {"i": "task_status", "o": "plone.app.querystring.operation.selection.any", "v": ["open"]}
  ],
  "sort_on": "task_due_date",
  "sort_order": "ascending",
  "b_start": 0,
  "b_size": 25,
  "metadata_fields": ["UID", "task_due_date", "task_source_title"]
}
```

Results use standard `items`, `items_total`, and `batching` keys and inherit page
visibility. Render the sentinel as missing; display the calendar-date portion of
`task_due_date` without timezone conversion, and use the browser timezone for today.
Derive the containing page URL by removing `/++tasks++items/<UUID>` from `@id`.
REST deserialization compares old/new task projections and queues only changed
entries for catalog updates after the page is saved. Removing the entire block
also removes its task entries. Catalog refreshes resolve already indexed tasks;
discovery during a full clear-and-rebuild is deferred.
Existing sites
must run the `kitconcept.intranet:default` profile upgrade `20261012001` to install the indexes and backfill todos;
unknown historical task creators fall back to page creators, and historical
completion times are approximated by migration time.


The `/tasks` page offers My tasks and All tasks tabs with a workspace path filter.
Both tabs show open tasks visible to the current user and the total matching count
before batching. Task summaries may request `task_workspace` (nearest workspace
URL and title) and `task_assignee_details` (all assignee IDs and display names).
These attributes resolve live without new catalog indexes or a profile upgrade.

The Tasks view also supports URLs such as `/workspace/tasks` and
`/workspace/page/tasks`. It preselects the nearest containing workspace, and
the workspace filter can still be changed or cleared.
