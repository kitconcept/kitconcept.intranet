---
myst:
  html_meta:
    description: "How content ownership and the CLM inheritance model work in the intranet."
    keywords: "content ownership, CLM, inheritance, responsible person"
doc_type: explanation
audience: admin
status: draft
---

# Content Ownership

The intranet uses the **CLM (Content Lifecycle Management)** behavior to track content ownership. Understanding how ownership is assigned and inherited is important for both editors and administrators.

## How ownership works

Each content item can have:
- **Content Owner** (`responsible_person`) — the accountable person for the content
- **Feedback to** (`feedback_person`) — who receives feedback for this specific item
- **Authors** (`authors`) — people involved in creating or editing the content

## Inheritance

When sending feedback, the system walks up the content tree to find the nearest ancestor with a **Content Owner** set:

1. Check **Feedback to** on the current item
2. Check **Content Owner** on the current item
3. Walk up to parent items, checking **Content Owner** on each ancestor

This means you only need to set ownership at a folder or section level, and all child content inherits it automatically.

:::{note}
Full explanation pending domain expert review.
:::

## See Also

- [Configure the feedback form](/how-to-guides/feedback/configure-feedback)
- [CLM behavior reference](/developer/reference/behaviors/clm)
