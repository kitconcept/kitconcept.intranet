---
myst:
  html_meta:
    "description": "Displays rating, comment count, and metadata (creation and modification dates) below the content view."
    "property=og:description": "Displays rating, comment count, and metadata (creation and modification dates) below the content view."
    "property=og:title": "Content Interactions"
    "keywords": "Volto, Plone, content rating, comments, metadata, creation date, modification date"
---

# Content Interactions

This component displays **likes, comments, share options**, and **content metadata** (creation and modification dates) below the content view in an Intranet site.

It enhances content engagement by allowing users to express reactions and access relevant metadata at a glance.

## Screenshot

![Example of content interactions](/_static/content-interactions.png)

---

## Overview

The **ContentInteractions.jsx** component is a custom React component that integrates:

- 👍 **Likes**: Users can like or unlike content
  - The `enable_content_rating` setting must be enabled in the Intranet Settings control panel
  - The `kitconcept.intranet.votes` behavior must be enabled for the content type
  - The `enable_likes` field must be True for the specific content item
  - Only available when all these are active

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

### Enable Rating on Content Item

Then, enable it for your content item:

![Enable rating on content item](/_static/content-rating.png)

---

## Component Location
```text
src/components/ContentInteractions/ContentInteractions.jsx
```