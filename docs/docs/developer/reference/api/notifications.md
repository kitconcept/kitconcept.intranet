---
myst:
  html_meta:
    description: "REST API reference for the @notifications and @notifications-settings endpoints."
    keywords: "API, REST, notifications, @notifications, @notifications-settings, preferences"
doc_type: reference
audience: developer
status: draft
last_updated: 2026-11-16
---

# @notifications Endpoints

The notification center exposes two endpoints on the site root.
They always act on the **current user**: there is no way to read or change another user's notifications.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/@notifications` | List the current user's notifications. |
| `PATCH` | `/@notifications` | Mark notifications as read. |
| `GET` | `/@notifications-settings` | Read the current user's preferences. |
| `PATCH` | `/@notifications-settings` | Update the current user's preferences. |

All four are registered for `IPloneSiteRoot` with the `zope2.View` permission, and answer `401 Unauthorized` to anonymous users.

Source: `backend/src/kitconcept/intranet/notifications/services.py`.

## `GET /@notifications`

Lists the current user's notifications, newest first.

### Query parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `b_start` | integer | `0` | Index of the first item to return. |
| `b_size` | integer | `25` | Maximum number of items to return. |
| `unread_only` | `1`, `true` | off | Return unread notifications only. |

### Response

| Key | Type | Description |
|-----|------|-------------|
| `@id` | string | URL of the endpoint. |
| `items_total` | integer | Number of matching notifications before batching. With `unread_only`, the number of unread ones. |
| `unread` | integer | Number of unread notifications, whatever `unread_only` says. Use it for the badge. |
| `items` | array | The notifications in the requested batch. See below. |

Notifications about content the current user can't view, because it was deleted or isn't accessible to them, are left out of `items`, `items_total`, and `unread`.

### Notification item

| Key | Type | Description |
|-----|------|-------------|
| `id` | string | Notification ID, a 32-character hex string. Use it to mark the notification as read. |
| `type` | string | `like`, `modified`, or `transition`. |
| `@id` | string | Current URL of the content item. |
| `uid` | string | UID of the content item. |
| `title` | string | Current title of the content item. |
| `portal_type` | string | Content type of the item. |
| `actor` | object | Who did it: `{"id": "<userid>", "fullname": "<full name>"}`. `fullname` falls back to the user ID. |
| `created` | string | ISO 8601 timestamp in UTC. For merged edits, the time of the latest edit. |
| `read` | boolean | Whether the notification has been read. |
| `transition` | string | `transition` only. ID of the workflow transition, for example `publish`. |
| `review_state` | string | `transition` only. ID of the new review state, for example `published`. |
| `review_state_title` | string | `transition` only. Title of the new review state, translated to the request's language. |

### Example

```http
GET /@notifications?b_size=2 HTTP/1.1
Accept: application/json
Authorization: Bearer <token>
```

```json
{
  "@id": "http://localhost:8080/Plone/@notifications",
  "items_total": 10,
  "unread": 6,
  "items": [
    {
      "id": "6f1c0b5e9a7d4b0f8a3e2d1c0b9a8f7e",
      "type": "like",
      "@id": "http://localhost:8080/Plone/benachrichtigungen-demo/reiserichtlinie-2027",
      "uid": "a1b2c3d4e5f60718293a4b5c6d7e8f90",
      "title": "Reiserichtlinie 2027",
      "portal_type": "Document",
      "actor": {"id": "b.yilmaz", "fullname": "Ben Yilmaz"},
      "created": "2026-11-16T09:41:12.345678+00:00",
      "read": false
    },
    {
      "id": "0a9b8c7d6e5f40312a3b4c5d6e7f8091",
      "type": "transition",
      "@id": "http://localhost:8080/Plone/benachrichtigungen-demo/it-sicherheit-faq",
      "uid": "f0e1d2c3b4a5968778695a4b3c2d1e0f",
      "title": "IT-Sicherheit FAQ",
      "portal_type": "Document",
      "actor": {"id": "c.beck", "fullname": "Dr. Clara Beck"},
      "created": "2026-11-16T08:35:02.000000+00:00",
      "read": false,
      "transition": "publish",
      "review_state": "published",
      "review_state_title": "Veröffentlicht"
    }
  ]
}
```

(notifications-api-caching)=

### Caching

Every response carries an `ETag` and `Cache-Control: private, no-cache`, so browsers store it and revalidate it before using it again.

A request with an `If-None-Match` header that contains the current ETag gets `304 Not Modified`, with the `ETag` header and no body.
Weak ETags (`W/"…"`), lists of ETags, and `*` are accepted.

The ETag changes when:

- the user gets a new notification, or an existing one is merged with a new edit;
- notifications are marked as read;
- an item the user authors is edited, changes state, or is moved, renamed, or deleted;
- the query string or the language differs;
- the hour changes.

```http
GET /@notifications?b_size=5 HTTP/1.1
Accept: application/json
Authorization: Bearer <token>
If-None-Match: "47e2c38fe86aeab6ebfc9f0dc65fb0be"
```

```http
HTTP/1.1 304 Not Modified
ETag: "47e2c38fe86aeab6ebfc9f0dc65fb0be"
```

### Errors

| Status | Condition |
|--------|-----------|
| `304 Not Modified` | `If-None-Match` matches the current ETag. Not an error, listed here for completeness. |
| `400 Bad Request` | `b_start` or `b_size` isn't an integer. |
| `401 Unauthorized` | The user is anonymous. |

## `PATCH /@notifications`

Marks notifications of the current user as read.

### Request body

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `ids` | array of strings | No | IDs of the notifications to mark as read. Without `ids`, or with an empty body, **all** notifications are marked as read. |

Unknown IDs and notifications that are already read are ignored.
There's no way to mark a notification as unread.

### Response

`204 No Content`.

### Example

```http
PATCH /@notifications HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{"ids": ["6f1c0b5e9a7d4b0f8a3e2d1c0b9a8f7e"]}
```

Mark all as read:

```http
PATCH /@notifications HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{}
```

### Errors

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | `ids` isn't a list. |
| `401 Unauthorized` | The user is anonymous. |

## `GET /@notifications-settings`

Returns the current user's preferences: one boolean per notification type.
Types the user never changed are `true`.

```http
GET /@notifications-settings HTTP/1.1
Accept: application/json
Authorization: Bearer <token>
```

```json
{"like": true, "modified": true, "transition": true}
```

## `PATCH /@notifications-settings`

Updates the current user's preferences.
Send only the types you want to change.
Values are converted to Boolean values.

### Response

`200 OK` with all preferences after the update.

### Example

```http
PATCH /@notifications-settings HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{"like": false}
```

```json
{"like": false, "modified": true, "transition": true}
```

### Errors

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | The body has a key that isn't a notification type. |
| `401 Unauthorized` | The user is anonymous. |

## CSRF

Both `PATCH` services disable Plone's CSRF protection for their request, as they only change the current user's own data.

## See also

- {doc}`/developer/concepts/notifications`
- {doc}`/developer/reference/components/notifications`
- {doc}`/features/notification-center`
