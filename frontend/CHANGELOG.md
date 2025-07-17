# Changelog

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/volto/developer-guidelines/contributing.html#create-a-pull-request
-->

<!-- towncrier release notes start -->

## 1.0.0-beta.6 (2025-07-17)

### Internal

- Transfer and adjust acceptance tests from VLT. @iRohitSingh @sneridagh [#137](https://github.com/kitconcept/kitconcept.intranet/issue/137)
- Added new event calendar block.
  Added `footer_main_logo_inversed` image field to kitconcept.footer behavior, and related frontend code.
  Several fixes.
  Update to core 1a12. @sneridagh 
- Update to core 1a13. @sneridagh 

### Test

- Add cypress test for navigation_title, kicker and Breadcrumbs @iRohitSingh 

## 1.0.0-beta.5 (2025-06-30)

### Bugfix

- Fixed default `selectedItemAttrs` for Teaser to include Person specific attributes. Update to kitconcept.core 1.0.0a11. @sneridagh 
- Several bugfixes. Update to Volto 18.23.0 and kitconcept.core 1.0.0a9. @sneridagh 
- Several bugfixes. Update to kitconcept.core 1.0.0a10. @sneridagh 

## 1.0.0-beta.4 (2025-06-10)

### Internal

- Update to kitconcept/core 1.0.0a8. @sneridagh 

## 1.0.0-beta.3 (2025-05-23)

### Internal

- Upgrade @kitconcept/core to version 1.0.0-alpha.5. @ericof 
- Upgrade @plone/volto to version 18.22.0. @ericof 

## 1.0.0-beta.2 (2025-05-15)

### Feature

- Upgrade @kitconcept/core to version 1.0.0-alpha.3. @ericof 

### Internal

- Update to Volto 18.20.0 and remove duplicated add-ons declarations. @sneridagh [#102](https://github.com/kitconcept/kitconcept.intranet/issue/102)

## 1.0.0-beta.1 (2025-05-13)

### Breaking

- The adoption of @kitconcept/core could break existing customizations @ericof 

### Feature

- Added support for adding custom_css in a slot using Helmet @sneridagh 
- Use @kitconcept/core version 1.0.0-alpha.2 @ericof 

## 1.0.0-alpha.18 (2025-05-07)

### Internal

- Upgrade to VLT 6.0.0a24. @sneridagh 

## 1.0.0-alpha.17 (2025-04-02)

## 1.0.0-alpha.16 (2025-04-02)

## 1.0.0-alpha.15 (2025-04-02)

## 1.0.0-alpha.14 (2025-04-02)

### Feature

- Unify usage of header actions. @sneridagh [#85](https://github.com/kitconcept/kitconcept.intranet/issue/85)
- New site customization settings: `has_intranet_header`, `has_fat_menu`. @sneridagh [#85](https://github.com/kitconcept/kitconcept.intranet/issue/85)
- Update to VLT 6a21. @sneridagh [#88](https://github.com/kitconcept/kitconcept.intranet/issue/88)

### Internal

- Update to Volto 18.11.0 and VLT 6a20. @sneridagh [#85](https://github.com/kitconcept/kitconcept.intranet/issue/85)

## 1.0.0-alpha.13 (2025-04-01)

## 1.0.0-alpha.12 (2025-03-25)

### Feature

- Upgrade to VLT 6a19. @sneridagh [#84](https://github.com/kitconcept/kitconcept.intranet/issue/84)

## 1.0.0-alpha.11 (2025-03-24)

### Internal

- Update to use latest VLT 6a18. @sneridagh [#82](https://github.com/kitconcept/kitconcept.intranet/issue/82)

## 1.0.0-alpha.10 (2025-03-21)

### Internal

- Update to use Volto 18.10.1 and adjustments for new VLT package layout. @sneridagh [#77](https://github.com/kitconcept/kitconcept.intranet/issue/77)
- Move to a released version of `@kitconcept/volto-light-theme`. @sneridagh [#77](https://github.com/kitconcept/kitconcept.intranet/issue/77)
- On GitHub, add a workflow to check a PR has changelog entries @ericof 

## 1.0.0-alpha.9 (2025-03-12)

## 1.0.0-alpha.8 (2025-03-11)

### Feature

- Update @plone/volto to version 18.9.2 @sneridagh 
- Update volto-banner-block to latest, add dependencies. @sneridagh 

## 1.0.0-alpha.7 (2025-03-05)

## 1.0.0-alpha.6 (2025-02-12)

### Feature

- Upgrade Volto to version 18.8.2 [@ericof] [#65](https://github.com/kitconcept/kitconcept.intranet/issue/65)

### Bugfix

- Install corepack on the frontend image to avoid requiring internet connection during startup [@ericof] [#62](https://github.com/kitconcept/kitconcept.intranet/issue/62)

## 1.0.0-alpha.5 (2025-02-06)

### Internal

- Fix Docker image generation [@ericof] 

## 1.0.0-alpha.4 (2025-02-06)

## 1.0.0-alpha.3 (2024-10-01)

### Internal

- Release ghcr.io/kitconcept/kitconcept-intranet-frontend image with tags [@ericof] 

## 1.0.0-alpha.2 (2024-10-01)

### Bugfix

- Generate Docker images on tag creation [@ericof] [#51](https://github.com/kitconcept/kitconcept.intranet/issue/51)
- Fix Docker image creation for frontend [@ericof] [#52](https://github.com/kitconcept/kitconcept.intranet/issue/52)

## 1.0.0-alpha.1 (2024-10-01)

### Feature

- Initial version of kitconcept.intranet [@tisto] [#1](https://github.com/kitconcept/kitconcept.intranet/issue/1)
