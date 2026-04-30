---
myst:
  html_meta:
    "description": "kitconcept.core how-to guides"
    "property=og:description": "kitconcept.core how-to guides"
    "property=og:title": "kitconcept.core how-to guides"
    "keywords": "Plone, kitconcept.core, how-to, guides"
---

# What is `kitconcept.core`?

It is a backend and frontend setup that serves as the baseline and foundation for all kitconcept GmbH distributions built on top of Plone.

It includes common features, add-ons, configuration, best practices, and shared components that are used across multiple projects.

## Backend Package

Named [`kitconcept.core`](https://pypi.org/project/kitconcept.core/), the backend package provides all the building blocks needed to create a new Plone-based distribution.

### Site creation

This package enhances `Products.CMFPlone`'s site creation mechanism by allowing a new base profile—rather than `Products.CMFPlone:plone`—to signal to the upgrade machinery that a new version is available.

To do so, `kitconcept.core` specializes the MigrationTool `kitconcept.core.tool.migration.MigrationTool` to support a new base profile and a dynamic list of dependencies. We use `kitconcept.core.factory.add_site`—instead of
 `Products.CMFPlone.factory.addPloneSite`—to work with this enhanced MigrationTool.

### Generic Setup profiles

When you run a Generic Setup profile, the order of execution is:

* Run the pre_handler defined in the profile registration
* Install the dependencies listed on `metadata.xml`, in the order they are defined
* Run every other import step defined in the profile (XML files)
* Run the post_handler defined in the profile registration

Considering this order, we need more than one profile to complete site creation, and based on the existing logic from `Products.CMFPlone`, we created distinct profiles:

#### `kitconcept.core:base`

The first profile is a replacement for `Products.CMFPlone:plone`. It defines the Dexterity content type definition for `Plone Site`. This is required to create the site instance.

This profile also contains configuration that does not require the Plone Site creation to be finalized, such as registering workflows, permissions, and the catalog.

The profile `metadata.xml` has no dependencies on other Generic Setup profiles and defines the "version" for kitconcept.core.

There is a post_handler script (`kitconcept.core.setuphandlers.base.import_final_steps`) that finalizes site creation by:

* Initialize the MigrationTool by setting the base profile and package.
* Purge profile versions on `portal_setup`
* Set the initial version on `portal_setup`
* Run the `kitconcept.core:cmfdependencies` profile
* Run the `kitconcept.core:dependencies` profile
* Run additional functions to set up the site:
  * `Products.CMFPlone.setuphandlers.replace_local_role_manager`
  * `Products.CMFPlone.setuphandlers.addCacheHandlers`
  * `Products.CMFPlone.setuphandlers.first_weekday_setup`
  * `Products.CMFPlone.setuphandlers.timezone_setup`


#### `kitconcept.core:cmfdependencies`

This profile is a replacement for `Products.CMFPlone:dependencies` and installs core add-ons—using their Generic Setup profiles—that implement features required by other add-ons and the distributions (i.e., the registry, portlets, theming, and versioning).

This profile installs a list of other profiles during its installation (examples: `Products.CMFEditions:CMFEditions`, `plone.app.registry:default`, `plone.app.users:default`).

In `Products.CMFPlone`, registry records, portlet managers, and assignments are set by this profile. In our profile, we keep the registry records and portlet managers (to avoid issues with third-party add-ons), but do not assign any portlet.

#### `kitconcept.core:dependencies`

The third profile is the one with all the settings we want to be shared across all our distributions.

This profile will install our required dependencies:

* *Plone RESTAPI* (`plone.restapi:default`)
* *Plone Volto* (`plone.volto:default`)
* *Collective Person* (`collective.person:default`)
* *Volto Light Theme* (`kitconcept.voltolighttheme:default`)
* *Volto Form Support* (`collective.volto.formsupport:default`)
* *Social Media Support* (`plonegovbr.socialmedia:default`)

Also, it sets:

* Content types
* Versioning
* Catalog indexes and metadata
* Control panels
* Registry records

### Upgrade / Migration

```{note}
The migration / upgrade warnings in the user interface no longer refer to new versions of Plone, but new versions of `kitconcept.core` -- defined in the `metadata.xml` of the `kitconcept.core:base` Generic Setup profile.
```

After bumping the version of `kitconcept.core:base`, we need to create a new upgrade step, like the one below:

```xml
<configure
    xmlns="http://namespaces.zope.org/zope"
    xmlns:genericsetup="http://namespaces.zope.org/genericsetup"
    >

  <genericsetup:upgradeSteps
      profile="kitconcept.core:base"
      source="20251209001"
      destination="20260122001"
      >
    <genericsetup:upgradeStep
        title="Upgrade dependencies for Plone 6.1.4"
        handler="..utils.null_upgrade_step"
        />
    <genericsetup:upgradeDepends
        title="Adds disable_profile_links setting to kitconcept settings"
        import_profile="kitconcept.core:dependencies"
        import_steps="plone.app.registry"
        />
  </genericsetup:upgradeSteps>

</configure>
```

Dependencies listed on `kitconcept.core.factory.LocalAddonList` will be upgraded to their latest installed version automatically when an upgrade of the base profile is run.
