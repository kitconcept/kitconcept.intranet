---
myst:
  html_meta:
    description: "Reference for the smartTextRenderer helper for rendering markdown links in plain text fields."
    keywords: "smartTextRenderer, markdown links, text renderer, helper, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-27
---

# smartTextRenderer

`smartTextRenderer` converts a plain-text string that may contain Markdown-style links (`[text](href)`) into React nodes. Non-link text and newlines are also handled. It is used to support lightweight link authoring in content fields that do not use a rich-text editor.

**File:** `frontend/packages/volto-light-theme/frontend/packages/volto-light-theme/src/helpers/smartText.tsx`

---

## API

```js
smartTextRenderer(smartText)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `smartText` | `string`, `null`, or `undefined` | Input text, possibly containing Markdown links |

**Returns:** An array of React nodes, or `null` if the input is falsy (`null`, `undefined`, or `""`).

---

## Behaviour

| Input pattern | Output |
|---------------|--------|
| `null` / `undefined` / `""` | `null` |
| Plain text | Text node |
| `[label](href)` | `<UniversalLink href={href}>label</UniversalLink>` |
| Text before/after a link | Mixed text nodes and link elements |
| Multiple links in one string | All links and surrounding text nodes |
| `\n`, `\r\n`, `\r` | `<br />` element |
| `[text]` without `(href)` | Rendered as literal text — not treated as a link |

Whitespace around link text and href is trimmed automatically.

---

## Usage

```tsx
import { smartTextRenderer } from '../../helpers/smartText';

<p className="description">{smartTextRenderer(item.description)}</p>
```

Used in: `DefaultSummary`, `NewsItemSummary`, `EventSummary`, `FileSummary`, and `PersonSummary`.

---

## Examples

```text
Input:  "Contact [Jane Smith](mailto:jane@example.com) for details."
Output: "Contact " + <UniversalLink href="mailto:jane@example.com">Jane Smith</UniversalLink> + " for details."
```

```text
Input:  "Line one\nLine two"
Output: "Line one" + <br /> + "Line two"
```

```text
Input:  "[not a link] some text"
Output: "[not a link] some text"  (no href — rendered as plain text)
```

---

## Notes

- The Markdown link regex uses the `/g` flag, which is stateful. `linkPattern.lastIndex` is reset to `0` on every call — without this, repeated calls on different strings would produce incorrect results.
- Links are rendered using Volto's `UniversalLink` component, which handles both internal and external URLs correctly.
- The function is stateless and safe to call on every render.
- Test coverage is in `src/helpers/smartText.test.tsx`.

## See also

- [PersonSummary](../components/person-summary.md)
