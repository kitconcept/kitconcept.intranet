---
myst:
  html_meta:
    description: "Reference for the InheritedFieldWrapper higher-order component."
    keywords: "InheritedFieldWrapper, HOC, widget, inherited field, CLM, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-09
---

# InheritedFieldWrapper

## Overview

`InheritedFieldWrapper` is a higher-order component (HOC) that wraps a Volto form widget to display an inherited field value from a parent content object. When a field has no user-entered value but an inherited value exists, the wrapper appends inheritance information to the field's description and shows the inherited value with a link to the parent item.

**File:** `frontend/packages/kitconcept-intranet/src/components/widgets/InheritedFieldWrapper.jsx`

## API

```typescript
InheritedFieldWrapper(
  WrappedComponent: React.ComponentType,
  inheritedFieldFunction: (content: any, props: any) => any,
): React.ComponentType
```

| Argument | Type | Description |
|----------|------|-------------|
| `WrappedComponent` | `React.ComponentType` | The Volto widget to wrap (e.g. autocomplete widget) |
| `inheritedFieldFunction` | `(content, props) => any` | Extracts the inherited value from the content object |

The returned component accepts the same props as any Volto widget, plus:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Field ID, used for vocabulary and subrequest key |
| `title` | `string` | Yes | Field label |
| `description` | `string` | No | Field description — inheritance info is appended |
| `value` | `any` | No | Current user-entered value; if present, inheritance UI is suppressed |
| `widgetOptions.vocabulary['@id']` | `string` | No | Vocabulary base URL for resolving token display names |
| `inheritedField` | `boolean` | No | If `false`, suppresses the inherited value display |

## Usage

```typescript
// frontend/packages/kitconcept-intranet/src/config/widgets.ts
config.widgets.id.responsible_person = InheritedFieldWrapper(
  config.widgets.widget.autocomplete,
  (content, props) => content?.['@components']?.clm?.[props.id],
);
```

The `inheritedFieldFunction` receives the current `content` object and the widget `props`. It should return the raw inherited value (e.g. a vocabulary token) or `undefined`/`null` if there is nothing to inherit.

## Behaviour

1. Calls `inheritedFieldFunction(content, props)` to get the inherited value.
2. If a value exists and the field has no user-entered value:
   - Fetches the vocabulary entry for the token via a subrequest keyed `widget-${id}-${locale}`.
   - Appends to the field description: `Inherited [FieldTitle]: **[display name]** from the parent content: [parent link]`.
3. If `props.value` is present, the inherited display is skipped entirely — the field behaves normally.
4. Subrequest caching uses the locale to support multilingual sites.

## Notes

- Currently applied only to `responsible_person` (autocomplete widget).
- The `responsibilities` field uses a plain token widget without this wrapper.
- If the vocabulary display name cannot be resolved, the raw inherited value is shown as fallback.
- The CLM expander (`@components.clm`) must be included in the content response for the inherited value to be available.

## See Also

- [Person content type](../../../reference/content-types.md)
- [Widgets reference](widgets.md)
