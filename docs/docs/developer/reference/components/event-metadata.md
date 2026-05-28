---
myst:
  html_meta:
    description: "Reference for the EventMetadata block component that renders event dates, location, URL, and contact info."
    keywords: "EventMetadata, event, location, block, Location behavior, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-27
---

# EventMetadata block

Renders event-specific metadata below the page title: start/end times, location, event URL, and contact information.

**File:** `frontend/packages/kitconcept-intranet/src/components/Blocks/EventMetadata/View.jsx`

## Overview

The kitconcept-intranet distribution extends the upstream VLT implementation to support both a plain-text `location` field and a serialized `locations` array provided by a custom backend serializer in `kitconcept.intranet`.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `properties['@id']` | `string` | Yes | Content item URL; used to build the ICS download link |
| `properties.start` | `string` | Yes | ISO 8601 start datetime |
| `properties.end` | `string` | No | ISO 8601 end datetime; omitted when `open_end` is true or `end` is falsy |
| `properties.whole_day` | `boolean` | No | If true, shows only the date (no time) |
| `properties.open_end` | `boolean` | No | If true, the end section is not rendered |
| `properties.location` | `string` | No | Plain-text location string |
| `properties.locations` | `Array<{token: string, title: string, url: string}>` | No | Location terms serialized by the custom `EventSerializer`; each item includes a resolved URL — provided by the [Location behavior](/developer/reference/behaviors/location) |
| `properties.event_url` | `string` | No | External URL for the event |
| `properties.contact_name` | `string` | No | Contact person name |
| `properties.contact_email` | `string` | No | Rendered as a `mailto:` link |
| `properties.contact_phone` | `string` | No | Rendered as a `tel:` link |

## Location rendering

When `locations` is present, each item is rendered as a clickable link using the resolved `url` and the vocabulary term's `title`. When `locations` is absent, the plain-text `location` field is shown instead. If both fields are absent, the location section is not rendered at all.

## Date formatting

| Condition | Output |
|-----------|--------|
| `whole_day === true` | Date only (year, month, day — no time) |
| `open_end === true` or `end` is falsy | Start date/time only; end section not rendered |
| Default | Start and end date/time |

Dates are rendered with the `FormattedDate` component for locale-aware output.

## ICS download

A download link is rendered pointing to `{expandToBackendURL(content['@id'])}/ics_view`, allowing users to add the event to their calendar application.

## Notes

- `isOpenEnd` is evaluated as `!content.end || !!content.open_end` — a missing `end` value also suppresses the end section, not just an explicit `open_end: true`.
- `locations` is a field added by `kitconcept.intranet` — see [Location behavior](/developer/reference/behaviors/location).

## See also

- [Event Calendar block](../../../how-to-guides/blocks/event-calendar.md)
- [Location behavior](/developer/reference/behaviors/location)
