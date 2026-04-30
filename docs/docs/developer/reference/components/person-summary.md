---
myst:
  html_meta:
    description: "Reference for the PersonSummary component used in Teaser, Grid, and Listing blocks."
    keywords: "PersonSummary, Person, Teaser, Grid, Listing, summary, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-27
---

# PersonSummary

Content-type-specific summary card rendered when a `Person` item appears inside a Teaser, Grid, or Listing block.

**File:** `frontend/packages/kitconcept-intranet/src/components/Summary/PersonSummary.tsx`

**Registration:** `frontend/packages/volto-light-theme/frontend/packages/volto-light-theme/src/config/summary.ts` — registered as the `Summary` component for the `Person` content type. See {doc}`vlt:how-to-guides/summary` for how the Summary registry works.

---

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `item` | `Partial<ObjectBrowserItem>` | Yes | The Person content object |
| `HeadingTag` | `React.ElementType` | No | Heading element used for the name (default: `'h3'`) |
| `a11yLabelId` | `string` | No | `aria-labelledby` value passed to the heading element |
| `hide_description` | `boolean` | No | If true, the description paragraph is not rendered |

### Person item fields used

| Field | Description |
|-------|-------------|
| `head_title` | Optional label displayed above the name |
| `title` | Person's full name rendered in `HeadingTag`; falls back to `item.id` |
| `job_title` | Job title displayed below the name |
| `description` | Short bio — processed through [`smartTextRenderer`](../helpers/smart-text.md) to support markdown links |
| `contact_email` | Rendered as a `mailto:` link with a mail icon |
| `contact_room` | Rendered with a location icon |
| `contact_phone` | Rendered with a mobile/phone icon |

`ObjectBrowserItem` (from `@plone/types`) only declares `@id`, `@type`, and `title`. The Person-specific fields above (`head_title`, `job_title`, `contact_email`, `contact_room`, `contact_phone`) are extra fields from the catalog brain included in the API response but not part of the type definition.

---

## Link behaviour

`PersonSummary.hideLink = true` is set unconditionally on the component. The parent block templates (`DefaultTemplate`, `GridTemplate`, `SummaryTemplate`) check this flag before wrapping the name in a link:

```typescript
let showLink = !Summary.hideLink && !isEditMode;
```

Because `hideLink` is always `true` for Person items, person names are never rendered as links regardless of edit mode or any control panel setting.

---

## Styles

SCSS source: `frontend/packages/volto-light-theme/frontend/packages/volto-light-theme/src/theme/person.scss`

The `.summary-extra-info` class handles icon + text rows. Icon size is 24px.

---

## Notes

- The intranet version extends the upstream VLT `PersonSummary` with two changes: it adds `job_title` rendering and sets `hideLink = true`.
- `hide_description` suppresses the description paragraph unconditionally — unlike the VLT base which additionally skips the paragraph when `item.description === ''`.
- `description` is passed through `smartTextRenderer` — markdown-style links (`[text](href)`) in the description field are rendered as `<UniversalLink>` elements.

## See also

- [smartTextRenderer](../helpers/smart-text.md)
- [Person view](person-view.md)
