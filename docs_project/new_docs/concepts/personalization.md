---
myst:
  html_meta:
    description: "How passive targeting personalizes content listings for users based on their organisational unit."
    keywords: "personalization, passive targeting, user relevance"
doc_type: explanation
audience: editor
status: draft
---

# Personalization

The intranet supports **passive targeting** — a feature that automatically sorts content listings to show the most relevant items first, based on the current user's organisational unit or location.

## How it works

When a listing block or search block is configured with **User relevance** as the sort order, Solr ranks results so that content associated with the user's team or location appears at the top.

This happens passively — the user does not need to do anything to see personalized results. The system detects their profile automatically.

## Requirements

- Solr must be configured and active in your Plone instance.
- The user must be associated with a Person content item assigned to an organisational unit or location.

:::{note}
Full explanation pending. See [How to use passive targeting](/how-to-guides/engagement/passive-targeting) for configuration steps.
:::

## See Also

- [How to enable passive targeting](/how-to-guides/engagement/passive-targeting)
