---
myst:
  html_meta:
    description: "Likes and content rating feature — let logged-in users like content, with a count shown in the content interactions bar."
    keywords: "likes, rating, content rating, votes, vote, thumbs, engagement, interactions"
doc_type: feature
audience: user
status: draft
last_updated: 2026-09-07
---

# Likes & Content Rating

:::{admonition} Feature summary
:class: note

**Status:** GA (global on by default; per-item off by default) ·
**Audience:** all logged-in users, editors, admins ·
**Interim source of truth** — canonical spec will move to the intranet.
:::

## Summary

Content rating lets logged-in users **"like"** a piece of content with a single
thumbs-up, and shows a running **like count**. It is a binary like — not a
star-scale rating — surfaced in the **content interactions bar** below the
content, alongside a comment count and an email share button.

The feature is known by three overlapping names in the system: **Content
Rating** (the global control-panel switch), **Likes** (the per-item switch and
the UI), and **Votes** (the underlying storage and `@vote` API).

## Who it's for

- **Logged-in readers** signal that content is useful by liking it.
- **Editors** turn likes on for individual items.
- **Administrators** turn the whole capability on or off for the site.

## Capabilities

- One-click **like / unlike** toggle per content item.
- A **like count** shown in the interactions bar.
- **Two-level enablement**: a global site switch and a per-item switch.
- Applied to **Document, Event, File, News Item, and Image**.

## Behaviour & rules

:::{admonition} For QA and product owners
:class: tip
This section is the behavioural spec. Treat each rule as a testable assertion.
:::

### Enablement (two gates)

The like control appears only when **both** are true:

1. **Global** — `enable_content_rating` in the control panel. **Default: on.**
2. **Per item** — the item's `enable_likes` field. **Default: off.**

So out of the box the capability is globally enabled but shows on no content
until an editor enables likes on a specific item.

### Liking

- A like is recorded via a `@vote` POST that **toggles** the current user's id in
  the item's `votes` list — first call adds a like, a second call by the same
  user removes it.
- The **count** is simply the number of user ids in `votes`.
- Each user counts **at most once** per item (their id is either present or not).
- The `votes` list is **read-only** through normal editing — it is only ever
  changed by the `@vote` service.

### Authentication

- **Anonymous users cannot like.** The backend rejects an anonymous `@vote` with
  *"Must be logged in to vote."*
- In the UI, anonymous users still see the thumb, but it is a **link to the login
  page** rather than a like button.

### Scope & shape

- It is a **binary thumbs-up**, not a 1–5 star or numeric scale.
- There is a single `@vote` endpoint; "like" is the UI vocabulary over the
  votes storage. There is no separate `@like` or `@rating` endpoint.

### The interactions bar (related surfaces)

The like control lives in the **content interactions bar**, which also shows:

- a **comment count** (present when discussion is allowed or comments exist), and
- an **email Share** button (opens a pre-filled `mailto:` with the title and
  link).

These two are part of the same bar rather than separate features.

## Configuration

- **Admins:** toggle **Enable Content Rating** in the intranet control panel to
  turn the capability on/off site-wide.
- **Editors:** switch on **Enable Likes** (the "Likes" fieldset) on an individual
  Document, Event, File, News Item, or Image.

## Learn more

- **How-to** — {doc}`/how-to-guides/engagement/enable-likes`
- **Reference (behavior)** — {doc}`/developer/reference/behaviors/votes`
- **Reference (API)** — {doc}`/developer/reference/api/votes` (`@vote` endpoint)
- **Reference (component)** —
  {doc}`/developer/reference/components/content-interactions`
