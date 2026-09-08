---
myst:
  html_meta:
    description: "Workspaces & Wiki feature — focused team knowledge areas with nested Wiki Pages, an app-like navigation tree, and a compact header."
    keywords: "workspace, wiki, wiki page, navigation tree, compact header, knowledge, v3"
doc_type: feature
audience: user
status: draft
last_updated: 2026-09-07
---

# Workspaces & Wiki

:::{admonition} Feature summary
:class: note

**Status:** v3 · Core (with a Provisional tree-management area) ·
**Audience:** all users (readers), editors ·
**Interim source of truth** — canonical spec will move to the intranet.
:::

## Summary

Workspaces are focused, team-oriented knowledge areas. Each Workspace holds
**nested Wiki Pages**, files, and images, and gives users an **app-like
experience**: a left-hand navigation tree for moving through the Workspace's
structure and a compact header that keeps them oriented. Wiki Pages are edited in
the modern {doc}`Wiki Editor <wiki-editor>`.

This is the centerpiece of the v3 "workspace-centered knowledge experience."

## Who it's for

- **Readers** browse a Workspace's pages through the navigation tree.
- **Editors** create and organize nested Wiki Pages as the primary unit of team
  knowledge.

## Capabilities

- **Workspace** content area grouping Wiki Pages, files, and images.
- **Wiki Pages** that nest inside a Workspace (and inside each other).
- An **app-like navigation tree** for the current Workspace.
- A **compact, workspace-aware header** with breadcrumbs and search.
- In-tree **content management** (rename, duplicate, delete, add, reorder).

## The content types

### Workspace

- A **folderish** container; addable **anywhere** in the site.
- Allowed children: **Wiki Page, File, Image** (restricted).
- Carries {doc}`content-lifecycle-management` ownership fields.
- Distinguished internally by a workspace **marker** that other features key off
  (the navigation tree and compact header).

### Wiki Page

- A **folderish** container — Wiki Pages can **nest inside each other**.
- **Not globally addable**: a Wiki Page can only be created **inside a
  Workspace** (or inside another Wiki Page). It does not appear as an "add" option
  at arbitrary locations.
- Allowed children: **Wiki Page, File, Image**.
- Carries {doc}`content-lifecycle-management` ownership fields, and is edited with
  the {doc}`Wiki Editor <wiki-editor>`.

:::{admonition} Not a subsite
:class: note
A Workspace is a plain folder distinguished by a marker — it is **not** a
navigation root or subsite, and does not get its own theme/header/footer. (The
separate "Subsite" capability is a distinct, provisional feature and is not part
of Workspaces.)
:::

## Behaviour & rules

:::{admonition} For QA and product owners
:class: tip
This section is the behavioural spec. Treat each rule as a testable assertion.
:::

### Navigation tree

- The tree appears **only** when the current content is a **Workspace or Wiki
  Page** — it is intentionally absent on the site home page and outside Workspace
  contexts.
- Its root is the **active Workspace** (or the site root as fallback). It
  **auto-expands** the ancestors of the current item and highlights the current
  item.
- Each row shows a **review-state color dot** for its content.
- The open/closed state is remembered per viewer (browser storage).
- Workspaces themselves are filtered out of the in-tree listings (the switcher
  handles moving between Workspaces).

### In-tree content management (Provisional)

Authorized users can act on items directly from the tree:

- **Rename** — inline title edit.
- **Duplicate** — copies the item and places the copy after the original.
- **Delete** — removes the item.
- **Add child** — inline, creates a new **Wiki Page** under the item.
- **Reorder** — moves items within their parent (button/position-based, **not**
  drag-and-drop).

All of these use standard content operations under the hood (no custom endpoint).

:::{admonition} Provisional — hold from public claims
:class: warning
Tree-based rename/duplicate/delete/reorder is classified **Provisional** in the
v3 feature set: roles, confirmation dialogs, descendant handling, conflicts,
locking, published-content rules, and failure recovery are **not yet defined**.
Treat these as data-integrity journeys to be specified before they're a public
promise.
:::

### Compact workspace header

- Inside a Workspace (and on any content **beneath** it), the intranet shows a
  **compact header** with breadcrumbs and a workspace search entry, instead of the
  standard site header.
- Outside Workspace contexts, the standard site header is shown.
- Header behavior in subsites and other edge contexts is a known **reconciliation
  item**.

### Content review

- Workspace and Wiki Page do **not** carry the
  {doc}`content-review-reminders` behavior (unlike Document, Event, News Item,
  etc.). They participate in ownership/feedback but not in review scheduling.

## Known limits (v3)

- The **access model** for Workspaces — creation, membership, ownership,
  isolation, and management permissions — still needs an approved definition
  before it's a release contract.
- Wiki Page depth, valid/invalid parents, locking, and translation behavior need
  QA verification.
- Tree-management operations are Provisional (see above).

## Learn more

- **Related feature** — {doc}`wiki-editor` (editing Wiki Pages)
- **Related feature** — {doc}`content-lifecycle-management`,
  {doc}`likes-and-content-rating`
- **Reference** — {doc}`/reference/content-types`
