/**
 * Alignment of a wiki table (work item 836, proposed when the #828 mockup
 * was discussed on 2026-11-12): left-aligned to the text column (the default, no
 * property) or centred, `tableAlign: 'center'` on the table node.
 *
 * A centred table wider than the text column is centred on the page in the
 * editor, the view and the history diff; one wider than the page minus the
 * side margins starts at the left margin and scrolls
 * (theme/components/_wikiTable.scss). The width model is the same as for a
 * left-aligned table: while its width is dragged, the frame keeps its left
 * edge, so the right edges follow the pointer (TableWidthDrag.tsx), and
 * when the drag ends the table is centred again at its new width.
 *
 * `WikiTableAlignPlugin` renders the alignment as the class
 * `wiki-table-centered` on the table's block (editor, view and diff) and
 * removes a value it does not know.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/836
 */
import { createSlatePlugin, ElementApi, KEYS } from 'platejs';

/** The node property holding the alignment. */
export const TABLE_ALIGN_KEY = 'tableAlign';

/** The one value stored; left-aligned is the property's absence. */
export const TABLE_ALIGN_CENTER = 'center';

/** The class on a centred table's block. */
export const CENTERED_CLASS = 'wiki-table-centered';

/** Whether a table node is centred. */
export const isCentered = (node: unknown) =>
  (node as Record<string, unknown> | null | undefined)?.[TABLE_ALIGN_KEY] ===
  TABLE_ALIGN_CENTER;

export const WikiTableAlignPlugin = createSlatePlugin({
  key: 'wikiTableAlign',
  inject: {
    isBlock: true,
    targetPlugins: [KEYS.table],
    nodeProps: {
      nodeKey: TABLE_ALIGN_KEY,
      transformClassName: ({ nodeValue }) =>
        nodeValue === TABLE_ALIGN_CENTER ? CENTERED_CLASS : undefined,
    },
  },
}).overrideEditor(({ editor, tf: { normalizeNode } }) => ({
  transforms: {
    normalizeNode(entry, options) {
      const [node, path] = entry;
      if (
        ElementApi.isElement(node) &&
        node.type === editor.getType(KEYS.table) &&
        TABLE_ALIGN_KEY in node &&
        node[TABLE_ALIGN_KEY] !== TABLE_ALIGN_CENTER
      ) {
        editor.tf.unsetNodes(TABLE_ALIGN_KEY, { at: path });
        return;
      }
      normalizeNode(entry, options);
    },
  },
}));
