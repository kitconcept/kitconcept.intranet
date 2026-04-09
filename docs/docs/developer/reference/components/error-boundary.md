---
myst:
  html_meta:
    description: "Reference for the recoverable ErrorBoundary component used in block rendering."
    keywords: "ErrorBoundary, error boundary, blocks, recoverable, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-09
---

# ErrorBoundary (Recoverable Block Error Boundary)

## Overview

`ErrorBoundary` is a Redux-connected React class component that wraps individual blocks during rendering. When a block throws an error, the boundary catches it and displays a fallback UI instead of crashing the entire page. The boundary **automatically recovers** when the user modifies the block structure in edit mode — allowing editors to fix a broken block without a page reload.

**File:** `frontend/packages/volto-light-theme/src/components/Blocks/Block/ErrorBoundary.tsx`

---

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | No | Human-readable block name shown in the error UI |
| `block` | `string` | No | Block UID, used for identification |
| `type` | `string` | No | Block type identifier |
| `isEdit` | `boolean` | No | Whether the page is in edit mode |
| `children` | `ReactNode` | No | The block component to render |

### Redux state (injected via `connect`)

| State path | Description |
|------------|-------------|
| `state.form.global.blocks` | Current blocks map — changes trigger error reset |
| `state.form.global.blocks_layout` | Current layout — changes trigger error reset |
| `state.form.global.title` | Page title — changes trigger error reset |

---

## Behaviour

### Error capture

`getDerivedStateFromError()` sets `hasError: true` when a descendant throws. `componentDidCatch()` logs the error and error info to the browser console. No external error reporting is performed.

### Automatic recovery

`componentDidUpdate()` compares the current `blocks`, `blocksLayout`, and `title` props against the previous values. If any of them changed, `hasError` is reset to `false` and the block re-renders normally. This allows an editor to:

1. See the error fallback UI.
2. Delete or modify the broken block.
3. Watch the error clear automatically — no reload required.

### Fallback UI

When `hasError` is true, the `ErrorBoundaryMessage` component is rendered. It displays the block `name`, `type`, and a note about edit mode.

---

## Notes

- Recovery only works in edit mode because `blocks` and `blocksLayout` state only changes during editing.
- In view mode, the error boundary catches the error and holds the fallback UI until the page is reloaded or navigated away from.
- Console errors are not suppressed — they remain visible in developer tools.

## Missing or unclear

- The exact registration point where `ErrorBoundary` wraps each block (the HOC or block engine integration) was not confirmed from the component file alone.

## See Also

- [Blocks configuration](../../how-to-guides/blocks-config-ttw.md)
