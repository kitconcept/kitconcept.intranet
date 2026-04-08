---
myst:
  html_meta:
    description: "How to add and configure Slider block variations in the kitconcept Intranet."
    keywords: "slider, carousel, slideshow, block, variations, how-to, editor"
doc_type: how-to
audience: editor
last_updated: 2026-04-08
---

# Use the Slider block

The Slider block (also called a Carousel block) displays a series of content items—images, teasers, or text—in a rotating slideshow. Two primary variations are available: the **Full Slider** and the **Simple Side Slider**.

## Prerequisites

- You have Editor or Manager access to the page.
- The images or content items you want to feature are already uploaded/created on the site.

## Adding the Slider Block

1. Open the page in **edit mode**.
2. Click the **+** button to open the block chooser.
3. Search for **Slider** (or **Carousel**) and click it to insert.

## Choosing a Variation

After inserting the block, open the **Variation** tab (or the dropdown at the top of the sidebar) to pick a layout:

| Variation | Description |
|-----------|-------------|
| **Default (Full Slider)** | Full-width slides with large images and overlaid text |
| **Simple Side Slider** | Image on one side, text content on the other; each slide scrolls horizontally |

### Full Slider

The full slider occupies the entire content width and cycles through large hero-style slides. Suitable for homepage banners or section intros.

### Simple Side Slider

The Simple Side Slider uses a split layout:
- Left side: image
- Right side: title, description, and optional call-to-action link

Slides animate by sliding horizontally. This variation works well for featured articles, news highlights, or product showcases within a page.

## Adding Slides

1. In the block sidebar, click **Add slide**.
2. For each slide, configure:

| Field | Description |
|-------|-------------|
| **Image** | Select an image from the site using the object browser, or upload a new one |
| **Title** | Headline text for the slide |
| **Description** | Supporting text or summary (optional) |
| **Link** | URL or internal path for a call-to-action button |
| **Link text** | Button label (e.g. "Read more") |
| **Open in new tab** | Whether the link target opens in a new browser tab |

3. Repeat for each additional slide.
4. Drag the slide entries to reorder them.
5. Click the trash icon next to a slide to remove it.

## Slider Options

| Option | Description |
|--------|-------------|
| **Auto-play** | Automatically advance slides on a timer |
| **Interval (ms)** | Time between slides when auto-play is enabled (default: 5000 ms) |
| **Show navigation arrows** | Display previous/next arrow buttons |
| **Show pagination dots** | Display dot indicators below the slider |
| **Infinite loop** | After the last slide, wrap back to the first |
| **Pause on hover** | Stop auto-play when the user hovers over the slider |

## Refresh Content Button

When the slider is configured with a query (to automatically pull in content), a **Refresh Content** button appears in the edit-mode toolbar. Clicking it re-runs the query and updates the slides to reflect the latest content without requiring a full page reload.

## Accessibility Considerations

- Always provide meaningful **Title** and **Description** text for each slide so screen reader users receive equivalent information.
- If auto-play is enabled, users can pause the slider using the pause button that appears in the slider controls.
- The keyboard arrow keys allow navigation between slides when focus is inside the slider.

## Example: Simple Side Slider for Latest News

1. Insert a **Slider** block.
2. Select the **Simple Side Slider** variation.
3. Add three slides, each with a news article image, title, short excerpt, and a "Read article" link.
4. Enable **Show navigation arrows** and **Show pagination dots**.
5. Disable **Auto-play** (let users navigate at their own pace).
6. Click **Save**.

## See Also

- [Blocks configuration](/how-to-guides/settings/blocks-config)
- [Event Calendar Block](/how-to-guides/blocks/event-calendar)
