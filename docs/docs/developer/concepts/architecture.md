---
myst:
  html_meta:
    description: "System architecture overview for the kitconcept Intranet Distribution — kitconcept.core backend layers, Generic Setup profiles, and upgrade machinery."
    keywords: "architecture, kitconcept.core, Plone, Generic Setup, backend, distribution"
doc_type: explanation
audience: developer
status: review
related:
  - /developer/concepts/data-model
  - /developer/getting-started/project-structure
last_updated: 2026-03-18
---

# System Architecture

## Overview

The kitconcept Intranet Distribution is built on top of **kitconcept.core** — a backend and frontend setup that serves as the baseline and foundation for all kitconcept GmbH distributions built on top of Plone.

It includes common features, add-ons, configuration, best practices, and shared components that are used across multiple projects. The intranet distribution extends this foundation with intranet-specific content types, behaviors, and UI components.

## Backend Package

Named [`kitconcept.core`](https://pypi.org/project/kitconcept.core/), the backend package provides all the building blocks needed to create a new Plone-based distribution.

### Site creation

This package enhances `Products.CMFPlone`'s site creation mechanism by allowing a new base profile — rather than `Products.CMFPlone:plone` — to signal to the upgrade machinery that a new version is available.

`kitconcept.core` specializes the MigrationTool (`kitconcept.core.tool.migration.MigrationTool`) to support a new base profile and a dynamic list of dependencies. It uses `kitconcept.core.factory.add_site` — instead of `Products.CMFPlone.factory.addPloneSite` — to work with this enhanced MigrationTool.

### Generic Setup profiles

When you run a Generic Setup profile, the order of execution is:

1. Run the `pre_handler` defined in the profile registration
2. Install the dependencies listed in `metadata.xml`, in order
3. Run every other import step defined in the profile (XML files)
4. Run the `post_handler` defined in the profile registration

The distribution uses three distinct profiles:

#### `kitconcept.core:base`

Replacement for `Products.CMFPlone:plone`. Defines the Dexterity content type for `Plone Site` and contains configuration that does not require site creation to be finalized (workflows, permissions, catalog).

The `metadata.xml` has no dependencies on other Generic Setup profiles and defines the version for kitconcept.core.

A post_handler script (`kitconcept.core.setuphandlers.base.import_final_steps`) finalizes site creation by:

- Initializing the MigrationTool with the base profile and package
- Purging and resetting profile versions on `portal_setup`
- Running the `kitconcept.core:cmfdependencies` profile
- Running the `kitconcept.core:dependencies` profile
- Running standard CMFPlone setup functions (role manager, cache handlers, timezone)

#### `kitconcept.core:cmfdependencies`

Replacement for `Products.CMFPlone:dependencies`. Installs core add-ons via their Generic Setup profiles — the registry, portlets, theming, and versioning. Keeps registry records and portlet managers but does not assign portlets.

#### `kitconcept.core:dependencies`

Installs all required dependencies shared across distributions:

| Dependency | Profile |
|-----------|---------|
| Plone RESTAPI | `plone.restapi:default` |
| Plone Volto | `plone.volto:default` |
| Collective Person | `collective.person:default` |
| Volto Light Theme | `kitconcept.voltolighttheme:default` |
| Volto Form Support | `collective.volto.formsupport:default` |
| Social Media Support | `plonegovbr.socialmedia:default` |

Also configures: content types, versioning, catalog indexes, control panels, registry records.

### Upgrade / Migration

```{note}
The migration / upgrade warnings in the user interface no longer refer to new versions of Plone, but to new versions of `kitconcept.core` — defined in `metadata.xml` of the `kitconcept.core:base` profile.
```

After bumping the version of `kitconcept.core:base`, a new upgrade step must be created. The following is an illustrative example — use current source and destination version numbers from the codebase:

```xml
<configure
    xmlns="http://namespaces.zope.org/zope"
    xmlns:genericsetup="http://namespaces.zope.org/genericsetup"
    >

  <genericsetup:upgradeSteps
      profile="kitconcept.core:base"
      source="[PREVIOUS_VERSION]"
      destination="[NEW_VERSION]"
      >
    <genericsetup:upgradeStep
        title="Upgrade dependencies"
        handler="..utils.null_upgrade_step"
        />
    <genericsetup:upgradeDepends
        title="Update registry settings"
        import_profile="kitconcept.core:dependencies"
        import_steps="plone.app.registry"
        />
  </genericsetup:upgradeSteps>

</configure>
```

Dependencies listed in `kitconcept.core.factory.LocalAddonList` are upgraded to their latest installed version automatically when an upgrade of the base profile is run.

## Frontend Layer

The frontend is built on **Volto Light Theme (VLT)**, a Volto add-on providing the base look-and-feel, block system, and site customization behaviors.

See also:
- [Block Model](/developer/concepts/block-model)
- [Layout](/developer/concepts/layout)
- [VLT Site Customization Behaviors](/developer/reference/behaviors/voltolighttheme)
