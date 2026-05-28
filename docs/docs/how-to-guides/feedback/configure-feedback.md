---
myst:
  html_meta:
    description: "Configure feedback recipients and email settings for content pages in your intranet."
    keywords: "feedback, configure, email, CLM, admin"
doc_type: how-to
audience: admin
tags: [feedback, email, configuration]
last_updated: 2026-03-18
---

# Configure the content feedback form

This guide shows you how to configure who receives feedback submissions for your intranet content, and how to set up global feedback defaults.

## Prerequisites

- Admin access to the Intranet Settings control panel.
- The CLM behavior must be applied to your content types (contact your developer if unsure).
- The **Site 'From' address** must be set in the Mail control panel.

## How feedback routing works

The recipient of the feedback is determined by the following priority:

1. **Feedback to** field defined on the content item (if available)
2. **Content Owner** field defined on the content item (if available)
3. If neither field is filled but the content has a parent with a **Content Owner** set on any ancestor, the email is sent to that person

If **Enable Sticky Feedback Button** is enabled, a button will appear in a fixed position on the left side of the page. It appears automatically after 4 seconds or when the user scrolls past 500px.

![Sticky Feedback Button](/_static/images/sticky-feedback-button.png)

## Screenshots

### Feedback Form

![Example of feedback form](/_static/images/content-feedback-form.png)

### CLM Fields on a content item

![CLM fields](/_static/images/clm.png)

### Mail control panel

![Email fields](/_static/images/email.png)

### Intranet Settings

![Intranet settings](/_static/images/intranet.png)

## Global feedback settings

These fields are in the **Intranet Settings** control panel:

| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| **Default Feedback Email** (`default_feedback_email`) | Text | Used when no `feedback_person` is defined on the content. | *(empty)* |
| **Feedback CC Email** (`feedback_cc_email`) | Text | Additional recipient to receive a CC of all feedback submissions. | *(empty)* |
| **Allowed Email Domains** (`allowed_email_domains`) | List | Restricts feedback submission to specific email domains. | *(empty)* |
| **Enable Sticky Feedback Button** (`enable_sticky_feedback_button`) | Boolean | Shows a floating feedback button across all pages. | `False` |

:::{note}
The **Authors**, **Content Owner**, and **Feedback to** fields on individual content items are provided by the CLM behavior. See the [CLM behavior reference](/developer/reference/behaviors/clm) for technical details.
:::

## See Also

- [CLM behavior reference](/developer/reference/behaviors/clm)
- [@feedback API reference](/developer/reference/api/feedback)
