/**
 * Insert a wiki table the way Confluence does it: 3 × 3 with a header row.
 *
 * Plate's own insert (`insert.table({}, { select: true })`) creates a 2 × 2
 * table without a header row. Used by the slash menu entry and by the
 * floating toolbar button (both shadowed from @kitconcept/volto-plate).
 */
import { TablePlugin } from '@platejs/table/react';
import type { PlateEditor } from 'platejs/react';

export const WIKI_TABLE_DEFAULTS = { rowCount: 3, colCount: 3, header: true };

export function insertWikiTable(editor: PlateEditor) {
  editor
    .getTransforms(TablePlugin)
    .insert.table(WIKI_TABLE_DEFAULTS, { select: true });
}
