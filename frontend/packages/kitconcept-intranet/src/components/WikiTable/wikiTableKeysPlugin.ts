/**
 * Keyboard behaviour inside wiki tables, Confluence-style:
 *
 * - Tab / Shift+Tab move to the next / previous cell; Tab in the last cell
 *   appends a row. Plate 49's table plugin has no Tab handling, and the
 *   indent plugin binds Tab to "indent block", which would indent the
 *   paragraph inside the cell instead.
 * - Backspace at the start of a cell and Delete at its end do nothing,
 *   instead of merging the cell with its neighbour (Plate 49 only guards
 *   fragment deletes).
 *
 * Tab is a Plate shortcut (react-hotkeys on the editable element, which
 * runs before the editor's key handlers), so it has to be a shortcut here
 * as well: the plugin's priority puts it before the indent shortcut and
 * `stopImmediatePropagation` keeps the indent shortcut from firing when a
 * table handled the key. Outside tables the handler returns `false` and
 * the indent shortcut runs as usual.
 */
import {
  getNextTableCell,
  getPreviousTableCell,
  getTableEntries,
} from '@platejs/table';
import { TablePlugin } from '@platejs/table/react';
import type { SlateEditor } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

function moveCell(
  editor: SlateEditor,
  event: KeyboardEvent | React.KeyboardEvent,
  reverse: boolean,
) {
  const entries = getTableEntries(editor);
  if (!entries) return false;
  const { cell, row } = entries;
  const next = reverse
    ? getPreviousTableCell(editor, cell, cell[1], row)
    : getNextTableCell(editor, cell, cell[1], row);
  event.preventDefault();
  (event as KeyboardEvent).stopImmediatePropagation?.();
  if (next) {
    editor.tf.select(next[1], { edge: 'end' });
  } else if (!reverse) {
    editor
      .getTransforms(TablePlugin)
      .insert.tableRow({ header: false, select: true });
  }
  return true;
}

export const WikiTableKeysPlugin = createPlatePlugin({
  key: 'wikiTableKeys',
  // Before the indent plugin (100), so the Tab shortcut registers first.
  priority: 200,
  shortcuts: {
    nextCell: {
      keys: 'tab',
      handler: ({ editor, event }) => moveCell(editor, event, false),
    },
    previousCell: {
      keys: 'shift+tab',
      handler: ({ editor, event }) => moveCell(editor, event, true),
    },
  },
  handlers: {
    onKeyDown: ({ editor, event }) => {
      if (event.key !== 'Backspace' && event.key !== 'Delete') return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (!editor.selection || !editor.api.isCollapsed()) return;
      const entries = getTableEntries(editor);
      if (!entries) return;
      const cellPath = entries.cell[1];
      const atEdge =
        event.key === 'Backspace'
          ? editor.api.isStart(editor.selection.anchor, cellPath)
          : editor.api.isEnd(editor.selection.anchor, cellPath);
      if (atEdge) {
        event.preventDefault();
        return true;
      }
    },
  },
});
