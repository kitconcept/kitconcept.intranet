---
myst:
  html_meta:
    description: "Reference for the PersonView component and Person SOLR search result rendering."
    keywords: "PersonView, PersonResultItem, SearchTabs, Person, SOLR, search, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-09
---

# Person View

## Overview

Three components handle the rendering of `Person` content: `PersonView` renders the full detail page, `PersonResultItem` renders a compact card in SOLR search results, and `SearchTabs` provides tabbed navigation across content type groups in the search UI.

## PersonView

**File:** `frontend/packages/kitconcept-intranet/src/components/theme/PersonView.tsx`

**Registration:**
```typescript
config.views.contentTypesViews.Person = PersonView;
```

### Props

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content.first_name` | `string` | Yes | First name |
| `content.last_name` | `string` | No | Last name |
| `content.academic_title` | `{ title: string }` | No | Displayed before the name |
| `content.image` | `object` | No | Profile image — uses `scales.preview.download`, falls back to `download` |
| `content.description` | `string` | No | Short bio or tagline |
| `content.text` | `{ data: string }` | No | Full bio, rendered as HTML |
| `content.organisational_units` | `string[]` | No | Organisational units |
| `content.department` | `string` | No | Department name |
| `content.contact_email` | `string` | No | Rendered as `mailto:` link |
| `content.contact_phone` | `string` | No | Rendered as `tel:` link (displayed as mobile) |
| `content.office_phone` | `string` | No | Office phone number |
| `content.fax` | `string` | No | Fax number |
| `content.address` | `string` | No | Street or postal address |
| `content.contact_building` | `string` | No | Building name or number |
| `content.contact_room` | `string` | No | Room identifier |
| `content.locations` | `string[]` | No | Location references rendered as `UniversalLink` items |

### Rendered sections

1. Profile image
2. Full name with academic title
3. Organisational units and department
4. Contact section (phone, fax, email, website) with SVG icons
5. Address section (locations, building, room)
6. Bio section (`content.text.data` via `dangerouslySetInnerHTML`)

### Notes

- `content.text.data` is rendered with `dangerouslySetInnerHTML` — ensure the backend sanitises HTML before delivery.
- The image field reads `scales.preview.download` first; falls back to `image.download`.
- Responsive SVG dividers are used for different breakpoints (desktop, tablet, mobile).

---

## PersonResultItem

**File:** `frontend/packages/kitconcept-intranet/src/components/SolrSearch/resultItems/PersonResultItem.jsx`

**Registration:**
```typescript
config.settings.solrSearchOptions.contentTypeSearchResultViews.Person = PersonResultItem;
config.settings.contentIcons.Person = personSVG;
```

### Props

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `item['@id']` | `string` | Yes | URL of the person |
| `item.title` | `string` | Yes | Display name |
| `item.extras.job_title` | `string` | No | Job title, shown below name |
| `item.extras.contact_phone` | `string` | No | Phone number with icon |
| `item.extras.contact_building` | `string` | No | Building with icon |
| `item.extras.contact_room` | `string` | No | Room appended to building |
| `item.extras.contact_email` | `string` | No | Email with icon |

Renders a 64×64 profile image (falls back to an avatar SVG), name, job title, and contact details. Profile links are wrapped in `MaybeWrap` and suppressed when `kitconcept.disable_profile_links` is enabled in the control panel.

---

## SearchTabs

**File:** `frontend/packages/kitconcept-intranet/src/components/SolrSearch/SearchTabs.jsx`

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `groupSelect` | `number` | Yes | Index of the active tab |
| `setGroupSelect` | `(index: number) => void` | Yes | Callback to change the active tab |
| `facetGroups` | `[label: string, counter: number][]` | Yes | Tab labels and result counts from SOLR |

Renders tab buttons (Pages, Events, Files, Images, News Items, Persons). Icons are pulled from `config.settings.contentIcons`. Tab click is suppressed when the result count is 0.

---

## See Also

- [Control Panel Settings](../../../reference/control-panel.md)
- [Person content type](../../../reference/content-types.md)
- [Configure search settings](../../../how-to-guides/settings/search-settings.md)
