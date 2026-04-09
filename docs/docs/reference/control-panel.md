---
myst:
  html_meta:
    description: "Reference for all IIntranetSettings control panel options."
    keywords: "control panel, settings, IIntranetSettings, admin"
doc_type: reference
audience: admin
last_updated: 2026-04-09
---

# Control Panel Settings

All settings available in the **kitconcept Intranet Settings** control panel (`/@@intranet-settings-controlpanel`). Settings are stored in the Plone registry under the `IIntranetSettings` interface.

## Feedback settings

| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| `enable_sticky_feedback_button` | Boolean | Show a floating feedback button on all content pages | `False` |
| `default_feedback_email` | Text | Fallback email address for feedback submissions when no CLM fields are set on the content | *(empty)* |
| `feedback_cc_email` | Text | CC address added to all feedback submission emails | *(empty)* |
| `allowed_email_domains` | List | If set, only email addresses from these domains may submit feedback | *(empty)* |

## Content interaction settings

| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| `enable_content_rating` | Boolean | Enable the likes / rating feature globally across the site | `False` |

## Person settings

| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| `disable_profile_links` | Boolean | When enabled, person names in teasers and listings are not linked to the person's profile page | `False` |
| `person_picture_aspect_ratio` | Choice | Controls the CSS aspect ratio applied to person profile images. Options: `rounded1to1` (circular, default) or `squared4to5` (portrait rectangle) | `rounded1to1` |

### disable_profile_links

Registry key: `kitconcept.disable_profile_links`

When set to `True`, the `PersonResultItem` and teaser/listing components wrap person links in a no-op `MaybeWrap`, effectively removing the hyperlink. This is useful on intranets where person profiles should not be publicly discoverable through search results.

### person_picture_aspect_ratio

Registry key: `kitconcept.person_picture_aspect_ratio`

Controls the visual style of person images throughout the site (teasers, listings, detail view). When set to `squared4to5`, the `person-squared-images` CSS class is added to the `<body>` element by the `IntranetCSSInjector` slot component, which applies the corresponding CSS rules.

## Missing or unclear

- Full list of backend registry field names and their Python types requires confirmation from the backend `IIntranetSettings` interface definition.

## See Also

- [Person image style](../how-to-guides/settings/person-image-style.md)
- [Configure the feedback form](../how-to-guides/feedback/configure-feedback.md)
- [Person View component](../developer/reference/components/person-view.md)
