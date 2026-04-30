---
myst:
  html_meta:
    description: "How to add and configure the Event Calendar block on intranet pages."
    keywords: "event calendar, block, events, how-to, editor"
doc_type: how-to
audience: editor
last_updated: 2026-04-27
---

# Use the Event Calendar block

The Event Calendar block displays upcoming events from your intranet in a list view. It supports query-based filtering so you can show events from specific folders, categories, or date ranges.

## Prerequisites

- You have Editor or Manager access to the page.

## Adding the Event Calendar Block

1. Open the page where you want to display events in **edit mode**.
2. Click the **+** button to open the block chooser.
3. Search for **Event Calendar** and click it to insert the block.
4. The block will appear with a placeholder calendar view.

## Configuring the Block

Once the block is inserted, use the sidebar panel to configure it.

### Query Settings

The Event Calendar block uses the same query engine as the Listing block. You can filter which events appear by:

1. Click **Add criterion** in the sidebar.
2. Select a filter type:
   - **Location** – restrict events to a specific folder path.
   - **Subject (Tags)** – show only events with certain tags.
   - **Start date** – show events starting from a given date.
3. Set the value for the criterion and confirm.

:::{tip}
To show only future events, add a **Start date** criterion with the operator set to **greater than or equal to** and the value set to **today**.
:::

### Display Options

| Option | Description |
|--------|-------------|
| **Title** | Optional heading shown above the calendar |
| **Number of items** | Maximum number of events to display |
| **Sort by** | Order events by start date (ascending/descending) or title |

## See Also

- [Creating an Event](/how-to-guides/content/create-person) (replace with event guide when available)
- [Listing block configuration](/how-to-guides/settings/blocks-config)
