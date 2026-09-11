# Changelog

<!-- towncrier release notes start -->
## 3.0.0a4 (2026-09-10)

### Backend


#### Feature

- Update kitconcept.solr to 3.0.0a2 (suggestions include images by default). @reebalazs [#570](https://github.com/kitconcept/kitconcept.intranet/issue/570)
- New vocabulary kitconcept.intranet.vocabularies.creators: users who created content on the site (unique catalog Creator values with resolved full names), the data source for the search dialog's "Created by" filter. @reebalazs 


#### Bugfix

- Fix the content review reminder email body: render the last-updated value as a date instead of the object repr, and add proper line and paragraph breaks (English and German) so the message is no longer a single run-on block. [#486](https://github.com/kitconcept/kitconcept.intranet/issue/486)
- Update kitconcept.solr to 3.0.0a1 (AI answers no longer cite context-less documents such as Images as sources). @reebalazs [#570](https://github.com/kitconcept/kitconcept.intranet/issue/570)
- Activate Solr during site creation only when the site was created with Solr support, and reindex the site in the same pass -- including the RAG chunks when AI search is enabled -- so search works without a manual reindex. @ericof 
- Give the two OpenStreetMap maps blocks on the QA maps page unique titles, so their iframes have unique title attributes (a11y frame-title-unique). 
- Remove the obsolete ``/features/block`` example branch while retaining the QA block fixtures. @sneridagh 


#### Internal

- Adjust QA example content: rename QA section to "Quality Assurance", add missing block descriptions (banner, carousel, form, logos, rss), fix broken logo image references, add banner variations, add grey background variants (carousel, form, event calendar, maps) and an OpenStreetMap example to the maps block. 



### Frontend


#### Feature

- Update @kitconcept/volto-solr to ^3.0.0-alpha.2. @reebalazs [#570](https://github.com/kitconcept/kitconcept.intranet/issue/570)
- Search dialog: the Type / Created by / Updated / Status filter chips are functional - they filter the livesearch, list real users, and travel to the results page URL so a reload reproduces the filtered results. @reebalazs 


#### Bugfix

- Show CLM box in edit mode and hide it on the login page @iRohitSingh [#clm-edit-mode](https://github.com/kitconcept/kitconcept.intranet/issue/clm-edit-mode)
- Fix CLM feedback form @iRohitSingh [#feedback-form](https://github.com/kitconcept/kitconcept.intranet/issue/feedback-form)
- Remove the Feedback about this page link from the footer @iRohitSingh [#remove-footer-feedback](https://github.com/kitconcept/kitconcept.intranet/issue/remove-footer-feedback)
- Fix the CLM Content Owner (`responsible_person`) field showing a raw user id instead of the person's name after the value was changed and saved, and stop the inheritance hint from appearing for a content's own value (e.g. after clearing the field). @sneridagh [#496](https://github.com/kitconcept/kitconcept.intranet/issue/496)
- Update @kitconcept/volto-solr to ^3.0.0-alpha.1. @reebalazs [#570](https://github.com/kitconcept/kitconcept.intranet/issue/570)


#### Internal

- Enforce the mandatory OVERRIDE header on shadowed components in CI (shadow-headers check). 


#### Tests

- Add acceptance tests for the CLM `responsible_person` widget: the name is shown after a change+save, no inheritance hint for a content's own value, and the inheritance hint appears with the ancestor's name when the value is genuinely inherited. @sneridagh [#496](https://github.com/kitconcept/kitconcept.intranet/issue/496)
- Run block accessibility checks against the retained ``/qa/block`` fixtures and remove checks for fixtures that no longer exist. @sneridagh 



### Project


#### Feature

- Update kitconcept.solr to 3.0.0a2: images appear in the livesearch suggestions by default, like on the results page (team decision from the ticket 570 review). @reebalazs [#570](https://github.com/kitconcept/kitconcept.intranet/pull/570)
- Search dialog filter chips: filter livesearch suggestions, search results, and the AI answer by content type, creator (multi-select with avatars and livesearch), last updated, and review state. @reebalazs [#585](https://github.com/kitconcept/kitconcept.intranet/pull/585)


#### Bugfix

- Update kitconcept.solr to 3.0.0a1: the AI answer no longer cites documents that contributed no context (e.g. Images) as sources. @reebalazs [#570](https://github.com/kitconcept/kitconcept.intranet/pull/570)


#### Internal

- Enforce the mandatory OVERRIDE header on shadowed components in CI (shadow-headers check). 


#### Documentation

- Add a Features documentation section: a product/feature catalog (outside the Diátaxis quadrants) that serves as an interim source of truth for users, QA, and product owners, with a hub page per feature (CLM, feedback, people & organisation, personalization, content review & reminders, likes, workspaces & wiki, wiki editor, search, and AI-assisted answers). [#486](https://github.com/kitconcept/kitconcept.intranet/pull/486)
- Build and publish the documentation to GitHub Pages at https://kitconcept.github.io/kitconcept.intranet/, replacing the Read the Docs setup. The docs build now runs in CI with warnings treated as errors. @ericof 
- Cleared every Vale style error in the documentation, linked the first use of VLT and CLM on each page to the glossary, and fixed the remaining Sphinx cross-reference and syntax-highlighting warnings so the documentation builds cleanly with warnings treated as errors. @ericof 



## 3.0.0a3 (2026-08-27)

### Backend


#### Internal

- Update the backend to kitconcept.plate 1.0.0a24. @sneridagh 



### Frontend


#### Bugfix

- Scope the sidebar top offset to the compact intranet header via a body class, so the sidebar is only pushed down when that header is present. @sneridagh 


#### Internal

- Update the frontend development source to Volto 19.3.1 and @kitconcept/volto-plate to 1.0.0-alpha.24. @sneridagh 



### Project


#### Documentation

- Document changelog fragment locations and PR guidance for agents in AGENTS.md. @sneridagh 



## 3.0.0a2 (2026-08-26)

### Backend

No significant changes.




### Frontend


#### Bugfix

- Fixed released-package builds by replacing the workspace-only VLT Header alias with component utility registration. @sneridagh 


#### Internal

- Removed the stale `altVLT` alias from the ESLint import resolver, left over after the VLT Header alias was replaced by component utility registration. @ericof 



### Project

No significant changes.




## 3.0.0a1 (2026-08-24)

### Backend


#### Breaking

- Intranet v3 first iteration. @sneridagh [#399](https://github.com/kitconcept/kitconcept.intranet/issue/399)


#### Feature

- Upgrade to use @kitconcept/volto-plate 1a20, with the new suggestions/comments. @sneridagh [#421](https://github.com/kitconcept/kitconcept.intranet/issue/421)
- Add Content Lifecycle Management at the end of the page @iRohitSingh [#431](https://github.com/kitconcept/kitconcept.intranet/issue/431)
- Restrict access to the intranet through permissions declared in `rolemap.xml` instead of binding a workflow to the Plone Site content type. An upgrade step updates existing sites. @ericof [#479](https://github.com/kitconcept/kitconcept.intranet/issue/479)
- Added a new `Subsite` content type, a folderish container acting as a navigation root, with its own header, footer, navigation and breadcrumbs. @ericof [#494](https://github.com/kitconcept/kitconcept.intranet/issue/494)
- Use the released kitconcept.solr==3.0.0a0 from PyPI (with AI/RAG search support) instead of the pinned git revision. @reebalazs [#595](https://github.com/kitconcept/kitconcept.intranet/issue/595)
- Add the AI search (RAG) test corpus as an optional second content set (backend/src/kitconcept/intranet/distributions/intranet/ai-content): a curated German knowledge corpus from the intranet demo site with golden questions, import-ai-content/update-ai-content make targets and demo-password alignment. Not imported by default; requires a fresh site without the standard example content. @reebalazs 
- Added the CLM (lifecycle management) fields to News Item and Event. @iFlameing 
- Added the CLM (lifecycle management) fields to Workspace and Wiki Page, and installed plone.app.iterate for working copy support. @iFlameing 
- Update to Volto 19.3.0, VLT 8a31 and volto-plate 1a21. @sneridagh 


#### Bugfix

- Fixed the Person serializer to show the back button and able to add Image and file content type. @iFlameing [#467](https://github.com/kitconcept/kitconcept.intranet/issue/467)
- Enable edit-time versioning (`at_edit_autoversion` policy) for the `WikiPage` and `Workspace` content types so their history view records an entry for every edit. @iFlameing [#550](https://github.com/kitconcept/kitconcept.intranet/issue/550)
- Pin kitconcept.solr to a revision instead of the branch: backend, frontend and the solr image. Includes the Plate RAG chunking fix (kitconcept.solr#112). @reebalazs 
- Updated to latest @kitconcept/volto-plate. @sneridagh

  See https://github.com/kitconcept/volto-plate/releases/tag/1.0.0a19 


#### Internal

- Add Example content for Workspaces @iRohitSingh [#418](https://github.com/kitconcept/kitconcept.intranet/issue/418)
- Add example content of Wiki Page Meeting Notes @iRohitSingh [#435](https://github.com/kitconcept/kitconcept.intranet/issue/435)
- Add example content of Meeting Notes and Wiki Page @iRohitSingh [#447](https://github.com/kitconcept/kitconcept.intranet/issue/447)
- Update example content of Meeting Notes Wiki Page @iRohitSingh [#454](https://github.com/kitconcept/kitconcept.intranet/issue/454)
- Add example content of wikipage in workspaces @iRohitSingh [#465](https://github.com/kitconcept/kitconcept.intranet/issue/465)
- Fix broken footer link and update banner block example content @iRohitSingh [#470](https://github.com/kitconcept/kitconcept.intranet/issue/470)
- Depend on the released `kitconcept.plate` 1.0.0a23 from PyPI instead of the source distribution vendored in `container/`. @ericof [#593](https://github.com/kitconcept/kitconcept.intranet/issue/593)
- Derive the backend Makefile settings (container image name, package name, Python and base package versions, example content path) from `uvx repoplone settings dump`, and fail early when `jq` is missing or the settings payload is empty. @ericof 
- Move the AI search (RAG) test corpus out of the distributed package into `backend/example_content/ai-content` and exclude `example_content` from the sdist. The corpus is copied into `/import` in the backend container image. @ericof 
- Update the kitconcept-solr pin to the current feature-ai-rag tip (hybrid retrieval and latest fixes included in CI and deployments). @reebalazs 
- Update the kitconcept-solr pin to the feature-ai-rag tip with the local-scoping support (@solr-suggest path_prefix), required by the workspace-scope tests and the deployment. @reebalazs 
- Update volto-plate to latest one. @iFlameing 


#### Tests

- Upgrade pytest-plone to version 1.1.0 and drop the now-redundant local test fixtures. @ericof [#463](https://github.com/kitconcept/kitconcept.intranet/issue/463)



### Frontend


#### Breaking

- Intranet v3 first iteration. @sneridagh [#399](https://github.com/kitconcept/kitconcept.intranet/issue/399)


#### Feature

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


#### Bugfix

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


#### Internal

- Depend on the released `@kitconcept/volto-plate` 1.0.0-alpha.23 from npm instead of the tarball vendored in `frontend/artifacts/`. @ericof [#593](https://github.com/kitconcept/kitconcept.intranet/issue/593)
- Avatar Fallback for personPill @Tishasoumya-02 
- Update volto-plate to latest one. @iFlameing 



### Project


#### Feature

- Switch kitconcept.solr to the released 3.0.0a0, with AI (RAG) search support: kitconcept.solr==3.0.0a0 from PyPI (replacing the pinned git revision), @kitconcept/volto-solr ^3.0.0-alpha.0 from npm (replacing the mrs.developer checkout), and the 3.0.0a0 Solr image in the dev compose and stack files. @reebalazs [#595](https://github.com/kitconcept/kitconcept.intranet/pull/595)


#### Bugfix

- Pin kitconcept.solr to a revision instead of the branch: backend, frontend and the solr image. Includes the Plate RAG chunking fix (kitconcept.solr#112). @reebalazs 


#### Internal

- Upgrade pytest-plone to version 1.1.0 and drop the now-redundant local test fixtures. @ericof [#463](https://github.com/kitconcept/kitconcept.intranet/pull/463)
- Added a manual deploy workflow and switched the tag-triggered deploy to 3.* releases. @ericof [#466](https://github.com/kitconcept/kitconcept.intranet/pull/466)
- Deployment workflows: forward the frontend and backend replica counts, the Solr image tag and the kitconcept.solr LLM endpoint settings to the deploy stacks, and add a manual deploy workflow targeting `*.kitconcept.io`. @ericof 
- Development and deployment stacks: parameterise the Solr and Tika image tags (`SOLR_TAG`, `TIKA_TAG`) and the frontend/backend replica counts, and pass the kitconcept.solr LLM endpoint settings (`KITCONCEPT_SOLR_LLM_URL`, `KITCONCEPT_SOLR_LLM_TOKEN`). @ericof 
- Development and deployment stacks: pass the kitconcept.solr LLM chat model setting (`KITCONCEPT_SOLR_LLM_CHAT_MODEL`) and forward it from the deploy workflows. @ericof 
- Development stack: use the feature-ai-rag Solr image (RAG chunk schema) and add solr-activate-and-reindex-with-rag[-clear] targets. @reebalazs 
- Dropped the `update-volto-plate` script and its `Makefile` target, no longer needed now that `volto-plate` is consumed from its public releases. @ericof 
- Moved `dependabot.yml` to `.github/`, where GitHub actually reads it, and labelled its pull requests with `skip changelog` so they are exempt from the changelog check. @ericof 
- Renamed the towncrier `test` fragment type to `tests`, and added it to the repository-level configuration. @ericof 
- Reworked the changelog CI workflow: the backend, frontend and repository checks now run as steps of a single job, derive their paths from `uvx repoplone settings dump`, and report their outcome in the workflow summary. @ericof 



## 2.0.0a17 (2026-06-12)

### Backend


#### Bugfix

- Update kitconcept.solr to 2.0.0a14 @iRohitSingh 
- VLT 8a30 and Volto 19.1.4
  See https://github.com/plone/volto/releases/tag/19.1.4
  See https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a30 @sneridagh 



### Frontend

#### Feature

- Update floated image styles. @danlavrz 
- Update post-footer component to follow improved implementation in VLT. @danalvrz 

#### Bugfix

- Update kitconcept.solr to 2.0.0a14 @iRohitSingh 
- VLT 8a30 and Volto 19.1.4
  See https://github.com/plone/volto/releases/tag/19.1.4
  See https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a30 @sneridagh 

#### Internal

- Hide Intranet header setting from root sidebar. @danalvrz 



### Project

No significant changes.




## 2.0.0a16 (2026-06-09)

### Backend


#### Bugfix

- Add missing translation for Responsibilities tab in Person profile. @danalvrz 
- Update to VLT and Volto 19.1.2. @sneridagh

  See https://github.com/plone/volto/releases/tag/19.1.2
  See https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a29 



### Frontend

#### Feature

- Improve look and feel of the feedback form to match VLT. @danalvrz 

#### Bugfix

- Enable `doEmptySearch` so the search page returns all results for an empty search term, instead of an empty page. @reebalazs 
- Fixed accordion does not work with the "Order" tab. Use `@eea/volto-accordion-block` 12.0.0. @Tishasoumya-02 
- Hide the empty search tabs container on an empty search term, so it no longer renders as a stray grey rectangle. @reebalazs 
- Update to VLT and Volto 19.1.2. @sneridagh

  See https://github.com/plone/volto/releases/tag/19.1.2
  See https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a29 



### Project


#### Internal

- Add some missing docs for feature implemented last year. @iFlameing 



## 2.0.0a15 (2026-05-12)

### Backend


#### Bugfix

- Update to kitconcept.voltolighttheme 8.0.0a27 (fix for redirect regression).
  @davisagli 



### Frontend

#### Internal

- Update to volto-light-theme 8.0.0a27 (no significant changes). @davisagli 



### Project


#### Bugfix

- Fix version of solr image. @davisagli 



## 2.0.0a14 (2026-05-12)

### Backend


#### Bugfix

- Update to VLT 8a26.
  https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a26 @sneridagh 



### Frontend

#### Bugfix

- Update to VLT 8a26 and Volto 19a36.
  https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a26 @sneridagh 

#### Internal

- Change default slate width to default width @iRohitSingh [#369](https://github.com/kitconcept/kitconcept.intranet/issue/369)



### Project

No significant changes.




## 2.0.0a13 (2026-05-06)

### Backend


#### Bugfix

- Fix the version of plone.app.querystring. @davisagli 



### Frontend

#### Internal

- Update kitconcept.core (no significant frontend change). @davisagli 



### Project

No significant changes.




## 2.0.0a12 (2026-05-06)

### Backend


#### Bugfix

- Fix link to location from Event view. @davisagli 
- Update to Volto 19a33 and core2a16.
  https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a15
  https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a16 @sneridagh 



### Frontend

#### Bugfix

- Fix link to location from Event view. @davisagli 
- Update to Volto 19a33 and core2a16.
  https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a15
  https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a16 @sneridagh 



### Project

No significant changes.




## 2.0.0a11 (2026-04-30)

### Backend


#### Breaking

- Migrate storage of location_reference and organisational_unit_reference fields to make them language-independent.
  There is an upgrade step which must be run to update existing content. @davisagli [#286](https://github.com/kitconcept/kitconcept.intranet/issue/286)


#### Feature

- Use vocabularies for location and organisational unit search facets. @reebalazs [#286](https://github.com/kitconcept/kitconcept.intranet/issue/286)


#### Bugfix

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



### Frontend

#### Feature

- Use vocabularies for location and organisational unit search facets. @reebalazs [#286](https://github.com/kitconcept/kitconcept.intranet/issue/286)
- Show disclaimer in personalized Search blocks. @danalvrz 

#### Bugfix

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

#### Internal

- Hide StickyFeedbackButton in edit mode.  @iRohitSingh 
- Save Volto version in package.json for later consumption. @sneridagh 
- Unhide change note field @iRohitSingh 



### Project


#### Bugfix

- Fix solr-stop Makefile target to also stop the tika container. @reebalazs [#286](https://github.com/kitconcept/kitconcept.intranet/pull/286)


#### Internal

- Add VLT, Core, and Intranet docs to a unified documentation system in the Intranet with a new layout. @iFlameing 



## 2.0.0a10 (2026-03-14)

### Backend


#### Feature

- Add kitconcept.contactblock. @iFlameing 


#### Bugfix

- Add missing upgrade file(v20260217001) in upgrades/configure.zcml. @iFlameing 
- Update core 2a13 and vlt2a18. @sneridagh
  See:
  https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a13
  https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a18 
- Update to collective.solr 10.1.1 (fixes edge case with pagination). @davisagli 



### Frontend

#### Feature

- Add ContactList block. @iFlameing [#contactlist](https://github.com/kitconcept/kitconcept.intranet/issue/contactlist)
- Added add-on @plone-collective/volto-image-editor. @sneridagh 

#### Bugfix

- Fix colors in Person profile view. @danalvrz 
- Update core 2a13 and vlt2a18. @sneridagh
  See:
  https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a13
  https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a18 



### Project


#### Bugfix

- Fix basic authentication not being set on backend deployments. @ericof [#331](https://github.com/kitconcept/kitconcept.intranet/pull/331)



## 2.0.0a9 (2026-03-05)

### Backend


#### Feature

- Update to VLT 8a17.
  See https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a17 @sneridagh [#vlt8a17](https://github.com/kitconcept/kitconcept.intranet/issue/vlt8a17)
- Added command for upgrading dependencies. @davisagli @sneridagh [#333](https://github.com/kitconcept/kitconcept.intranet/issue/333)
- Add current user querystring operation. @danalvrz 
- Add room and building facet fields for person solr search. @danalvrz 
- Update kitconcept-core to 2.0.0a12. @iFlameing 


#### Bugfix

- Fix initial kitconcept.solr search config in newly created sites. @davisagli 


#### Internal

- Support optional instance-local.yaml in the backed to override cookiecutter zope settings on a development install. @fredvd [#225](https://github.com/kitconcept/kitconcept.intranet/issue/225)
- Improve example content of Personalized Listings @iRohitSingh [#338](https://github.com/kitconcept/kitconcept.intranet/issue/338)
- Added more pt-br translations. @humanaice 
- Install kitconcept.solr by default for local development. @danalvrz 



### Frontend

#### Feature

- Update to VLT 8a17.
  See https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a17 @sneridagh [#vlt8a17](https://github.com/kitconcept/kitconcept.intranet/issue/vlt8a17)
- Added command for upgrading dependencies. @davisagli @sneridagh [#333](https://github.com/kitconcept/kitconcept.intranet/issue/333)
- Add custom Person view for solr search results and customized search tabs with icons. @danalvrz 
- Update kitconcept-core to 2.0.0a12. @iFlameing 

#### Internal

- Added pt-br translations. @humanaice 
- Fixed a misleading translation (de). @jnptk 
- Regenerate lock file with no changes. @danalvrz 



### Project


#### Internal

- GHA: Only run the tag workflow on tags starting with `2.`. @ericof 
- Update the dev Docker Compose configuration to activate solr by default, but not use a persistent volume. @danalvrz 



## 2.0.0a8 (2026-02-05)

### Backend


#### Bugfix

- See https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a14 @sneridagh 


#### Internal

- Add example content for Passive Targteing feature @iRohitSingh [#309](https://github.com/kitconcept/kitconcept.intranet/issue/309)
- Show intranet header in accpetance tests. @davisagli 



### Frontend

#### Bugfix

- See https://github.com/kitconcept/volto-light-theme/releases/tag/8.0.0a14 @sneridagh 

#### Internal

- Fix acceptance test for header search. @davisagli 



### Project


#### Internal

- Demo sites: Ensure tika and solr services are always on an internal network. @ericof 



## 2.0.0a7 (2026-01-27)

### Backend


#### Feature

- Add Responsibilities field to Person content type. @danalvrz 


#### Bugfix

- Update the footer colophon text in example content. @iFlameing 



### Frontend

#### Feature

- Configure token widget for responsibilities field on Person content type. @danalvrz 

#### Bugfix

- Fix flaky cypress test. @iFlameing 



### Project


#### Feature

- Add docs about the Responsibilities field in Person content type. @danalvrz 



## 2.0.0a6 (2026-01-26)

### Backend


#### Internal

- Resize images in the example content. @sneridagh [#305](https://github.com/kitconcept/kitconcept.intranet/issue/305)
- Regenerated .pot files (no string changes). @danalvrz 
- Update to k.core 2a9:
    https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a9 @sneridagh 



### Frontend

#### Feature

- Add and register ListingBlockDisclaimer component for targeted listings. @danalvrz 

#### Bugfix

- Fix repeated vocabulary request for each keystroke in a text block @Tishasoumya-02 [#306](https://github.com/kitconcept/kitconcept.intranet/issue/306)

#### Internal

- Fix flaky preview-image-link cypress test @Tishasoumya-02 [#304](https://github.com/kitconcept/kitconcept.intranet/issue/304)
- Update to k.core 2a9:
    https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a9 @sneridagh 



### Project


#### Internal

- Removed coverage tests from CI. @sneridagh 



## 2.0.0a5 (2026-01-15)

### Backend


#### Internal

- Fixed bug where markdown inline links in descriptions are rendered as a separate paragraph @jackahl
  Use the CSS prop --breadcrumbs-foregound for breadcrumbs links as default, with --link-foreground-color as fallback. @danalvrz
  Removed `Contents` shadow in favor of the core implementation. @sneridagh
  New reindex script @davisagli @jnptk 



### Frontend

#### Internal

- Fixed bug where markdown inline links in descriptions are rendered as a separate paragraph @jackahl
  Use the CSS prop --breadcrumbs-foregound for breadcrumbs links as default, with --link-foreground-color as fallback. @danalvrz
  Removed `Contents` shadow in favor of the core implementation. @sneridagh
  New reindex script @davisagli @jnptk 



### Project

No significant changes.




## 2.0.0a4 (2026-01-14)

### Backend


#### Breaking

- Convert organisational unit and location behaviors to support multiple values. There is an upgrade step which must be run to update existing content and indexes. @davisagli 


#### Bugfix

- Fixed sticky menu cut off at the bottom on smaller screens @iRohitSingh
  Fixed double navigation in cards that contains inner links in its body. @sneridagh
  Fixed rearrangement of files in drag-and-drop of folderish content. @Tishasoumya-02 


#### Internal

- Add example content for differentiate between technical and user-facing example content
  @iRohitSingh 



### Frontend

#### Bugfix

- Fixed sticky menu cut off at the bottom on smaller screens @iRohitSingh
  Fixed double navigation in cards that contains inner links in its body. @sneridagh
  Fixed rearrangement of files in drag-and-drop of folderish content. @Tishasoumya-02 
- Update Person and Event views to support multiple values for organisational unit and location. @davisagli 

#### Internal

- Add Cypress tests for Enter key behavior on focused blocks @iRohitSingh 



### Project


#### Documentation

- Fix spelling. @davisagli 



## 2.0.0a3 (2025-12-16)

### Backend


#### Feature

- Add option to sort listing blocks by user relevance (when solr is enabled). @davisagli [#207](https://github.com/kitconcept/kitconcept.intranet/issue/207)


#### Bugfix

- Update to kitconcept.core 2.0.0a6 (rename Path criteria, fix validation of Person username). @davisagli 


#### Internal

- Update kitconcept.solr to 2.0.0a8. @reebalazs 



### Frontend

#### Internal

- Update to kitconcept.solr 2.0.0.alpha-7. @davisagli [#207](https://github.com/kitconcept/kitconcept.intranet/issue/207)
- Re-enable acceptance tests for Person content type. @davisagli 
- Update @kitconcept/volto-solr to 2.0.0-alpha.8. @reebalazs 



### Project


#### Bugfix

- Fix solr configuration for demo sites. @davisagli 


#### Internal

- Update kitconcept.solr to 2.0.0a8 and @kitconcept/volto-solr to 2.0.0-alpha.8. Add tika service for SOLR text extraction. @reebalazs 


#### Documentation

- Add docs for passive targeting. @davisagli [#207](https://github.com/kitconcept/kitconcept.intranet/pull/207)



## 2.0.0a2 (2025-12-09)

### Backend


#### Bugfix

- Update to core 2a5.
  https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a5 @sneridagh 



### Frontend

#### Bugfix

- Update to core 2a5.
  https://github.com/kitconcept/kitconcept-core/releases/tag/2.0.0a5 @sneridagh 



### Project

No significant changes.




## 2.0.0a1 (2025-12-01)

### Backend


#### Bugfix

- Update kitconcept.solr to 2.0.0.a6 @reebalazs 


#### Internal

- Hide secondary logo in mobile. Fixed teaser description update problem. Update core 2a4. @sneridagh 



### Frontend

#### Bugfix

- Update kitconcept.solr to 2.0.0.a6 @reebalazs 

#### Internal

- Hide secondary logo in mobile. Fixed teaser description update problem. Update core 2a4. @sneridagh 
- Rename internal package and folder for consistency. @sneridagh 



### Project

No significant changes.




## 2.0.0a0 (2025-11-13)

### Backend


#### Breaking

- Renamed code related to content lifecycle management from LCM to CLM. @iFlameing [#240](https://github.com/kitconcept/kitconcept.intranet/issue/240)
- Update to use Volto 19 and VLT 8. @sneridagh 


#### Feature

- Add backend for content ratings, and enable discussion and ratings for the Page content type. @iFlameing [#185](https://github.com/kitconcept/kitconcept.intranet/issue/185)
- Add service for feedback form. @iFlameing [#240](https://github.com/kitconcept/kitconcept.intranet/issue/240)
- Add votes behaviour to all default Plone content type. @iFlameing 


#### Bugfix

- Activate solr when creating a site with the setup_solr option enabled. @davisagli 


#### Internal

- Update to Volto 19a13 VLT 8a6. @sneridagh [#282.vlt8a6volto19a13](https://github.com/kitconcept/kitconcept.intranet/issue/282.vlt8a6volto19a13)
- Enable solr by default in the beispiele image. @davisagli 
- Enable solr for demo site. @davisagli 
- Several fixes - Update Volto 18.29.0 and vlt 7.5.1. @sneridagh 



### Frontend

#### Breaking

- Update to use Volto 19 and VLT 8. @sneridagh 

#### Feature

- Add Content Interactions component including rating, discussion, and sharing. @Tishasoumya-02, @iFlameing [#185](https://github.com/kitconcept/kitconcept.intranet/issue/185)
- Add Feedback Form @Tishasoumya-02 

#### Bugfix

- Fix aria-label for search input when solr is enabled. @reekitconcept, @davisagli 

#### Internal

- Update to Volto 19a13 VLT 8a6. @sneridagh [#282.vlt8a6volto19a13](https://github.com/kitconcept/kitconcept.intranet/issue/282.vlt8a6volto19a13)
- Added the prepublish script. 
- Several fixes - Update Volto 18.29.0 and vlt 7.5.1. @sneridagh 
- Update Share email text. @iFlameing 



### Project


#### Breaking

- Added versions consistency check in mrs-developer. @sneridagh 


#### Internal

- Enable solr for demo site. @davisagli 
- Fix solr hostname for demo stack. @davisagli 


#### Documentation

- Add documentation for content interactions. @iFlameing [#185](https://github.com/kitconcept/kitconcept.intranet/pull/185)
- Add docs for Feedback Contact Form and CLM fields. @iFlameing 



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



