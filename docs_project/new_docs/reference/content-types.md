---
myst:
  html_meta:
    description: "Reference for intranet content types — Person, Location, and Organisational Unit fields and usage."
    keywords: "content types, Person, Location, Organisational Unit, reference, intranet"
doc_type: reference
audience: editor
---

# Content Types

The kitconcept Intranet Distribution provides three custom content types: **Person**, **Location**, and **Organisational Unit**. These form the structural backbone of the intranet's people directory and organisational hierarchy.

---

## Person

A Person content item represents a staff member. It appears in people directories, search results, and teaser listings.

### Fields

| Field | Location | Description |
|-------|----------|-------------|
| **Name** | Default | Full name of the person |
| **Portrait** | Default | Profile photo |
| **Responsibilities** | Responsibilities & Expertise | Topics, tasks, or questions the person is responsible for |

### Responsibilities field

The **responsibilities** field is located in the **Responsibilities & Expertise** fieldset on the Person edit form. It allows users to describe what topics, tasks, or questions they are responsible for, helping colleagues find the right contact person.

Enter free-form tags describing responsibilities. Examples:
- "Budget planning"
- "IT-Support"
- "Onboarding"

The field supports autocomplete suggestions based on existing responsibilities in the system, making it easier to use consistent terminology across the organisation.

Responsibilities are indexed in the catalog, so users can search for persons by their responsibilities.

### See Also

- [How to create a Person](/how-to-guides/content/create-person)
- [Person behavior schema](/developer/reference/behaviors/person)

---

## Location

A Location content item represents a physical location such as an office or building.

:::{note}
Full field reference for Location is pending. See [ILocationBehavior schema](/developer/reference/behaviors/location) for technical details.
:::

### See Also

- [How to create a Location](/how-to-guides/content/create-location)
- [Location behavior schema](/developer/reference/behaviors/location)

---

## Organisational Unit

An Organisational Unit represents a team, department, or division within the organisation.

:::{note}
Full field reference for Organisational Unit is pending. See [Organisational Unit behavior schema](/developer/reference/behaviors/organisational-unit) for technical details.
:::

### See Also

- [How to create an Organisational Unit](/how-to-guides/content/create-organisational-unit)
- [Organisational Unit behavior schema](/developer/reference/behaviors/organisational-unit)
- [Organisational structure concept](/concepts/organisational-structure)
