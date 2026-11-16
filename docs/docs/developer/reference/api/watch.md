---
myst:
  html_meta:
    description: "REST API reference for the @watch endpoint and the watch expander."
    keywords: "API, watch, watching, REST, @watch, expander, notifications"
doc_type: reference
audience: developer
status: draft
last_updated: 2026-11-16
---

# @watch Endpoint

The `@watch` endpoint reads and toggles whether the **current user** watches a
content item. It is registered for content with the
{doc}`kitconcept.intranet.watchers </developer/reference/behaviors/watchers>`
behavior (`IWatchable`) and requires the `View` permission.

It never returns other users' watch state or a list of watchers.

## `GET /@watch`

Returns the current user's watch state.

**Example:**

```http
GET /my-page/@watch HTTP/1.1
Accept: application/json
```

**Response:**

```json
{
  "@id": "http://localhost:3000/my-page/@watch",
  "watching": false
}
```

For anonymous users (when they can view the item) `watching` is always `false`.

***

## `POST /@watch`

Toggles the current user's watch state: starts watching if they don't watch the
item, stops watching if they do. Returns the new state.

**Request body:** none.

**Example:**

```http
POST /my-page/@watch HTTP/1.1
Accept: application/json
```

**Response:**

```json
{
  "@id": "http://localhost:3000/my-page/@watch",
  "watching": true
}
```

**Side effects:**

- Adds or removes the user ID in the item's watchers and reindexes only the
  `watchers` catalog index.
- Fires no `IObjectModifiedEvent`, doesn't change `modified`, and creates no
  new version.

***

## Error responses

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | `POST` by an anonymous user. |
| `401 Unauthorized` | The user can't view the item. |
| `404 Not Found` | Watching content is disabled (`kitconcept.intranet.enable_content_watching` is `False`). |
| `404 Not Found` | The item's type doesn't have the `kitconcept.intranet.watchers` behavior. |

## `watch` expander

The same state is available as the `watch` component of a content response, so
a client doesn't need a separate request.

**Without expansion** (default), the component only links to the endpoint:

```json
"@components": {
  "watch": {
    "@id": "http://localhost:3000/my-page/@watch"
  }
}
```

**With expansion** (`?expand=watch`):

```http
GET /my-page?expand=watch HTTP/1.1
Accept: application/json
```

```json
"@components": {
  "watch": {
    "@id": "http://localhost:3000/my-page/@watch",
    "watching": true
  }
}
```

The component is present only on watchable content, which makes it a reliable
check for "can this item be watched?" It is present even when the feature is
disabled; check `kitconcept.intranet.enable_content_watching` in `@site`.

The intranet frontend requests the expander for all content
(`config.settings.apiExpanders` in `config/settings.ts`).

## Related site setting

`GET /@site` includes:

| Key | Type | Description |
|-----|------|-------------|
| `kitconcept.intranet.enable_content_watching` | boolean | Whether watching content is enabled. |

## "Watched by me" query

To list the items the current user watches, query the `watchers` index with the
intranet operation, for example through `@querystring-search`:

```http
POST /@querystring-search HTTP/1.1
Accept: application/json
Content-Type: application/json

{
  "query": [
    {
      "i": "watchers",
      "o": "plone.app.querystring.operation.string.watchedByCurrentUser"
    }
  ]
}
```

For anonymous users the query matches nothing.

## See also

- {doc}`/developer/concepts/watch-content`
- {doc}`/developer/reference/behaviors/watchers`
- {doc}`/features/watch-content`
