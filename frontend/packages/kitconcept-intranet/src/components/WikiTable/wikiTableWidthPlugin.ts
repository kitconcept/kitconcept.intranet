/**
 * A table that arrives in the editor as a whole (pasted HTML from Excel,
 * Confluence or a web page, CSV text, markdown, a .docx) gets a wider step
 * when it has many columns: 6 or more columns are "Medium" (`medium`,
 * 1040px), 8 or more "Wide" (`layout`, 1440px), 10 or more "Full width"
 * (`full`). The first step follows the UX analysis behind #823: from six
 * columns on, a table is cramped in the 780px text column (every column is
 * at least 120px wide). The further steps every two columns were decided
 * in #825 along with the Medium step.
 *
 * Every paste goes through `insertFragment` (Plate's parsers insert the
 * deserialized fragment with it), so this is the one place for all paste
 * paths. Only top-level tables without a `blockWidth` are stamped, and only
 * when the paste lands at the top level of the page: a table pasted into a
 * column stays in the column, where the width is ignored and would only be
 * stored. (A callout holds text, not blocks: a table pasted into it splits
 * the callout and lands on the page, so it is stamped like any other. A
 * table pasted into a table cell is merged into that table by Plate.) A
 * table copied inside the editor keeps the width it had. A table inserted from
 * the slash menu or the toolbar (3 × 3, `insertNodes`) stays in the reading
 * column, and adding columns to a table never changes its width: that
 * would override an editor's choice. @plone/plate's block width plugin
 * keeps a stamped value, it is one of the widths allowed for tables
 * (config/blocks.ts).
 *
 * Tickets: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/823
 *          https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/825
 */
import type { TElement } from 'platejs';
import { createSlatePlugin, ElementApi, KEYS } from 'platejs';

export const BLOCK_WIDTH_KEY = 'blockWidth';

/** From this many columns on, a pasted table is "Medium". */
export const MEDIUM_FROM_COLUMNS = 6;

/** From this many columns on, a pasted table is "Wide". */
export const WIDE_FROM_COLUMNS = 8;

/** From this many columns on, a pasted table is "Full width". */
export const FULL_FROM_COLUMNS = 10;

export type TableWidth = 'default' | 'medium' | 'layout' | 'full';

/** The width step for a table with `columns` columns. */
export function widthForColumnCount(columns: number): TableWidth {
  if (columns >= FULL_FROM_COLUMNS) return 'full';
  if (columns >= WIDE_FROM_COLUMNS) return 'layout';
  if (columns >= MEDIUM_FROM_COLUMNS) return 'medium';
  return 'default';
}

/** The number of columns of a table: its widest row, merged cells counted. */
export function columnCount(table: TElement): number {
  return Math.max(
    0,
    ...table.children.map((row) =>
      ElementApi.isElement(row)
        ? row.children.reduce(
            (sum, cell) =>
              sum +
              (ElementApi.isElement(cell)
                ? Math.max(1, Number(cell.colSpan) || 1)
                : 0),
            0,
          )
        : 0,
    ),
  );
}

/**
 * `nodes` with a `blockWidth` on every top-level table that has none, from
 * its column count. Tables in the reading column are left as they are (the
 * block width plugin stamps `default`). Returns `nodes` itself when nothing
 * changes.
 */
export function withPastedTableWidths<T>(nodes: T[], tableType = KEYS.table) {
  let changed = false;
  const result = nodes.map((node) => {
    if (
      !ElementApi.isElement(node) ||
      node.type !== tableType ||
      typeof node[BLOCK_WIDTH_KEY] === 'string'
    ) {
      return node;
    }
    const width = widthForColumnCount(columnCount(node));
    if (width === 'default') return node;
    changed = true;
    return { ...node, [BLOCK_WIDTH_KEY]: width };
  });
  return changed ? result : nodes;
}

export const WikiTableWidthPlugin = createSlatePlugin({
  key: 'wikiTableWidth',
}).overrideEditor(({ editor, tf: { insertFragment } }) => ({
  transforms: {
    insertFragment(fragment, options) {
      // The lowest block at the caret differs from the highest one when the
      // caret is inside a column or a table cell (a callout is one block).
      const lowest = editor.api.block()?.[0];
      const highest = editor.api.block({ highest: true })?.[0];
      const nested = !!lowest && !!highest && lowest !== highest;
      insertFragment(
        nested
          ? fragment
          : withPastedTableWidths(fragment, editor.getType(KEYS.table)),
        options,
      );
    },
  },
}));
