---
myst:
  html_meta:
    description: "Restore deleted intranet content from the recycle bin."
    keywords: "recycle bin, deleted content, restore, recover, permanently delete"
last_updated: 2026-10-05
---

# Restore deleted content

The recycle bin gives site managers a recovery window after they delete content.
It ships enabled by default and preserves a deleted item, including the contents
of a deleted folder, until a manager restores or permanently removes it.

You need the `plone.recyclebin: Access recycle bin` permission to view and
manage deleted content. Managers have this permission by default.

## Move content to the recycle bin

1. Navigate to the content item.
2. Select **Delete** from the toolbar.
3. Confirm the deletion.
4. Open **Recycle bin** from the user menu, or visit `/@@recyclebin` at the
   site root.

The item appears with its original path and deletion date. Deleting a folder
creates one recycle-bin entry for the complete folder tree.

## Restore content to its original location

1. Open the recycle bin.
2. Select one or more items.
3. Select **Restore selected**.

When you restore one item, the browser opens the restored content. The item
keeps its original ID and returns to its original parent.

The restore stops without overwriting content if the original parent no longer
exists or another item with the same ID already exists there. Restore the item
to another container in that case.

## Restore content to another location

1. In the recycle bin, select the title of the deleted item.
2. In **Target path**, enter the path of an existing container relative to the
   site root, such as `news/archive`.
3. Select **Restore**.

Leave **Target path** unchanged to restore the item to its original parent.

## Permanently remove deleted content

To remove selected entries, select them. Then choose **Delete selected**. To
remove everything, choose **Empty recycle bin**.

:::{warning}
You can't undo the permanent removal of an item from the recycle bin.
:::

In **Site Setup → Recycle bin**, managers can configure whether the recycle bin
captures deletions, the retention period, and whether restored items return to
their initial workflow state.

For filtering, restoring individual descendants, configuration, and REST API
details, see the
[Plone Recycle Bin documentation](https://plone.github.io/plone-recyclebin/).
