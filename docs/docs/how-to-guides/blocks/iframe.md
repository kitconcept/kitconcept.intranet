---
myst:
  html_meta:
    description: "How to embed external content on a page using the IFrame block."
    keywords: "iframe, embed, external content, block, how-to, editor"
doc_type: how-to
audience: editor
last_updated: 2026-04-27
---

# Use the IFrame block

The IFrame block lets you embed external web content—such as dashboards, maps, videos, or third-party tools—directly inside an intranet page. The block renders the external page inside an inline frame (`<iframe>`).

## Prerequisites

- You have Editor or Manager access to the page.
- The domain of the content you want to embed has been added to the allowed-domains list by an administrator. See [How to Configure Allowed iFrame Domains](/how-to-guides/settings/iframe-domains).

:::{warning}
For security reasons, only domains explicitly allowed by an administrator can be embedded. If you try to embed a URL from a domain that is not on the allow-list, the block will show an error. Contact your site administrator to request a new domain.
:::

## Adding the IFrame Block

1. Open the page in **edit mode**.
2. Click the **+** button to open the block chooser.
3. Search for **IFrame** and click it to insert the block.

## Configuring the IFrame

### Setting the URL

1. When you add the IFrame block, an input field appears inline asking for a URL. Paste the full URL of the page you want to embed (including `https://`). The block will attempt to load a preview as soon as the URL is valid.
2. To change the URL later, edit the URL field on the sidebar. The preview reloads automatically as you type.

### Adjusting the Size

| Option | Description |
|--------|-------------|
| **Height** | Fixed pixel height of the iframe (e.g. `600`). Defaults to `400px`. |
| **Width** | Set to `100%` (default) to fill the available column width, or enter a fixed pixel value. |

:::{tip}
For dashboards and interactive tools, a height of 700–900 px usually works well. For forms or simple pages, 400–500 px is often sufficient.
:::

### Accessibility Options

| Option | Description |
|--------|-------------|
| **Title / Label** | A descriptive title for screen readers. Required for accessibility. Example: `"Project status dashboard"`. |

## Saving and Previewing

1. After entering the URL and adjusting settings, click **Save** on the page.
2. The iframe will render the external content in both edit mode and view mode.

## Troubleshooting

**The iframe shows a blank page or an error.**
The embedded site may be sending an `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none'` header, which prevents it from being displayed inside an iframe. This is a restriction set by the external site and cannot be bypassed.

**My URL is not loading and I see "Domain not allowed".**
The domain is not on the allow-list. Ask your site administrator to add it under [iFrame domain settings](/how-to-guides/settings/iframe-domains).

**The content is cut off at the bottom.**
Increase the **Height** value in the block settings.

## See Also

- [How to Configure Allowed iFrame Domains](/how-to-guides/settings/iframe-domains)
- [Control Panel Settings](/reference/control-panel)
