---
myst:
  html_meta:
    description: "Configure SOLR search and search tab settings in the kitconcept Intranet."
    keywords: "SOLR, search, volto-solr, search tabs, search settings, how-to, admin"
doc_type: how-to
audience: admin
last_updated: 2026-04-09
---

# Configure search settings

## Goal

Enable and configure SOLR-powered search for the kitconcept Intranet, including tabbed search results grouped by content type.

## Prerequisites

- A running SOLR instance is available and indexed with your Plone content.
- The `volto-solr` add-on is included in your frontend configuration (it is bundled by default in kitconcept-intranet).
- The backend `collective.solr` (or equivalent) package is installed and configured.

## Steps

### 1. Enable SOLR search

`volto-solr` is bundled as a dependency of `@kitconcept/intranet` and registered automatically when the intranet add-on is loaded. No additional frontend configuration is required for basic SOLR search.

Verify the SOLR endpoint is reachable from the backend by checking the Plone control panel at **Site Setup → SOLR**.

### 2. Configure custom search result views per content type

By default, SOLR search results use a generic card layout. You can register a custom result component for any content type by setting it in `solrSearchOptions.contentTypeSearchResultViews` and providing a matching icon in `contentIcons`:

```typescript
config.settings.solrSearchOptions.contentTypeSearchResultViews.MyType = MyTypeResultItem;
config.settings.contentIcons.MyType = myTypeSVG;
```

For example, the intranet registers a dedicated compact card for `Person` content automatically:

```typescript
config.settings.solrSearchOptions.contentTypeSearchResultViews.Person = PersonResultItem;
config.settings.contentIcons.Person = personSVG;
```

No additional configuration is needed unless you want to override an existing result card.

### 3. Control Person profile links in search results

By default, person names in search results link to the person's profile page. To disable these links site-wide:

1. Go to **Site Setup → kitconcept Intranet Settings**.
2. Enable **Disable profile links**.
3. Save.

Once enabled, person names in `PersonResultItem` are rendered as plain text without hyperlinks.

### 4. Search tabs

The `SearchTabs` component displays tabbed navigation in the SOLR search UI, grouping results by content type. Tabs are driven by the `facetGroups` returned by SOLR — they appear automatically for any content type that has results. No separate configuration is required.

## Verification

1. Open the search page (`/search` or the intranet search route).
2. Perform a search that returns results for multiple content types.
3. Confirm tabs appear for Pages, Events, Files, Images, News Items, and Persons.
4. Confirm that person result cards show image, name, job title, and contact details.

## Notes

- SOLR indexes must include the `extras` fields (`job_title`, `contact_phone`, `contact_building`, `contact_room`, `contact_email`) for the `PersonResultItem` to display contact details.
- If SOLR is not reachable, the frontend falls back to the standard Plone search.

```{note}
Exact SOLR schema field mappings for the `extras` object require confirmation from the backend SOLR configuration.
```

## See Also

- [Person View component](../../developer/reference/components/person-view.md)
- [Control Panel Settings](../../reference/control-panel.md)
