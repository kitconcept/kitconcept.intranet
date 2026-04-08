---
myst:
  html_meta:
    description: "Reference for the ListingBlockDisclaimer component and the listingBodyDisclaimer slot."
    keywords: "ListingBlockDisclaimer, disclaimer, listing, slot, component, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-08
---

# ListingBlockDisclaimer

The `ListingBlockDisclaimer` component displays contextual disclaimer text below a listing block. It is rendered via the `listingBodyDisclaimer` slot, which is placed at the bottom of the `ListingBody` component.

Disclaimers can be targeted to specific listing contexts using the same targeting/personalisation rules used elsewhere in the intranet, making it possible to show different disclaimer text depending on the user's organisational unit, role, or other attributes.

## Slot: `listingBodyDisclaimer`

The disclaimer is injected into the listing body through a registered slot:

| Property | Value |
|----------|-------|
| **Slot name** | `listingBodyDisclaimer` |
| **Location** | Bottom of `ListingBody`, after all listing items |
| **Rendered when** | At least one disclaimer component is registered for the slot |

### Registering a disclaimer component

```ts
import MyDisclaimer from './MyDisclaimer';

config.registerSlotComponent({
  slot: 'listingBodyDisclaimer',
  name: 'myDisclaimer',
  component: MyDisclaimer,
  predicates: [/* optional targeting predicates */],
});
```

The built-in `ListingBlockDisclaimer` component is already registered by default with the intranet distribution.

## Component: `ListingBlockDisclaimer`

### Import

```ts
import ListingBlockDisclaimer from '@kitconcept/volto-light-theme/components/Blocks/ListingBlockDisclaimer';
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `content` | `object` | Yes | The current page/context content object |
| `properties` | `object` | Yes | The listing block's data properties |
| `metadata` | `object` | No | Additional metadata passed from the slot system |

### Behaviour

The component reads disclaimer configuration from the intranet settings or from a targeted content source and renders the applicable disclaimer text. If no disclaimer is configured for the current context, the component renders nothing (returns `null`).

Disclaimers are matched by:

1. **Organisational unit** – the disclaimer can be scoped to a specific OU.
2. **Content path** – the disclaimer can be scoped to a folder path.
3. **User role** – the disclaimer can be restricted to certain Plone roles.
4. **Fallback** – a default disclaimer displayed when no specific rule matches.

### Example output

When a disclaimer is applicable, the component renders:

```html
<div class="listing-block-disclaimer">
  <p>This list is maintained by the Legal department. For questions contact legal@example.com.</p>
</div>
```

## Styling

The disclaimer wrapper uses the CSS class `listing-block-disclaimer`. Override it in your custom theme:

```css
.listing-block-disclaimer {
  margin-top: var(--spacing-medium);
  padding: var(--spacing-small);
  border-left: 4px solid var(--color-warning);
  background-color: var(--color-warning-bg);
  font-size: var(--font-size-small);
  color: var(--color-text-muted);
}
```

## Disabling the Default Disclaimer

To remove the built-in disclaimer globally:

```ts
config.unRegisterSlotComponent({
  slot: 'listingBodyDisclaimer',
  name: 'listingBlockDisclaimer', // the name used during default registration
});
```

## See Also

- [Slots reference](/developer/reference/components/slots)
- [Sticky Menu Slot reference](/developer/reference/components/sticky-menu-slot)
- [Personalisation concepts](/concepts/personalization)
