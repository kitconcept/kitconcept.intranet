---
myst:
  html_meta:
    "description": "Upgrade Plone version in kitconcept.core"
    "property=og:description": "Upgrade Plone version in kitconcept.core"
    "property=og:title": "Upgrade Plone version in kitconcept.core"
    "keywords": "kitconcept Intranet Distribution, upgrade Plone"
---

# How to upgrade Plone in kitconcept.core

This document describes how to upgrade Plone in kitconcept.core.

```{note}
This process assumes that you have installed `uvx` in your machine.
If you haven't, please follow the instructions in the [uvx documentation](https://uvx.readthedocs.io/en/latest/installation.html).
```

1. Use the `repoplone` command, replace the version with the desired one:

```bash
$ uvx repoplone deps upgrade backend 6.1.4
```

2. Update the tests that check the Plone version in the backend.
Make a quick search for `plone_version` in the `backend/tests` folder and update the version accordingly (at the time of the writing: `backend/tests/services/system/test_system_get.py` and `backend/tests/tools/test_migration_tool.py`).

3. Create an upgrade step.
   Add an upgrade step for the `kitconcept.core:base` profile.
   First, check what changes were made in `Products.CMFPlone`, and evaluate if we need to backport these changes to our profile:
   - If a new registry configuration is created
   - Changes to default types or permissions
   We at least need a null upgrade step, so that the migration tool has a chance to upgrade dependencies.
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
        <!--  This step upgrade all dependencies of kitconcept.core -->
        <genericsetup:upgradeStep
            title="Upgrade dependencies for Plone 6.1.4"
            handler="..utils.null_upgrade_step"
            />
        <!-- Additional step updating registry settings defined in kitconcept.core:dependencies -->
        <genericsetup:upgradeDepends
            title="Adds disable_profile_links setting to kitconcept settings"
            import_profile="kitconcept.core:dependencies"
            import_steps="plone.app.registry"
            />
      </genericsetup:upgradeSteps>

    </configure>
   ```
