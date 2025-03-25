# Changelog

<!-- towncrier release notes start -->

## 1.0.0a12 (2025-03-25)


### Bugfix

- Fix hatchling packaging issue with building wheels. @ericof 

## 1.0.0a11 (2025-03-24)

No significant changes.


## 1.0.0a10 (2025-03-21)


### Breaking

- Upgrade to split customization behavior in several ones, and renamed them to use `voltolightheme`. @sneridagh [#77](https://github.com/kitconcept/kitconcept.intranet/issue/77)


### Feature

- Use released version of `kitconcept.voltolightheme`. @sneridagh [#77](https://github.com/kitconcept/kitconcept.intranet/issue/77)
- Remove local development of the customization behaviors after transfer them to `kitconcept.voltolightheme`. @sneridagh [#77](https://github.com/kitconcept/kitconcept.intranet/issue/77)


### Internal

- Add script to dump constraints from pyproject.toml to a constraints.txt file during Docker image build @ericof 
- Fix ruff configuration for isort @ericof 
- On GitHub, add a workflow to check a PR has changelog entries @ericof 
- Upgrade plone.distribution to version 3.1.1 @ericof 
- Upgrade plone.restapi to version 9.13.0 @ericof 

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
