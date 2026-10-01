/**
 * Drag and drop of table rows and columns in the wiki editor, with
 * react-aria (`useDrag` / `useDrop`): mouse, touch, keyboard and screen
 * readers. Replaces Plate's react-dnd based row handle.
 *
 * Only a custom drag type is put on the drag data, never text, so a drop
 * outside a table cannot insert anything. Native drag events of our drags
 * are stopped before they reach Slate's own drag and drop handling (which
 * would otherwise treat the drop as an insert); other drags, such as
 * dragging selected text or dropping a file into a cell, pass through
 * untouched (see `shield`). Keyboard and screen
 * reader drags run through react-aria's drag manager and never produce
 * native events.
 */
import * as React from 'react';
import { defineMessages } from 'react-intl';
import { isTextDropItem, useDrag, useDrop } from 'react-aria-components';
import type { Path, SlateEditor, TElement } from 'platejs';
import {
  type DropPosition,
  hasMergedCells,
  isHeaderRow,
  moveColumn,
  moveRow,
  moveTargetIndex,
} from './tableMoves';

// react-aria-components does not export the drop event type.
type DropEvent = Parameters<
  NonNullable<Parameters<typeof useDrop>[0]['onDrop']>
>[0];

export const ROW_DRAG_TYPE = 'application/x-kitconcept-wiki-table-row';
export const COLUMN_DRAG_TYPE = 'application/x-kitconcept-wiki-table-column';

export const messages = defineMessages({
  dragRow: {
    id: 'Drag to move the row',
    defaultMessage: 'Drag to move the row',
  },
  dragColumn: {
    id: 'Drag to move the column',
    defaultMessage: 'Drag to move the column',
  },
});

type Payload = { tableId?: string; id?: string; col?: number };
type DragHandlers = Record<string, unknown>;

const DRAG_EVENTS = [
  'onDragStart',
  'onDragEnter',
  'onDragOver',
  'onDragLeave',
  'onDrop',
  'onDragEnd',
] as const;

const carries = (event: React.DragEvent, types: string[]) =>
  Array.from(event.dataTransfer?.types ?? []).some((type) =>
    types.includes(type),
  );

/**
 * Keep react-aria and Slate apart.
 *
 * - Drag sources (our handles) only start our drags: their events are
 *   always stopped before they reach Slate.
 * - Drop targets hand an event to react-aria only when the drag carries
 *   the type this target accepts. react-aria's drop target calls
 *   preventDefault + stopPropagation on every drag passing over it; for
 *   anything else (selected text, files, an image, a row dragged over a
 *   column target) the event is left alone and reaches the next target or
 *   Slate unchanged.
 */
function shield<T extends DragHandlers>(
  props: T,
  {
    source = false,
    accept = [],
    dragImage,
  }: {
    source?: boolean;
    accept?: string[];
    dragImage?: () => HTMLElement | null;
  } = {},
): T {
  const shielded: DragHandlers = { ...props };
  for (const name of DRAG_EVENTS) {
    const handler = props[name] as
      | ((event: React.DragEvent) => void)
      | undefined;
    if (!handler && !source) continue;
    shielded[name] = (event: React.DragEvent) => {
      if (!source && !carries(event, accept)) return;
      handler?.(event);
      if (name === 'onDragStart' && dragImage) {
        const image = dragImage();
        if (image) event.dataTransfer?.setDragImage(image, 16, 16);
      }
      event.stopPropagation();
    };
  }
  return shielded as T;
}

async function readPayload(
  event: DropEvent,
  type: string,
): Promise<Payload | null> {
  for (const item of event.items) {
    if (isTextDropItem(item) && item.types.has(type)) {
      try {
        return JSON.parse(await item.getText(type)) as Payload;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Before or after the target, by the pointer's half of the element. */
function positionFor(
  element: HTMLElement | null,
  x: number,
  y: number,
  axis: 'x' | 'y',
): DropPosition {
  if (!element) return 'after';
  const size = axis === 'y' ? element.offsetHeight : element.offsetWidth;
  return (axis === 'y' ? y : x) < size / 2 ? 'before' : 'after';
}

function tableOf(editor: SlateEditor, node: TElement, depth: 1 | 2) {
  const path = editor.api.findPath(node);
  if (!path) return null;
  const tablePath: Path = path.slice(0, -depth);
  const entry = editor.api.node<TElement>(tablePath);
  if (!entry) return null;
  return { table: entry[0], tablePath, path };
}

/**
 * Put the caret into the moved row or column: the drag handle holding the
 * focus is outside the editable text, so undo (⌘Z) would not reach the
 * editor, and the user sees where the row or column went.
 */
function focusCell(editor: SlateEditor, cellPath: Path) {
  const start = editor.api.start(cellPath);
  if (!start) return;
  editor.tf.select(start);
  editor.tf.focus();
}

/** Drag handle and drop target for a table row (`tr`). */
export function useRowDragAndDrop(
  editor: SlateEditor,
  row: TElement,
  rowRef: React.RefObject<HTMLTableRowElement | null>,
) {
  const header = isHeaderRow(row);
  // Nothing is dropped above the header row.
  const adjust = (position: DropPosition): DropPosition =>
    header ? 'after' : position;
  const [dropLine, setDropLine] = React.useState<DropPosition | null>(null);

  const { dragProps, isDragging } = useDrag({
    isDisabled: header,
    getAllowedDropOperations: () => ['move'],
    getItems: () => [
      {
        [ROW_DRAG_TYPE]: JSON.stringify({
          tableId: tableOf(editor, row, 1)?.table.id,
          id: row.id,
        }),
      },
    ],
  });

  const { dropProps, isDropTarget } = useDrop({
    ref: rowRef,
    getDropOperation: (types) => (types.has(ROW_DRAG_TYPE) ? 'move' : 'cancel'),
    onDropEnter: (e) =>
      setDropLine(adjust(positionFor(rowRef.current, e.x, e.y, 'y'))),
    onDropMove: (e) =>
      setDropLine(adjust(positionFor(rowRef.current, e.x, e.y, 'y'))),
    onDropExit: () => setDropLine(null),
    onDrop: async (e) => {
      setDropLine(null);
      const payload = await readPayload(e, ROW_DRAG_TYPE);
      const target = tableOf(editor, row, 1);
      if (!payload || !target || payload.tableId !== target.table.id) return;
      const from = target.table.children.findIndex(
        (child) => (child as TElement).id === payload.id,
      );
      if (from < 0) return;
      const position = adjust(positionFor(rowRef.current, e.x, e.y, 'y'));
      const to = moveTargetIndex(from, target.path.at(-1) as number, position);
      moveRow(editor, target.tablePath, from, to);
      focusCell(editor, [...target.tablePath, to, 0]);
    },
  });

  return {
    dragProps: shield(dragProps as DragHandlers, {
      source: true,
      dragImage: () => rowRef.current,
    }),
    dropProps: shield(dropProps as DragHandlers, { accept: [ROW_DRAG_TYPE] }),
    isDragging,
    dropLine: isDropTarget ? dropLine : null,
  };
}

/** Drag handle and drop target for a column, on the cells of the first row. */
export function useColumnDragAndDrop(
  editor: SlateEditor,
  cell: TElement,
  colIndex: number,
  enabled: boolean,
  cellRef: React.RefObject<HTMLTableCellElement | null>,
) {
  const [dropLine, setDropLine] = React.useState<DropPosition | null>(null);
  const merged = () => {
    const target = tableOf(editor, cell, 2);
    return !target || hasMergedCells(target.table);
  };

  const { dragProps, isDragging } = useDrag({
    isDisabled: !enabled,
    getAllowedDropOperations: () => ['move'],
    getItems: () => [
      {
        [COLUMN_DRAG_TYPE]: JSON.stringify({
          tableId: tableOf(editor, cell, 2)?.table.id,
          col: colIndex,
        }),
      },
    ],
  });

  const { dropProps, isDropTarget } = useDrop({
    ref: cellRef,
    isDisabled: !enabled,
    getDropOperation: (types) =>
      types.has(COLUMN_DRAG_TYPE) && !merged() ? 'move' : 'cancel',
    onDropEnter: (e) =>
      setDropLine(positionFor(cellRef.current, e.x, e.y, 'x')),
    onDropMove: (e) => setDropLine(positionFor(cellRef.current, e.x, e.y, 'x')),
    onDropExit: () => setDropLine(null),
    onDrop: async (e) => {
      setDropLine(null);
      const payload = await readPayload(e, COLUMN_DRAG_TYPE);
      const target = tableOf(editor, cell, 2);
      if (
        !payload ||
        payload.col === undefined ||
        !target ||
        payload.tableId !== target.table.id
      )
        return;
      const position = positionFor(cellRef.current, e.x, e.y, 'x');
      const to = moveTargetIndex(payload.col, colIndex, position);
      moveColumn(editor, target.tablePath, payload.col, to);
      focusCell(editor, [...target.tablePath, 0, to]);
    },
  });

  return {
    dragProps: shield(dragProps as DragHandlers, { source: true }),
    dropProps: shield(dropProps as DragHandlers, {
      accept: [COLUMN_DRAG_TYPE],
    }),
    isDragging,
    dropLine: isDropTarget ? dropLine : null,
  };
}
