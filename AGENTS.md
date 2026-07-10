# AGENTS.md

This file applies to the repository root and all subdirectories unless a deeper `AGENTS.md` overrides it.
When working inside `frontend/core`, always read the closer Volto `AGENTS.md` files there first.

## Repository Overview

This repository is the `kitconcept.intranet` monorepo: a Plone distribution with backend, frontend, docs, and deployment support.
It is split into three main working areas plus project-wide tooling:

- `backend/` - Plone backend, policy/distribution package, Python toolchain, site creation/export helpers
- `frontend/` - Volto-based frontend workspace, including the `@kitconcept/intranet` package and acceptance tests
- `docs/` - project documentation
- `devops/`, `docker-compose*.yml`, root `Makefile` - deployment, local stack, CI, and orchestration

## Monorepo Rules

- Treat the repo as a coordinated backend/frontend distribution, not as a standalone Volto package.
- Prefer the root `Makefile` for cross-stack tasks and the local `backend/` or `frontend/` Makefiles for area-specific work.
- Use `pnpm`; do not introduce `npm` or top-level `yarn` workflows.
- Keep changes scoped to the relevant area. Do not touch both backend and frontend unless the feature or bug actually spans both.
- Preserve existing generated/example content workflows in `backend/`; exported content can be intentional product data, not disposable fixtures.

## Frontend Model

- `frontend/` is a pnpm workspace with a local Volto development setup.
- The main project package is `frontend/packages/kitconcept-intranet`.
- Most project-specific frontend work lives under `frontend/packages/kitconcept-intranet/src`.
- `frontend/core` is a vendored Volto core workspace. Do not touch it for normal repo work; treat it as upstream core Volto code that is out of scope unless the user explicitly asks for a core Volto change.
- Customizations, block configuration, theme styles, slots, and acceptance coverage are all part of the frontend package surface and often need coordinated updates.

## Default Validation Commands

Run the narrowest command set that matches the area you changed.

Whole repo:

```sh
make format
make lint
make test
```

Frontend only:

```sh
make -C frontend format
make -C frontend lint
make -C frontend test
```

Backend only:

```sh
make -C backend format
make -C backend lint
make -C backend test
```

## Post-Edit Rule

- After any code edit, run the linting and formatting pass for the affected area before finishing.
- For frontend changes, that means at minimum:

```sh
make -C frontend format
make -C frontend lint
```

- For backend changes, run the backend equivalents.
- If a change spans both stacks, run the root `make format` and `make lint`.

## Acceptance Tests

There are two acceptance-test paths in this repo:

- Playwright: current and preferred
- Cypress: legacy coverage kept for older tests and workflows

Prefer Playwright for new acceptance coverage and when updating existing tests around active features.
Cypress tests are considered legacy/obsolete and should only be extended when there is a concrete reason you cannot cover the scenario in Playwright yet.

Primary Playwright commands:

```sh
pnpm --dir frontend --filter @kitconcept/intranet test:acceptance
pnpm --dir frontend --filter @kitconcept/intranet test:acceptance:a11y
```

Playwright tests live under `frontend/acceptance/tests`.
They run through `frontend/playwright.config.ts` and are configured serially (`workers: 1`) because tests can conflict while creating and deleting content.

Legacy Cypress commands:

```sh
make -C frontend acceptance-test
make -C frontend ci-acceptance-test
make -C frontend acceptance-a11y-test
make -C frontend ci-acceptance-a11y-test
```

Use the Cypress path mainly to maintain or debug existing legacy specs under `frontend/cypress/tests`.

## Editing Rules

- Read the nearest `AGENTS.md` before editing.
- Preserve the existing `Makefile`-driven workflows; do not replace them with ad hoc commands in docs or automation without a reason.
- Be careful with `mrs.developer.json`, local workspace overrides, and the vendored/frontend core relationship.
- When changing frontend behavior, consider whether the change belongs in `frontend/packages/kitconcept-intranet` or in the vendored Volto core area.
- When changing exported backend content or distribution setup, verify whether the change affects demo data, installation defaults, or test fixtures.
