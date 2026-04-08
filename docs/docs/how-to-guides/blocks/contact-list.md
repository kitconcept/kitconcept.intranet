---
myst:
  html_meta:
    description: "How to add and configure the ContactList block to display persons on a page."
    keywords: "contact list, contacts, persons, block, how-to, editor"
doc_type: how-to
audience: editor
last_updated: 2026-04-08
---

# Use the ContactList block

The ContactList block displays a curated list of persons from your intranet directory on any page. It is ideal for team pages, department overviews, and contact directories.

## Prerequisites

- You have Editor or Manager access to the page.
- The persons you want to list have been created as [Person content items](/how-to-guides/content/create-person) on the site.

## Adding the ContactList Block

1. Open the page in **edit mode**.
2. Click the **+** button to open the block chooser.
3. Search for **ContactList** (or **Contact List**) and click it to insert the block.

## Configuring the Block

### Selecting Contacts

You can populate the list in two ways:

#### Option A: Manual selection

1. In the block sidebar, click **Add item** or the object browser icon.
2. Use the content browser to navigate to the Person items you want to include.
3. Select each person and confirm. Repeat for additional entries.
4. Drag the handles in the list to reorder contacts.

#### Option B: Query-based (automatic)

If your installation supports query mode for the ContactList block:

1. Toggle the **Use query** switch in the sidebar.
2. Add filter criteria (for example, filter by organisational unit or tag).
3. Set the maximum number of persons to display.

### Display Options

| Option | Description |
|--------|-------------|
| **Title** | Optional heading above the list |
| **Show photo** | Toggle the person portrait image |
| **Show role/title** | Show the person's job title |
| **Show contact info** | Show email address and phone numbers |
| **Show link** | Make the person's name link to their profile page |
| **Columns** | Number of columns for the grid layout (1–4) |

:::{note}
The **Show link** option may be controlled globally by the admin setting **Disable Person Link**. If the admin has disabled person links site-wide, individual blocks cannot override this setting. See [Control Panel Settings](/reference/control-panel) for details.
:::

### Layout

The ContactList block supports two layout modes:

- **Grid** – persons are displayed in a responsive card grid. Suitable for team overviews.
- **List** – persons are displayed as a vertical list with inline contact details. Suitable for compact directories.

## Example: Adding a Team Section

1. On your team page, add a **Text** block with the heading "Our Team".
2. Add a **ContactList** block below it.
3. Manually select the persons in your team using the object browser.
4. Enable **Show photo**, **Show role/title**, and set **Columns** to `3`.
5. Click **Save**.

## Troubleshooting

**A person does not appear in the object browser.**
The person item may not yet be published. Ask the person's owner or an admin to publish it, or switch to a workflow state visible to editors.

**Photos are not displayed.**
The person content item may not have a portrait image. Edit the person item and upload a photo in the Image field.

## See Also

- [How to Create a Person](/how-to-guides/content/create-person)
- [Person content type reference](/reference/content-types)
- [Control Panel Settings](/reference/control-panel)
