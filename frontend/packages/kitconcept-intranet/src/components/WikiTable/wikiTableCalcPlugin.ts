/**
 * Keeps the sum cells of a table's footer row up to date while editing.
 *
 * Whenever a table is normalized (after any change inside it), every footer
 * cell marked `calc: 'sum'` gets the sum of its column written into it as
 * text (see `tableCalc.ts`). The text is stored with the page, so the view
 * and the history diff need no calculation of their own.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/750
 */
import {
  createSlatePlugin,
  ElementApi,
  KEYS,
  PathApi,
  RangeApi,
} from 'platejs';

import { sumUpdates } from './tableCalc';

export const WikiTableCalcPlugin = createSlatePlugin({
  key: 'wikiTableCalc',
}).overrideEditor(({ editor, tf: { normalizeNode } }) => ({
  transforms: {
    normalizeNode(entry, options) {
      const [node, path] = entry;
      if (ElementApi.isElement(node) && node.type === KEYS.table) {
        const [update] = sumUpdates(node);
        if (update) {
          const cellPath = [...path, update.row, update.col];
          const caretInCell =
            !!editor.selection &&
            PathApi.isDescendant(editor.selection.anchor.path, cellPath);
          // Only the text is replaced, the cell's paragraph stays: the
          // history diff then shows a text change, and node ids are stable.
          // Delete and insert separately: `insertText` with a range as `at`
          // also moves the editor's selection there (Slate), which would
          // pull a caret typing elsewhere into this cell.
          const range = editor.api.range(cellPath);
          if (range && !RangeApi.isCollapsed(range)) {
            editor.tf.delete({ at: range });
          }
          if (update.text) {
            editor.tf.insertText(update.text, {
              at: editor.api.start(cellPath),
            });
          }
          // Deleting the old text leaves a caret inside it at the start;
          // keep it at the end of the result.
          if (caretInCell) editor.tf.select(editor.api.end(cellPath));
          return;
        }
      }
      normalizeNode(entry, options);
    },
  },
}));
