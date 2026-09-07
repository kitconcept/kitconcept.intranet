---
myst:
  html_meta:
    description: "Search feature — a live, workspace-scoped search dialog backed by Solr, with a classic results page."
    keywords: "search, solr, workspace search, scope, live search, facets, v3, beta"
doc_type: feature
audience: user
status: draft
last_updated: 2026-09-07
---

# Search

:::{admonition} Feature summary
:class: warning

**Status:** v3 · **Beta (Provisional)** · **Audience:** all users ·
Requires Solr · **Interim source of truth** — canonical spec will move to the
intranet.
:::

## Summary

Search offers a **live, workspace-aware search dialog** opened from anywhere with
a keyboard shortcut or the header search button. As the user types, results
appear instantly, scoped to the Workspace they're working in, another accessible
Workspace, or the whole intranet. Pressing Enter opens a **classic results page**
with content-type tabs, facets, and sorting. The same dialog hosts the optional
{doc}`AI-assisted answers <ai-assisted-answers>`.

## Who it's for

- **All users** searching intranet content, especially from within a Workspace.

## Capabilities

- A **Cmd/Ctrl+K** (or header-button) **live search dialog**.
- **As-you-type suggestions** backed by Solr.
- **Scope switching**: current Workspace / another Workspace / everywhere.
- A **classic results page** with content-type tabs, real facets, and sorting.
- **Per-type result cards** (e.g. rich person results).
- **Server-side permission trimming** so users only ever see what they may access.

## Behaviour & rules

:::{admonition} For QA and product owners
:class: tip
This section is the behavioural spec. Treat each rule as a testable assertion.
:::

### The dialog

- Opens via a header button or a global **Cmd/Ctrl+K** shortcut. The shortcut is
  suppressed while focus is in an editable field (so the Wiki Editor's own
  shortcuts keep working).
- Suggestions appear once the query is **2+ characters**, debounced (~250 ms),
  from a Solr suggest endpoint.
- Clicking a suggestion navigates to that item; pressing **Enter** opens the
  classic results page.

### Search scopes

Three scopes, selected via the scope chip:

- **Current Workspace** (default) — resolved from the Workspace the current
  content belongs to.
- **Another accessible Workspace** — chosen from a list that is itself
  **security-trimmed** (inaccessible Workspaces never appear).
- **Everywhere** — no path restriction.

Scope is translated into a **path filter** applied to suggestions, the results
page, and AI answers. On Enter, a scoped search opens the Workspace's own results
page filtered to that path; an "everywhere" search opens the site results page.

:::{note}
A deferred **"Intranet Portal"** scope (portal content outside any Workspace) is
**not** selectable — it needs backend exclusion support and was moved to a later
ticket. It survives only as a location label on results, not as a scope option.
:::

### Results page

- The **classic results page** renders content-type **tabs** (Pages, Events,
  Files, Images, News, Persons) with per-group counts, **working facets**, sort,
  and layout controls.
- Person results render as rich cards (job title, phone, building/room, email),
  respecting the profile-link site flags.
- The AI toggle is intentionally **absent** from the classic results page — AI is
  dialog-only.

### Permission trimming

- Enforced **server-side**: every Solr query is filtered by the user's
  roles/groups/id, and hidden-from-search items are excluded. Anonymous users are
  restricted to anonymous-visible content.
- Applies to suggestions, the results page, and AI grounding alike — inaccessible
  content never appears.

### Filter controls in the dialog (non-functional — demo only)

:::{admonition} Exclude — do not present as working
:class: warning
The dialog's **Type / Created-by / Updated / Status** filter chips and the
"Search titles only" / "Show archived content" toggles are **display-only**. They
open, look real, and remember a selection, but they are **never sent to any
endpoint** and do not filter results (the option lists are static demo data).

Only the **Workspace scope chip** is a real control in the dialog. (The classic
results page facets, by contrast, do work.) These controls must be hidden or
implemented before they can be part of the release contract.
:::

## Configuration

- Requires **Solr** to be set up and active (server-level; no control-panel
  setting).
- Two legacy control-panel settings — `external_search_url` and
  `search_field_placeholder` — drive the **older** light-theme search widget, not
  this dialog. The dialog uses its own placeholder and routing.

## Learn more

- **How-to** — {doc}`/how-to-guides/settings/search-settings`
- **Reference (component)** — {doc}`/developer/reference/components/search-tabs`
- **Related feature** — {doc}`ai-assisted-answers`, {doc}`workspaces-and-wiki`,
  {doc}`personalization`
