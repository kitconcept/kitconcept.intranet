---
myst:
  html_meta:
    description: "How to display RSS feed content on a page using the RSS block."
    keywords: "RSS, feed, news, block, how-to, editor"
doc_type: how-to
audience: editor
last_updated: 2026-04-08
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

1. In the sidebar, paste the full URL of the RSS or Atom feed (e.g. `https://example.com/news/rss.xml`).
2. The block will fetch and preview the feed items.

:::{tip}
Most news websites and blogs publish an RSS feed. Common paths are `/feed`, `/rss`, `/rss.xml`, or `/atom.xml`. Check the website's footer or source for a feed link icon.
:::

### Display Options

| Option | Description |
|--------|-------------|
| **Title** | Optional heading shown above the feed items |
| **Number of items** | How many feed entries to display (default: 5) |
| **Show description** | Toggle the summary/description text beneath each item title |
| **Show publication date** | Toggle the published date for each item |
| **Show source link** | Show a "Read more" link that opens the original article |
| **Open links in new tab** | Whether item links open in the current tab or a new one |

### Block Styles

The RSS block supports visual style variations to match different design contexts:

| Style | Description |
|-------|-------------|
| **Default** | Clean list layout with title, date, and optional description |
| **Compact** | Title-only list, suitable for sidebars or narrow columns |
| **Cards** | Each feed item is displayed as a card with an image (when available in the feed) |
| **Highlighted** | The first item is prominently featured; remaining items appear in a compact list below |

To change the style, select the block and open the **Style** tab in the sidebar, then pick one of the available options.

## Refreshing Feed Content

Feed content is fetched when the page loads. If the feed has been updated and you want to show the latest items without waiting for the cache to expire, click the **Refresh** button in the block toolbar (visible in edit mode).

:::{note}
Feed results are cached on the server to avoid excessive external requests. By default, the cache expires after 10 minutes. Ask your administrator if you need a shorter or longer cache interval.
:::

## Example: Showing Industry News in a Sidebar Column

1. Open your page in edit mode.
2. Add a two-column **Grid** block.
3. In the narrow column, add an **RSS** block.
4. Enter the feed URL for your industry news source.
5. Set **Number of items** to `5`, enable **Show publication date**, disable **Show description**.
6. Select the **Compact** style.
7. Click **Save**.

## Troubleshooting

**The block shows "Could not load feed" or no items.**
Check that the feed URL is correct and that the Plone backend server can reach it. Some feeds require authentication or are restricted to specific IP ranges.

**Items are outdated.**
The feed is being served from cache. Click **Refresh** in edit mode or wait for the cache interval to expire.

**Special characters appear garbled.**
The feed may not be declaring the correct encoding. Contact your site administrator.

## See Also

- [IFrame Block](/how-to-guides/blocks/iframe)
- [Blocks configuration](/how-to-guides/settings/blocks-config)
