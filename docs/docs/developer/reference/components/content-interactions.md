---
myst:
  html_meta:
    description: "Reference for the ContentInteractions React component — votes, comments, share, and metadata."
    keywords: "ContentInteractions, JSX, votes, component, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-27
---

# ContentInteractions

The **ContentInteractions** component displays likes, comments, share options, and content metadata (creation and modification dates) below the content view in an Intranet site.

![Example of content interactions](/_static/images/content-interactions.png)

## Overview

The **ContentInteractions.jsx** component is a custom React component that integrates:

- **Likes**: Users can like content and revert their like.
  - The `enable_content_rating` setting must be enabled in the Intranet Settings control panel
  - The `kitconcept.intranet.votes` behavior must be enabled for the content type
  - The `enable_likes` field must be True for the specific content item
  - Only available when all these conditions are active

- **Comments**: Displays total comment count
  - Only shown when commenting is enabled

- **Share**: Provides email sharing options
  - Always shown

- **Metadata**: Shows creation and last modified dates
  - Always shown

## Component Location

```text
src/components/ContentInteractions/ContentInteractions.jsx
```

## See Also

- [How to enable likes](/how-to-guides/engagement/enable-likes)
- [IVotes behavior](/developer/reference/behaviors/votes)
- [@votes API](/developer/reference/api/votes)
