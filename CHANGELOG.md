# Changelog

<!-- towncrier release notes start -->
## 1.0.0b21 (2025-12-08)

### Backend


#### Internal

- Update to k.core 1.0.2. @sneridagh 



### Frontend

#### Bugfix

- Add classname for unauthorized page. Update Volto 18.30.1.
  Cross language support for blocks chooser search. Fixed highlight block ENTER, create a new block consistently. Update highlight block to 4.5.1. Update Volto 18.30.0.
  Fixed error on pressing ENTER in introduction block. Update add-on to 1.2.0.
  Update to k.core 1.0.2 @sneridagh 



### Project

No significant changes.




## 1.0.0b20 (2025-12-01)

### Backend


#### Bugfix

- Hide secondary logo on mobile. Fixed teaser description override. Upgrade to use core 1.0.1. @sneridagh 



### Frontend

#### Bugfix

- Hide secondary logo on mobile. Fixed teaser description override. Upgrade to use core 1.0.1. @sneridagh 

#### Internal

- Rename intranet package and the internal folder name. @sneridagh 



### Project

No significant changes.




## 1.0.0b19 (2025-11-18)

### Backend


#### Bugfix

- Fix accordion icons. Update to core 1.0.0. @sneridagh 



### Frontend

#### Bugfix

- Fix accordion icons. Update to core 1.0.0. @sneridagh 



### Project

No significant changes.




## 1.0.0b18 (2025-11-04)

### Backend


#### Bugfix

- New blocks error boundary.
  Fixed image widget flaw on uploading to non-folderish content.
  Several fixes.
  Update to core 1.0.0a7. @sneridagh 


#### Internal

- Several fixes - Update Volto 18.29.0 and vlt 7.5.1. @sneridagh 



### Frontend

#### Bugfix

- New blocks error boundary.
  Fixed image widget flaw on uploading to non-folderish content.
  Several fixes.
  Update to core 1.0.0a7. @sneridagh 

#### Internal

- Several fixes - Update Volto 18.29.0 and vlt 7.5.1. @sneridagh 



### Project

No significant changes.




## 1.0.0b17 (2025-10-31)

### Backend


#### Internal

- Several fixes - Update Volto 18.29.0 and vlt 7.5.1. @sneridagh 



### Frontend

#### Internal

- Several fixes - Update Volto 18.29.0 and vlt 7.5.1. @sneridagh 



### Project

No significant changes.




## 1.0.0b16 (2025-10-29)

### Backend

No significant changes.




### Frontend

#### Internal

- Force a release to test the prepublish script. 



### Project

No significant changes.




## 1.0.0b15 (2025-10-08)

### Backend


#### Bugfix

- Update to coreb5. @sneridagh 



### Frontend

#### Bugfix

- Update to coreb5. @sneridagh 



### Project

No significant changes.




## 1.0.0b14 (2025-10-07)

### Backend


#### Bugfix

- Fix phone icon not horizontally centered in the sticky menu. @tisto [#153](https://github.com/kitconcept/kitconcept.intranet/issue/153)
- Several fixes. Update to coreb4. @sneridagh [#265](https://github.com/kitconcept/kitconcept.intranet/issue/265)



### Frontend

#### Bugfix

- Several fixes. Update to coreb4. @sneridagh [#265.1](https://github.com/kitconcept/kitconcept.intranet/issue/265.1)
- Show job title above the description. @sneridagh [#265.2](https://github.com/kitconcept/kitconcept.intranet/issue/265.2)



### Project

No significant changes.




## 1.0.0b13 (2025-10-01)

### Backend

No significant changes.




### Frontend

#### Bugfix

- Added smartRenderer for customization of PersonSummary. @sneridagh 



### Project

No significant changes.




## 1.0.0b12 (2025-10-01)

### Backend


#### Bugfix

- Added smartTextRenderer, fix icons in calendar, fix low res images in cards, fix regression in teasers in edit mode. @sneridagh 



### Frontend

#### Bugfix

- Added smartTextRenderer, fix icons in calendar, fix low res images in cards, fix regression in teasers in edit mode. @sneridagh 



### Project

No significant changes.




## 1.0.0b11 (2025-09-29)

### Backend


#### Bugfix

- Update kitconcept.core to 1.0.0b1. @iFlameing [#258](https://github.com/kitconcept/kitconcept.intranet/issue/258)
- Fixed CSS issue with top blocks. Upgrade to core 1b2 (Volto 18.27.2 and VLT 7.1.0) @sneridagh 


#### Internal

- Update example content. Use German names, fix multiple smaller issues. @tisto [#259](https://github.com/kitconcept/kitconcept.intranet/issue/259)



### Frontend

#### Bugfix

- Fixed CSS issue with top blocks. Upgrade to core 1b2 (Volto 18.27.2 and VLT 7.1.0) @sneridagh 
- Fixed reset button in teasers using `preview_image_link`. Update to Volto 18.27.0. @sneridagh
  Redirect the user to homepage after logout. Update kitconcept-core to `1.0.0-beta.1`. @iFlameing 



### Project

No significant changes.




## 1.0.0b10 (2025-09-25)

### Backend

No significant changes.




### Frontend

#### Bugfix

- Fix search input styles in header @reebalazs [#173](https://github.com/kitconcept/kitconcept.intranet/issue/173)

#### Internal

- Fix cypress test for calendar block. @iFlameing 



### Project

No significant changes.




## 1.0.0b9 (2025-09-25)

### Backend


#### Bugfix

- Add Person job title to catalog metadata and default summary fields.
  There is an upgrade step to update the catalog.
  @davisagli 
- Include academic title in Person content title.
  There is an upgrade step to enable this and reindex existing Person content.
  @davisagli 
- Reset teaser button fix. Update to core 1b0. @sneridagh 


#### Internal

- Add example content of volto form block and update example content of
  Person Profile @iRohitSingh [#244](https://github.com/kitconcept/kitconcept.intranet/issue/244)
- Add three location example content objects [#246](https://github.com/kitconcept/kitconcept.intranet/issue/246)
- Add job titles to person example content @tisto [#254](https://github.com/kitconcept/kitconcept.intranet/issue/254)
- Update to kitconcept.voltolighttheme 7.0.0b7 and kitconcept.core 1.0.0a31. @davisagli 



### Frontend

#### Bugfix

- Fix Person Profile View Tablet and Mobile View @iRohitSingh [#247](https://github.com/kitconcept/kitconcept.intranet/issue/247)
- Fix link font size of person view @iRohitSingh [#249](https://github.com/kitconcept/kitconcept.intranet/issue/249)
- Add Person job title to the summary used in listings and teasers. @davisagli 
- Don't link to Person profile view in listings and teasers. @davisagli 
- Fix correct import for custom search css @reebalazs 
- Reset teaser button fix. Update to core 1b0. @sneridagh 



### Project

No significant changes.




## 1.0.0b8 (2025-09-22)

### Backend


#### Feature

- Add a new behavior `kitconcept.intranet.person` with fields academic_title, job_title, department. @ericof [#134](https://github.com/kitconcept/kitconcept.intranet/issue/134)
- Add organisational_unit and location behaviors to Person content type. @iFlameing [#174](https://github.com/kitconcept/kitconcept.intranet/issue/174)
- Add german translation. @iFlameing [#176](https://github.com/kitconcept/kitconcept.intranet/issue/176)
- Add lcm behaviour and lcm service for inheritance. @iFlameing. [#178](https://github.com/kitconcept/kitconcept.intranet/issue/178)
- Added `kitconcept.person_squared_images` control panel setting for supporting person squared images option. @sneridagh [#181](https://github.com/kitconcept/kitconcept.intranet/issue/181)
- Add support for an autocomplete livesearch widget @reebalazs [#191](https://github.com/kitconcept/kitconcept.intranet/issue/191)
- Use new image field for persons. Upgrade to Plone 6.1.2, core 1a21, VLT7a26. @sneridagh [#201](https://github.com/kitconcept/kitconcept.intranet/issue/201)
- Add German and Brazilian Portuguese translation support. @ericof 
- Add IFrame block example content and IFrane allowed domains setting. @danalvrz 
- Add RSS service for RSS block. @danalvrz 
- Add a `byline` expander with details about the content creators for the byline. @davisagli 
- Create new sites in German by default. @davisagli 
- Implement SOLR support using kitconcept.solr. @ericof 
- Move the person square control panel field to have a dropdown, in order for it to be future proof. @sneridagh 
- Update kitconcept to 1.0.0a29 version. @iFlameing 


#### Bugfix

- Fix site language settings not being honored. @ericof [#133](https://github.com/kitconcept/kitconcept.intranet/issue/133)
- Move Location and Organisational Unit fields to Categorization fieldset. @davisagli [#139](https://github.com/kitconcept/kitconcept.intranet/issue/139)
- Several misc fixes. Update to core 1a18 and VLT 7a25. @sneridagh [#196](https://github.com/kitconcept/kitconcept.intranet/issue/196)
- Change the Person `department` field to use Textarea instead of input. @iFlameing [#236](https://github.com/kitconcept/kitconcept.intranet/issue/236)
- Add missing translations. Includes updating to Volto 18.26.0, VLT 7.0.0b2, and kitconcept-core 1.0.0a25. @davisagli 
- Adjust Person schema. @davisagli 
- Change name of person_picture_aspect_ratio setting. @sneridagh 
- Fix registry settings after site creation. @ericof 
- Fix setting the logo on the Plone site root `logo` field. @ericof 
- Fixed CSS problem in Search block. @sneridagh 
- Fixed problem with Person still showing blocks. Update core to 1a27. @sneridagh 
- Fixed regression in person grid teasers in edit mode. @sneridagh 
- Fixed slider flag position in simple variant, and calendar block icon. @sneridagh 


#### Internal

- Add Solr startup scripts for development. @ericof [#108](https://github.com/kitconcept/kitconcept.intranet/issue/108)
- Upgrade collective.person to version 1.0.0b1. @ericof [#134](https://github.com/kitconcept/kitconcept.intranet/issue/134)
- Update example content of grid block @iRohitSingh [#171](https://github.com/kitconcept/kitconcept.intranet/issue/171)
- Add example content for list with date variation for listing block @Tishasoumya-02 [#177](https://github.com/kitconcept/kitconcept.intranet/issue/177)
- Update example content of image block @iRohitSingh [#182](https://github.com/kitconcept/kitconcept.intranet/issue/182)
- Revert all the changes of feedback form. @iFlameing [#198](https://github.com/kitconcept/kitconcept.intranet/issue/198)
- Add example content of location content type @iRohitSingh [#202](https://github.com/kitconcept/kitconcept.intranet/issue/202)
- remove one empty h2 from example content @jackahl [#203](https://github.com/kitconcept/kitconcept.intranet/issue/203)
- Fix example content of person @iRohitSingh [#208](https://github.com/kitconcept/kitconcept.intranet/issue/208)
- Example content update: preview_image and description; remove duplicate images; polish slider block page. [#219](https://github.com/kitconcept/kitconcept.intranet/issue/219)
- Add white Plone logo to the footer. [#226](https://github.com/kitconcept/kitconcept.intranet/issue/226)
- Fix A11y headlines Unique headings in example content @iRohitSingh [#227](https://github.com/kitconcept/kitconcept.intranet/issue/227)
- Make all headings and ids in accordion example content unique @jackahl [#229](https://github.com/kitconcept/kitconcept.intranet/issue/229)
- Update example content of grid text @iRohitSingh [#231](https://github.com/kitconcept/kitconcept.intranet/issue/231)
- Remove the features transfered already to k.core. @sneridagh [#240](https://github.com/kitconcept/kitconcept.intranet/issue/240)
- Add RSS block example content @iRohitSingh 
- Add example content for Organisational Unit, Location content, Person content and listing criteria for them. @iFlameing 
- Add example content for organisational unit. @tisto 
- Fix the upgrade steps source and destination field. @iFlameing 
- Update example content , remove separator blocks from in-between teaser blocks @Tishasoumya-02 
- Update simple-slider example content and fix the remoteUrl which gets appended by /nohost/plone on updating example content @Tishasoumya-02 



### Frontend

#### Feature

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

#### Bugfix

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

#### Internal

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



### Project


#### Feature

- Additional solr updates @reebalazs [#191](https://github.com/kitconcept/kitconcept.intranet/pull/191)
- Add SOLR to docker-compose files. @ericof 


#### Internal

- Add Solr startup scripts for development. @ericof [#108](https://github.com/kitconcept/kitconcept.intranet/pull/108)
- Use persistent GH token when deploying so, that containers can move between swarm nodes. @fredvd 


#### Documentation

- Added documentation for the squared person images for teasers and listings. @sneridagh [#181](https://github.com/kitconcept/kitconcept.intranet/pull/181)



## 1.0.0b7 (2025-08-05)

### Backend


#### Feature

- Added behavior for configuring blocks through the web. @sneridagh [#151](https://github.com/kitconcept/kitconcept.intranet/issue/151)
- Add organisational Unit content type. @iFlameing [#169](https://github.com/kitconcept/kitconcept.intranet/issue/169)
- Add Location content type. @iFlameing 
- Add `kitconcept.intranet.location` behavior. @iFlameing 
- Add `kitconcept.intranet.vocabularies.location` vocabulary. @iFlameing 


#### Internal

- Add an event content type with same start and end date. @iFlameing [#149](https://github.com/kitconcept/kitconcept.intranet/issue/149)
- Publish example content. @sneridagh [#155](https://github.com/kitconcept/kitconcept.intranet/issue/155)
- Update example content of carousel block. @iRohitSingh [#157](https://github.com/kitconcept/kitconcept.intranet/issue/157)
- Update to latest VLT 7a19 and core 1a15. @sneridagh [#161](https://github.com/kitconcept/kitconcept.intranet/issue/161)
- Update example content. @iRohitSingh [#167](https://github.com/kitconcept/kitconcept.intranet/issue/167)
- Polish features section; move images to images folder; cleanup; reorder top-level entries. @tisto [#168](https://github.com/kitconcept/kitconcept.intranet/issue/168)


#### Test

- Add kitconcept.intranet.testing.A11Y_TESTING fixture to be used with A11y tests. @ericof 
- Update Dockerfile.acceptance to be used in GHA. @ericof 



### Frontend

#### Feature

- Added feature for configuring blocks through the web. @sneridagh [#151](https://github.com/kitconcept/kitconcept.intranet/issue/151)
- Include `volto-form-block` as add-on. @robgietema [#152](https://github.com/kitconcept/kitconcept.intranet/issue/152)
- Customize EventMetadata block to handle Location behavior. @ericof 

#### Bugfix

- Fix extra request of Event Calendar block. @iFlameing [#149](https://github.com/kitconcept/kitconcept.intranet/issue/149)
- Fix EventMetaData view to display location. @danalvrz [#165](https://github.com/kitconcept/kitconcept.intranet/issue/165)

#### Internal

- Added all add-ons, VLT and @kitconcept/core to the build, using mrs-developer. @sneridagh [#148](https://github.com/kitconcept/kitconcept.intranet/issue/148)
- Bring back core test acceptance to its original place. @sneridagh [#156](https://github.com/kitconcept/kitconcept.intranet/issue/156)
- Pin all the add-ons to a tag. @sneridagh [#158](https://github.com/kitconcept/kitconcept.intranet/issue/158)
- Add cypress test for sort_on and sort_order for eventCalendar Block. @iFlameing [#160](https://github.com/kitconcept/kitconcept.intranet/issue/160)
- Update to latest VLT 7a19 and core 1a15. @sneridagh [#161](https://github.com/kitconcept/kitconcept.intranet/issue/161)
- Update VLT to 7.0.0a20 and fix a11y test @iRohitSingh [#163](https://github.com/kitconcept/kitconcept.intranet/issue/163)
- Update A11y link @iRohitSingh [#167](https://github.com/kitconcept/kitconcept.intranet/issue/167)
- Modify A11y configuration in Makefile. @ericof 
- Remove Makefile targets related to running the backend as a container. @ericof 



### Project


#### Bugfix

- GHA: Fix actions/upload-artifact settings for the acceptance tests. @ericof 


#### Internal

- Configure CODEOWNERS to route pull request review requests. @ericof 
- GHA: Add acceptance and a11y tests to the workflow. @ericof 
- Refactor Makefile to handle Acceptance and A11y tests. @ericof 


#### Documentation

- Added documentation for configuring blocks through the web. @sneridagh [#151](https://github.com/kitconcept/kitconcept.intranet/pull/151)
- Add instructions on how to update example content. @tisto 



## 1.0.0b6 (2025-07-17)

### Backend


#### Feature

- Example content for Event Calendar. @iFlameing [#140](https://github.com/kitconcept/kitconcept.intranet/issue/140)


#### Internal

- Fix acceptance fixture. @iRohitSingh @sneridagh [#137](https://github.com/kitconcept/kitconcept.intranet/issue/137)
- Remove temporarily unit tests related to content creation. @sneridagh [#137](https://github.com/kitconcept/kitconcept.intranet/issue/137)
- Added VLT example content under `/features/examples`. @sneridagh [#138](https://github.com/kitconcept/kitconcept.intranet/issue/138)
- Added new event calendar block.
  Added `footer_main_logo_inversed` image field to kitconcept.footer behavior, and related frontend code.
  Several fixes.
  Update to core 1a12. @sneridagh 
- Update to core 1a13. @sneridagh 


#### Test

- Implement robotframework support for acceptance tests. @ericof 



### Frontend

#### Internal

- Transfer and adjust acceptance tests from VLT. @iRohitSingh @sneridagh [#137](https://github.com/kitconcept/kitconcept.intranet/issue/137)
- Added new event calendar block.
  Added `footer_main_logo_inversed` image field to kitconcept.footer behavior, and related frontend code.
  Several fixes.
  Update to core 1a12. @sneridagh 
- Update to core 1a13. @sneridagh 

#### Test

- Add cypress test for navigation_title, kicker and Breadcrumbs @iRohitSingh 



### Project


#### Internal

- Fix acceptance fixture. @iRohitSingh @sneridagh [#137](https://github.com/kitconcept/kitconcept.intranet/pull/137)


#### Documentation

- Added documentation infrastructure. @sneridagh 



## 1.0.0b5 (2025-06-30)

### Backend


#### Bugfix

- Fixed `remove-data` command. @sneridagh 
- Several bugfixes. Update to Volto 18.23.0 and kitconcept.core 1.0.0a9. @sneridagh 
- Update to kitconcept.core 1.0.0a10. @sneridagh 
- Update to kitconcept.core 1.0.0a11. @sneridagh 


#### Internal

- Add example content of people, event and news item content type @iRohitSingh 


#### Test

- Speedup test run. @ericof 



### Frontend

#### Bugfix

- Fixed default `selectedItemAttrs` for Teaser to include Person specific attributes. Update to kitconcept.core 1.0.0a11. @sneridagh 
- Several bugfixes. Update to Volto 18.23.0 and kitconcept.core 1.0.0a9. @sneridagh 
- Several bugfixes. Update to kitconcept.core 1.0.0a10. @sneridagh 



### Project


#### Internal

- Added convenience top Makefile for removing content data and create site. @sneridagh 
- Refactor GHA workflow to support deployments to all pushes to main. @ericof 
- Support deploying to additional targets. @ericof 



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



