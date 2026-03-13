---
myst:
  html_meta:
    "description": "Upgrade add-on dependencies in kitconcept.core"
    "property=og:description": "Upgrade add-on dependencies in kitconcept.core"
    "property=og:title": "Upgrade add-on dependencies in kitconcept.core"
    "keywords": "kitconcept Intranet Distribution, upgrade"
---

# How to upgrade an add-on dependency in kitconcept.core

This document describes how to upgrade the version of an add-on in kitconcept.core.

```{note}
This process assumes that you have installed `uvx` in your machine.
If you haven't, please follow the instructions in the [uvx documentation](https://uvx.readthedocs.io/en/latest/installation.html).
```

1. Update the add-on version on the `dependencies` key of `backend/pyproject.toml`. (example: `kitconcept.voltolighttheme>=8.0.0`)

2. Run `make upgrade` to update the lockfile

3. Create an upgrade step on `kitconcept.core:base` profile.
   We at least need a null upgrade step, so that the migration tool has a chance to upgrade all dependencies listed on `kitconcept.core.factory.LocalAddonList`.
   ```xml
       <genericsetup:upgradeStep
        title="Upgrade dependencies"
        handler="..utils.null_upgrade_step"
        />
   ```

4. Add other steps to modify settings if needed.
