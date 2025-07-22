---
myst:
  html_meta:
    "description": "Blocks configuration Trough the Web (TTW)"
    "property=og:description": "Blocks configuration Trough the Web (TTW)"
    "property=og:title": "Blocks configuration Trough the Web (TTW)"
    "keywords": "kitconcept Intranet Distribution, blocks configuration, TTW"
---

# Blocks configuration Trough the Web (TTW)

This document describes how to configure blocks TTW (through the web) in a Plone site or subsite.

This is a feature that relies on the `kitconcept.blocks.config` behavior to be enabled on the Plone site or subsite.
This behavior have a field that allows you to define some aspects of the default (hardcoded in the configuration object) blocks configuration.

These are the things that you can configure TTW:
- Enabled blocks
- Themes of a block
- Enabled variations of a block

These configurations are modeled through the definition of a mutator field in JSON format.
The mutator definition will be applied to the hardcoded blocks configuration, modifying the default values with the instructions contained in the mutator field.

## Enabling the behavior

The behavior is enabled by default on the Plone site for the kitconcept intranet distribution, but you can also enable it on a subsite.

## The mutator field DSL

You define the configuration in a JSON format, which is stored in the `blocks_config_mutator` field of the `kitconcept.blocks.config` behavior.

The mutator field is a JSON object that contains the block id that you want to configure, and the configuration options that you want to apply to that block.

This is the shape of the mutator field:
```ts
export type MutatorDSL = Record<
  string,
  {
    disable?: boolean;
    variations?: string[];
    themes?: StyleDefinition[];
  }
>;
```

Where:
- `disable`: If set to `true`, the block will be disabled and not available in the blocks chooser.
- `variations`: An array of strings that defines the enabled variations for the block. If not defined, all variations are enabled.
- `themes`: An array of style definitions that defines the themes for the block. If not defined, the block will use the default themes.

Given this mutator field, the blocks configuration:

```ts
const mutator = {
  teaser: {
    disable: true,
    variations: ['variation1', 'variation2'],
    themes: [
      {
        style: {
          '--theme-color': '#fff',
          '--theme-high-contrast-color': '#ecebeb',
          '--theme-foreground-color': '#000',
          '--theme-low-contrast-foreground-color': '#555555',
        },
        name: 'default',
        label: 'Default',
      },
    ],
  },
  gridBlock: {
    variations: ['variationB'],
  },
  description: {
    disable: true,
  },
};
```

This mutator will:
- Disable the `teaser` block, so it won't be available in the blocks chooser.
- Enable only the `variation1` and `variation2` variations for the `teaser` block.
- Define a custom theme for the `teaser` block with specific styles.
- Enable only the `variationB` variation for the `gridBlock`.
- Disable the `description` block, so it won't be available in the blocks chooser.
