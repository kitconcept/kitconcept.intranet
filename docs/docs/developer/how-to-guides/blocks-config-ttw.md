---
myst:
  html_meta:
    description: "Full DSL reference for configuring Volto blocks through the web using the kitconcept.blocks.config behavior."
    keywords: "blocks, configuration, TTW, mutator DSL, kitconcept.blocks.config, developer"
doc_type: how-to
audience: developer
last_updated: 2026-11-23
---

# Configure blocks through the web (TTW)

This document describes how to configure blocks TTW (through the web) in a Plone site or subsite, including the full mutator DSL specification.

This feature relies on the `kitconcept.blocks.config` behavior. It is enabled by default on the Plone Site for the kitconcept intranet distribution, but you can also enable it on a subsite.

## What can be configured

- **Enabled blocks**—disable blocks from appearing in the blocks chooser
- **Themes of a block**—define available StyleWrapper themes
- **Enabled variations of a block**—limit which variations editors can choose
- **Themes of all blocks at once**—define site-wide StyleWrapper themes with the reserved `"*"` key

These configurations are modeled through a **mutator field** in JSON format. The mutator definition is applied to the hardcoded blocks configuration, modifying default values with the instructions in the field.

## Accessing the configuration field

You find it in the **Plone Site** tab of the site or subsite settings, under the name **Blocks configuration**.

```{image} /_static/images/ttwblocksconfig.png
:alt: Blocks configuration TTW screenshot
:width: 600px
:align: center
```

A modal will open with the mutator field, where you can define the configuration in JSON format.

```{image} /_static/images/ttwconfigjsonfieldmodal.png
:alt: Blocks modal configuration TTW screenshot
:width: 600px
:align: center
```

The field validates JSON format, and will show an error if the format is invalid. All keys must use double quotes, and no trailing commas, as per the JSON standard.

## The mutator field DSL

The mutator field is stored in `blocks_config_mutator` on the `kitconcept.blocks.config` behavior.

### TypeScript type definition

```ts
export type BlockMutator = {
  disable?: boolean;
  variations?: string[];
  themes?: StyleDefinition[];
  // Plus the keys the block lists in its `ttwConfigurable` config
  [key: string]: unknown;
};

export type GlobalMutator = {
  themes?: StyleDefinition[];
};

export type MutatorDSL = {
  '*'?: GlobalMutator;
} & Record<string, BlockMutator | undefined>;
```

Where:
- `disable`—If `true`, the block is disabled and not available in the blocks chooser.
- `variations`—Array of variation IDs to enable. If omitted, all variations are enabled.
- `themes`—Array of style definitions for the block's themes. If omitted, default themes are used.

### Full example

```json
{
  "teaser": {
    "disable": true,
    "variations": ["variation1", "variation2"],
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
  },
  "gridBlock": {
    "variations": ["variationB"]
  },
  "description": {
    "disable": true
  }
}
```

This mutator will:
- Disable the `teaser` block from the blocks chooser.
- Enable only `variation1` and `variation2` for the `teaser` block.
- Define a custom theme for the `teaser` block with specific CSS properties.
- Enable only the `variationB` variation for the `gridBlock`.
- Disable the `description` block from the blocks chooser.

## Site-wide themes

The reserved `"*"` key sets the themes of all blocks at once.
It only supports `themes`, and any other key in it is ignored with a warning in the browser console.

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

The settings are applied in this order, and a later step takes precedence over an earlier one:

1. The blocks configuration from code.
2. The `"*"` themes. They replace `config.blocks.themes`, which blocks without their own themes fall back to. Blocks whose themes in code are a copy of `config.blocks.themes` get them too. Blocks with their own palette in code keep it.
3. The block's own entry. In the example above, the Button block only offers the `default` theme, and all other blocks offer both themes.

Keep these points in mind:

- Include a theme named `default`. Blocks without a selected theme fall back to it. Without it, they are shown without theme colors, and a warning is shown in the browser console.
- Content stores the name of the selected theme. If you remove or rename a theme, blocks that use it lose their colors without any error.
- Blocks inside a Grid block inherit the theme of the Grid by its name. If a block's own `themes` entry leaves out names of the site-wide themes, that block cannot inherit them.

## Other keys a block allows

A block can allow more keys of its config to be changed through the web, by listing them in `ttwConfigurable` with the type their value must have:

```ts
config.blocks.blocksConfig.slider.ttwConfigurable = {
  flagColors: 'styleDefinitions',
};
```

The Highlight and Slider blocks use this for their own color lists, which they keep outside `themes`:

| Block | Key | CSS custom properties |
|---|---|---|
| Highlight (`highlight`) | `descriptionColors` | `--descriptionColor`, `--descriptionColor-foreground` |
| Slider (`slider`) | `flagColors` | `--flagColor`, `--flagColor-foreground` |

```json
{
  "highlight": {
    "descriptionColors": [
      {
        "style": {
          "--descriptionColor": "#00678B",
          "--descriptionColor-foreground": "#fff"
        },
        "name": "highlight-custom-color-1",
        "label": "DLR blue"
      }
    ]
  },
  "slider": {
    "flagColors": [
      {
        "style": {
          "--flagColor": "#00678B",
          "--flagColor-foreground": "#fff"
        },
        "name": "slider-custom-color-1",
        "label": "DLR blue"
      }
    ]
  }
}
```

The `"*"` themes don't change these lists.

Any other key in a block entry is ignored, with a warning in the browser console.
This also applies to a key the block allows if its value in code is a function, and to `__proto__`, `constructor`, `prototype` and `ttwConfigurable` themselves.
So the configuration can't replace a block's components, schema or icon.

### Value types

| Type | Value |
|---|---|
| `styleDefinitions` | A non-empty list of style definitions, as used by `themes` |

All theme lists and allowed values are checked before they are applied, and an invalid value is ignored with a warning.
A style definition needs a string `name` and `label`, and a `style` object that only sets CSS custom properties (names starting with `--`).
Their values must be strings or numbers, and must not contain `;`, `{`, `}`, `<`, `>`, `\`, `url(`, `image-set(`, `@import` or `expression(`.
So the configuration can't add other CSS, load outside resources, or break out of the page's styles.

Keep these points in mind for the Highlight and Slider lists:

- New blocks get the first color of the Highlight list, and the color named `slider-custom-color-1` of the Slider list. Keep a color with that name in the Slider list.
- Content stores the name of the selected color. If you remove or rename a color, blocks that use it lose their colors without any error. To change the colors of existing blocks, keep their names and change the values.
- They need versions of `@kitconcept/volto-highlight-block` and `@kitconcept/volto-slider-block` that list them in `ttwConfigurable` and read them from the blocks configuration when rendering the page.

## How the configuration is applied

The configuration is merged onto the blocks configuration from code every time it changes, never onto a previous result.
When you navigate to content without a blocks configuration, the configuration from code is restored.
So the settings of a site or subsite do not stay active after you leave it.

## See Also

- [Admin guide: Configure blocks through the web](/how-to-guides/settings/blocks-config)
