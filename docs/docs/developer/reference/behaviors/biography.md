---
myst:
  html_meta:
    description: "Schema reference for the IPersonBiography Dexterity behavior from kitconcept.core."
    keywords: "IPersonBiography, behavior, Person, biography, text, RichText, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-27
---

# IPersonBiography

The `IPersonBiography` behavior adds a rich-text biography field to a content type. It is defined in `kitconcept.core` and applied to the **Person** content type.

## Behavior name

```
kitconcept.core.biography
```

## Fields

| Field name | Type | Required | Label | Description |
|---|---|---|---|---|
| `text` | `RichText` | No | Biography | A short biography for this person. |

The field is declared as `primary` (the main content field of the type) and is indexed in `SearchableText` via `plone.app.dexterity.textindexer`.

## Side effects

The behavior sets `IPersonData["description"]` to read-only, hiding the standard `description` field inherited from `collective.person`.

## Field ordering

`text` is ordered after `last_name` via `form.order_after`.

## Registration

Registered in `kitconcept/core/behaviors/configure.zcml`:

```xml
<plone:behavior
    name="kitconcept.core.biography"
    title="Person: Biography information"
    description="Add a field for a biography."
    provides=".person_bio.IPersonBiography"
    />
```

## Applied to Person

The behavior is applied to the Person content type in both the `kitconcept-core` dependencies profile and the `kitconcept.intranet` default profile:

```xml
<element value="kitconcept.core.biography" />
```

## See also

- [IAdditionalContactInfo behavior reference](/developer/reference/behaviors/additional-contact-info)
- [Person content type reference](/reference/content-types)
