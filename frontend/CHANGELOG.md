# Changelog

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/volto/developer-guidelines/contributing.html#create-a-pull-request
-->

<!-- towncrier release notes start -->

## 1.0.0-beta.9 (2025-09-25)

### Bugfix

- Fix Person Profile View Tablet and Mobile View @iRohitSingh [#247](https://github.com/kitconcept/kitconcept.intranet/issue/247)
- Fix link font size of person view @iRohitSingh [#249](https://github.com/kitconcept/kitconcept.intranet/issue/249)
- Add Person job title to the summary used in listings and teasers. @davisagli 
- Don't link to Person profile view in listings and teasers. @davisagli 
- Fix correct import for custom search css @reebalazs 
- Reset teaser button fix. Update to core 1b0. @sneridagh 

## 1.0.0-beta.8 (2025-09-22)

### Feature

- Add sticky feedback button @iRohitSingh [#123](https://github.com/kitconcept/kitconcept.intranet/issue/123)
- Add a wrapper(InheritedFieldWrapper) for showing inheritedField description and add expanders of lcm. @iFlameing [#178](https://github.com/kitconcept/kitconcept.intranet/issue/178)
- Added support for squared person images in teaser and listings. @sneridagh [#181](https://github.com/kitconcept/kitconcept.intranet/issue/181)
- Move https://github.com/kitconcept/volto-light-theme/pull/614 to here.
  Added TTW ConfigInjector feature. @sneridagh [#186](https://github.com/kitconcept/kitconcept.intranet/issue/186)
- Additional solr updates @reebalazs [#191](https://github.com/kitconcept/kitconcept.intranet/issue/191)
- Use new image field for persons. Upgrade to Plone 6.1.2, core 1a21, VLT7a26. @sneridagh [#201](https://github.com/kitconcept/kitconcept.intranet/issue/201)
- Add custom view for Person content type. @danalvrz [#236](https://github.com/kitconcept/kitconcept.intranet/issue/236)
- Add German as a supported frontend language. @davisagli 
- Add IFrame block. @danalvrz 
- Add RSS block. @danalvrz 
- Add byline in a slot below the title. @Tishasoumya-02 
- Add documentByLine feature @Tishasoumya-02 
- Add listing template listing with Date and cypress test for the same @Tishasoumya-02 
- Implement SOLR support using @kitconcept/volto-solr version 2.0.0-alpha.2. @ericof 
- Move the person square control panel field to have a dropdown, in order for it to be future proof. @sneridagh 

### Bugfix

- Fix extra pipe separator after "Log in" link. @davisagli [#138](https://github.com/kitconcept/kitconcept.intranet/issue/138)
- Upgrade @plone-collective/volto-authomatic to version 3.0.0-alpha.4. @ericof [#180](https://github.com/kitconcept/kitconcept.intranet/issue/180)
- Several misc fixes. Update to core 1a18 and VLT 7a25. @sneridagh [#196](https://github.com/kitconcept/kitconcept.intranet/issue/196)
- Fix console error in StickyFeedbackButton @iRohitSingh [#238](https://github.com/kitconcept/kitconcept.intranet/issue/238)
- Add missing translations. Includes updating to Volto 18.26.0, VLT 7.0.0b2, and kitconcept-core 1.0.0a25. @davisagli 
- Change name of person_picture_aspect_ratio setting. @sneridagh 
- Fixed CSS problem in Search block. @sneridagh 
- Fixed problem with Person still showing blocks. Update core to 1a27. @sneridagh 
- Fixed regression in person grid teasers in edit mode. @sneridagh 
- Fixed slider flag position in simple variant, and calendar block icon. @sneridagh 
- Hide Roles field from Person edit form. @davisagli 
- Update iframe block to version 2.3.2. @danalvrz 
- Use Image component for showing image in PersonView component. @iFlameing 

### Internal

- Fix acceptance test stability. @davisagli [#139](https://github.com/kitconcept/kitconcept.intranet/issue/139)
- Fix A11y test @iRohitSingh [#171](https://github.com/kitconcept/kitconcept.intranet/issue/171)
- Add cypress test for location and organisational unit content type. @iFlameing [#172](https://github.com/kitconcept/kitconcept.intranet/issue/172)
- Add cypress test of organisational_unit and location behaviors of Person content type. @iFlameing [#174](https://github.com/kitconcept/kitconcept.intranet/issue/174)
- Fix A11y of image block @iRohitSingh [#182](https://github.com/kitconcept/kitconcept.intranet/issue/182)
- Revert all the changes of feedback form. @iFlameing [#198](https://github.com/kitconcept/kitconcept.intranet/issue/198)
- Add missing a11y test @iRohitSingh [#202](https://github.com/kitconcept/kitconcept.intranet/issue/202)
- remove empty text rule in gridtext axe test jackahl [#203](https://github.com/kitconcept/kitconcept.intranet/issue/203)
- remove unnecessary rule disabelings in axe tests to harden them @jackahl [#212](https://github.com/kitconcept/kitconcept.intranet/issue/212)
- add a check for succesfull content request on all axe a11y tests to avaoid checking the 404 page @jackahl [#217](https://github.com/kitconcept/kitconcept.intranet/issue/217)
- remove further axe rule disabelings @jackahl [#221](https://github.com/kitconcept/kitconcept.intranet/issue/221)
- Fix A11y headlines Unique headings in example content @iRohitSingh [#227](https://github.com/kitconcept/kitconcept.intranet/issue/227)
- remove unique-id rule disabling in accordion a11y block @jackahl [#229](https://github.com/kitconcept/kitconcept.intranet/issue/229)
- Fix A11y of grid text @iRohitSingh [#231](https://github.com/kitconcept/kitconcept.intranet/issue/231)
- Remove the features transfered already to k.core. @sneridagh [#240](https://github.com/kitconcept/kitconcept.intranet/issue/240)
- Add German Translation for List with date @Tishasoumya-02 
- Add cypress test for preview image link using Image Widget @Tishasoumya-02 
- Add cypress test for sticky Menu @Tishasoumya-02 
- Check for 200 status in a11y tests. @davisagli 
- Hide LCM field and StickyFeedbackButton slide from left. @iFlameing 
- Update example content for slider-simple @Tishasoumya-02 

## 1.0.0-beta.7 (2025-08-05)

### Feature

- Added feature for configuring blocks through the web. @sneridagh [#151](https://github.com/kitconcept/kitconcept.intranet/issue/151)
- Include `volto-form-block` as add-on. @robgietema [#152](https://github.com/kitconcept/kitconcept.intranet/issue/152)
- Customize EventMetadata block to handle Location behavior. @ericof 

### Bugfix

- Fix extra request of Event Calendar block. @iFlameing [#149](https://github.com/kitconcept/kitconcept.intranet/issue/149)
- Fix EventMetaData view to display location. @danalvrz [#165](https://github.com/kitconcept/kitconcept.intranet/issue/165)

### Internal

- Added all add-ons, VLT and @kitconcept/core to the build, using mrs-developer. @sneridagh [#148](https://github.com/kitconcept/kitconcept.intranet/issue/148)
- Bring back core test acceptance to its original place. @sneridagh [#156](https://github.com/kitconcept/kitconcept.intranet/issue/156)
- Pin all the add-ons to a tag. @sneridagh [#158](https://github.com/kitconcept/kitconcept.intranet/issue/158)
- Add cypress test for sort_on and sort_order for eventCalendar Block. @iFlameing [#160](https://github.com/kitconcept/kitconcept.intranet/issue/160)
- Update to latest VLT 7a19 and core 1a15. @sneridagh [#161](https://github.com/kitconcept/kitconcept.intranet/issue/161)
- Update VLT to 7.0.0a20 and fix a11y test @iRohitSingh [#163](https://github.com/kitconcept/kitconcept.intranet/issue/163)
- Update A11y link @iRohitSingh [#167](https://github.com/kitconcept/kitconcept.intranet/issue/167)
- Modify A11y configuration in Makefile. @ericof 
- Remove Makefile targets related to running the backend as a container. @ericof 

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
