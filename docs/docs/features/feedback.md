---
myst:
  html_meta:
    description: "Feedback feature — let readers send private feedback on any page, routed to the accountable content owner."
    keywords: "feedback, contact form, content owner, routing, intranet"
doc_type: feature
audience: user
status: draft
last_updated: 2026-09-07
---

# Feedback

:::{admonition} Feature summary
:class: note

**Status:** GA · **Audience:** all users ·
**Interim source of truth**—canonical spec will move to the intranet.
:::

## Summary

The feedback feature lets readers send **private feedback on any page**—what's unclear, outdated, or missing—directly to the person accountable for
that content. The submitter gets an automatic confirmation, and the recipient is
resolved automatically from {doc}`content-lifecycle-management` ownership.

## Who it's for

- **Readers** report issues without needing to know who owns a page.
- **Content owners / editors** receive actionable feedback about their content.
- **Administrators** configure the fallback recipient and Cc address.

## Capabilities

- Two feedback entry points backed by the same endpoint:
  - an **inline box** in the "About this content" panel, and
  - a **full-page form** reached from a footer link.
- Automatic **recipient routing** based on content ownership.
- **Confirmation email** to the submitter and optional **Cc**.
- **Bilingual** emails (German / English).
- Optional restriction to **internal email domains**.

## The two surfaces

| | Inline box | Full-page form |
|--|-----------|----------------|
| Location | "About this content" panel on the page | Dedicated `/<page>/feedback-form` route |
| Discoverability | Shown to logged-in users when the panel renders | Footer link "Feedback about this page" |
| Submitter email | Taken automatically from the logged-in user | Typed into the form's Email field |
| Recipient | Same routing (resolved on the backend from the page) | Same routing (resolved on the backend from the page) |

Both surfaces post to the same backend service, so they always send to the same
recipient for a given page.

## Behaviour & rules

:::{admonition} For QA and product owners
:class: tip
This section is the behavioural spec. Treat each rule as a testable assertion.
:::

### Recipient resolution

The recipient is decided **on the backend from the target page**, not from
anything in the form. It follows the {term}`CLM` priority chain:

1. **Feedback to** (`feedback_person`) on the page → their contact email.
2. Otherwise the **inherited Content Owner** (`responsible_person`) → their
   contact email.
3. Otherwise the **site-wide default feedback email**.
4. If none resolves to an email, the submission is **rejected** with an error.

See {doc}`content-lifecycle-management` for the full ownership and inheritance
rules.

### Visibility

- The **footer feedback link** appears only when the page has at least one CLM
  field set or inherited. Pages with no ownership anywhere up the tree show no
  link.
- The **inline feedback box** appears only to logged-in users, inside a panel
  that renders only when the content has at least one author.
- The inline **Send** button stays disabled until the user has typed feedback
  text and has an email on their account, and while a submission is in flight.

### Emails and validation

- The submitter always receives a **confirmation email**.
- A **Cc** is sent to the configured address when set.
- Emails are sent in the reader's current language (German or English).
- When an allowed-domains list is configured, the submitter's email must match
  one of those domains or the submission is rejected.

## Configuration

- Set the default recipient, Cc, and allowed domains—see
  {doc}`/how-to-guides/feedback/configure-feedback`.
- Ownership that drives routing is configured via
  {doc}`content-lifecycle-management`.

## Learn more

- **Tutorial**—{doc}`/tutorials/using-feedback`
- **How-to**—{doc}`/how-to-guides/feedback/configure-feedback`,
  {doc}`/how-to-guides/feedback/submit-feedback`
- **Reference (API)**—{doc}`/developer/reference/api/feedback`
- **Related feature**—{doc}`content-lifecycle-management`
