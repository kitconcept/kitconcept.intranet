# Changelog

<!-- towncrier release notes start -->
## 1.0.0b4 (2025-06-10)

### Backend


#### Bugfix

- Remove behaviors, since they are set in core. @sneridagh 


#### Internal

- Add example content of Sticky menu ,Person content type and update footer example
  content and background color @iRohitSingh 
- Adds test to /@system get endpoint. @ericof 
- Update to kitconcept/core 1.0.0a8. @sneridagh 



### Frontend

#### Internal

- Update to kitconcept/core 1.0.0a8. @sneridagh 



### Project

No significant changes.




## 1.0.0b3 (2025-05-23)

### Backend


#### Feature

- Support external authentication with pas.plugins.oidc and pas.plugins.authomatic. @ericof [#101](https://github.com/kitconcept/kitconcept.intranet/issue/101)
- Site creation form now allows you to select which type of authentication do you want to setup. @ericof 


#### Bugfix

- Development: Fixed typos in backend/Makefile that prevented the creation of new sites. @ericof 


#### Internal

- Moved c.person to k.core. @sneridagh 
- Upgrade kitconcept.core to version 1.0.0a5. @ericof 



### Frontend

#### Internal

- Upgrade @kitconcept/core to version 1.0.0-alpha.5. @ericof 
- Upgrade @plone/volto to version 18.22.0. @ericof 



### Project


#### Documentation

- Update README.md with screenshots of new site creation. @ericof [#101](https://github.com/kitconcept/kitconcept.intranet/pull/101)



## 1.0.0b2 (2025-05-15)

### Backend


#### Feature

- Upgrade kitconcept.core to version 1.0.0a3. @ericof 



### Frontend

#### Feature

- Upgrade @kitconcept/core to version 1.0.0-alpha.3. @ericof 

#### Internal

- Update to Volto 18.20.0 and remove duplicated add-ons declarations. @sneridagh [#102](https://github.com/kitconcept/kitconcept.intranet/issue/102)



### Project

No significant changes.




## 1.0.0b1 (2025-05-13)

### Backend


#### Breaking

- The adoption of kitconcept.core breaks existing installations. Please refer to the documentation about how to migrate to this new version. @ericof 


#### Feature

- Added control panel for global project intranet settings. @sneridagh [#98](https://github.com/kitconcept/kitconcept.intranet/issue/98)
- Use kitconcept.core version 1.0.0a2 @ericof 


#### Internal

- Added missing update of `uv.lock`. @sneridagh 
- Pin Python version to 3.12 @ericof 



### Frontend

#### Breaking

- The adoption of @kitconcept/core could break existing customizations @ericof 

#### Feature

- Added support for adding custom_css in a slot using Helmet @sneridagh 
- Use @kitconcept/core version 1.0.0-alpha.2 @ericof 



### Project


#### Internal

- Replace references to PLONE_VERSION (plone-version) by kc-version @ericof 



## 1.0.0a18 (2025-05-07)

### Backend


#### Internal

- Force Intranet header and intranet flag default content in example content. @sneridagh [#91](https://github.com/kitconcept/kitconcept.intranet/issue/91)
- Upgrade to VLT 6.0.0a24. @sneridagh 



### Frontend

#### Internal

- Upgrade to VLT 6.0.0a24. @sneridagh 



### Project

No significant changes.




## 1.0.0a17 (2025-04-02)

### Backend


#### Bugfix

- Container: Keep python packages installed by plone/server-builder image. @ericof [#89](https://github.com/kitconcept/kitconcept.intranet/issue/89)



### Frontend

No significant changes.


### Project

No significant changes.




## 1.0.0a16 (2025-04-02)

### Backend

No significant changes.




### Frontend

No significant changes.


### Project


#### Bugfix

- GHA: Fix issues with tag workflow @ericof 



## 1.0.0a15 (2025-04-02)

### Backend


#### Feature

- Upgrade Products.CMFPlone to version 6.1.1 @ericof [#86](https://github.com/kitconcept/kitconcept.intranet/issue/86)
- Force kitconcept.voltolighttheme version 6.0.0a21 @ericof 



### Frontend

No significant changes.


### Project


#### Internal

- GHA: Deploy only on new Tags, not on pushes to main @ericof 



## 1.0.0a14 (2025-04-02)

### Backend

No significant changes.




### Frontend

#### Feature

- Unify usage of header actions. @sneridagh [#85](https://github.com/kitconcept/kitconcept.intranet/issue/85)
- New site customization settings: `has_intranet_header`, `has_fat_menu`. @sneridagh [#85](https://github.com/kitconcept/kitconcept.intranet/issue/85)
- Update to VLT 6a21. @sneridagh [#88](https://github.com/kitconcept/kitconcept.intranet/issue/88)

#### Internal

- Update to Volto 18.11.0 and VLT 6a20. @sneridagh [#85](https://github.com/kitconcept/kitconcept.intranet/issue/85)



### Project

No significant changes.




## 1.0.0a13 (2025-04-01)

### Backend

No significant changes.




### Frontend

No significant changes.


### Project


#### Bugfix

- GHA: Fix manual_deploy workflow not working for branches other than main. @ericof 
- The docker-compose.yml shipped here does not need a database (or relstorage) @ericof 


#### Internal

- GHA: Update docker/build-push-action to v6 @ericof 
- Refactor container image creation for beispiele. @ericof 



## 1.0.0a12 (2025-03-25)

### Backend


#### Bugfix

- Fix hatchling packaging issue with building wheels. @ericof 



### Frontend

#### Feature

- Upgrade to VLT 6a19. @sneridagh [#84](https://github.com/kitconcept/kitconcept.intranet/issue/84)



### Project

No significant changes.




## 1.0.0a11 (2025-03-24)

### Backend

No significant changes.




### Frontend

#### Internal

- Update to use latest VLT 6a18. @sneridagh [#82](https://github.com/kitconcept/kitconcept.intranet/issue/82)



### Project


#### Internal

- Allow entries on the repository changelog @ericof 
- Fix backend service name reference on the frontend service. @ericof 
- GHA: Update changelog workflow. @ericof 
- Use beispile image, by default, for docker-compose.yml. @ericof 



## 1.0.0a10 (2025-03-21)

### Backend


#### Breaking

- Upgrade to split customization behavior in several ones, and renamed them to use `voltolightheme`. @sneridagh [#77](https://github.com/kitconcept/kitconcept.intranet/issue/77)


#### Feature

- Use released version of `kitconcept.voltolightheme`. @sneridagh [#77](https://github.com/kitconcept/kitconcept.intranet/issue/77)
- Remove local development of the customization behaviors after transfer them to `kitconcept.voltolightheme`. @sneridagh [#77](https://github.com/kitconcept/kitconcept.intranet/issue/77)


#### Internal

- Add script to dump constraints from pyproject.toml to a constraints.txt file during Docker image build @ericof 
- Fix ruff configuration for isort @ericof 
- On GitHub, add a workflow to check a PR has changelog entries @ericof 
- Upgrade plone.distribution to version 3.1.1 @ericof 
- Upgrade plone.restapi to version 9.13.0 @ericof 



### Frontend

#### Internal

- Update to use Volto 18.10.1 and adjustments for new VLT package layout. @sneridagh [#77](https://github.com/kitconcept/kitconcept.intranet/issue/77)
- Move to a released version of `@kitconcept/volto-light-theme`. @sneridagh [#77](https://github.com/kitconcept/kitconcept.intranet/issue/77)
- On GitHub, add a workflow to check a PR has changelog entries @ericof 



## 1.0.0a9 (2025-03-12)

### Backend


#### Feature

- Use plone.exportimport 1.1.0 @ericof 


#### Internal

- Add a target $(VENV_FOLDER) to the backend Makefile as an alias to install. @ericof 



### Frontend

No significant changes.


## 1.0.0a8 (2025-03-11)

### Backend


#### Feature

- Adds preview_image_link behavior to Link, Event, News Item, Image, File, Person content types @sneridagh 


#### Bugfix

- Upgrade to plone.autoinclude 2.0.0 [@ericof] 


#### Internal

- Refactor backend installation [@ericof] [#69](https://github.com/kitconcept/kitconcept.intranet/issue/69)



### Frontend

#### Feature

- Update @plone/volto to version 18.9.2 @sneridagh 
- Update volto-banner-block to latest, add dependencies. @sneridagh 



## 1.0.0a6 (2025-03-05)

### Backend

No significant changes.




### Frontend



## 1.0.0a5 (2025-02-12)

### Backend


#### Feature

- Upgrade Plone to version 6.1.0 [@ericof] [#64](https://github.com/kitconcept/kitconcept.intranet/issue/64)



### Frontend

#### Feature

- Upgrade Volto to version 18.8.2 [@ericof] [#65](https://github.com/kitconcept/kitconcept.intranet/issue/65)

#### Bugfix

- Install corepack on the frontend image to avoid requiring internet connection during startup [@ericof] [#62](https://github.com/kitconcept/kitconcept.intranet/issue/62)



## 1.0.0a4 (2025-02-06)

### Backend

No significant changes.




### Frontend

#### Internal

- Fix Docker image generation [@ericof] 



## 1.0.0a3 (2025-02-06)

### Backend


#### Internal

- Allow use of environment variables for create-site script [@ericof] [#55](https://github.com/kitconcept/kitconcept.intranet/issue/55)



### Frontend



## 1.0.0a2 (2024-10-01)

### Backend


#### Bugfix

- Generate Docker images on tag creation [@ericof] [#51](https://github.com/kitconcept/kitconcept.intranet/issue/51)


#### Internal

- Fixes a warning in the Acceptance tests docker image creation [@ericof] 
- Improve GHA to generate the backend Docker image [@ericof] 
- Release ghcr.io/kitconcept/kitconcept-intranet-backend image with tags [@ericof] 



### Frontend

#### Internal

- Release ghcr.io/kitconcept/kitconcept-intranet-frontend image with tags [@ericof] 



## 1.0.0a0 (2024-10-01)

### Backend


#### Feature

- Initial version of kitconcept.intranet [@tisto] [#1](https://github.com/kitconcept/kitconcept.intranet/issue/1)
- Make public workflow the default workflow for new Intranets [@ericof] [#2](https://github.com/kitconcept/kitconcept.intranet/issue/2)
- Provide two options of workflow: One for public intranets, the other one for intranets that require authentication [@ericof] [#48](https://github.com/kitconcept/kitconcept.intranet/issue/48)


#### Bugfix

- Fix dos_protection error [@reebalazs] [#9](https://github.com/kitconcept/kitconcept.intranet/issue/9)


#### Internal

- Apply plone/meta [@ericof] [#7](https://github.com/kitconcept/kitconcept.intranet/issue/7)
- Upgrade backend to use ruff, hatch and uv [@ericof] [#49](https://github.com/kitconcept/kitconcept.intranet/issue/49)



### Frontend

#### Feature

- Initial version of kitconcept.intranet [@tisto] [#1](https://github.com/kitconcept/kitconcept.intranet/issue/1)



