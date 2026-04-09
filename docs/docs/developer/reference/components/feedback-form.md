---
myst:
  html_meta:
    description: "Reference for the FeedbackForm React component."
    keywords: "FeedbackForm, component, feedback, React, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-09
---

# FeedbackForm Component

## Overview

`FeedbackForm` renders a standalone feedback page accessible at `/feedback-form` and `/**/feedback-form`. It collects free-text feedback, name, and email from the user, then submits to the backend `/@contact-form-feedback` endpoint. It does not appear as an embedded component — it is a full route-mounted page.

**File:** `frontend/packages/kitconcept-intranet/src/components/FeedBackForm/FeedBackForm.tsx`

**Registration:**
```typescript
config.addonRoutes = [
  { path: ['/feedback-form', '/**/feedback-form'], component: FeedBackForm },
];
config.addonReducers = { feedbackContactForm };
```

## Form Fields

| Field | Required | Description |
|-------|----------|-------------|
| Page URL | Read-only | Automatically set to the referring page path |
| Feedback | Yes | Multi-line free-text input |
| Name | No | Submitter's name |
| Email | Yes | Submitter's email address |

## API

**Endpoint:** `POST {content-path}/@contact-form-feedback`

**Payload:**
```json
{
  "feedback": "string",
  "name": "string",
  "email": "string",
  "url": "string",
  "user_agent": "string",
  "window_width": "number",
  "window_height": "number"
}
```

`user_agent`, `window_width`, and `window_height` are collected automatically on mount via `useEffect`.

**Redux reducer:** `feedbackContactForm` — tracks loading, success, and error state.

## Behaviour

- On success: shows a success toast and navigates back to the referring page.
- On error: shows an error toast. An email validation error from the backend displays as "Only internal e-mail addresses are permitted".
- Cancel button navigates back without submitting.
- Data protection disclosure links differ by locale: `/en/data-protection` (English) or `/de/datenschutz` (German).
- Placeholder text in the feedback field is also locale-specific.

## Notes

- Uses `react-aria-components` for accessible form fields.
- Email validation is enforced on the backend, not the frontend.
- The form clears a field's error state as soon as the user starts typing in that field.

## See Also

- [How to configure the feedback form](../../../how-to-guides/feedback/configure-feedback.md)
- [Sticky feedback button](../../../how-to-guides/feedback/configure-feedback.md)
