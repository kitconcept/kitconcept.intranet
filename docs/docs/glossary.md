---
myst:
  html_meta:
    description: "Terms and definitions used throughout the kitconcept Intranet Distribution documentation."
    keywords: "glossary, terms, definitions, intranet, Plone"
status: draft
last_updated: 2026-03-18
---

# Glossary

Terms and definitions used throughout the kitconcept Intranet Distribution documentation.

:::{note}
Intranet-specific terms below are stubs pending review by a domain expert. Generic Plone/Sphinx terms are complete.
:::

```{glossary}
:sorted: true

Plone
    [Plone](https://plone.org/) is an open-source content management system used to create, edit, and manage digital content, like websites, intranets, and custom solutions.
    It comes with over 20 years of growth, optimisations, and refinements.
    The result is a system trusted by governments, universities, businesses, and other organisations all over the world.

add-on
    An add-on in Plone extends its functionality.
    It is code that is released as a package to make it easier to install.

    In Volto, an add-on is a JavaScript package.

    In Plone core, an add-on is a Python package.

    -   [Plone core add-ons](https://github.com/collective/awesome-plone#readme)
    -   [Volto add-ons](https://github.com/collective/awesome-volto#readme)

Markedly Structured Text
MyST
    [Markedly Structured Text (MyST)](https://myst-parser.readthedocs.io/en/latest/) is a rich and extensible flavor of Markdown, for authoring Plone Documentation.

Sphinx
    [Sphinx](https://www.sphinx-doc.org/en/master/) is a tool that makes it easy to create intelligent and beautiful documentation.
    It was originally created for Python documentation, and it has excellent facilities for the documentation of software projects in a range of languages.

CLM
    Content Lifecycle Management. The `ICLM` behavior provides **Authors**, **Content Owner**, and **Feedback To** fields on content items. These fields drive the feedback routing system — the Content Owner or Feedback To person receives feedback submissions for the item.

    See: {doc}`/developer/reference/behaviors/clm`

Passive Targeting
    A feature that sorts listing or search block results by relevance to the current user's organisational unit or location, creating a personalized browsing experience. Requires Solr.

    See: {doc}`/how-to-guides/engagement/passive-targeting`

Person
    A custom Plone content type representing a staff member in the intranet. Provides a people directory, responsibilities field, and integrates with the CLM behavior for content ownership.

    See: {doc}`/reference/content-types`

Organisational Unit
    A custom Plone content type representing a team, department, or division within the organisation. Used to structure the intranet's organisational hierarchy and drive passive targeting.

    See: {doc}`/reference/content-types`

Location
    A custom Plone content type representing a physical location such as an office or building. Used in the organisational structure and for passive targeting.

    See: {doc}`/reference/content-types`

Subsite
    A Plone content item that implements `INavigationRoot`. Acts as a mini-site root within a larger Plone site. Inherits VLT site customization settings from its nearest site ancestor.

    See: {doc}`/developer/reference/behaviors/voltolighttheme`

Volto Light Theme
VLT
    The frontend theme package (`@kitconcept/volto-light-theme`) used by the kitconcept Intranet Distribution. Provides the base look-and-feel, block system (Block Model v3), and site customization behaviors.

    See: {doc}`/developer/concepts/block-model`

kitconcept.core
    The backend/frontend baseline layer beneath the kitconcept Intranet Distribution. Provides the foundation Generic Setup profiles, shared add-ons, and upgrade machinery.

    See: {doc}`/developer/concepts/architecture`

Content Owner
    The `responsible_person` field from the CLM behavior. Identifies the accountable owner of a content item. Used as the primary fallback recipient in the feedback routing priority chain.

    See: {doc}`/developer/reference/behaviors/clm`

Distribution
    A pre-configured Plone setup bundling add-ons, configuration, and content types into a single installable package. The kitconcept Intranet Distribution is built on top of `kitconcept.core`.
```
