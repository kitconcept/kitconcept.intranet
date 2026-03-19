---
myst:
  html_meta:
    description: "Enable content likes and ratings for pages in your kitconcept intranet."
    keywords: "likes, ratings, content interactions, engagement, admin"
doc_type: how-to
audience: admin
tags: [engagement, likes, ratings]
last_updated: 2026-03-18
---

# How to Enable Likes and Ratings

This guide shows you how to enable content likes, ratings, and the content interactions bar for pages in your intranet.

## Prerequisites

- You have admin access to the Intranet Settings control panel.
- The `kitconcept.intranet.votes` behavior must be enabled for the content type (contact your developer if unsure).

## What this feature provides

Once enabled, the following is displayed below each content item:

- **Likes**: Users can like or unlike content. Requires `enable_content_rating` to be on globally and `enable_likes` to be set on the individual content item.
- **Comments**: Displays total comment count. Only shown when commenting is enabled.
- **Share**: Provides email sharing options. Always shown.
- **Metadata**: Shows creation and last modified dates. Always shown.

## Steps

### 1. Enable Rating Globally

Go to the Intranet Settings control panel and enable the `enable_content_rating` setting.

![Enable rating globally](/_static/images/globally-rating.png)

### 2. Enable Rating on a Content Item

Open the content item you want to enable likes on, then enable the `enable_likes` field.

![Enable rating on content item](/_static/images/content-rating.png)

## Verification

After completing both steps, the likes button will appear below the content when viewed by logged-in users.

## See Also

- [ContentInteractions component reference](/developer/reference/components/content-interactions)
- [IVotes behavior reference](/developer/reference/behaviors/votes)
- [@votes API reference](/developer/reference/api/votes)
