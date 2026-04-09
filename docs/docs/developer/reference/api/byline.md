---
myst:
  html_meta:
    description: "Reference for the byline expander and DocumentByLine slot component."
    keywords: "byline, documentByLine, slot, belowContentTitle, author, expander, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-09
---

# Byline / DocumentByLine

## Overview

The byline feature shows the author's name, publication date, and last-modified date below the page title. It is implemented as a slot component (`DocumentByLine`) registered in the `belowContentTitle` slot. The backend provides author metadata through the `byline` content expander.

---

## Backend: byline expander

The backend expander is requested by including `byline` in the `expand` query parameter:

```
GET /path/to/content?expand=byline
```

**Response shape** (inside `@components`):

```json
{
  "@components": {
    "byline": {
      "users": {
        "<userid>": {
          "fullname": "Jane Smith",
          "homepage": "/en/persons/jane-smith"
        }
      }
    }
  }
}
```

`users` is a mapping from user ID to display data. If a user ID has no entry, the component falls back to rendering the raw user ID.

---

## Frontend: DocumentByLine slot component

**File:** `frontend/packages/kitconcept-intranet/src/slots/DocumentByLine/DocumentByLine.tsx`

**Registration:**
```typescript
config.registerSlotComponent({
  slot: 'belowContentTitle',
  name: 'documentByLine',
  component: DocumentByLine,
});
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `content` | `Content` | Full content object including `@components.byline.users` |
| `content.creators` | `string[]` | Array of user IDs |
| `content.created` | `string` | ISO 8601 creation date |
| `content.modified` | `string` | ISO 8601 last-modified date |
| `content.review_state` | `string` | If `'published'`, the creation date is shown as "published" |
| `location.pathname` | `string` | Used to detect add mode |

### Behaviour

- **Author names:** Reads `creators` from Redux form state (`form.global.creators`) first, falls back to `content.creators`. Resolves each user ID against `@components.byline.users` to get the display name; links to `homepage` if present.
- **Dates:** Shows "published" date when `review_state === 'published'`; always shows "last modified" date.
- **Add mode:** Component does not render when `location.pathname` includes `/add`.
- **Memoisation:** `creators` array is memoised to prevent re-renders caused by reference changes.

### Rendered output (example)

```
By Jane Smith · published 8 Apr 2026 · last modified 9 Apr 2026
```

---

## Missing or unclear

- The exact backend package that registers the `byline` expander is not confirmed from frontend code alone.

## See Also

- [Slot system](../../../developer/concepts/slots.md)
- [Person content type](../../../reference/content-types.md)
