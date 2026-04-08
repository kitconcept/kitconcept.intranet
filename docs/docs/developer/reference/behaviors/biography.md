---
myst:
  html_meta:
    description: "Schema reference for the IBiography Dexterity behavior."
    keywords: "IBiography, behavior, Person, biography, description, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-08
---

# IBiography

The `IBiography` behavior adds a rich-text biography field to a content type. It is applied to the **Person** content type so that employees and staff members can have a professional biography or extended description displayed on their profile page.

## Interface

```
kitconcept.intranet.behaviors.biography.IBiography
```

## Fields

| Field name | Type | Required | Description |
|------------|------|----------|-------------|
| `biography` | `RichText` | No | Free-text biography or extended description of the person. Supports basic HTML formatting (bold, italic, links, lists). |

:::{note}
The `biography` field supplements—but does not replace—the standard Plone `description` field (plain-text summary). The `description` field is used for search snippets and metadata, while `biography` is intended for the full-page narrative displayed in the person's profile.
:::

## Registration

```xml
<property name="behaviors" purge="false">
  <element value="kitconcept.intranet.behaviors.biography.IBiography"/>
</property>
```

## Frontend rendering

The biography field is rendered in the **Person view** below the contact details section. It uses the standard Volto rich-text renderer, which respects HTML markup stored in the field.

### Conditional display

The biography section is only rendered if the `biography` field contains content. If the field is empty, the section is omitted entirely from the rendered page.

## Adding to a Custom Content Type

Apply the behavior via GenericSetup:

```xml
<!-- profiles/default/types/MyType.xml -->
<property name="behaviors" purge="false">
  <element value="kitconcept.intranet.behaviors.biography.IBiography"/>
</property>
```

Or enable it through the Plone control panel: **Dexterity Content Types** → select your type → **Behaviors** tab → enable **Biography**.

## Indexing

The `biography` field content is indexed in the Plone catalog's `SearchableText` index (after HTML stripping) so that keyword searches also match biography text. If you are using SOLR, the field is included in the full-text SOLR index by default.

## See Also

- [IPersonBehavior reference](/developer/reference/behaviors/person)
- [IAdditionalContactInfo behavior reference](/developer/reference/behaviors/additional-contact-info)
- [Person content type reference](/reference/content-types)
- [Person view component](/developer/reference/components/person-view)
