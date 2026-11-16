---
myst:
  html_meta:
    description: "Watch content feature — logged-in users watch a content item and get an email every time a published version of it changes."
    keywords: "watch, watching, subscribe, follow, notification, email, eye, watched by me"
doc_type: feature
audience: user
status: draft
last_updated: 2026-11-16
---

# Watch content

:::{admonition} Feature summary
:class: note

**Status:** MVP (on for new sites, off for upgraded sites) ·
**Audience:** all logged-in users, admins ·
**Interim source of truth**—canonical spec will move to the intranet.
:::

## Summary

Watching lets a logged-in user follow a single content item and get an
**email every time a published version of it changes**. Users start and stop
watching with an **eye toggle** on the item, and can list everything they watch
with a **"Watched by me"** listing.

## Who it's for

- **Readers** who depend on a page—opening hours, a policy, a process
  description—and want to know when it changes, without checking it by hand.
- **Administrators** turn the capability on or off for the site.

## Capabilities

- One-click **watch / stop watching** toggle per content item.
- An **email on every change** of a watched, published item, with who changed
  it, when, the change note, and links to the item and its version history.
- A **"Watched by me"** listing criterion to show a user's watched items.
- **Private by design:** nobody can see who else watches an item.
- Applied to **Document, News Item, Event, File, and Image**.

## Behaviour & rules

:::{admonition} For QA and product owners
:class: tip
This section is the behavioural spec. Treat each rule as a testable assertion.
:::

### Enablement

The watch toggle appears only when **all** of these are true:

1. **Global**—**Enable Watching Content** in the intranet control panel is on.
   **Default: on for new sites, off for sites upgraded from an earlier version.**
2. **Content type**—the item's type has the `kitconcept.intranet.watchers`
   behavior (Document, News Item, Event, File, and Image do).
3. **User**—the user is logged in. **Anonymous users never see the toggle.**

There is no per-item switch: every item of a watchable type can be watched.

### Watching

- Any logged-in user who can view an item can watch it.
- The toggle is a **pressed / not pressed** button. Selecting it again stops
  watching.
- A confirmation toast appears for both starting and stopping.
- Watching does **not** change the item: its modification date stays the same
  and it doesn't count as an edit.

### Where the toggle appears

| Content types | Location | Look |
|---------------|----------|------|
| Document, News Item, Event | Top right of the **About this content** box | Labelled button: **Watch** / **Watching** |
| File, Image, and other types with the behavior | **Content interactions bar** below the content, next to Like | Round eye-only button |

In the pressed state (watching), the button turns dark with a white, filled eye.

```{image} /_static/images/watch-content-not-watching.png
:alt: The "About this content" box with the "Watch" button (not watching)
```

```{image} /_static/images/watch-content-watching.png
:alt: The same box with the pressed "Watching" button
```

### Emails

An email goes out when a watched item is:

- **edited and saved**,
- **published** (workflow transition to *published*), or
- **checked in** from a working copy.

An email goes only to watchers who:

- **can still view** the item at the time of the change,
- have an **email address** in their profile, and
- are **not the person who made the change**.

And only when the item is **published**. Changes to private or pending content
send nothing.

Further rules:

- **One email per item per save**, even when a single save triggers several
  internal events.
- If the save fails, **no email** goes out. A mail server problem never stops
  the save.
- Adding, removing, or reordering **child items** of a watched page is not a
  change of the page itself and sends no email.
- **Editing a working copy** sends no email; the **check-in** does.

### Email content

- **Language:** the item's language, falling back to the site default.
  German and English are supported.
- **Subject:** `Update to "<title>"` / `Änderung an „<title>"`.
- **Body:** greeting with the recipient's name, who changed the item, date and
  time, the change note (when one was entered), a link to the item, a link to
  its **version history** (`<url>/history`), and how to stop watching.

```{image} /_static/images/watch-content-email.png
:alt: A watch notification email in German
```

### Privacy

- The list of watchers is **not** part of the content data the API returns.
- A user can only learn whether **they** watch an item. There is **no watcher
  count** and no list of watchers in the UI.

### Copies and working copies

- A **copy** of a watched item starts with **no watchers**.
- A **working copy** keeps the watchers of the original, so they survive
  checkout and check-in. The working copy itself never sends emails and doesn't
  appear in the "Watched by me" listing.

### "Watched by me"

- Listing blocks offer the criterion **Watched by** with the operation
  **Watched by me**. It lists the items the current user watches.
- For **anonymous** visitors the criterion matches **nothing**.

## Configuration

- **Admins:** toggle **Enable Watching Content** in the intranet control panel.
- **Admins:** make sure the site has a **"Site 'From' address"** in the mail
  settings. Without it, no watch email can be sent.

## Not included yet

- Watching whole sections or folders.
- A page to manage all watched items in one place, and a one-click link in the email to stop watching
  in the email.
- Daily or weekly digest emails, and notification preferences.
- An option for editors to skip notifications for minor edits.

## Learn more

- **How-to**—{doc}`/how-to-guides/engagement/watch-content`
- **How-to (admin)**—{doc}`/how-to-guides/engagement/enable-content-watching`
- **Reference (setting)**—{doc}`/reference/control-panel`
- **Explanation (developer)**—{doc}`/developer/concepts/watch-content`
- **Reference (API)**—{doc}`/developer/reference/api/watch` (`@watch` endpoint)
- **Reference (behavior)**—{doc}`/developer/reference/behaviors/watchers`
- **Reference (component)**—{doc}`/developer/reference/components/watch-button`
