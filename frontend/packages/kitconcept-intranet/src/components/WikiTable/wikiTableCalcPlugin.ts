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
import { createSlatePlugin, ElementApi, KEYS } from 'platejs';

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
          editor.tf.replaceNodes(
            [
              {
                type: editor.getType(KEYS.p),
                children: [{ text: update.text }],
              },
            ],
            { at: [...path, update.row, update.col], children: true },
          );
          return;
        }
      }
      normalizeNode(entry, options);
    },
  },
}));
