---
myst:
  html_meta:
    description: "Reference for the InheritedFieldWrapper higher-order component."
    keywords: "InheritedFieldWrapper, HOC, widget, inherited field, CLM, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-27
---

# InheritedFieldWrapper

`InheritedFieldWrapper` is a higher-order component (HOC) that wraps a Volto form widget to display an inherited field value from a parent content object. When a field has no user-entered value but an inherited value exists, the wrapper replaces the field's `description` prop with a JSX element that prepends the inherited value information above the original description text.

**File:** `frontend/packages/kitconcept-intranet/src/components/widgets/InheritedFieldWrapper.jsx`

## API

```typescript
InheritedFieldWrapper(
  WrappedComponent: React.ComponentType,
  inheritedFieldFunction: (content: any, props: any) => { value: string; url: string } | undefined,
): React.ComponentType
```

| Argument | Type | Description |
|----------|------|-------------|
| `WrappedComponent` | `React.ComponentType` | The Volto widget to wrap (e.g. autocomplete widget) |
| `inheritedFieldFunction` | `(content, props) => { value: string; url: string } \| undefined` | Extracts the inherited value and parent URL from the content object. Return `undefined` or `null` when there is nothing to inherit |

The returned component accepts the same props as any Volto widget, plus:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Field ID; used for the vocabulary subrequest key |
| `title` | `string` | Yes | Field label; used in the inherited value display |
| `description` | `string` | No | Original field description; shown below the inherited value info when inheritance is active |
| `value` | `any` | No | Current user-entered value; if present, inheritance UI is suppressed |
| `widgetOptions.vocabulary['@id']` | `string` | No | Vocabulary base URL for resolving token display names |
| `inheritedField` | `boolean` | No | If `false`, suppresses the inherited value display entirely |

## Usage

```typescript
// frontend/packages/kitconcept-intranet/src/config/widgets.ts
config.widgets.id.responsible_person = InheritedFieldWrapper(
  config.widgets.widget.autocomplete,
  (content, props) => content?.['@components']?.clm?.[props.id],
);
```

The `inheritedFieldFunction` receives the current `content` object and the widget `props`. It must return `{ value: string, url: string }` where `value` is the vocabulary token and `url` is the URL of the parent content item, or `undefined`/`null` if there is nothing to inherit.

## Behaviour

1. Calls `inheritedFieldFunction(content, props)` to get the inherited value.
2. If `props.inheritedField` is truthy, an inherited value exists, and `props.value` is empty:
   - Fetches the vocabulary display name for the token via a subrequest keyed `widget-${id}-${locale}`.
   - Replaces the `description` prop with a JSX element showing (in order):
     - `Inherited {title}:` followed by the bold display name (falls back to raw token if unresolved)
     - `from the parent content:` followed by a link to `inheritedField.url`
     - The original `props.description` text
3. If `props.value` is present, the wrapper renders `WrappedComponent` with its original props unchanged.
4. Subrequest caching uses the locale (`props.intl.locale`) to support multilingual sites.

## Notes

- Currently applied only to `responsible_person` (autocomplete widget).
- The `responsibilities` field uses `config.widgets.widget.token` directly, without this wrapper.
- If the vocabulary display name cannot be resolved, the raw `inheritedField.value` token is shown as fallback.
- The CLM expander (`@components.clm`) must be present in the content response for the inherited value to be available.

## See also

- [Widgets reference](widgets.md)
