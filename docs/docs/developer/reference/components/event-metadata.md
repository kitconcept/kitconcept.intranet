---
myst:
  html_meta:
    description: "Reference for the EventMetadata block customization that handles the Location behavior."
    keywords: "EventMetadata, event, location, block, Location behavior, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-09
---

# EventMetadata Block

## Overview

The `EventMetadata` block renders event-specific metadata below the page title: start/end times, location, event URL, and contact information. The kitconcept-intranet distribution extends the upstream VLT implementation to support both a plain-text `location` field and a relational `location_reference` field provided by the `kitconcept.intranet` Location behavior.

**File:** `frontend/packages/kitconcept-intranet/src/components/Blocks/EventMetadata/View.jsx`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `properties.start` | `string` | Yes | ISO 8601 start datetime |
| `properties.end` | `string` | No | ISO 8601 end datetime; omitted when `open_end` is true |
| `properties.whole_day` | `boolean` | No | If true, shows only the date (no time) |
| `properties.open_end` | `boolean` | No | If true, the end section is not rendered |
| `properties.location` | `string` | No | Plain-text location string |
| `properties.location_reference` | `Array<{ '@id': string; title: string }>` | No | Linked Location content items — provided by the `kitconcept.intranet` [Location behavior](/developer/reference/behaviors/location) |
| `properties.event_url` | `string` | No | External URL for the event |
| `properties.contact_name` | `string` | No | Contact person name |
| `properties.contact_email` | `string` | No | Rendered as `mailto:` link |
| `properties.contact_phone` | `string` | No | Rendered as `tel:` link |

## Location rendering

The block uses `location_reference` when available, falling back to the plain-text `location` field:

```jsx
// Pseudocode of the resolution logic
if (properties.location_reference?.length > 0) {
  // Render each item as a UniversalLink
} else if (properties.location) {
  // Render plain text
}
```

This allows editors to link events to structured `Location` content objects while remaining compatible with sites that use only the free-text field.

## Date formatting

| Condition | Output |
|-----------|--------|
| `whole_day === true` | Date only, no time |
| `open_end === true` | Start date/time only, no end shown |
| Default | Start and end date/time |

Dates are rendered with the `FormattedDate` component for locale-aware output.

## ICS download

A download link is rendered pointing to `{content-url}/ics_view`, allowing users to add the event to their calendar application.

## Notes

- The customization file at `src/customizations/@kitconcept/volto-light-theme/components/Blocks/EventMetadata/View.jsx` is a re-export that routes to the intranet implementation — no additional logic is added there.
- `isOpenEnd` is evaluated as `!content.end || !!content.open_end`, so a missing `end` value also suppresses the end section.
- `location_reference` is a field added by `kitconcept.intranet` — see [Location behavior](/developer/reference/behaviors/location).

## See Also

- [Event Calendar block](../../../how-to-guides/blocks/event-calendar.md)
- [Person content type](../../../reference/content-types.md)
