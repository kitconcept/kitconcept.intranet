---
myst:
  html_meta:
    description: "Reference for all IIntranetSettings control panel options."
    keywords: "control panel, settings, IIntranetSettings, admin"
doc_type: reference
audience: admin
status: draft
---

# Control Panel Settings

All settings available in the kitconcept Intranet Settings control panel.

:::{note}
This page is a stub pending domain expert input. For the schema definition, see [IIntranetSettings registry reference](/developer/reference/registry).
:::

## Settings

| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| `enable_content_rating` | Boolean | Enable the likes/rating feature globally | `False` |
| `enable_sticky_feedback_button` | Boolean | Show a floating feedback button on all pages | `False` |
| `default_feedback_email` | Text | Fallback email for feedback when no CLM fields are set | *(empty)* |
| `feedback_cc_email` | Text | CC address for all feedback submissions | *(empty)* |
| `allowed_email_domains` | List | Restrict feedback to these email domains | *(empty)* |

:::{note}
Additional settings are pending documentation. Domain expert review required.
:::

## See Also

- [IIntranetSettings registry schema](/developer/reference/registry)
