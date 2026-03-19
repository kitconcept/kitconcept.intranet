---
myst:
  html_meta:
    description: "Site customization options available through VLT behaviors — header, theme, and footer settings."
    keywords: "site customization, logo, colors, footer, header, admin"
doc_type: reference
audience: admin
last_updated: 2026-03-18
---

# Site Customization

This page describes the settings available to customize your site's header, theme colors, and footer. These settings are available once the VLT site customization behaviors have been applied to your site's content types.

:::{note}
These settings require the VLT behaviors to be applied by a developer first. See [Configure VLT Behaviors](/developer/reference/behaviors/voltolighttheme) for setup instructions.
:::

## Header

You can customize the following aspects of the header.

### Site logo

Define the main site logo shown in the top left-most side of the header.

### Complementary logo

Define a complementary logo in the header — a second logo shown on the right-most side.

### Fat menu

VLT has a fat menu located below the main site sections. You can trigger it by clicking on one of the main site sections. You can disable it (it is enabled by default).

### Intranet header

Your site can have a different header intended for intranet sites. If enabled, the intranet header will show instead of the default one.

### Intranet flag

If you have enabled the intranet header, the intranet flag is the text in the grey pill at the top of the header.

(site-customization-actions)=

### Actions

Define the actions located at the top right of the header. These are links, each defined by a title, a target URL, and a boolean for whether to open in a new tab.

The special actions `login`, `logout`, and `register` are shown if they are enabled as actions in your Plone site.

## Theming

Customize the colors and look and feel of your site.

### Navigation text color

Customize the navigation text color.

### Fat menu and breadcrumbs text color

Customize the fat menu text color. This also applies to the breadcrumbs text color.

### Fat menu background color

Customize the fat menu background color.

### Footer font color

Customize the footer font color.

### Footer background color

Customize the footer background color.

## Footer

Customize the following aspects of the footer.

### Footer links

Define additional links in the footer. Each link has a title, a target URL, and a boolean for whether to open in a new tab.

### Footer logos

Add a list of logos in the footer. Each logo has a title, a target URL, an image, a size (`small` or `large`), and a container width (`default` or `layout`).

### Footer colophon text

Customize the colophon text shown as the last line of the footer.

## See Also

- [Configure VLT Behaviors](/developer/reference/behaviors/voltolighttheme)
