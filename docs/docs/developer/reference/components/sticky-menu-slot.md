---
myst:
  html_meta:
    description: "Reference for the sticky navigation menu slot in Volto Light Theme."
    keywords: "sticky menu, slot, navigation, stickyMenu, developer, VLT"
doc_type: reference
audience: developer
last_updated: 2026-04-08
---

# Sticky menu slot

The sticky menu slot (`stickyMenu`) is a layout slot provided by Volto Light Theme that renders a navigation menu anchored to the top of the viewport as the user scrolls down the page. It is suitable for in-page navigation (anchor links), secondary toolbars, or contextual action menus.

## Slot name

```
stickyMenu
```

## Location in the page

The sticky menu renders between the site header and the main content area. Once the user scrolls past the header, the menu sticks to the top of the visible viewport (CSS `position: sticky` or `position: fixed` depending on the component registered).

## Default behaviour

By default, the `stickyMenu` slot is empty—no component is registered. You must register a component to activate the sticky menu for your site or for specific pages.

## Registering a component

```ts
import MyStickyNav from './MyStickyNav';

config.registerSlotComponent({
  slot: 'stickyMenu',
  name: 'myStickyNav',
  component: MyStickyNav,
  // Optional: restrict to specific content types or paths
  predicates: [
    (args) => args.content?.['@type'] === 'Document',
  ],
});
```

### Props passed to the component

| Prop | Type | Description |
|------|------|-------------|
| `content` | `object` | The current page content object from the Plone API |
| `pathname` | `string` | Current URL path |
| `metadata` | `object` | Additional slot metadata |

## Typical use case: in-page anchor navigation

A common use of the sticky menu is to render an auto-generated table of contents for long pages:

1. The component reads the heading structure of the current page content.
2. It renders a horizontal navigation bar with anchor links (`#section-id`).
3. As the user scrolls, the active section is highlighted in the menu.
4. The menu sticks to the top of the screen once the main header scrolls out of view.

### Example component skeleton

```tsx
import React from 'react';

const StickyInPageNav = ({ content }) => {
  const headings = extractHeadings(content?.blocks); // custom utility

  if (!headings.length) return null;

  return (
    <nav className="sticky-menu" aria-label="Page sections">
      <ul>
        {headings.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default StickyInPageNav;
```

## Styling

The slot wrapper renders a `<div>` with the CSS class `slot-sticky-menu`. Add your sticky positioning in your theme CSS:

```css
.slot-sticky-menu {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
}
```

:::{tip}
Ensure the `z-index` is high enough to appear above other positioned elements (such as inline-block elements inside content), but below modal dialogs and tooltips.
:::

## Multiple components in the slot

You can register more than one component in the `stickyMenu` slot. They will be rendered in registration order. Use predicates to ensure components are only shown in the correct context:

```ts
config.registerSlotComponent({
  slot: 'stickyMenu',
  name: 'breadcrumbBar',
  component: StickyBreadcrumbs,
  predicates: [(args) => args.content?.['@type'] !== 'LRF'],
});

config.registerSlotComponent({
  slot: 'stickyMenu',
  name: 'sectionNav',
  component: StickySectionNav,
  predicates: [(args) => args.content?.['@type'] === 'Document'],
});
```

## Removing the sticky menu

To unregister a component from the slot:

```ts
config.unRegisterSlotComponent({
  slot: 'stickyMenu',
  name: 'myStickyNav',
});
```

## See Also

- [Slots reference](/developer/reference/components/slots)
- [ListingBlockDisclaimer component](/developer/reference/components/listing-disclaimer)
