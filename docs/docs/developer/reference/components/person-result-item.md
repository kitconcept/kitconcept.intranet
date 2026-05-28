---
myst:
  html_meta:
    description: "Reference for the PersonResultItem component that renders Person cards in SOLR search results."
    keywords: "PersonResultItem, Person, SOLR, search, developer, reference"
doc_type: reference
audience: developer
last_updated: 2026-04-09
---

# PersonResultItem

**File:** `frontend/packages/kitconcept-intranet/src/components/SolrSearch/resultItems/PersonResultItem.jsx`

**Registration:**
```typescript
config.settings.solrSearchOptions.contentTypeSearchResultViews.Person = PersonResultItem;
config.settings.contentIcons.Person = personSVG;
```

Renders a compact card for a `Person` item in SOLR search results. Displays a 64×64 profile image (falls back to an avatar SVG), name, job title, and contact details. Profile links are wrapped in `MaybeWrap` and suppressed when `kitconcept.disable_profile_links` is enabled in the control panel.

## Props

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `item['@id']` | `string` | Yes | URL of the person |
| `item.title` | `string` | Yes | Display name |
| `item.extras.job_title` | `string` | No | Job title, shown below name |
| `item.extras.contact_phone` | `string` | No | Phone number with icon |
| `item.extras.contact_building` | `string` | No | Building with icon |
| `item.extras.contact_room` | `string` | No | Room appended to building |
| `item.extras.contact_email` | `string` | No | Email with icon |

## See Also

- [SearchTabs](search-tabs)
- [PersonView](person-view)
- [Configure search settings](../../../how-to-guides/settings/search-settings.md)
- [Control Panel Settings](../../../reference/control-panel.md)
