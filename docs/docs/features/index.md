---
myst:
  html_meta:
    description: "Feature catalog for the kitconcept Intranet Distribution — what the product does, for users, potential users, QA, and product owners."
    keywords: "features, capabilities, product, spec, intranet, overview"
doc_type: feature
audience: user
status: draft
last_updated: 2026-09-07
---

# Features

A capability catalog for the kitconcept Intranet Distribution: what the product
does, who each feature is for, and how it behaves.

:::{admonition} Interim source of truth
:class: important

This section is a **temporary, versioned source of truth** for the product's
features. It serves users and potential users as an overview, and QA and product
owners as a behavioural spec.

The canonical, living version will eventually move to a live document on the
intranet itself. Until then, treat these pages as authoritative and keep them in
sync with the shipped behaviour.
:::

## How this section is organised

Unlike the four Diátaxis quadrants—{doc}`Tutorials </tutorials/index>`,
{doc}`How-to Guides </how-to-guides/index>`,
{doc}`Reference </reference/index>`, and {doc}`Concepts </concepts/index>`—which are organised around what a reader is *trying to do*, this section is
organised around *what the product offers*.

Each feature page is a **hub**: it gives a self-contained summary and behaviour
spec, then links out to the task, reference, and conceptual docs that already
cover it in depth. Read a feature page to understand a capability end to end;
follow its links when you need to do, configure, or extend it.

## Feature catalog

| Feature | What it does | For | Status |
|---------|--------------|-----|--------|
| {doc}`content-lifecycle-management` | Track content ownership and authorship; route feedback and review reminders to the accountable people. | Editors, admins | GA |
| {doc}`feedback` | Let readers send private feedback on any page, routed to the right owner. | All users | GA |
| {doc}`people-and-organisation` | Model staff, teams, and locations as first-class content—the people directory and org hierarchy. | Editors, admins | GA |
| {doc}`personalization` | Boost or filter listings by relevance to the current user's team or location (passive targeting). | All users | Boost needs Solr |
| {doc}`content-review-reminders` | Schedule content reviews, act on them (approve/delegate/postpone), and remind reviewers by email. | Editors, admins | Off by default |
| {doc}`likes-and-content-rating` | Let logged-in users like content and see a like count in the interactions bar. | All users | Per-item opt-in |
| {doc}`workspaces-and-wiki` | Focused team knowledge areas with nested Wiki Pages, an app-like navigation tree, and a compact header. | All users | v3 |
| {doc}`wiki-editor` | A modern Plate-powered rich-text editor for Wiki Pages, with links, images, mentions, comments, and suggestions. | Editors | v3 |
| {doc}`search` | A live, workspace-scoped search dialog backed by Solr, with a classic results page. | All users | v3 · Beta |
| {doc}`ai-assisted-answers` | Ask a question in the search dialog and get a grounded, single-turn answer with source links. | All users | v3 · Beta |

## Additional capabilities

These ship with the distribution and are documented in the quadrants above;
dedicated feature pages are planned.

| Capability | Where it's documented |
|------------|-----------------------|
| Site customization (Volto Light Theme, subsites) | {doc}`/reference/site-customization` |
| Workflows | {doc}`/reference/workflows` |

```{toctree}
:maxdepth: 1
:hidden: true

content-lifecycle-management
feedback
people-and-organisation
personalization
content-review-reminders
likes-and-content-rating
workspaces-and-wiki
wiki-editor
search
ai-assisted-answers
```
