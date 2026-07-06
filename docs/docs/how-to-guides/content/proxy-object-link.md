---
myst:
  html_meta:
    description: "Open a person profile from a teaser or listing and return to the original page using the proxy object link and return toast."
    keywords: "proxy object link, return to, person profile, toast, how-to, editor"
doc_type: how-to
audience: editor
last_updated: 2026-06-16
---

# Open a person profile and return to the original page

Person summaries and cards can show a **link icon button**.
Clicking it opens the person's profile page while remembering where you came from.
On the profile page, a toast notification offers a one-click way to return to the page you started on.

This is useful when a person appears on many listings, teasers, or organisational pages: you can jump to their profile and then go straight back to the page you were reading, without using the browser's Back button.

## Prerequisites

- The link icon button is controlled by the `kitconcept.clickable_profile_links` site setting.
  The button is only rendered when this setting is disabled.
  If you do not see the icon, ask your administrator to disable it.

## Opening a person profile

1. Navigate to any page that lists or teases a person (for example a department listing, a search result, or a teaser block).
2. Locate the **link icon** displayed on the person summary or card.
3. Click the link icon.
4. You are taken to the person's profile page.
   The address bar now includes a `return_to` parameter pointing to the page you came from, for example:

   ```text
   /en/people/jane-doe?return_to=/en/departments/marketing
   ```

## Returning to the original page

1. After opening the profile, a toast notification appears in the corner with the title **"Back to the original page"**.
2. Read the message: *"You opened this item from another page. Use the link to return."*
3. Click the **return button** (the circled back arrow) in the toast.
4. You are taken back to the page you originally came from.

The toast:

- Stays open until you act on it or navigate away (it does not auto-close).
- Is dismissed automatically if you navigate to a different page yourself.

## Troubleshooting

**I do not see the link icon on person summaries.**
The icon is only shown when the `kitconcept.clickable_profile_links` site setting is disabled.
Ask your administrator to check the setting.

**No toast appears on the profile page.**
The toast only appears when the page was opened through the link icon, that is, when the URL contains a `return_to` parameter.
If you opened the profile directly or by another link, no toast is shown.

**Clicking return takes me to an unexpected page.**
The return target is whatever page you were on when you clicked the link icon.
Open the profile again from the page you want to return to.

## See Also

- [Create a person](/how-to-guides/content/create-person)
- [Configure squared person images in teasers and listings](/how-to-guides/settings/person-image-style)
