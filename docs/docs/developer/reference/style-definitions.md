---
myst:
  html_meta:
    description: "Reference for the styleDefinitions registry and ColorSwatch widget in volto-light-theme."
    keywords: "styleDefinitions, styleWrapperStyleObjectEnhancer, ColorSwatch, themes, block styles, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-09
---

# styleDefinitions Registry

## Overview

The `styleDefinitions` registry is a Volto utility system that maps block style field values to CSS custom property objects. Two utility enhancers are registered — `blockThemesEnhancer` and `styleDefinitionsEnhancer` — both of type `styleWrapperStyleObjectEnhancer`. They are called by the style wrapper mechanism to compute the inline `style` object applied to each block's container.

**File:** `frontend/packages/volto-light-theme/src/helpers/styleDefinitions.ts`

---

## Registered utilities

### blockThemesEnhancer

```typescript
config.registerUtility({
  name: 'blockThemesEnhancer',
  type: 'styleWrapperStyleObjectEnhancer',
  method: blockThemesEnhancer,
});
```

**Signature:**
```typescript
blockThemesEnhancer({ data, container }): Record<string, string> | {}
```

Resolves the active theme for the block from `data.theme`, then looks up the theme definition in (in order):
1. `blockConfig.themes`
2. `blockConfig.colors`
3. `config.blocks.themes` (global fallback)

Returns the theme's `style` object, which contains CSS custom properties such as `--theme-color`, `--theme-high-contrast-color`, `--theme-foreground-color`. Returns `{}` if no matching theme is found.

---

### styleDefinitionsEnhancer

```typescript
config.registerUtility({
  name: 'styleDefinitionsEnhancer',
  type: 'styleWrapperStyleObjectEnhancer',
  method: styleDefinitionsEnhancer,
});
```

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
    },
    name: 'default',
    label: 'Default',
  },
  // … more themes
];
```

Block widths follow the same pattern on `config.blocks.widths`.

---

## ColorSwatch widget

**File:** `frontend/packages/volto-light-theme/src/components/Widgets/ColorSwatch.tsx`

The `ColorSwatch` widget renders a horizontal radio group of coloured swatches, used in the block sidebar to let editors pick a theme or colour.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Field ID |
| `title` | `string` | Yes | Field label |
| `label` | `string` | Yes | Accessible label |
| `onChange` | `(id, value) => void` | Yes | Change callback |
| `colors` | `StyleDefinition[]` | No* | Array of colour definitions (mutually exclusive with `themes`) |
| `themes` | `StyleDefinition[]` | No* | Array of theme definitions (mutually exclusive with `colors`) |
| `value` | `string` | No | Currently selected value |
| `default` | `string` | No | Default value if none is selected |
| `required` | `boolean` | No | Whether selection is required |
| `disabled` / `isDisabled` | `boolean` | No | Disables the widget |

\* Exactly one of `colors` or `themes` must be provided.

### Behaviour

- Uses React Aria Components (`Radio`, `RadioGroup`, `Tooltip`) for full accessibility.
- Selection priority: current `value` → `default` prop → theme named `'default'` → first entry in the list.
- Each swatch applies the theme's `style` object directly as `style` on the swatch `div`, so the preview reflects the actual CSS custom properties.
- A tooltip shows the theme label on hover.

---

## Notes

- `blockThemesEnhancer` returns `{}` (not an error) when the block type is unknown — this is intentional to allow blocks without registered themes to render without inline styles.
- The `ColorSwatch` `colors` and `themes` props are mutually exclusive by TypeScript type — passing both is a type error.

## See Also

- [Colors reference](colors.md)
- [Frontend styleguide](frontend-styleguide.md)
- [Widgets reference](components/widgets.md)
