---
myst:
  html_meta:
    description: "Configure search bar settings in the kitconcept Intranet control panel."
    keywords: "search, search settings, how-to, admin"
doc_type: how-to
audience: admin
last_updated: 2026-04-14
---

# Configure search settings

This guide shows you how to configure the search bar in the intranet header.

## Steps

### 1. Open the Intranet Settings control panel

Go to **Site Setup → Intranet Settings**.

### 2. Set an external search URL (optional)

By default, the header search bar takes users to the intranet's built-in search page. To redirect it to a different URL instead:

1. Enter the full URL in the **External Search URL** field.
2. Click **Save**.

Leave the field empty to keep using the built-in search.

### 3. Set the search bar placeholder text (optional)

To change the hint text shown inside the search bar:

1. Enter the text in the **Search Field Placeholder** field (e.g. *Search the intranet…*).
2. Click **Save**.

## Verification

To confirm your changes worked:

1. Go to any page on the intranet.
2. Check the header search bar — it should show the placeholder text you set.
3. Type a search term and press Enter — you should land on the URL you configured, or the built-in search page if no URL was set.

## Notes

SOLR-powered search is set up at the server level by a system administrator and does not have settings in this control panel.

## See also

- [Control Panel Settings](/reference/control-panel)
