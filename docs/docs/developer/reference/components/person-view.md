---
myst:
  html_meta:
    description: "Reference for the PersonView component that renders the Person detail page."
    keywords: "PersonView, Person, developer, reference"
doc_type: reference
audience: developer
last_updated: 2026-04-09
---

# PersonView

**File:** `frontend/packages/kitconcept-intranet/src/components/theme/PersonView.tsx`

**Registration:**
```typescript
config.views.contentTypesViews.Person = PersonView;
```

Renders the full detail page for a `Person` content item.

## Props

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

## Rendered sections

1. Profile image
2. Full name with academic title
3. Organisational units and department
4. Contact section (phone, fax, email, website) with SVG icons
5. Address section (locations, building, room)
6. Bio section (`content.text.data` via `dangerouslySetInnerHTML`)

## Notes

- `content.text.data` is rendered with `dangerouslySetInnerHTML` — ensure the backend sanitises HTML before delivery.
- The image field reads `scales.preview.download` first; falls back to `image.download`.
- Responsive SVG dividers are used for different breakpoints (desktop, tablet, mobile).

## See Also

- [PersonResultItem](person-result-item)
- [Person content type](../../../reference/content-types.md)
- [Control Panel Settings](../../../reference/control-panel.md)
