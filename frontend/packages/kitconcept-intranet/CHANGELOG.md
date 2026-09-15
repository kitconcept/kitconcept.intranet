# Changelog

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/volto/developer-guidelines/contributing.html#create-a-pull-request
-->

<!-- towncrier release notes start -->

## 3.0.0-alpha.5 (2026-09-11)


### Bugfix

- Fix broken Avatar pictures @iRohitSingh [#480](https://github.com/kitconcept/kitconcept.intranet/issue/480)
- Use the specified English and German labels for authors, the responsible person, and page feedback. @sneridagh [#622](https://github.com/kitconcept/kitconcept.intranet/issue/622)
- @kitconcept/volto-plate to 1.0.0-alpha.26. @sneridagh 
- Fix the Status icons in content folder @Tishasoumya-02 
- Show all configured CLM authors in the About This Content panel, fall back to content creators when no authors are set, and load user portraits through Volto's portrait middleware. @sneridagh 
- Show the configured feedback person as the effective feedback recipient, falling back to the responsible person. @sneridagh 
- Show the workspace navigation portal and hide the like/comment/share footer for content nested inside a workspace (not just the workspace and wiki pages themselves). @iFlameing 


### Internal

- Upgrade kitconcept-core to 2.0.0b7, Volto Light Theme to 8.0.0a32, and Volto Banner Block to 1.2.1. @sneridagh 

## 3.0.0-alpha.4 (2026-09-10)


### Feature

- Update @kitconcept/volto-solr to ^3.0.0-alpha.2. @reebalazs [#570](https://github.com/kitconcept/kitconcept.intranet/issue/570)
- Search dialog: the Type / Created by / Updated / Status filter chips are functional - they filter the livesearch, list real users, and travel to the results page URL so a reload reproduces the filtered results. @reebalazs 


### Bugfix

- Show CLM box in edit mode and hide it on the login page @iRohitSingh [#clm-edit-mode](https://github.com/kitconcept/kitconcept.intranet/issue/clm-edit-mode)
- Fix CLM feedback form @iRohitSingh [#feedback-form](https://github.com/kitconcept/kitconcept.intranet/issue/feedback-form)
- Remove the Feedback about this page link from the footer @iRohitSingh [#remove-footer-feedback](https://github.com/kitconcept/kitconcept.intranet/issue/remove-footer-feedback)
- Fix the CLM Content Owner (`responsible_person`) field showing a raw user id instead of the person's name after the value was changed and saved, and stop the inheritance hint from appearing for a content's own value (e.g. after clearing the field). @sneridagh [#496](https://github.com/kitconcept/kitconcept.intranet/issue/496)
- Update @kitconcept/volto-solr to ^3.0.0-alpha.1. @reebalazs [#570](https://github.com/kitconcept/kitconcept.intranet/issue/570)


### Internal

- Enforce the mandatory OVERRIDE header on shadowed components in CI (shadow-headers check). 


### Tests

- Add acceptance tests for the CLM `responsible_person` widget: the name is shown after a change+save, no inheritance hint for a content's own value, and the inheritance hint appears with the ancestor's name when the value is genuinely inherited. @sneridagh [#496](https://github.com/kitconcept/kitconcept.intranet/issue/496)
- Run block accessibility checks against the retained ``/qa/block`` fixtures and remove checks for fixtures that no longer exist. @sneridagh 

## 3.0.0-alpha.3 (2026-08-27)


### Bugfix

- Scope the sidebar top offset to the compact intranet header via a body class, so the sidebar is only pushed down when that header is present. @sneridagh 


### Internal

- Update the frontend development source to Volto 19.3.1 and @kitconcept/volto-plate to 1.0.0-alpha.24. @sneridagh 

## 3.0.0-alpha.2 (2026-08-26)


### Bugfix

- Fixed released-package builds by replacing the workspace-only VLT Header alias with component utility registration. @sneridagh 


### Internal

- Removed the stale `altVLT` alias from the ESLint import resolver, left over after the VLT Header alias was replaced by component utility registration. @ericof 

## 3.0.0-alpha.1 (2026-08-24)


### Breaking

- Intranet v3 first iteration. @sneridagh [#399](https://github.com/kitconcept/kitconcept.intranet/issue/399)


### Feature

- Upgrade to use @kitconcept/volto-plate 1a20, with the new suggestions/comments. @sneridagh [#421](https://github.com/kitconcept/kitconcept.intranet/issue/421)
- Add Content Lifecycle Management at the end of the page @iRohitSingh [#431](https://github.com/kitconcept/kitconcept.intranet/issue/431)
- Add feedback form to AboutThisContent @iRohitSingh [#458](https://github.com/kitconcept/kitconcept.intranet/issue/458)
- Update comments layout, styling, and footer placement @iRohitSingh [#469](https://github.com/kitconcept/kitconcept.intranet/issue/469)
- Add new style for Content Lifecycle Management @iRohitSingh [#473](https://github.com/kitconcept/kitconcept.intranet/issue/473)
- Use the released @kitconcept/volto-solr ^3.0.0-alpha.0 from npm instead of the mrs.developer checkout. @reebalazs [#595](https://github.com/kitconcept/kitconcept.intranet/issue/595)
- Add Person Pill component and storybook test @Tishasoumya-02 
- Add new search and Breadcrumbs overlay for intranet v3 @iRohitSingh 
- Add rename, duplicate, and delete actions for items in the navigation tree. @iFlameing 
- Added Event and News Item to the AboutThisContent slot. @iFlameing 
- Added the CLM (lifecycle management) fields to Workspace and Wiki Page, and installed plone.app.iterate for working copy support. @iFlameing 
- Hide the site footer on Workspace and Wiki Page content types. @iFlameing 
- Integrate the AI search (RAG) feature branch: @kitconcept/volto-solr from the feature-ai-rag branch; no "Use AI" toggle — when the backend reports the feature available, the AI answer renders above the classic search results. @reebalazs 
- Show the current root (Workspace or site) as the top-level item in the navigation tree, so users can quickly jump back to it. @iFlameing 
- Update to Volto 19.3.0, VLT 8a31 and volto-plate 1a21. @sneridagh 
- Workspace search dialog per the approved design (internal ticket #426): live search results while typing (kitconcept.solr @solr-suggest), "Ask AI" button with the AI Overview answer panel and sources (@rag-search), Cmd+K/Ctrl+K shortcut, filter chips (visual, deferred backend). @reebalazs
  AI errors surface as a friendly localized message instead of the raw backend error (raw messages like embed timeouts under concurrent LLM load are logged to the console only, see internal ticket #515). 
- Workspace search dialog: the Workspace chip is the local/global scope switch — workspace scope (default) restricts livesearch and the Enter results page to the workspace subtree, "Intranet Portal" searches globally. Covered by a Cypress test and a backend @solr-suggest path_prefix test; requires the kitconcept.solr local-scoping support. @reebalazs 
- Workspace search dialog: the Workspace chip opens a scope dropdown - search everywhere or in any workspace you can access; result rows show their location and an empty scoped search offers "Search everywhere". @reebalazs 


### Bugfix

- Fix alignment of List with Dates listing variation @iRohitSingh [#419](https://github.com/kitconcept/kitconcept.intranet/issue/419)
- Fix missing save button in users controlpanel @iRohitSingh [#423](https://github.com/kitconcept/kitconcept.intranet/issue/423)
- Use site title in workspace switcher @iRohitSingh [#429](https://github.com/kitconcept/kitconcept.intranet/issue/429)
- Fix Breadcrumb navigation styling @iRohitSingh [#431](https://github.com/kitconcept/kitconcept.intranet/issue/431)
- Fix new Breadcrumb navigation styling @iRohitSingh [#432](https://github.com/kitconcept/kitconcept.intranet/issue/432)
- Fix search results page container width @iRohitSingh [#433](https://github.com/kitconcept/kitconcept.intranet/issue/433)
- Fix align WikiPage document byline to default container width @iRohitSingh [#439](https://github.com/kitconcept/kitconcept.intranet/issue/439)
- Fix Navigation Tree Content type icon is moved to the right @iRohitSingh [#442](https://github.com/kitconcept/kitconcept.intranet/issue/442)
- Remove banner shadow when banner has no text @iRohitSingh [#445](https://github.com/kitconcept/kitconcept.intranet/issue/445)
- Remove Old CLM section @iRohitSingh [#460](https://github.com/kitconcept/kitconcept.intranet/issue/460)
- Add temporary fix for tailwind grid class conflict with listing grid variation. @danalvrz 
- Disabled the global focus-visible outline/box-shadow from core. @iFlameing 
- Exclude `ul.items` from the list padding/bullet fix so they don't get unwanted indentation. @iFlameing 
- Fix jumping of navigation tree filter @Tishasoumya-02 
- Fix selector to apply correct styles to Search block with dates variation. @danalvrz 
- Fix styles for slate date and slate mentions. @danlavrz 
- Fix tailwind conflict with content-upload img. @tishasoumya-02 
- Fix tailwind conflict with list styling. @danlavrz 
- Fix the navigation tree not detecting the active Workspace for pages nested underneath it, since the workspace lookup was restricted to direct children of the site root. @iFlameing 
- Fixed person portrait images resolving to the internal backend URL instead of the public site URL in server-side rendered pages. @iFlameing 
- Hide the navigation tree sidebar on the site home page. @iFlameing 
- Hide the navigation tree's existing children while adding a new Workspace, instead of showing the parent's unrelated content. @iFlameing 
- Navigation tree no longer shows an expand caret for folders that don't actually have any children. @iFlameing 
- Pin kitconcept.solr to a revision instead of the branch: backend, frontend and the solr image. Includes the Plate RAG chunking fix (kitconcept.solr#112). @reebalazs 
- Restore the top-level `Depth` field in the querystring widget when a path criterion is present, by overriding Volto's `QuerystringWidget` and reverting https://github.com/plone/volto/pull/8350. @ericof 
- Update to @kitconcept/core 2.0.0.alpha-6 (no significant changes). @davisagli 
- Updated to latest @kitconcept/volto-plate. @sneridagh

  See https://github.com/kitconcept/volto-plate/releases/tag/1.0.0a19 


### Internal

- Depend on the released `@kitconcept/volto-plate` 1.0.0-alpha.23 from npm instead of the tarball vendored in `frontend/artifacts/`. @ericof [#593](https://github.com/kitconcept/kitconcept.intranet/issue/593)
- Avatar Fallback for personPill @Tishasoumya-02 
- Update volto-plate to latest one. @iFlameing 

## 2.0.0-alpha.17 (2026-06-12)

### Feature

- Update floated image styles. @danlavrz 
- Update post-footer component to follow improved implementation in VLT. @danalvrz 

### Bugfix

- Update kitconcept.solr to 2.0.0a14 @iRohitSingh 
- VLT 8a30 and Volto 19.1.4
  See https://github.com/plone/volto/releases/tag/19.1.4
  See https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a30 @sneridagh 

### Internal

- Hide Intranet header setting from root sidebar. @danalvrz 

## 2.0.0-alpha.16 (2026-06-09)

### Feature

- Improve look and feel of the feedback form to match VLT. @danalvrz 

### Bugfix

- Enable `doEmptySearch` so the search page returns all results for an empty search term, instead of an empty page. @reebalazs 
- Fixed accordion does not work with the "Order" tab. Use `@eea/volto-accordion-block` 12.0.0. @Tishasoumya-02 
- Hide the empty search tabs container on an empty search term, so it no longer renders as a stray grey rectangle. @reebalazs 
- Update to VLT and Volto 19.1.2. @sneridagh

  See https://github.com/plone/volto/releases/tag/19.1.2
  See https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a29 

## 2.0.0-alpha.15 (2026-05-12)

### Internal

- Update to volto-light-theme 8.0.0a27 (no significant changes). @davisagli 

## 2.0.0-alpha.14 (2026-05-12)

### Bugfix

- Update to VLT 8a26 and Volto 19a36.
  https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a26 @sneridagh 

### Internal

- Change default slate width to default width @iRohitSingh [#369](https://github.com/kitconcept/kitconcept.intranet/issue/369)

## 2.0.0-alpha.13 (2026-05-06)

### Internal

- Update kitconcept.core (no significant frontend change). @davisagli 

## 2.0.0-alpha.12 (2026-05-06)

### Bugfix

- Fix link to location from Event view. @davisagli 
- Update to Volto 19a33 and core2a16.
  https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a15
  https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a16 @sneridagh 

## 2.0.0-alpha.11 (2026-04-30)

### Feature

- Use vocabularies for location and organisational unit search facets. @reebalazs [#286](https://github.com/kitconcept/kitconcept.intranet/issue/286)
- Show disclaimer in personalized Search blocks. @danalvrz 

### Bugfix

- Fix errors loading the translation view. @davisagli [#286](https://github.com/kitconcept/kitconcept.intranet/issue/286)
- Update to core 2a14 and vlt8a21 and Volto 19a29.
  See:
  https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a14
  https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a20
  https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a21
  @sneridagh 
- Upgrade to Volto 19a32 and VLT 8a24.
  https://github.com/plone/volto/releases/tag/19.0.0-alpha.31
  https://github.com/plone/volto/releases/tag/19.0.0-alpha.32
  https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a22
  https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a23
  https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a24 @sneridagh 

### Internal

- Hide StickyFeedbackButton in edit mode.  @iRohitSingh 
- Save Volto version in package.json for later consumption. @sneridagh 
- Unhide change note field @iRohitSingh 

## 2.0.0-alpha.10 (2026-03-14)

### Feature

- Add ContactList block. @iFlameing [#contactlist](https://github.com/kitconcept/kitconcept.intranet/issue/contactlist)
- Added add-on @plone-collective/volto-image-editor. @sneridagh 

### Bugfix

- Fix colors in Person profile view. @danalvrz 
- Update core 2a13 and vlt2a18. @sneridagh
  See:
  https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a13
  https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a18 

## 2.0.0-alpha.9 (2026-03-05)

### Feature

- Update to VLT 8a17.
  See https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a17 @sneridagh [#vlt8a17](https://github.com/kitconcept/kitconcept.intranet/issue/vlt8a17)
- Added command for upgrading dependencies. @davisagli @sneridagh [#333](https://github.com/kitconcept/kitconcept.intranet/issue/333)
- Add custom Person view for solr search results and customized search tabs with icons. @danalvrz 
- Update kitconcept-core to 2.0.0a12. @iFlameing 

### Internal

- Added pt-br translations. @humanaice 
- Fixed a misleading translation (de). @jnptk 
- Regenerate lock file with no changes. @danalvrz 

## 2.0.0-alpha.8 (2026-02-05)

### Bugfix

- See https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a14 @sneridagh 

### Internal

- Fix acceptance test for header search. @davisagli 

## 2.0.0-alpha.7 (2026-01-27)

### Feature

- Configure token widget for responsibilities field on Person content type. @danalvrz 

### Bugfix

- Fix flaky cypress test. @iFlameing 

## 2.0.0-alpha.6 (2026-01-26)

### Feature

- Add and register ListingBlockDisclaimer component for targeted listings. @danalvrz 

### Bugfix

- Fix repeated vocabulary request for each keystroke in a text block @Tishasoumya-02 [#306](https://github.com/kitconcept/kitconcept.intranet/issue/306)

### Internal

- Fix flaky preview-image-link cypress test @Tishasoumya-02 [#304](https://github.com/kitconcept/kitconcept.intranet/issue/304)
- Update to k.core 2a9:
    https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a9 @sneridagh 

## 2.0.0-alpha.5 (2026-01-15)

### Internal

- Fixed bug where markdown inline links in descriptions are rendered as a separate paragraph @jackahl
  Use the CSS prop --breadcrumbs-foregound for breadcrumbs links as default, with --link-foreground-color as fallback. @danalvrz
  Removed `Contents` shadow in favor of the core implementation. @sneridagh
  New reindex script @davisagli @jnptk 

## 2.0.0-alpha.4 (2026-01-14)

### Bugfix

- Fixed sticky menu cut off at the bottom on smaller screens @iRohitSingh
  Fixed double navigation in cards that contains inner links in its body. @sneridagh
  Fixed rearrangement of files in drag-and-drop of folderish content. @Tishasoumya-02 
- Update Person and Event views to support multiple values for organisational unit and location. @davisagli 

### Internal

- Add Cypress tests for Enter key behavior on focused blocks @iRohitSingh 

## 2.0.0-alpha.3 (2025-12-16)

### Internal

- Update to kitconcept.solr 2.0.0.alpha-7. @davisagli [#207](https://github.com/kitconcept/kitconcept.intranet/issue/207)
- Re-enable acceptance tests for Person content type. @davisagli 
- Update @kitconcept/volto-solr to 2.0.0-alpha.8. @reebalazs 

## 2.0.0-alpha.2 (2025-12-09)

### Bugfix

- Update to core 2a5.
  https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a5 @sneridagh 

## 2.0.0-alpha.1 (2025-12-01)

### Bugfix

- Update kitconcept.solr to 2.0.0.a6 @reebalazs 

### Internal

- Hide secondary logo in mobile. Fixed teaser description update problem. Update core 2a4. @sneridagh 
- Rename internal package and folder for consistency. @sneridagh 

## 2.0.0-alpha.0 (2025-11-13)

### Breaking

- Update to use Volto 19 and VLT 8. @sneridagh 

### Feature

- Add Content Interactions component including rating, discussion, and sharing. @Tishasoumya-02, @iFlameing [#185](https://github.com/kitconcept/kitconcept.intranet/issue/185)
- Add Feedback Form @Tishasoumya-02 

### Bugfix

- Fix aria-label for search input when solr is enabled. @reekitconcept, @davisagli 

### Internal

- Update to Volto 19a13 VLT 8a6. @sneridagh [#282.vlt8a6volto19a13](https://github.com/kitconcept/kitconcept.intranet/issue/282.vlt8a6volto19a13)
- Added the prepublish script. 
- Several fixes - Update Volto 18.29.0 and vlt 7.5.1. @sneridagh 
- Update Share email text. @iFlameing 

## 1.0.0-beta.15 (2025-10-08)

### Bugfix

- Update to coreb5. @sneridagh 

## 1.0.0-beta.14 (2025-10-07)

### Bugfix

- Several fixes. Update to coreb4. @sneridagh [#265.1](https://github.com/kitconcept/kitconcept.intranet/issue/265.1)
- Show job title above the description. @sneridagh [#265.2](https://github.com/kitconcept/kitconcept.intranet/issue/265.2)

## 1.0.0-beta.13 (2025-10-01)

### Bugfix

- Added smartRenderer for customization of PersonSummary. @sneridagh 

## 1.0.0-beta.12 (2025-10-01)

### Bugfix

- Added smartTextRenderer, fix icons in calendar, fix low res images in cards, fix regression in teasers in edit mode. @sneridagh 

## 1.0.0-beta.11 (2025-09-29)

### Bugfix

- Fixed CSS issue with top blocks. Upgrade to core 1b2 (Volto 18.27.2 and VLT 7.1.0) @sneridagh 
- Fixed reset button in teasers using `preview_image_link`. Update to Volto 18.27.0. @sneridagh
  Redirect the user to homepage after logout. Update kitconcept-core to `1.0.0-beta.1`. @iFlameing 

## 1.0.0-beta.10 (2025-09-25)

### Bugfix

- Fix search input styles in header @reebalazs [#173](https://github.com/kitconcept/kitconcept.intranet/issue/173)

### Internal

- Fix cypress test for calendar block. @iFlameing 

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
