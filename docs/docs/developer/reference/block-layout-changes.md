---
myst:
  html_meta:
    description: "Reference for VLT layout and visual fixes: full-width blocks in edit mode and grid image overlay removal."
    keywords: "full-width blocks, edit mode, layout, grid, image, overlay, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-09
---

# Block layout changes (VLT)

This page documents two visual fixes introduced in `volto-light-theme` that affect block rendering.

---

## Full-width blocks in edit mode

**File:** `frontend/packages/volto-light-theme/src/theme/_layout.scss`

Blocks that use the `has--block-width--full` style class previously did not extend correctly to the page edges in edit mode. The fix applies the `adjustEditContainerFullWidth()` SCSS mixin for these blocks inside the `#page-add` and `#page-edit` selectors:

```scss
#page-add,
#page-edit {
  [class*='block-editor-']:not(.contained) {
    @include layout-container-width();
    @include adjustMarginsToEditContainer($layout-container-width);

    &.has--block-width--full {
      @include adjustEditContainerFullWidth();
    }
  }
}
```

**Effect:** Blocks configured with full-width style now span edge-to-edge in edit mode, matching their appearance in view mode.

**No configuration required.** This is an automatic CSS fix.

---

## Remove black overlay on images without captions (Grid block)

**File:** `frontend/packages/volto-light-theme/src/theme/blocks/_listing.scss`

Previously, the `.image-gallery-description` element in grid/image-gallery listings displayed a black gradient overlay even when no caption was present. The fix sets `background: none` on that element:

```scss
.image-gallery-description {
  position: relative;
  bottom: auto;
  left: auto;
  display: block;
  padding: 25px 0 0 0;
  background: none;
  font-size: 14px;
}
```

**Effect:** Images in grid blocks no longer have a black overlay when no caption is provided. The caption area is still rendered (for layout stability) but is visually transparent.

**Related component:** `frontend/packages/volto-light-theme/src/components/Blocks/Listing/ImageGallery.jsx`

**No configuration required.** This is an automatic CSS fix.

---

## See Also

- [Use the Slider block](../../how-to-guides/blocks/slider.md)
- [styleDefinitions registry](style-definitions.md)
