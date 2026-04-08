---
myst:
  html_meta:
    description: "Schema reference for the IAdditionalContactInfo Dexterity behavior."
    keywords: "IAdditionalContactInfo, behavior, Person, address, phone, fax, developer"
doc_type: reference
audience: developer
last_updated: 2026-04-08
---

# IAdditionalContactInfo

The `IAdditionalContactInfo` behavior adds physical address and telephone fields to a content type. It is applied to the **Person** content type to capture office location and phone contact details beyond the standard email address.

## Interface

```
kitconcept.intranet.behaviors.additional_contact_info.IAdditionalContactInfo
```

## Fields

| Field name | Type | Required | Description |
|------------|------|----------|-------------|
| `address` | `Text` | No | Street address or office location of the person. Supports multi-line input. |
| `office_phone` | `TextLine` | No | Direct office phone number. Free-form text to accommodate various national formats. |
| `fax` | `TextLine` | No | Fax number. Free-form text. |

:::{note}
All fields are optional. If none are filled in, the fields are simply not rendered in the Person view.
:::

## Registration

The behavior is registered in `configure.zcml` and applied to the `Person` content type via the Generic Setup profile:

```xml
<property name="behaviors" purge="false">
  <element value="kitconcept.intranet.behaviors.additional_contact_info.IAdditionalContactInfo"/>
</property>
```

## Frontend rendering

The additional contact fields are rendered in the **Person view** component alongside other contact details. The address field is rendered with preserved line breaks. Phone numbers are rendered as `tel:` links where applicable.

To customise rendering, override the `PersonView` component or the relevant slot in the person view template.

## Adding to a Custom Content Type

To apply this behavior to a custom content type, add it to the type's behavior list via GenericSetup or TTW (through-the-web):

```xml
<!-- profiles/default/types/MyType.xml -->
<property name="behaviors" purge="false">
  <element value="kitconcept.intranet.behaviors.additional_contact_info.IAdditionalContactInfo"/>
</property>
```

Or via the Plone control panel: **Dexterity Content Types** → select your type → **Behaviors** tab → enable **Additional Contact Info**.

## See Also

- [IPersonBehavior reference](/developer/reference/behaviors/person)
- [IBiography behavior reference](/developer/reference/behaviors/biography)
- [Person content type reference](/reference/content-types)
- [Person view component](/developer/reference/components/person-view)
