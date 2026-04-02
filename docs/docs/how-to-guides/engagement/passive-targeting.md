---
doc_type: how-to
audience: editor
tags: [engagement, passive-targeting]
myst:
  html_meta:
    "description": "Sort content in listings based on its relevance to the current user."
    "keywords": "Volto, Plone, intranet, passive targeting"
last_updated: 2026-03-18
---

# Configure passive targeting

Passive targeting makes it possible to sort a listing or search block to highlight content which matches the current user's organisational unit or location, creating a personalized browsing experience.

## Enable passive targeting for a block

To use passive targeting on a listing or search block:

1. **Add a listing or search block** to your page
2. **Configure the block criteria** to specify what content should be included (e.g., content type, review state, etc.)
3. **Choose "User relevance" as the sort order** from the sort dropdown

Once configured with "User relevance" sorting, content that matches the current user's organisational unit or location will automatically appear at the top of the listing or search results.

## Caveats

Before enabling passive targeting, be aware of the following requirements and limitations:

- **Solr requirement**: Passive targeting requires a Solr search engine to be configured and active in your Plone instance. It will not work with the default catalog-based search.

- **User profile requirements**: The current user must be associated with a Person content item that is assigned to an organisational unit or location. To associate a Person with a user, set its username.

