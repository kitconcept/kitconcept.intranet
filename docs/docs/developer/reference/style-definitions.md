---
myst:
  html_meta:
    description: "Reference for the styleDefinitions registry and ColorSwatch widget in volto-light-theme."
    keywords: "styleDefinitions, styleWrapperStyleObjectEnhancer, ColorSwatch, themes, block styles, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-27
---

# styleDefinitions registry

## Overview

The `styleDefinitions` registry is a Volto utility system that maps block style field values to CSS custom property objects. Two utility enhancers are registered — `blockThemesEnhancer` and `styleDefinitionsEnhancer` — both of type `styleWrapperStyleObjectEnhancer`. They are called by the style wrapper mechanism to compute the inline `style` object applied to each block's container.

**Implementation:** `frontend/packages/volto-light-theme/frontend/packages/volto-light-theme/src/helpers/styleDefinitions.ts`

**Registration:** `frontend/packages/volto-light-theme/frontend/packages/volto-light-theme/src/config/blocks.tsx`

---

## Registered utilities

Both utilities are registered in `blocks.tsx`:

```typescript
config.registerUtility({
  name: 'blockThemesEnhancer',
  type: 'styleWrapperStyleObjectEnhancer',
  method: blockThemesEnhancer,
});

config.registerUtility({
  name: 'styleDefinitionsEnhancer',
  type: 'styleWrapperStyleObjectEnhancer',
  method: styleDefinitionsEnhancer,
});
```

### blockThemesEnhancer

**Signature:**
```typescript
blockThemesEnhancer({ data, container }): Record<string, string> | {}
```

Resolves the active theme for a block using the following logic (in order):

1. Returns `{}` immediately if `data['@type']` is missing or the block type has no registered config.
2. Looks up the block's style definitions from (in order): `blockConfig.themes` → `blockConfig.colors` → `config.blocks.themes`.
3. If `container.theme` is set and the block has no theme or its theme is `'default'`, returns the container's theme style.
4. If `data.theme` is set, returns the matching theme's style object.
5. If no theme is set at all, falls back to the `'default'` entry in `config.blocks.themes`.

### styleDefinitionsEnhancer

**Signature:**
```typescript
styleDefinitionsEnhancer({ data, container }): Record<string, string>
```

Iterates over `data.styles` (the block's style field values). For each field, it looks up a registered utility of type `'styleFieldDefinition'` by field name and calls it to produce CSS custom properties. All results are merged and returned.

---

## Registering global themes

Themes are registered on `config.blocks.themes` in `blocks.tsx`:

```typescript
config.blocks.themes = [
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
  // … more themes
];
```

Block widths follow the same pattern on `config.blocks.widths`.

---

## Notes

- `blockThemesEnhancer` returns `{}` when the block type is unknown or has no registered config — this is intentional to allow such blocks to render without inline styles.
- The `ColorSwatch` `colors` and `themes` props are mutually exclusive by TypeScript union type (`ColorsOnly | ThemesOnly`).

## See also

- [Colors reference](colors.md)
- [Frontend styleguide](frontend-styleguide.md)
- [Widgets reference](components/widgets.md) — includes the `ColorSwatch` widget used to select themes in the block sidebar
