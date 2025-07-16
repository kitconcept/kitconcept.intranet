# kitconcept's volto-button-block Release Notes

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/volto/developer-guidelines/contributing.html#create-a-pull-request
-->

<!-- towncrier release notes start -->

## 4.0.0-alpha.0 (2025-05-19)

### Internal

- Re-release for update metadata and READMEs. @sneridagh 

## 3.0.3 (2024-10-18)

### Bugfix

- Fix style wrapper in view and props passed to the legacy wrapper @sneridagh [#23](https://github.com/kitconcept/volto-button-block/pull/23)

## 3.0.2 (2024-10-08)

### Internal

- Fix peerDep on `react-intl` @sneridagh [#21](https://github.com/kitconcept/volto-button-block/pull/21)

## 3.0.1 (2024-06-11)

### Internal

- Remove `@plone/components` from dependencies @sneridagh [#0](https://github.com/kitconcept/volto-button-block/pull/0)

## 3.0.0 (2024-06-11)

### Breaking

- Compatible with the Block Model v3, via the `blockModel` opt-in flag. @sneridagh

  ** Deprecation notice **:
  During the 3.x series of this add-on, the flag will be opt-in.
  From 4.x onwards, the model v3 will be the default for this add-on and the flag will be removed (no opt-out).

  The 3.x series will be the last to support tge SemanticUI button component.
  The 4.x version will support `@plone/components` `Button` component only. [#20](https://github.com/kitconcept/volto-button-block/pull/20)

### Feature

- Add Spanish translations @macagua [#13](https://github.com/kitconcept/volto-button-block/pull/13)
- Use docker-less and project-less approach for developing @sneridagh [#17](https://github.com/kitconcept/volto-button-block/pull/17)

### Internal

- Improve project-less setup @sneridagh [#18](https://github.com/kitconcept/volto-button-block/pull/18)

## 2.3.1 (2023-07-21)

### Bugfix

- Fix DE translation of Inner Alignment @iRohitSingh. [#1](https://github.com/kitconcept/volto-export/pull/1)
- Add missing translation. @danalvrz [#12](https://github.com/kitconcept/volto-export/pull/12)


## 2.3.0 (2023-06-23)

### Feature

- Add new Feature Button opens in new window @iRohitSingh [#9](https://github.com/kitconcept/volto-export/pull/9)


## 2.2.0 (2023-06-06)

### Feature

- Add Brazilian Portuguese translation. @ericof [#7](https://github.com/kitconcept/volto-export/pull/7)


## 2.1.0 (2023-03-20)

### Feature

- Remove 'block' suffix @danalvrz [#5](https://github.com/kitconcept/volto-export/pull/5)
- Add dockerized testbed support @sneridagh [#6](https://github.com/kitconcept/volto-export/pull/6)


## 2.0.0 (2022-06-09)

### Breaking

- Fix CSS and block name now is `__button` to avoid semanticUI CSS clashes @sneridagh
- Rename widget internally @sneridagh

## 1.1.0 (2022-06-07)

### Feature

- Making it to incorporate the new style wrapper @iFlameing

## 1.0.0 (2022-04-22)

### Feature

- Real initial release @sneridagh

## 1.0.0-alpha.0 (2022-04-21)

### Feature

- Initial release @sneridagh @tisto

### Internal

- Added github workflows @robgietema
