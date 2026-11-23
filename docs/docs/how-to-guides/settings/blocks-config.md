---
myst:
  html_meta:
    description: "Configure which blocks are available for editors using the Blocks Configuration field in Site Setup."
    keywords: "blocks, configuration, TTW, through the web, site settings, admin"
doc_type: how-to
audience: admin
tags: [blocks, configuration, site-settings]
last_updated: 2026-11-23
---

# Configure blocks through the web

This guide shows you how to control which blocks are available to editors, and configure their themes and variations, using the Blocks Configuration field in Site Setup—no code deployment required.

## About this feature

This feature relies on the `kitconcept.blocks.config` behavior. It is enabled by default on the Plone Site for the kitconcept intranet distribution, but can also be enabled on a subsite.

You can configure:
- **Enabled blocks**—disable blocks you don't want editors to use
- **Themes of a block**—restrict or define available themes
- **Enabled variations of a block**—limit which block variations are available
- **Themes of all blocks at once**—define the themes every block offers, with the special `"*"` entry

## Steps

### 1. Open the Blocks Configuration field

Go to **Plone Site** tab and look for the **Blocks configuration** field.

```{image} /_static/images/ttwblocksconfig.png
:alt: Blocks configuration TTW screenshot
:width: 600px
:align: center
```

### 2. Edit the configuration

Click the field to open the JSON editor modal.

```{image} /_static/images/ttwconfigjsonfieldmodal.png
:alt: Blocks modal configuration TTW screenshot
:width: 600px
:align: center
```

### 3. Enter your configuration

The field accepts a JSON object. Use double quotes and no trailing commas (standard JSON).

**Example—disable a block and restrict variations:**

```json
{
  "teaser": {
    "disable": true
  },
  "gridBlock": {
    "variations": ["variationB"]
  },
  "description": {
    "disable": true
  }
}
```

**Example—set the themes of all blocks, and limit the Button block to one theme:**

```json
{
  "*": {
    "themes": [
      {
        "style": {
          "--theme-color": "#fff",
          "--theme-high-contrast-color": "#ecebeb",
          "--theme-foreground-color": "#000",
          "--theme-low-contrast-foreground-color": "#555555"
        },
        "name": "default",
        "label": "Default"
      },
      {
        "style": {
          "--theme-color": "#CFE7F9",
          "--theme-high-contrast-color": "#fff",
          "--theme-foreground-color": "#000",
          "--theme-low-contrast-foreground-color": "#333333"
        },
        "name": "light-blue",
        "label": "Light blue"
      }
    ]
  },
  "__button": {
    "themes": [
      {
        "style": {
          "--theme-color": "#fff",
          "--theme-high-contrast-color": "#ecebeb",
          "--theme-foreground-color": "#000",
          "--theme-low-contrast-foreground-color": "#555555"
        },
        "name": "default",
        "label": "Default"
      }
    ]
  }
}
```

A block's own `themes` entry takes precedence over the `"*"` entry.
Always include a theme named `default`, and don't remove or rename a theme that content already uses: blocks that use it lose their colors.

### 4. Save

The field validates JSON format and will show an error if the format is invalid. Save the form when done.

:::{note}
For the full DSL specification including TypeScript types and all available options, see the [Blocks Configuration TTW developer reference](/developer/how-to-guides/blocks-config-ttw).
:::
