---
myst:
  html_meta:
    "description": "Upgrade a distribution-based frontend project using make upgrade"
    "property=og:description": "Upgrade a distribution-based frontend project using make upgrade"
    "property=og:title": "Upgrade a distribution-based frontend project using make upgrade"
    "keywords": "kitconcept distribution, make upgrade, volto distribution upgrade"
---

# How to upgrade a distribution-based project

Use this guide in projects based on a frontend distribution where `frontend/Makefile` provides an `upgrade` target.

## Prerequisites

- `repository.toml` contains `[frontend.package]` with:
  - `base_package`
  - `path`
- The add-on package at `path` declares the distribution package in `package.json`.
- `frontend/scripts/upgrade-distribution.js` exists in the project.
- `frontend/Makefile` has an `upgrade` target that runs:

```makefile
upgrade:
  node scripts/upgrade-distribution.js
  pnpm exec prettier --log-level silent --write volto.config.js
```

For setup details, see [](/how-to-guides/ensure-versions-distribution-projects).

## Upgrade steps

1. From the project root, run:

   ```bash
   make -C frontend upgrade
   ```

   or

   ```bash
   cd frontend
   make upgrade
   ```

2. Install and sync dependencies:

   ```bash
   make frontend-install
   ```

3. Review generated changes in:
   - `frontend/volto.config.js`
   - `frontend/mrs.developer.json`

4. Run tests:

   ```bash
   make test
   ```

## What `make upgrade` updates

- Rewrites `frontend/volto.config.js` distribution block with:
  - distribution `name`
  - distribution `version`
  - resolved `volto_version`
  - distribution `dependencies`
- Preserves existing `addons` and `theme` in `volto.config.js`.
- Updates `frontend/mrs.developer.json` with the resolved `core.tag` (`volto_version`).
