---
doc_type: how-to
audience: developer
myst:
  html_meta:
    "description": "Remove the colophon from Volto Light Theme"
    "keywords": "Volto Light Theme, colophon, remove colophon"
last_updated: 2026-03-18
---

# Remove the default colophon slot

Volto Light Theme offers a colophon feature for your site.

To remove the colophon from your site, you can use the `unRegisterSlotComponent` method in your add-on's configuration file.

```ts
config.unRegisterSlotComponent('postFooter', 'Colophon', 0);
```

## Override Colophon slot

You can override the slot using component shadowing.
To do this, create the shadow file in the {file}`customizations` folder of your add-on at the path {file}`src/customizations/@kitconcept/volto-light-theme/components/Footer/slots/Colophon.tsx`.
