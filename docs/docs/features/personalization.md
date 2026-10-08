---
myst:
  html_meta:
    description: "Personalization feature — passive targeting boosts and filters listings by relevance to the user's team or location."
    keywords: "personalization, passive targeting, user relevance, solr, listings, boost, currentUser"
doc_type: feature
audience: user
status: draft
last_updated: 2026-09-07
---

# Personalization (Passive Targeting)

:::{admonition} Feature summary
:class: note

**Status:** GA (boost variant requires Solr) · **Audience:** all users, editors ·
**Interim source of truth**—canonical spec will move to the intranet.
:::

## Summary

Personalization makes listings more relevant to whoever is looking at them,
based on the reader's **organisational unit** and **location**. It comes in two
distinct variants that share the same underlying association:

- **User relevance sort**—a *soft boost*. Content tied to the reader's team or
  location floats to the top, but everything still appears in the list.
- **Current logged-in user filter**—a *hard filter*. The listing is restricted
  to items matching the reader's org unit or location.

Both are "passive": the reader does nothing; the system reads their profile
automatically.

## Who it's for

- **Readers** get listings ordered or filtered to what's relevant to them, with
  no action required.
- **Editors** enable either variant per listing block via the query/sort
  controls.

## Capabilities

- **User relevance** sort option on listing blocks (soft boost via Solr).
- **Current logged-in user** query operation on listing blocks (hard filter).
- Ranking/filtering keyed on the reader's **Organisational Unit** and
  **Location**.
- An automatic on-page **disclaimer** telling readers a listing is personalized.

## How the association works

The chain from reader to ranking is:

1. The current Plone user is mapped to a **Person** content item by matching the
   Person's `username` field to the user id (`get_current_user_person()` in
   `utils/get_person.py`). The mapping requires **exactly one** matching Person.
2. That Person carries two reference fields—`organisational_unit_reference`
   and `location_reference`—each a list of Organisational Unit / Location
   **UIDs** (defined in `behaviors/organisational_unit.py` and
   `behaviors/location.py`).
3. Those references drive the boost or filter against the same indexes on the
   content being listed.

## Behaviour & rules

:::{admonition} For QA and product owners
:class: tip
This section is the behavioural spec. Treat each rule as a testable assertion.
:::

### User relevance sort (soft boost)

- Selecting **User relevance** as a listing block's sort order applies Solr boost
  queries so matching content ranks higher, **without removing** non-matching
  content.
- Boost weighting is **not equal**: organisational unit matches are boosted more
  strongly than location matches (org unit `^10`, location `^8` in
  `search.py`). So team relevance outranks location relevance.
- Boosts are **OR-joined**—a match on *either* org unit or location lifts an
  item.
- `userRelevance` is a **synthetic sort field**, not a real catalog index. It is
  intercepted before it reaches the catalog and translated into Solr boosts.

### Current logged-in user filter (hard filter)

- A listing query using the **Current logged-in user** operation restricts
  results to items whose org unit / location matches the reader's.
- This operation ships with the **default** profile, so it is available **even
  without Solr** (it runs against the catalog KeywordIndexes
  `organisational_unit_reference` and `location_reference`).

### Fallbacks and degradation

- **Not logged in, no Person, or an ambiguous match** (zero or more than one
  Person for the user): no boost and no filter are applied—the listing falls
  back to its default order / unfiltered results.
- **Reader has no org unit and no location**: the boost set is empty, so nothing
  is boosted; the hard filter adds no constraint.
- **Solr not installed/active**: the **User relevance sort** is a Solr-only
  feature—it is only offered when the Solr profile is installed, and its boost
  parameter is ignored by a non-Solr catalog. There is **no explicit Solr
  health-check or try/except**; degradation is implicit (empty boosts / ignored
  parameter). The hard filter doesn't depend on Solr.

### Scope

- **Listing blocks:** both variants are supported (sort boost and hard filter).
- **Solr search block:** does **not** use user relevance—it uses standard Solr
  relevance scoring only. No user-based boosting is applied in the search block.

### Reader-facing disclaimer

- When a listing uses **User relevance** sort **or** the **Current logged-in
  user** filter, an automatic disclaimer is shown above the results:
  "The displayed content is tailored to your organizational unit and location."

## Configuration / enablement

- There is **no dedicated on/off flag** for personalization. The hard filter is
  always available (default profile); the **User relevance boost** is gated on
  Solr being set up and active.
- Solr is enabled at site creation (`setup_solr`) and activated via the
  `SOLR_ACTIVATE` environment variable (`collective.solr.active`).
- For the feature to have any effect, readers must be represented by a **Person**
  item assigned to an Organisational Unit and/or Location.

## Learn more

- **Concept**—{doc}`/concepts/personalization`
- **How-to**—{doc}`/how-to-guides/engagement/passive-targeting`
- **Related feature**—{doc}`people-and-organisation`
