---
myst:
  html_meta:
    "description": "Ensure versions in distribution projects via an instance script"
    "property=og:description": "Ensure versions in distribution projects via an instance script"
    "property=og:title": "Ensure versions in distribution projects via an instance script"
    "keywords": "kitconcept distribution, ensuring versions, distribution projects, instance script"
---

# How to configure a project based on a distribution to ensure versions are consistent with the distribution

When you have a project that is based on a distribution, we need to make sure that the versions of the frontend packages in the project are consistent with the versions in the distribution and that these versions are all in sync across all the build.

We achieve the enforcement of the versions by running a script `upgrade-distribution.js` along with a custom `pnpm` configuration via `.pnpmfile.cjs` that ensures the distribution versions are used when installing dependencies.

We can set up this script and configuration in any project based on a distribution, and in the future we will include it in the `frontend` template for kitconcept projects based on a distribution.

## `upgrade-distribution.js`

`frontend/scripts/upgrade-distribution.js` keeps local frontend distribution config in sync with `repository.toml` and the add-on package dependencies.

### What it reads

- `repository.toml` (`[frontend.package]`):
  - `base_package` (distribution package name)
  - `path` (path to the frontend add-on package)
- `<path>/package.json`: finds the distribution version declared for `base_package`
- npm metadata via `pnpm view`:
  - distribution `dependencies`
  - distribution `volto_version` (falls back to installed package `volto_version`)
- existing `frontend/volto.config.js` (only to preserve `addons` and `theme`)

### What it writes

- `frontend/volto.config.js`
  - rewrites the file
  - preserves existing `addons` and `theme`
  - updates `distribution` to:
    - `name`
    - `version`
    - `volto_version`
    - `dependencies`
- `frontend/mrs.developer.json`
  - sets `core.tag` to the resolved distribution `volto_version`

### How Makefile uses it

In `frontend/Makefile`, target `upgrade` runs:

1. `node scripts/upgrade-distribution.js`
1. `pnpm exec prettier --log-level silent --write volto.config.js`

This means the script is the first step that updates the files it controls (`volto.config.js` and `mrs.developer.json`) before dependency resolution and installation.

## Setting up `upgrade-distribution.js` and the configuration

In the future it will be included in the `frontend` template for kitconcept projects based on a distribution.

For now, you can follow these instructions:

1. Copy it from `frontend/scripts/upgrade-distribution.js` in this repository to your project `frontend/scripts` folder. Create `frontend/scripts` if it doesn't exist in your project.
1. Make sure to have a `repository.toml` in your project root with the required fields (`[frontend.package]` with `base_package` and `path`).
1. Make sure to have the distribution package declared as a dependency in your add-on `package.json`.
1. Copy `frontend/scripts/.pnpmfile.cjs` to your project `frontend` folder.
1. Amend your `frontend/Makefile` to add a new `upgrade` command. It should look like this:

```makefile
upgrade:
    node scripts/upgrade-distribution.js
	pnpm exec prettier --log-level silent --write volto.config.js
```

1. Copy `frontend/scripts/internalChecks.test.ts` to your add-on `src` folder. This will add a test that checks that the distribution versions are consistent with the distribution package dependencies. You might have to install `vitest` as a dev dependency to run the test.
1. Run `make upgrade` from your `frontend` folder to trigger the update and install flow.
1. Check the changes in `frontend/volto.config.js` and `frontend/mrs.developer.json` to verify the update.
1. Run the tests `make test` to verify the internal check.
