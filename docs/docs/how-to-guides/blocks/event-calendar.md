---
myst:
  html_meta:
    description: "How to add and configure the Event Calendar block on intranet pages."
    keywords: "event calendar, block, events, how-to, editor"
doc_type: how-to
audience: editor
last_updated: 2026-04-08
---

# Use the Event Calendar block

The Event Calendar block displays upcoming events from your intranet in a calendar or list view. It supports query-based filtering so you can show events from specific folders, categories, or date ranges.

## Prerequisites

- You have Editor or Manager access to the page.
- At least one Event content item exists on the site (or in the folder you want to display).

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
| **View mode** | Switch between calendar grid view and list view |

### Calendar Grid View

In grid mode the block renders a monthly calendar. Days that have events are highlighted. Clicking a day expands the event entries for that day.

### List View

In list view the block renders events as a chronological list, showing the event title, start date/time, and location if available.

## Refreshing Content

The block includes a **Refresh Content** button in the toolbar. Click it to force the block to reload its query results without reloading the full page. This is useful on pages that stay open for a long time (such as a dashboard).

## Example: Showing This Week's Events

1. Add the Event Calendar block.
2. Add a **Start date** criterion: operator **greater than or equal to**, value **today**.
3. Add a second **Start date** criterion: operator **less than**, value **+7 days**.
4. Set **Sort by** to **Start date (ascending)**.
5. Set **Number of items** to `10`.
6. Click **Save**.

:::{note}
Events that span multiple days will appear on each day they cover in calendar grid view, but only once in list view (on their start date).
:::

## See Also

- [Creating an Event](/how-to-guides/content/create-person) (replace with event guide when available)
- [Listing block configuration](/how-to-guides/settings/blocks-config)
