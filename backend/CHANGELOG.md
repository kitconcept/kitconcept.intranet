# Changelog

<!-- towncrier release notes start -->
## 1.0.0a9 (2025-03-12)


### Feature

- Use plone.exportimport 1.1.0 @ericof


### Internal

- Add a target $(VENV_FOLDER) to the backend Makefile as an alias to install. @ericof


## 1.0.0a8 (2025-03-11)

### Feature

- Adds preview_image_link behavior to Link, Event, News Item, Image, File, Person content types @sneridagh


### Bugfix

- Upgrade to plone.autoinclude 2.0.0 [@ericof]


### Internal

- Refactor backend installation [@ericof] [#69](https://github.com/kitconcept/kitconcept.intranet/issue/69)


## 1.0.0a7 (2025-03-05)

No significant changes.


## 1.0.0a6 (2025-02-12)


### Feature

- Upgrade Plone to version 6.1.0 [@ericof] [#64](https://github.com/kitconcept/kitconcept.intranet/issue/64)

## 1.0.0a5 (2025-02-06)

No significant changes.


## 1.0.0a4 (2025-02-06)


### Internal

- Allow use of environment variables for create-site script [@ericof] [#55](https://github.com/kitconcept/kitconcept.intranet/issue/55)

## 1.0.0a3 (2024-10-01)


### Bugfix

- Generate Docker images on tag creation [@ericof] [#51](https://github.com/kitconcept/kitconcept.intranet/issue/51)


### Internal

- Fixes a warning in the Acceptance tests docker image creation [@ericof]
- Improve GHA to generate the backend Docker image [@ericof]
- Release ghcr.io/kitconcept/kitconcept-intranet-backend image with tags [@ericof]

## 1.0.0a0 (2024-10-01)


### Feature

- Initial version of kitconcept.intranet [@tisto] [#1](https://github.com/kitconcept/kitconcept.intranet/issue/1)
- Make public workflow the default workflow for new Intranets [@ericof] [#2](https://github.com/kitconcept/kitconcept.intranet/issue/2)
- Provide two options of workflow: One for public intranets, the other one for intranets that require authentication [@ericof] [#48](https://github.com/kitconcept/kitconcept.intranet/issue/48)


### Bugfix

- Fix dos_protection error [@reebalazs] [#9](https://github.com/kitconcept/kitconcept.intranet/issue/9)


### Internal

- Apply plone/meta [@ericof] [#7](https://github.com/kitconcept/kitconcept.intranet/issue/7)
- Upgrade backend to use ruff, hatch and uv [@ericof] [#49](https://github.com/kitconcept/kitconcept.intranet/issue/49)
