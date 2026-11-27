---
myst:
  html_meta:
    description: "Personal dashboard: a private start page for each user, built from listing blocks and created from a site-wide default layout."
    keywords: "dashboard, personal dashboard, start page, listings, private, Person, default layout"
doc_type: feature
audience: user
status: draft
last_updated: 2026-11-27
---

# Personal dashboard

:::{admonition} Feature summary
:class: note

**Status:** New · **Audience:** all logged-in users with a Person, admins ·
**Interim source of truth**—canonical spec will move to the intranet.
:::

## Summary

Every user with a Person gets a private dashboard: a page of blocks that shows
what is relevant to them, such as recently changed content, their workspaces,
and news and events from their organisational units. It lives inside the user's Person at `<person>/dashboard` and is linked from the user menu in the toolbar.

All dashboards start from one default layout, which site administrators edit in the content types control panel. Each user can then change their own dashboard with the normal block editor, without affecting anyone else.

## Who it's for

- **All users**—get a personal start page that works out of the box and that
  they can adapt to their own needs.
- **Site administrators**—define the default layout that every new dashboard
  starts from.

## Capabilities

- A **Dashboard** link in the toolbar's user menu that opens the user's own
  dashboard.
- A default layout of listing blocks, shown even before the user has saved
  anything.
- Full block editing of the user's own dashboard.
- A site-wide default layout, edited through the web.
- Versioning: every save creates a version in the dashboard's history.

## The default layout

The distribution ships this layout. All listings show up to five items. The
headlines are plain text and are not translated.

| Headline | Shows | Sorted by |
|----------|-------|-----------|
| Recently modified | All content except Dashboards and Images | Last modified, newest first |
| Recently created | All content except Dashboards and Images | Creation date, newest first |
| Recently created by me | Content created by the current user, except Dashboards and Images | Creation date, newest first |
| My workspaces | Workspaces created by the current user | Last modified, newest first |
| News from my organisational units | News Items for the user's organisational units | Publishing date, newest first |
| Events from my organisational units | Upcoming Events for the user's organisational units | Start date, soonest first |
| Submitted for publication | Content in the `pending` review state | Last modified, newest first |

Above the listings are a title block and an empty text block. The listings are
arranged in four grid rows.

```{image} /_static/images/dashboard-default-layout.png
:alt: A personal dashboard showing the default layout with the Recently modified and Recently created listings
:width: 600px
:align: center
```

## Behaviour & rules

:::{admonition} For QA and product owners
:class: tip
This section is the behavioural spec. Treat each rule as a testable assertion.
:::

### Access and the menu link

- The **Dashboard** link appears in the user menu only when a Person with the
  user's username exists. It links to `<person>/dashboard`.
- Anonymous users have no dashboard. On a `…/dashboard` URL they get the regular content view, which asks them to log in when the dashboard is private.

### Before the dashboard exists

- Until the user first clicks **Edit**, nothing is stored. The page shows the
  current default layout of the `Dashboard` content type, with the title
  **Dashboard**.
- The toolbar shows only an **Edit** button on this page.
- Only the user can see this default view of their own dashboard. Other users,
  including site administrators, get an error.

### Creating the dashboard

- Clicking **Edit** creates a `Dashboard` item with the id `dashboard` and the
  title "Dashboard" inside the user's Person, then opens its edit form.
- The new dashboard copies the default layout as it is at that moment.
- Creating it again is safe: if the dashboard already exists, it is kept and
  opened.
- Users can create only their own dashboard, never one inside another user's
  Person.
- If the dashboard can't be created, an error message says "The dashboard could
  not be created"

### Privacy

- Dashboards use the one-state `dashboard_workflow` (state `private`). Only the
  owner, Site Administrators and Managers can view or edit a dashboard.
- Dashboards do not inherit local roles from the Person. Whoever created the
  Person, or holds a local role on it, can't see the dashboard.
- Dashboards can't be added anywhere through the **Add** menu.

### Default layout changes

- Changing the default layout affects only dashboards created **after** the
  change. Existing dashboards keep their own blocks.
- Upgrading or reinstalling the distribution doesn't overwrite a default layout
  that was edited through the web.

### Versioning

- Each save of a dashboard creates a new version, visible in its history.

:::{admonition} Known gaps / limits
:class: warning

- **News/Events from my organisational units**: if the user's Person has no
  organisational unit, the filter is dropped and the listings show **all** News
  Items and Events.
- **My workspaces** lists workspaces the user **created**, not workspaces they
  are a member of.
- Not yet possible with the available listing criteria: "Recently modified by
  me", "Recent changes in my workspaces" and "Submitted for publication in my
  workspaces".
:::

## Configuration

- No setting is needed: the feature is on for every user with a Person. See
  {doc}`/how-to-guides/content/create-person`.
- Site administrators change the default layout as described in
  {doc}`/how-to-guides/settings/set-default-dashboard-layout`.

## Learn more

- **How-to**—{doc}`/how-to-guides/content/customize-your-dashboard`
- **How-to**—{doc}`/how-to-guides/settings/set-default-dashboard-layout`
- **Reference**—{doc}`/developer/reference/api/dashboard`
- **Related feature**—{doc}`people-and-organisation`
- **Related feature**—{doc}`personalization`
- **Related feature**—{doc}`workspaces-and-wiki`
