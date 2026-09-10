---
myst:
  html_meta:
    description: "Content Lifecycle Management (CLM) feature — content ownership, authorship, feedback routing, and review reminders."
    keywords: "CLM, content lifecycle management, content owner, feedback, ownership, authors, review"
doc_type: feature
audience: user
status: draft
last_updated: 2026-09-07
---

# Content Lifecycle Management (CLM)

:::{admonition} Feature summary
:class: note

**Status:** GA · **Since:** 2.0.0 · **Audience:** editors, admins ·
**Interim source of truth**—canonical spec will move to the intranet.
:::

## Summary

Content Lifecycle Management ({term}`CLM`) tracks **who is accountable for a piece of
content** and uses that to **route feedback and review reminders to the right
people**. It answers three questions for any page: who owns it, who wrote it,
and who should hear about problems with it.

Ownership can be set once at a section or folder level and is inherited by all
content below it, so editors don't have to configure it on every page.

## Who it's for

- **Editors** see who is responsible for content and receive feedback and review
  reminders for content they own.
- **Administrators** assign ownership (the fields are admin-only) and configure
  the fallback feedback recipient.
- **Readers** see the accountable owner in the "About this content" panel and can
  send feedback that reaches that person.

## Capabilities

- Three ownership fields on content—**Authors**, **Content Owner**, and
  **Feedback to**—provided by the `ICLM` behavior.
- Applied to **Document**, **Event**, **Workspace**, **Wiki Page**, and
  **News Item**.
- **Tree-inherited** Content Owner: set it on an ancestor and all descendants
  inherit it.
- Feedback routing with a **per-page override** and a **site-wide fallback**.
- Surfaced to readers in the **"About this content"** panel and a footer
  **feedback link**.
- Drives **content review reminders** (see
  {doc}`content-review-reminders`).

## The fields

| Field | Cardinality | Inherited? | Purpose |
|-------|-------------|-----------|---------|
| **Authors** (`authors`) | Multiple | No | People involved in creating or editing the content. |
| **Content Owner** (`responsible_person`) | Single | **Yes** | The accountable owner/maintainer. Shown to readers and used as the default feedback recipient. |
| **Feedback to** (`feedback_person`) | Single | No | A per-page override for who receives feedback, without changing the displayed owner. |

All three fields:

- draw from the **Person** content type (the people directory) rather than free
  text, and
- are **editable by site administrators only**.

### Content Owner vs. Feedback to

These look similar but do different jobs:

- **Content Owner** is about *accountability*. It is inherited tree-wide, shown
  publicly, and is the default feedback recipient.
- **Feedback to** is a *narrow, local override*. It redirects feedback for one
  specific page to a different person than the owner, without changing who is
  shown as accountable. It applies only to the exact page it is set on—it is
  **not** inherited.

If you never set **Feedback to**, feedback simply goes to the Content Owner.
This is the common case.

## Behaviour & rules

:::{admonition} For QA and product owners
:class: tip

This section is the behavioural spec. Treat each rule as a testable assertion.
:::

### Ownership inheritance

- When resolving the Content Owner for a page, the system walks **up the content
  tree** and returns the **nearest ancestor** that has a Content Owner set.
- The walk **stops at the first match**—a closer ancestor's owner wins over a
  more distant one.
- If no ancestor has an owner, the resolved Content Owner is empty.

### Feedback recipient resolution

When feedback is submitted for a page, the recipient email is resolved in this
strict priority order:

1. **Feedback to** on *that page* → the person's contact email.
   _(Not inherited—only the exact page counts.)_
2. Otherwise the **inherited Content Owner** → the person's contact email.
   _(Inherited—walks up the tree as above.)_
3. Otherwise the **site-wide default feedback email**
   (`kitconcept.intranet.default_feedback_email` in the control panel).
4. If none of the above yields an email, the submission is **rejected** with an
   error rather than sent to nobody.

Additional rules:

- The fallback is **per field, not per person**: if **Feedback to** is set but
  that person has no contact email, resolution silently falls through to the
  Content Owner, then the default—it doesn't error at that step.
- The person who submits feedback always receives a **confirmation email** at the
  address they provided.
- A **Cc** is sent to `kitconcept.intranet.feedback_cc_email` when configured.
- Feedback and confirmation emails are sent in the reader's language (German or
  English).

### Reader-facing surfaces

- The **"About this content"** panel shows Authors, the (inherited) Content
  Owner, and created/modified dates. The panel only renders when the content has
  at least one author.
- The panel's inline feedback box only appears to **logged-in** users.
- A **"Feedback about this page"** link is added to the footer, but **only when
  the page has at least one CLM field set or inherited** (Authors, Content Owner,
  Feedback to, or an inherited Content Owner). On a page with no CLM data
  anywhere up the tree, the link doesn't appear.

## Configuration

- Set **Authors**, **Content Owner**, and **Feedback to** on a content item's
  edit form (CLM fieldset). These are admin-only fields.
- Set the site-wide fallback recipient and Cc in the control panel—see
  {doc}`/how-to-guides/feedback/configure-feedback`.
- Assign people via the **Person** content type—see
  {doc}`people-and-organisation`.

## Learn more

- **Concept**—{doc}`/concepts/content-ownership` (how ownership and inheritance
  work)
- **How-to**—{doc}`/how-to-guides/feedback/configure-feedback`
- **Reference (behavior)**—{doc}`/developer/reference/behaviors/clm`
- **Reference (API)**—{doc}`/developer/reference/api/clm` (`@clm` endpoint)
- **Related feature**—{doc}`feedback`, {doc}`content-review-reminders`
