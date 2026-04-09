---
myst:
  html_meta:
    description: "Reference for the smartTextRenderer helper for rendering markdown links in plain text fields."
    keywords: "smartTextRenderer, markdown links, text renderer, helper, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-09
---

# smartTextRenderer

## Overview

`smartTextRenderer` converts a plain-text string that may contain Markdown-style links (`[text](href)`) into React nodes. Non-link text and newlines are also handled. It is used to support lightweight link authoring in content fields that do not use a rich-text editor (e.g. the `description` field on `Person` items).

**File:** `frontend/packages/volto-light-theme/src/helpers/smartText.tsx`

---

## API

```typescript
smartTextRenderer(smartText: string | null | undefined): React.ReactNode
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `smartText` | `string \| null \| undefined` | Input text, possibly containing Markdown links |

**Returns:** A React node (or array of nodes), or `null` if the input is empty, null, or undefined.

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
import { smartTextRenderer } from '@kitconcept/volto-light-theme/helpers/smartText';

// In PersonSummary:
<p className="description">{smartTextRenderer(item.description)}</p>
```

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

- Links are rendered using Volto's `UniversalLink` component, which handles both internal and external URLs correctly.
- The function is stateless and safe to call on every render.
- Test coverage is in `src/helpers/smartText.test.tsx`.

## See Also

- [PersonSummary](../components/person-summary.md)
