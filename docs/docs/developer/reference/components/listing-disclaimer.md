---
myst:
  html_meta:
    description: "Reference for the ListingBlockDisclaimer component and the aboveListingItems slot."
    keywords: "ListingBlockDisclaimer, disclaimer, listing, slot, component, personalization, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-27
---

# ListingBlockDisclaimer

The `ListingBlockDisclaimer` component displays a disclaimer below a listing block when the listing results are personalized for the current user.

## Slot: `aboveListingItems`

The disclaimer is injected into listing blocks through the `aboveListingItems` slot:

| Property | Value |
|----------|-------|
| **Slot name** | `aboveListingItems` |
| **Registration name** | `ListingDisclaimer` |
| **Registered in** | `frontend/packages/kitconcept-intranet/src/config/slots.ts` |

### Registering a custom disclaimer component

```ts
import MyDisclaimer from './MyDisclaimer';

config.registerSlotComponent({
  slot: 'aboveListingItems',
  name: 'myDisclaimer',
  component: MyDisclaimer,
});
```

### Removing the built-in disclaimer

```ts
config.unRegisterSlotComponent('aboveListingItems', 'ListingDisclaimer', 0);
```

The third argument is the index of the registered entry to remove. Pass `0` to remove the first (and only) registration.

## Component: `ListingBlockDisclaimer`

Located at `frontend/packages/kitconcept-intranet/src/slots/ListingDisclaimer/ListingDisclaimer.tsx`. Not part of the public package API — referenced internally via the slot registration.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `object` | No (defaults to `{}`) | The listing block's data object, containing `querystring` |

The component reads personalization state from `data.querystring` or from `data` directly.

### Behaviour

The component renders only when the listing is personalized for the current user. A listing is considered personalized if either condition is true:

- `sort_on === 'userRelevance'`
- The query contains a filter using `plone.app.querystring.operation.selection.currentUser`

When neither condition is met, the component returns `null` and renders nothing.

When a personalized listing is detected, the component renders a fixed, translated message:

> The displayed content is tailored to your organizational unit and location.

The message is defined via `react-intl` and can be overridden through the standard i18n translation mechanism.

### Example output

```html
<div class="results-disclaimer-container">
  <p class="disclaimer">The displayed content is tailored to your organizational unit and location.</p>
</div>
```

## Styling

The component uses two CSS classes:

| Class | Element |
|-------|---------|
| `results-disclaimer-container` | Outer `<div>` wrapper |
| `disclaimer` | Inner `<p>` text element |

## See Also

- [Slots reference](/developer/reference/components/slots)
- [StickyMenu reference](/developer/reference/components/sticky-menu)
