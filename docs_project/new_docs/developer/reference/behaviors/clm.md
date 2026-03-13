---
myst:
  html_meta:
    description: "ICLM behavior schema — fields, widget configuration, and vocabulary references."
    keywords: "CLM, ICLM, behavior, responsible_person, feedback_person, authors, developer"
doc_type: reference
audience: developer
---

# ICLM Behavior

## Overview

The `ICLM` behavior provides content lifecycle management fields. When applied to a content type, it exposes **Authors**, **Content Owner**, and **Feedback To** fields used by the feedback routing system.

The behavior dotted name is: `kitconcept.intranet.behaviors.clm.ICLM`

## Schema

| Field | Type | Description | Permissions | Notes |
|-------|------|-------------|-------------|-------|
| **Authors** (`authors`) | `List(TextLine)` | People involved in creating or editing the content. | `siteadminsonly` | Multi-select from `kitconcept.intranet.vocabularies.person`. |
| **Content Owner** (`responsible_person`) | `TextLine` | Primary owner or maintainer of the content. | `siteadminsonly` | Used for identifying the accountable content owner. |
| **Feedback to** (`feedback_person`) | `TextLine` | Person designated to receive feedback for this content. | `siteadminsonly` | Overrides the global default feedback email. |

## Widget Configuration

- All person fields use the `kitconcept.intranet.vocabularies.person` vocabulary.
- `authors` is **multi-select**.
- `responsible_person` and `feedback_person` are **single-select autocomplete** fields.
- The fields are grouped under the **CLM** fieldset.

## See Also

- [How to configure the feedback form](/how-to-guides/feedback/configure-feedback)
- [@feedback API reference](/developer/reference/api/feedback)
