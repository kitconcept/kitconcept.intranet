---
myst:
  html_meta:
    description: "Reference for the StickyMenu and MobileStickyMenu components and the kitconcept.sticky_menu behavior."
    keywords: "StickyMenu, MobileStickyMenu, sticky menu, aboveHeader, preFooter, kitconcept.sticky_menu, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-27
---

# StickyMenu

`StickyMenu` is a desktop fixed-position navigation component rendered on the right side of the screen. `MobileStickyMenu` is its mobile counterpart, rendered as a carousel fixed to the bottom of the screen. Both components read their data from the `kitconcept.sticky_menu` Plone behavior via the `inherit` API expander.

## Backend behavior

| Property | Value |
|----------|-------|
| **Dotted name** | `kitconcept.sticky_menu` |
| **Interface class** | `IStickyMenuSettings` |
| **Module** | `kitconcept.voltolighttheme.behaviors.sticky_menu` |
| **Title** | Sticky menu |
| **Description** | Sticky menu showing fixed in the right side of the screen |

### Fields

| Field | Type | Widget | Required | Default | Description |
|-------|------|--------|----------|---------|-------------|
| `sticky_menu` | `JSONField` | `object_list` (`iconLinkList` schema) | No | `[]` | List of icon links composing the menu |
| `sticky_menu_color` | `TextLine` | `colorPicker` | No | — | Background color |
| `sticky_menu_foreground_color` | `TextLine` | `colorPicker` | No | — | Text color |
| `enable_mobile_sticky_menu` | `Bool` | — | No | `False` | Show the mobile sticky menu at the bottom of the screen |

Each item in `sticky_menu` is an `iconLink` object:

| Field | Type | Description |
|-------|------|-------------|
| `@id` | `string` | Item identifier |
| `title` | `string` | Link label |
| `icon` | `Image` | Icon image |
| `href` | `Array<hrefType>` | Link target |
| `openInNewTab` | `boolean` | Open in a new tab |

## Slot registration

Both components are registered by default by `@kitconcept/volto-light-theme` in `src/config/slots.ts`.

| Component | Slot | Registration name |
|-----------|------|-------------------|
| `StickyMenu` | `aboveHeader` | `StickyMenu` |
| `MobileStickyMenu` | `preFooter` | `MobileStickyMenu` |

## Component: `StickyMenu`

**File:** `frontend/packages/volto-light-theme/src/components/StickyMenu/StickyMenu.tsx`

### Props

| Prop | Type | Required |
|------|------|----------|
| `content` | `Content` (from `@plone/types`) | Yes |

### Behaviour

Reads `sticky_menu`, `sticky_menu_color`, and `sticky_menu_foreground_color` from the `kitconcept.sticky_menu` inherit expander on `content`. Renders an `IconLinkList` inside a `<div class="sticky-menu">`.

Hidden via CSS in CMS UI, add view, edit view, and on mobile screens (≤ `$largest-mobile-screen`).

### CSS

| Class | Element |
|-------|---------|
| `sticky-menu` | Root `<div>` |

| CSS variable | Fallback |
|---|---|
| `--sticky-menu-color` | `#555` |
| `--sticky-menu-foreground-color` | `#fff` |

**Positioning:** `position: fixed`, right `0`, vertically centered (`top: 50vh`, `transform: translateY(-50%)`). On screens taller than 969px: `top: 373px`, `transform: none`. Z-index: `11`.

## Component: `MobileStickyMenu`

**File:** `frontend/packages/volto-light-theme/src/components/StickyMenu/MobileStickyMenu.tsx`

### Props

| Prop | Type | Required |
|------|------|----------|
| `content` | `Content` (from `@plone/types`) | Yes |

### Behaviour

Reads `enable_mobile_sticky_menu`, `sticky_menu`, `sticky_menu_color`, and `sticky_menu_foreground_color` from the `kitconcept.sticky_menu` inherit expander. Returns `null` when `enable_mobile_sticky_menu` is `false`.

Renders menu items as a horizontal Embla Carousel (`useEmblaCarousel`) with `PrevButton` and `NextButton` arrow controls.

### CSS

| Class | Element |
|-------|---------|
| `mobile-sticky-menu` | Root `<div>` |
| `embla` | Carousel container |
| `embla__viewport` | Carousel viewport |
| `embla__container` | Carousel track |
| `embla__slide` | Individual slide (33% width via `--slide-size`) |
| `embla__button` | Arrow button base |
| `embla__button--prev` | Previous arrow |
| `embla__button--next` | Next arrow |

| CSS variable | Fallback |
|---|---|
| `--sticky-menu-color` | `#555` |
| `--sticky-menu-foreground-color` | `#fff` |

**Positioning:** `position: fixed`, bottom `0`, full width, height `100px`. Z-index: `100`. Hidden by default (`display: none`), shown on mobile screens (≤ `$largest-mobile-screen`).

## Removing the default registration

```ts
config.unRegisterSlotComponent('aboveHeader', 'StickyMenu', 0);
config.unRegisterSlotComponent('preFooter', 'MobileStickyMenu', 0);
```

## Registering a custom sticky menu component

```ts
import MyMenu from './MyMenu';

config.registerSlotComponent({
  slot: 'aboveHeader',
  name: 'StickyMenu',
  component: MyMenu,
});
```

## See also

- [ListingBlockDisclaimer](/developer/reference/components/listing-disclaimer)
- [Slots reference](/developer/reference/components/slots)
