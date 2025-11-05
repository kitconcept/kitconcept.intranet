---
myst:
  html_meta:
    "description": "Implements a feedback form for Plone/Volto pages with configurable recipients, CC, and allowed email domains."
    "property=og:description": "Implements a feedback form for Plone/Volto pages with configurable recipients, CC, and allowed email domains."
    "property=og:title": "Content Feedback Form"
    "keywords": "Volto, Plone, feedback, form, intranet, LCM behavior"
---

# Content Feedback Form

The **Content Feedback Form** feature allows users to send feedback for a specific content item (e.g., a page or event) within the Intranet. It uses the **LCM behavior** to define feedback-related metadata for each content item and global settings to control the default behavior.

---

## Overview

When you fill in the **Content Owner** or **Feedback to** field in your content type, a **Feedback Form** link is inserted at the bottom of the page, allowing users to submit feedback directly associated with that content.

The recipient of the feedback is determined by the following priority:

1. **Feedback to** field defined on the content item (if available)
2. **Content Owner** field defined on the content item (if available)
3. If these two fields are not filled but your content has a parent and the **Content Owner** field is filled on any ancestor, the email is sent to that person

Additional default email addresses, CC addresses, domain restrictions, and sticky feedback button options are managed through the **Intranet Settings** control panel.

If **Enable Sticky Feedback Button** is enabled, a button will be present in a fixed position on the left side. It will appear automatically after 4 seconds or when the user scrolls past 500px.

![Sticky Feedback Button](/_static/sticky-feedback-button.png)

You also need to fill in the **Site 'From' address** field in the Mail control panel.

---

## Screenshots

### Feedback Form

![Example of feedback form](/_static/content-feedback-form.png)

### LCM Fields

![LCM fields](/_static/lcm.png)

### Email Control Panel Fields

![Email fields](/_static/email.png)

### Intranet Settings

![Intranet settings](/_static/intranet.png)


---

## Behavior: `ILCM`

| Field | Type | Description | Permissions | Notes |
|-------|------|-------------|-------------|-------|
| **Authors**(authors) | `List(TextLine)` | People involved in creating or editing the content. | `siteadminsonly` | Multi-select from `kitconcept.intranet.vocabularies.person`. |
| **Content Owner:**(responsible_person) | `TextLine` | Primary owner or maintainer of the content. | `siteadminsonly` | Used for identifying the accountable content owner. |
| **Feedback to**(feedback_person) | `TextLine` | Person designated to receive feedback for this content. | `siteadminsonly` | Overrides the global default feedback email. |

### Widget Configuration

- All person fields use the `kitconcept.intranet.vocabularies.person` vocabulary.
- `authors` is **multi-select**.
- `responsible_person` and `feedback_person` are **single-select autocomplete** fields.
- The fields are grouped under the **LCM** fieldset.

---

## Intranet Settings

These fields are part of the **Intranet Settings** control panel and define global feedback configuration.

| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| **Default Feedback Email** (`default_feedback_email`) | `TextLine` | Used when no `feedback_person` is defined on the content. | *(empty)* |
| **Feedback CC Email** (`feedback_cc_email`) | `TextLine` | Additional recipient to receive a CC of all feedback submissions. | *(empty)* |
| **Allowed Email Domains** (`allowed_email_domains`) | `List(TextLine)` | Restricts feedback submission to specific email domains. | *(empty)* |
| **Enable Sticky Feedback Button** (`enable_sticky_feedback_button`) | `Bool` | Shows a floating feedback button across all pages. | `False` |