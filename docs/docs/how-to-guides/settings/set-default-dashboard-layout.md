---
myst:
  html_meta:
    description: "Change the default layout that every new personal dashboard starts from, in the content types control panel."
    keywords: "dashboard, default layout, content types, layout editor, admin, site setup"
doc_type: how-to
audience: admin
tags: [dashboard, content-types, site-settings]
last_updated: 2026-11-27
---

# Set the default dashboard layout

This guide shows you how to change the default layout that new personal
dashboards start from.

## Prerequisites

- You are a Site Administrator or Manager.

## Steps

### 1. Open the content types control panel

Go to **Site Setup** and click **Content Types**.

### 2. Open the Dashboard layout

In the **Dashboard** row, open the actions menu (**…**) and click **Layout**.

```{image} /_static/images/dashboard-content-types-layout-action.png
:alt: The content types control panel with the actions menu of the Dashboard row open
:width: 600px
:align: center
```

The layout editor shows the current default dashboard.

```{image} /_static/images/dashboard-default-layout-editor.png
:alt: The layout editor of the Dashboard content type, with the block order in the sidebar
:width: 600px
:align: center
```

### 3. Change the blocks

Add, remove, reorder or configure blocks as on any page. For a listing, set its
headline, criteria and number of items in the sidebar.

To show content for the person viewing the dashboard, use listing criteria that
refer to the current user, such as **Creator** with **Current logged in user**.

### 4. Save

Click **Save** in the toolbar.

## Verification

To confirm the new layout is used:

1. Log in as a user who has a Person but hasn't edited their dashboard yet.
2. Open the user menu and click **Dashboard**.
3. The dashboard shows your new layout.

## Notes

- The new layout is used only for dashboards created after you save it. Users who
  have already edited their dashboard keep their own blocks.
- Listing headlines are plain text. They are shown as entered, in every
  language.
- Upgrades of the intranet don't overwrite a layout that you have edited here.

## See also

- [Developer: the `@dashboard` endpoint](/developer/reference/api/dashboard)
- {doc}`/features/personal-dashboard`
- {doc}`/how-to-guides/content/customize-your-dashboard`
