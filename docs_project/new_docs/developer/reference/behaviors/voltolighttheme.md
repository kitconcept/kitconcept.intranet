---
myst:
  html_meta:
    description: "Technical reference for kitconcept.voltolighttheme behaviors — applying and inheriting site customization."
    keywords: "voltolighttheme, behaviors, header, theme, footer, site, subsite, XML, developer"
doc_type: reference
audience: developer
---

# VLT Site Customization Behaviors

## Behavior Names

| Behavior | Purpose |
|----------|---------|
| `voltolighttheme.header` | Logo, nav, intranet flag, header actions |
| `voltolighttheme.theme` | Colors, font, background |
| `voltolighttheme.footer` | Footer links, logos, colophon |

These behaviors are provided by the `kitconcept.voltolighttheme` backend add-on. When applied to a content type, they expose fields for customizing the site's header, theme, and footer.

## Plone site root

Every Plone site has a site root. Content types inherit the behaviors from this single parent.

## Subsites

Subsites are typically child content types within a Plone Site. They usually implement `INavigationRoot` behavior. Language root folders (LRF), such as `/en` or `/ca`, are subsites.

You can create a content type that implements `INavigationRoot`, adding it anywhere in your site tree, and it will work as a subsite.

Subsites can be _nested_, so the settings that are applied are always the ones from the nearest site ancestor to the current content object.

For example, given this structure:

```console
Plone site (/)
└── LRF (/en)
    ├── Document (/en/document1)
    └── Subsite (/en/subsite)
        └── Document (/en/subsite/document2)
```

If `/en` has a custom logo, then `/en/document1` will inherit and show the logo from `/en` because it is `/en/document1`'s nearest site ancestor.

If `/en/subsite` has set a different logo, then `/en/subsite/document2` will show the logo from `/en/subsite` instead.

## Add behaviors

To add the behaviors to a Plone site, add the following snippet to `<your_backend_addon>/profiles/default/types/Plone_Site.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<object xmlns:i18n="http://xml.zope.org/namespaces/i18n"
        meta_type="Dexterity FTI"
        name="Plone Site"
        i18n:domain="plone"
>
  <property name="behaviors"
            purge="false"
  >
    <element value="voltolighttheme.header" />
    <element value="voltolighttheme.theme" />
    <element value="voltolighttheme.footer" />
  </property>
</object>
```

If you want the behaviors at the very top of your content type form, use `purge="true"` and list all behaviors explicitly:

```xml
<?xml version="1.0" encoding="utf-8"?>
<object xmlns:i18n="http://xml.zope.org/namespaces/i18n"
        meta_type="Dexterity FTI"
        name="Plone Site"
        i18n:domain="plone"
>
  <property name="behaviors"
            purge="true"
  >
    <element value="voltolighttheme.header" />
    <element value="voltolighttheme.theme" />
    <element value="voltolighttheme.footer" />
    <element value="plone.dublincore" />
    <element value="plone.relateditems" />
    <element value="plone.locking" />
    <element value="plone.allowdiscussion" />
    <element value="plone.excludefromnavigation" />
    <element value="plone.tableofcontents" />
    <element value="volto.blocks" />
  </property>
</object>
```

:::{note}
Using `purge="true"` removes any other behaviors that may have been customized. You can also reorder behaviors manually via the ZMI (`portal_types/Plone Site`) or programmatically.
:::

## See Also

- [Site customization settings reference](/reference/site-customization)
