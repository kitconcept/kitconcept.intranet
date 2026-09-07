---
myst:
  html_meta:
    description: "People and organisation feature — Person, Organisational Unit, and Location content types forming the people directory and org hierarchy."
    keywords: "people directory, person, location, organisational unit, org structure, profile, contact"
doc_type: feature
audience: user
status: draft
last_updated: 2026-09-07
---

# People & Organisation

:::{admonition} Feature summary
:class: note

**Status:** GA · **Audience:** all users (readers), editors, admins ·
**Interim source of truth** — canonical spec will move to the intranet.
:::

## Summary

The intranet models staff, teams, and offices as first-class content through
three custom content types — **Person**, **Organisational Unit**, and
**Location**. Together they form the **people directory** and the
**organisational hierarchy** that several other features build on: a Person
profile is the entity behind {doc}`content-lifecycle-management` ownership, and
the org unit / location references drive {doc}`personalization`.

## Who it's for

- **Readers** browse profiles and find colleagues, teams, and offices.
- **Editors** maintain profiles and the org structure.
- **Administrators** create Organisational Units and Locations (restricted to
  site admins) and link people to Plone user accounts.

## Capabilities

- **Person** — a rich staff profile (name, academic title, portrait, bio, job
  title, department, contact details, responsibilities), linkable to a Plone
  user account.
- **Organisational Unit** — a team, department, or division.
- **Location** — a physical office or building.
- **Cross-references** between all three, driving directory filtering and
  personalization.
- Frontend **profile view**, **summary/teaser card**, **search result**, and
  **person pill** components.

## The content types

### Person

A Person is built from the third-party `collective.person` type, extended with
intranet-specific behaviors. Its key fields (grouped by area):

| Area | Fields |
|------|--------|
| Identity | `first_name` (**required**), `last_name`, `academic_title` (Prof./Dr./Prof. Dr.), computed read-only `title` |
| Profile | `image` (portrait), `text` (biography), `job_title`, `department`, `roles` |
| Contact | `office_phone`, `contact_phone` (mobile), `fax`, `contact_email`, `contact_website`, `contact_building`, `contact_room`, `address` |
| Expertise | `responsibilities` (tag-style, from a shared vocabulary) |
| Membership | `organisational_unit_reference`, `location_reference` |
| Account link | `username` (maps to a Plone user) |

The displayed **title** is computed as *academic title + first + last name*.
Several contact fields are **permission-protected** for viewing.

### Organisational Unit

Represents a team, department, or division. It has **no bespoke fields of its
own** — its title/description come from standard behaviors — but it **carries a
`location_reference`**, so a unit can be associated with the offices it sits in.
Creation is restricted to **site admins**.

### Location

Represents a physical office or building. Like Organisational Unit it has **no
bespoke fields of its own**, but it **carries an `organisational_unit_reference`**,
associating an office with the teams based there. Creation is restricted to
**site admins**.

### Reference model

The three types cross-reference each other:

- **Person** → references both **Organisational Units** and **Locations**
- **Organisational Unit** → references **Locations**
- **Location** → references **Organisational Units**

References store target **UIDs**, are **language-independent**, and are exposed
as catalog keyword indexes (and Solr fields) so they can be used as listing/search
filters.

## Behaviour & rules

:::{admonition} For QA and product owners
:class: tip
This section is the behavioural spec. Treat each rule as a testable assertion.
:::

### Person ↔ user account

- A Person links to a Plone user through its **`username`** field.
- The link is **validated**: the username must map to a real Plone user, and a
  given user may be linked to **only one** Person (uniqueness is enforced).
- This one-to-one link is what lets other features resolve "the current user's
  Person" — required by {doc}`content-lifecycle-management` ownership and
  {doc}`personalization`.
- `contact_email` is a **separate** profile field, independent of the account
  link — it is the address used by feedback routing, not necessarily the user's
  login email.

### Directory listings

- There is **no bespoke "directory grid" component**. People directories are
  produced with the standard **Listing / Summary block** machinery using the
  Person summary card, combined with **org unit / location / responsibilities**
  query filters.
- Profile links in listings and search results respect site flags
  (`kitconcept.clickable_profile_links` to enable linking,
  `kitconcept.disable_profile_links` to suppress it).

### Serialization

- The Person API response **expands** the stored org-unit and location UIDs into
  human-readable **`organisational_units`** and **`locations`** title lists, which
  the profile view renders directly.

## Configuration

- Create **Organisational Units** and **Locations** first (site-admin only), then
  create **Person** items and assign their org unit, location, responsibilities,
  and `username`.
- Person, Organisational Unit, and Location also carry the
  {doc}`content-review-reminders` behavior, so they participate in review
  scheduling like other content.

## Learn more

- **Reference** — {doc}`/reference/content-types`
- **Concept** — {doc}`/concepts/organisational-structure`
- **Related feature** — {doc}`content-lifecycle-management`,
  {doc}`personalization`
