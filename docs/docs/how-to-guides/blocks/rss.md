---
myst:
  html_meta:
    description: "How to display RSS feed content on a page using the RSS block."
    keywords: "RSS, feed, news, block, how-to, editor"
doc_type: how-to
audience: editor
last_updated: 2026-04-27
---

# Use the RSS block

The RSS block fetches and displays items from an external RSS or Atom feed directly on an intranet page. It is useful for showing news from external sources, partner organisations, or industry feeds without leaving the intranet.

## Prerequisites

- You have Editor or Manager access to the page.
- You have the URL of the RSS feed you want to display.
- The feed URL's domain may need to be reachable from the Plone backend server (ask your administrator if you are unsure).

## Adding the RSS Block

1. Open the page in **edit mode**.
2. Click the **+** button to open the block chooser.
3. Search for **RSS** and click it.

## Configuring the RSS Block

### Entering the Feed URL

1. In the sidebar, paste the full URL of the RSS or Atom feed (e.g. `https://feeds.feedburner.com/ConservationInternationalBlog/ClimateChange`).
2. The block will fetch and preview the feed items.

## See Also

- [IFrame Block](/how-to-guides/blocks/iframe)
- [Blocks configuration](/how-to-guides/settings/blocks-config)
