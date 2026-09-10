---
myst:
  html_meta:
    description: "Wiki Editor feature — the Plate-powered rich-text editor for Wiki Pages, with links, images, mentions, dates, comments, and suggested changes."
    keywords: "wiki editor, plate, rich text, editor, mentions, suggestions, comments, links, images, v3"
doc_type: feature
audience: user
status: draft
last_updated: 2026-09-07
---

# Wiki Editor

:::{admonition} Feature summary
:class: note

**Status:** v3 · Core (editing) with Provisional areas (mentions, dates,
discussions/suggestions) · **Audience:** editors ·
**Interim source of truth** — canonical spec will move to the intranet.
:::

## Summary

The Wiki Editor is a modern, **Plate-powered** rich-text editing surface for
{doc}`Wiki Pages <workspaces-and-wiki>`. Instead of the standard block toolbar,
Wiki Pages open in a single continuous document editor with a synchronized page
title, slash-menu insertion, inline formatting, links, images, people mentions,
dates, and collaborative comments and suggested changes.

It applies **only to the Wiki Page content type** — all other types keep the
standard Volto blocks editor.

## Who it's for

- **Editors** writing and structuring team knowledge inside a Workspace.

## Capabilities

- A continuous **rich-text document** editor (not the block toolbar).
- **Synchronized title** — the in-editor H1 and the page's title field stay in
  sync both ways.
- **Slash menu** and a **floating toolbar** for inserting and formatting.
- **Links** to external URLs or internal content (with content search and tree
  browsing).
- **Images** via slash menu, sidebar, paste, or drag-and-drop.
- **People mentions** (`@`) and **inline dates** (`//`).
- **Comments** and **suggested changes** on the content, including bulk
  accept/reject.

## Behaviour & rules

:::{admonition} For QA and product owners
:class: tip
This section is the behavioural spec. Treat each rule as a testable assertion.
:::

### Scope and storage

- The editor replaces the standard blocks engine **only for Wiki Pages**
  (gated by `PlateEditorContentTypes = ['WikiPage']`). Metadata fieldsets still
  render in the sidebar.
- The document is persisted as a **single synthetic block** that holds the
  editor value plus its discussions and participating users — not as the usual
  multi-block layout, and not in Plone's native discussion system.

### Title synchronization

- The document's first heading is a special **title node** rendered as the page
  H1. Typing it updates the content object's `title` field, and vice-versa.
- The title node is **plain text only** — inline formatting hotkeys are blocked
  there, Enter creates a following paragraph, and duplicate title nodes are
  removed.

### Formatting (enabled commands)

- Marks: **bold** (⌘B), **italic** (⌘I), **strikethrough** (⌘⇧M), **code** (⌘E).
  _Underline is present in the code but currently disabled._
- Blocks: headings **H1–H6** (H5/H6 via the slash menu), paragraphs,
  **numbered / bulleted / to-do lists**, **tables**, **toggles**, **callouts**,
  **columns**, **code blocks**, a **table of contents**, alignment, line height,
  and "turn into" conversions.
- Markdown and DOCX handling are enabled. **AI assistance and drag-and-drop are
  explicitly disabled** in this editor.

:::{note}
The exact supported toolbar/block matrix is a **v3 open item** — engineering and
product still need to approve the final enabled set before it's a release
promise. Treat the list above as "present in code," not "contractually
supported."
:::

### Links

- A single "paste link or search content" input: a value starting with `/`, `#`,
  or a `scheme:` is treated as a literal link; otherwise (2+ characters) it
  **searches intranet content** (debounced) and offers matching results.
- Internal URLs are normalized to app-relative form.
- A folder icon opens the full **object browser** to pick a target by tree.

### Images

- Inserted from the **slash menu**, the **sidebar**, by **pasting**, or by
  **dropping** a file.
- Uploaded images become **real Plone Image objects** created in the current
  container — governed by the standard "Add Image" permission, no custom upload
  endpoint.

### Mentions and dates (Provisional)

- Typing **`@`** opens a people combobox backed by the `@mentions` backend
  endpoint (searches users by name/fullname; it refuses to enumerate all users,
  so a search term is required). Results render as person pills; recently
  mentioned people are remembered per user in browser storage.
- Typing a **second `/`** (`//`) inside the slash menu switches it to a **date
  picker** that inserts an inline date pill.

:::{admonition} Provisional — hold from public claims
:class: warning
Mentions and inline dates are classified **Provisional** in the v3 feature set:
selection rules, renamed/missing people, permission trimming, keyboard
interaction, and some visual polish are not fully validated. Do not include them
in public/marketing copy until reconciled.
:::

### Comments and suggested changes (Provisional)

- The editor supports **inline comments/discussions** and **suggested changes**
  attached to content, with thread resolve and **Accept all / Reject all** bulk
  actions. Suggestions are stored as inline marks within the document value; the
  title node is deliberately excluded from suggestion tracking.
- The comment editor itself supports marks and mentions.

:::{admonition} Provisional — alpha collaboration
:class: warning
Inline discussions and suggested changes are substantially built but classified
**Provisional** (originally a proof of concept): actors, state transitions,
notifications, audit behavior, and view-mode presentation are not yet a settled
contract, and the implementation carries alpha-stage caveats. This is distinct
from the standard footer **page comments** (see {doc}`workspaces-and-wiki`).
:::

## Configuration

- No per-site toggle: the editor is active for Wiki Pages by virtue of the type.
  Create a Wiki Page inside a Workspace and it opens in the Plate editor.

## Learn more

- **Related feature** — {doc}`workspaces-and-wiki`
- **Related feature** — {doc}`content-lifecycle-management` (ownership/byline on
  Wiki Pages), {doc}`people-and-organisation` (the people behind mentions)
