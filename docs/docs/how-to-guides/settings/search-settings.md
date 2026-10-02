---
myst:
  html_meta:
    description: "Configure search bar settings in the kitconcept Intranet control panel."
    keywords: "search, search settings, how-to, admin"
doc_type: how-to
audience: admin
last_updated: 2026-10-02
---

# Configure search settings

This guide shows you how to configure the search bar in the intranet header.

## Steps

### 1. Open the Intranet Settings control panel

Go to **Site Setup → Intranet Settings**.

### 2. Set an external search URL (optional)

By default, the header search bar opens the intranet's search dialog. To send searches to a different URL instead:

1. Enter the full URL in the **External Search URL** field.
2. Click **Save**.

With a URL set, the header shows a plain search field instead of opening the dialog. Leave the field empty to keep using the built-in search.

### 3. Set the search bar placeholder text (optional)

To change the hint text shown inside the search bar:

1. Enter the text in the **Search Field Placeholder** field (for example *Search the intranet…*).
2. Click **Save**.

## Verification

To confirm your changes worked:

1. Go to any page on the intranet.
2. Check the header search bar—it should show the placeholder text you set.
3. If you set a URL, type a search term and press Enter—the URL you configured should open in a new tab. If no URL was set, click the search bar—the search dialog should open.

## Notes

SOLR-powered search is set up at the server level by a system administrator and doesn't have settings in this control panel.

## See also

- [Control Panel Settings](/reference/control-panel)
