---
myst:
  html_meta:
    "description": "Displays rating, comment count, and metadata (creation and modification dates) below the content view."
    "property=og:description": "Displays rating, comment count, and metadata (creation and modification dates) below the content view."
    "property=og:title": "Content Rating and Metadata Binder"
    "keywords": "Volto, Plone, content rating, comments, metadata, creation date, modification date"
---

# Content Rating and Metadata Binder

This component displays **likes, comments, share options**, and **content metadata** (creation and modification dates) below the content view in an Intranet site.

It enhances content engagement by allowing users to express reactions and access relevant metadata at a glance.

## Screenshot

![Example of content binder](/_static/content-binder.png)

---

## Overview

The **Rating.jsx** component is a custom React component that integrates:

- 👍 **Likes**: Users can like or unlike content
  - Must be enabled globally in the control panel
  - Must be enabled for the specific content type
  - Only available when both settings are active

- 💬 **Comments**: Displays total comment count
  - Only shown when commenting is enabled

- 🔗 **Share**: Provides email sharing options
  - Always shown

- 🕓 **Metadata**: Shows creation and last modified dates
  - Always shown

---

## Configuration

### Enable Rating Globally

First, enable rating in the control panel:

![Enable rating globally](/_static/globally-rating.png)

### Enable Rating on Content Type

Then, enable it for your content type:

![Enable rating on content type](/_static/content-rating.png)

---

## Component Location
```text
src/components/Rating/Rating.jsx
```