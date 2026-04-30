---
myst:
  html_meta:
    description: "Reference for the SearchTabs component that renders tabbed navigation in the SOLR search UI."
    keywords: "SearchTabs, SOLR, search, tabs, developer, reference"
doc_type: reference
audience: developer
last_updated: 2026-04-27
---

# SearchTabs

**File:** `frontend/packages/kitconcept-intranet/src/components/SolrSearch/SearchTabs.jsx`

**Shadows:** `@kitconcept/volto-solr/components/theme/SolrSearch/SearchTabs` via `src/customizations/@kitconcept/volto-solr/components/theme/SolrSearch/SearchTabs.jsx` — the customization adds icons to each tab, which the upstream component does not have.

Renders tab buttons (Pages, Events, Files, Images, News Items, Persons) for navigating across content type groups in the SOLR search UI. Icons are pulled from `config.settings.contentIcons`. Tab click is suppressed when the result count is 0.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `groupSelect` | `number` | Yes | Index of the active tab |
| `setGroupSelect` | `(index: number) => void` | Yes | Callback to change the active tab |
| `facetGroups` | `[label: string, counter: number][]` | Yes | Tab labels and result counts from SOLR |

## See Also

- [PersonResultItem](person-result-item)
- [Configure search settings](../../../how-to-guides/settings/search-settings.md)
