---
myst:
  html_meta:
    description: "Reference for the PersonSummary component used in Teasers, Grids, and Listings."
    keywords: "PersonSummary, Person, Teaser, Grid, Listing, mail icon, summary, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-09
---

# PersonSummary

## Overview

`PersonSummary` is the content-type-specific summary card rendered when a `Person` item appears inside a **Teaser**, **Grid**, or **Listing** block. It displays the person's name, description, email, room, and phone — with icons — in a consistent compact format.

**File:** `frontend/packages/volto-light-theme/src/components/Summary/PersonSummary.tsx`

**Registration:**
```typescript
// frontend/packages/volto-light-theme/src/config/summary.ts
config.registerComponent({
  name: 'Summary',
  dependencies: ['Person'],
  component: PersonSummary,
});
```

The `Summary` component registry allows Teaser and Listing blocks to look up content-type-specific renderers at runtime:
```typescript
config.getComponent({ name: 'Summary', dependencies: [href['@type']] })
```

---

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `item` | `Person` | Yes | The Person content object |
| `HeadingTag` | `'h1' \| 'h2' \| 'h3'` | No | Heading element used for the name (default: `'h3'`) |
| `a11yLabelId` | `string` | No | `aria-labelledby` value for accessibility |
| `hide_description` | `boolean` | No | If true, the description paragraph is not rendered |

### Person item fields used

| Field | Description |
|-------|-------------|
| `head_title` | Optional label displayed above the name |
| `title` | Person's full name (rendered in `HeadingTag`) |
| `description` | Short bio — processed through [`smartTextRenderer`](../helpers/smart-text.md) to support markdown links |
| `contact_email` | Rendered as a `mailto:` link with a mail icon |
| `contact_room` | Rendered with a location icon |
| `contact_phone` | Rendered with a mobile/phone icon |

---

## Mail icon for mailto links

Email addresses are displayed with a mail icon from `@plone/volto/icons/email.svg`:

```tsx
{item.contact_email && (
  <div className="summary-extra-info email">
    <Icon title={intl.formatMessage(messages.email)} name={mailSVG} size="24px" />
    <a href={`mailto:${item.contact_email}`}>{item.contact_email}</a>
  </div>
)}
```

This pattern is also used for `contact_room` (location icon) and `contact_phone` (mobile icon).

---

## Profile link suppression

In **Teaser** and **Grid** blocks, person names are wrapped in a conditional link. The link is suppressed when `kitconcept.disable_profile_links` is enabled in the control panel:

```typescript
// DefaultBody.tsx (Teaser) and GridTemplate.jsx (Listing)
if (href['@type'] === 'Person' && siteSettings['kitconcept.disable_profile_links']) {
  // render name without link
}
```

---

## Styles

SCSS source: `frontend/packages/volto-light-theme/src/theme/person.scss`

The `.summary-extra-info` class handles icon + text rows. Icon size is 24px.

---

## Notes

- `description` is passed through `smartTextRenderer` — markdown-style links (`[text](href)`) in the description field are rendered as `<UniversalLink>` elements.
- The component respects the `hide_description` prop passed from parent block configuration.

## See Also

- [smartTextRenderer](../helpers/smart-text.md)
- [Person View](person-view.md)
- [Control Panel Settings](../../../reference/control-panel.md)
