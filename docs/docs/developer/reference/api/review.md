---
myst:
  html_meta:
    description: "REST API reference for the @review endpoint."
    keywords: "API, content, review, reminder, REST, @review"
doc_type: reference
audience: developer
status: draft
last_updated: 2026-04-09
---

# @review Endpoint

The `@review` endpoint handles approve/delegate/postpone operations on content items with the IContentReview behavior enabled.

## Actions

### `POST /@review/approve`

Marks the content as reviewed and up-to-date. Automatically calculates the next review due date based on the content's review_interval (falling back to the site-wide default interval if not set), and records today as the completion date.

**Request body:** None required.

**Effect on content fields:**

| Field                   | Value set                                           |
|-------------------------|-----------------------------------------------------|
| `review_status`         | "Up-to-date"                                        |
| `review_due_date`       | Calculated from `review_interval` (or site default) |
| `review_completed_date` | Today's date                                        |

**Example:**

```http
POST /my-page/@review/approve
```

***

### `POST /@review/delegate`

Assigns the content review to another user. Optionally attaches a comment.

**Request body (JSON):**

| Field      | Type   | Required | Description                                                                                |
|------------|--------|----------|--------------------------------------------------------------------------------------------|
| `assignee` | string | Yes      | User to assign the review to. Must be a valid value from the `review_assignee` vocabulary. |
| `comment`  | string | No       | Optional note about the delegation.                                                        |

**Errors:**

- `400 Bad Request` — if `assignee` is not found in the vocabulary.

**Example:**

```http
POST /my-page/@review/delegate
Content-Type: application/json

{
  "assignee": "jane.doe",
  "comment": "Please review the legal section."
}
```

***

### `POST /@review/postpone`

Postpones the review to a specified future date. Optionally attaches a comment. Sets the status to "Up-to-date" without recording a completion date.

**Request body (JSON):**

| Field      | Type                   | Required | Description |
|------------|------------------------|----------|-------------|
| `due_date` | string (ISO 8601 date) | No       | New review due date, e.g. "2026-09-01". If omitted, the existing due date is unchanged. |
| `comment`  | string                 | No       | Optional note about why the review was postponed. |

**Example:**

```http
POST /my-page/@review/postpone
Content-Type: application/json

{
  "due_date": "2026-09-01",
  "comment": "Waiting for updated policy documents."
}
```

***

## Error Responses

| Status            | Condition                                                  |
|-------------------|------------------------------------------------------------|
| `400 Bad Request` | Unknown action (not approve, delegate, or postpone)        |
| `400 Bad Request` | `delegate` called with an `assignee` not in the vocabulary |

## See Also

- [How to enable likes](/how-to-guides/engagement/enable-likes)
- [IContentReview behavior](/developer/reference/behaviors/votes)
