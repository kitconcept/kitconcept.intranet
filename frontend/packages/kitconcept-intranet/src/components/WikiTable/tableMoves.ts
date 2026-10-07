/**
 * Moving rows and columns of a wiki table.
 *
 * Pure index logic (`moveTargetIndex`, `reorder`) plus the Slate moves.
 * Used by drag and drop (useTableDragAndDrop.tsx) and by the move buttons
 * of the cell toolbar.
 */
import type { Path, SlateEditor, TElement } from 'platejs';
import { KEYS } from 'platejs';

export type DropPosition = 'before' | 'after';

type Cell = TElement & {
  colSpan?: number;
  rowSpan?: number;
  attributes?: { colspan?: string | number; rowspan?: string | number };
};

/** A row is a header row when all its cells are header cells. */
export const isHeaderRow = (row: TElement | undefined): boolean =>
  !!row &&
  row.children.length > 0 &&
  row.children.every((cell) => (cell as TElement).type === KEYS.th);

const span = (value: unknown) => Number(value ?? 1) || 1;

/** Tables with merged cells cannot have their columns moved. */
export const hasMergedCells = (table: TElement): boolean =>
  table.children.some((row) =>
    ((row as TElement).children ?? []).some((node) => {
      const cell = node as Cell;
      return (
        span(cell.colSpan ?? cell.attributes?.colspan) > 1 ||
        span(cell.rowSpan ?? cell.attributes?.rowspan) > 1
      );
    }),
  );

/**
 * Final index of an item moved from `from` to `before`/`after` the item at
 * `target` (indices before the move).
 */
export function moveTargetIndex(
  from: number,
  target: number,
  position: DropPosition,
): number {
  let to = position === 'before' ? target : target + 1;
  if (from < to) to -= 1;
  return to;
}

/** A copy of `list` with the item at `from` moved to index `to`. */
export function reorder<T>(list: readonly T[], from: number, to: number): T[] {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/** Move the row at index `from` of the table at `tablePath` to `to`. */
export function moveRow(
  editor: SlateEditor,
  tablePath: Path,
  from: number,
  to: number,
) {
  if (from === to) return;
  editor.tf.moveNodes({ at: [...tablePath, from], to: [...tablePath, to] });
}

/**
 * Move column `from` to `to`: the cell in every row, and the stored width.
 * Does nothing for tables with merged cells.
 */
export function moveColumn(
  editor: SlateEditor,
  tablePath: Path,
  from: number,
  to: number,
) {
  if (from === to) return;
  const entry = editor.api.node<TElement>(tablePath);
  if (!entry) return;
  const [table] = entry;
  if (hasMergedCells(table)) return;
  const colSizes = (table as TElement & { colSizes?: number[] }).colSizes;
  editor.tf.withoutNormalizing(() => {
    table.children.forEach((_row, rowIndex) => {
      editor.tf.moveNodes({
        at: [...tablePath, rowIndex, from],
        to: [...tablePath, rowIndex, to],
      });
    });
    if (colSizes && colSizes.length > Math.max(from, to)) {
      editor.tf.setNodes(
        { colSizes: reorder(colSizes, from, to) } as Partial<TElement>,
        { at: tablePath },
      );
    }
  });
}
