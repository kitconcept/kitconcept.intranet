---
myst:
  html_meta:
    description: "Schema reference for the IAdditionalContactInfo Dexterity behavior from kitconcept.core."
    keywords: "IAdditionalContactInfo, behavior, Person, contact_building, contact_room, address, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-27
---

# IAdditionalContactInfo

The `IAdditionalContactInfo` behavior adds location-related contact fields to a content type. It is defined in `kitconcept.core` and applied to the **Person** content type.

## Behavior name

```
kitconcept.core.additional_contact_info
```

## Fields

All fields are optional. `contact_building` and `contact_room` carry a custom read permission (see [Permissions](#permissions) below).

| Field name | Type | Required | Label | Description |
|---|---|---|---|---|
| `contact_building` | `TextLine` | No | Building | Single-line text for the building name or identifier. |
| `contact_room` | `TextLine` | No | Room | Single-line text for the room name or number. |
| `address` | `Text` | No | Address | Multi-line text for a postal address. |

All three fields are grouped in the `contact_location` fieldset, labelled **Location**.

## Permissions

`contact_building` and `contact_room` are protected by the read permission:

```
kitconcept.core.behaviors.additional_contact_info.view
```

`address` carries no custom read permission.

## Registration

Registered in `kitconcept/core/behaviors/configure.zcml`:

```xml
<plone:behavior
    name="kitconcept.core.additional_contact_info"
    title="Person: Additional contact information"
    description="Fields with additional person information"
    provides=".additional_contact_info.IAdditionalContactInfo"
    />
```

## Applied to Person

The behavior is applied to the Person content type in both the `kitconcept-core` dependencies profile and the `kitconcept.intranet` default profile:

```xml
<element value="kitconcept.core.additional_contact_info" />
```

## See also

- [IPersonBiography behavior reference](/developer/reference/behaviors/biography)
- [Person content type reference](/reference/content-types)
