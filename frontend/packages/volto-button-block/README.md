<picture>
  <source align="right" width="200" media="(prefers-color-scheme: dark)" srcset="https://kitconcept.com/kitconcept-white.svg">
  <img align="right" width="200" alt="kitconcept, GmbH" src="https://kitconcept.com/kitconcept-black.svg">
</picture>

# Volto Button Block

[![BlockModelv3 Ready](https://github.com/kitconcept/volto-light-theme/blob/main/BMv3-ready.svg)](https://github.com/kitconcept/volto-light-theme/blob/91039fcab0f7709fd28ea8b8a8f9e7c86291a8dd/BLOCK-MODEL-V3.md)
[![NPM](https://img.shields.io/npm/v/@kitconcept/volto-button-block.svg)](https://www.npmjs.com/package/@kitconcept/volto-button-block)
[![Build Status](https://github.com/kitconcept/volto-button-block/actions/workflows/code.yml/badge.svg)](https://github.com/kitconcept/volto-button-block/actions)
[![Build Status](https://github.com/kitconcept/volto-button-block/actions/workflows/unit.yml/badge.svg)](https://github.com/kitconcept/volto-button-block/actions)
[![Build Status](https://github.com/kitconcept/volto-button-block/actions/workflows/acceptance.yml/badge.svg)](https://github.com/kitconcept/volto-button-block/actions)

The Volto Button Block allows editors to add a configurable button to a Volto page.

## Screenshot

![Button-Block](https://github.com/kitconcept/volto-button-block/raw/main/screenshot.png)

## Screencast

![Button-Block](https://github.com/kitconcept/volto-button-block/raw/main/screencast.gif)

## Upgrade Guide

### Support for Block Model v3

A new block model it's being developed by the community.
This block model will change some internal structures in the Volto Block Engine.
The new Block Model v3 will be implemented and supported initially by `@kitconcept/volto-light-theme` in its next major release.
Later on, when it's a reality and it's polished and tested, it might be ported to Volto core.
Read more about the [Block Model v3](https://github.com/kitconcept/volto-light-theme/blob/91039fcab0f7709fd28ea8b8a8f9e7c86291a8dd/BLOCK-MODEL-V3.md).
This add-on is compatible with the Block Model v3 from 3.x series on, via an opt-in flag (`blockModel`).
The flag will be opt-in during the 3.x series of this package.
After 4.x is released, the Block Model v3 will be the default for this add-on and the flag will be removed (no opt-out configuration option will exist).

Example of the usage of the flag:

```js
config.blocks.blocksConfig.__button.blockModel = 3;
```

### SemanticUI support

The 3.x series will be the last one to support a SemanticUI button.
The 4.x version will support `@plone/components` `Button` component only.

## Installation

To install your project, you must choose the method appropriate to your version of Volto.


### Volto 17 and earlier

Create a new Volto project (you can skip this step if you already have one):

```
npm install -g yo @plone/generator-volto
yo @plone/volto my-volto-project --addon @kitconcept/volto-button-block
cd my-volto-project
```

Add `@kitconcept/volto-button-block`to your package.json:

```JSON
"addons": [
    "@kitconcept/volto-button-block"
],

"dependencies": {
    "@kitconcept/volto-button-block": "*"
}
```

Download and install the new add-on by running:

```
yarn install
```

Start Volto with:

```
yarn start
```

### Volto 18 and later

Add `@kitconcept/volto-button-block` to your `package.json`:

```json
"dependencies": {
    "@kitconcept/volto-button-block": "*"
}
```

Add `@kitconcept/volto-button-block` to your `volto.config.js`:

```javascript
const addons = ['@kitconcept/volto-button-block'];
```

If this package provides a Volto theme, and you want to activate it, then add the following to your `volto.config.js`:

```javascript
const theme = '@kitconcept/volto-button-block';
```

## Test installation

Visit http://localhost:3000/ in a browser, login, and check the awesome new features.


## Development

The development of this add-on is done in isolation using a new approach using pnpm workspaces and latest `mrs-developer` and other Volto core improvements.
For this reason, it only works with pnpm and Volto 18 (currently in alpha).


### Pre-requisites

-   [Node.js](https://6.docs.plone.org/install/create-project.html#node-js)
-   [Make](https://6.docs.plone.org/install/create-project.html#make)
-   [Docker](https://6.docs.plone.org/install/create-project.html#docker)


### Make convenience commands

Run `make help` to list the available commands.

```text
help                             Show this help
install                          Installs the add-on in a development environment
start                            Starts Volto, allowing reloading of the add-on during development
build                            Build a production bundle for distribution of the project with the add-on
i18n                             Sync i18n
ci-i18n                          Check if i18n is not synced
format                           Format codebase
lint                             Lint, or catch and remove problems, in code base
release                          Release the add-on on npmjs.org
release-dry-run                  Dry-run the release of the add-on on npmjs.org
test                             Run unit tests
ci-test                          Run unit tests in CI
backend-docker-start             Starts a Docker-based backend for development
storybook-start                  Start Storybook server on port 6006
storybook-build                  Build Storybook
acceptance-frontend-dev-start    Start acceptance frontend in development mode
acceptance-frontend-prod-start   Start acceptance frontend in production mode
acceptance-backend-start         Start backend acceptance server
ci-acceptance-backend-start      Start backend acceptance server in headless mode for CI
acceptance-test                  Start Cypress in interactive mode
ci-acceptance-test               Run cypress tests in headless mode for CI
```

### Development environment set up

Install package requirements.

```shell
make install
```

### Start developing

Start the backend.

```shell
make backend-docker-start
```

In a separate terminal session, start the frontend.

```shell
make start
```

### Lint code

Run ESlint, Prettier, and Stylelint in analyze mode.

```shell
make lint
```

### Format code

Run ESlint, Prettier, and Stylelint in fix mode.

```shell
make format
```

### i18n

Extract the i18n messages to locales.

```shell
make i18n
```

### Unit tests

Run unit tests.

```shell
make test
```

### Run Cypress tests

Run each of these steps in separate terminal sessions.

In the first session, start the frontend in development mode.

```shell
make acceptance-frontend-dev-start
```

In the second session, start the backend acceptance server.

```shell
make acceptance-backend-start
```

In the third session, start the Cypress interactive test runner.

```shell
make acceptance-test
```

## License

The project is licensed under the MIT license.

## Credits and Acknowledgements 🙏

Crafted with care by **This was generated by [cookiecutter-volto](https://github.com/plone/cookiecutter-volto/frontend_addon) on 2024-06-10 14:31:29**. A special thanks to all contributors and supporters!


# Credits

<img alt="Forschungszentrum Jülich" src="https://github.com/kitconcept/volto-blocks/raw/master/fz-juelich.svg" width="200px" />

The development of this plugin has been kindly sponsored by [Forschungszentrum Jülich](https://fz-juelich.de).
