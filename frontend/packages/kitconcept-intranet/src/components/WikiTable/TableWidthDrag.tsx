/**
 * The width handles of a top-level wiki table in the editor (work item 836,
 * the model of research ticket #828; replaces the single handle of #824):
 *
 * - a border between two columns (`ColumnBorderGrip`, in the cells, instead
 *   of Plate's column resize handle): the column and its right neighbour
 *   share their width, the table grows only once the neighbour is at its
 *   minimum;
 * - the double edge on the right (`TableEdgeHandles`), both pinned to the
 *   frame's right edge: the last column's own edge (inner) resizes that
 *   column and the table follows, the table's handle (outer) scales all
 *   columns and snaps to the four steps.
 *
 * Past the room the pointer's distance from the frame's edge sets the
 * speed (a frame loop keeps the table growing while the pointer is held
 * still); the zones are not drawn, the label shows the width and the
 * direction (‹ ›). The rules are the pure functions of wikiTableCustomWidth.ts;
 * this module measures the DOM, runs the frame loop, previews and stores.
 *
 * Preview: the columns through Plate's `colSizeOverrides` (as Plate's own
 * column resizing does), the width as a custom width on the block
 * (`TablePreview`, the shadow sets the class and `--wiki-table-width`). The
 * node is written once, when the drag ends: one undo step, nothing when the
 * drag changed nothing.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/836
 */
/* The width handles are focusable separators (the ARIA window splitter
   pattern: a separator with a tab stop is a widget, moved with the arrow
   keys); jsx-a11y counts every separator as non-interactive. */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
import * as React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { getTableColumnCount } from '@platejs/table';
import { useTableSet } from '@platejs/table/react';
import type { TTableElement } from 'platejs';

import type { TableWidth } from './wikiTableWidthPlugin';
import { CENTERED_CLASS } from './wikiTableAlign';
import {
  type BorderDrag,
  type DragInput,
  dragResult,
  formatPx,
  moveBorderDrag,
  moveTableDrag,
  seedSizes,
  speedRoomOf,
  shownWidth,
  startBorderDrag,
  startTableDrag,
  type StepWidths,
  sumOf,
  tableDragSizes,
  type TableDrag,
  NUDGE,
  nudgeColumn,
  nudgeTable,
  type WidthChange,
} from './wikiTableCustomWidth';

export const messages = defineMessages({
  resizeTable: {
    id: 'Resize table',
    defaultMessage: 'Resize table',
  },
  resizeLastColumn: {
    id: 'Resize the last column',
    defaultMessage: 'Resize the last column',
  },
  resizeColumn: {
    id: 'Resize column',
    defaultMessage: 'Resize column',
  },
  tableWidth: {
    id: 'Table {width}',
    defaultMessage: 'Table {width}',
  },
});

/** The text width and the content width of a table's block. */
export const measureBlock = (block: HTMLElement) => {
  const style = window.getComputedStyle(block);
  const content =
    block.clientWidth -
    (Number.parseFloat(style.paddingLeft) || 0) -
    (Number.parseFloat(style.paddingRight) || 0);
  return {
    style,
    text: Number.parseFloat(
      style.getPropertyValue('--default-container-width'),
    ),
    content,
  };
};

/**
 * The step widths of the table's block in px, as the CSS of
 * theme/components/_wikiTable.scss resolves them: `--wiki-table-room`
 * reaches from the text column's left edge to the content area's right
 * edge minus the side margin, never less than the text column.
 */
export const measureStepWidths = (block: HTMLElement): StepWidths => {
  const { style, text, content } = measureBlock(block);
  const px = (name: string) => Number.parseFloat(style.getPropertyValue(name));
  const margin = px('--wiki-table-side-margin') || 0;
  // The table starts at the text column's left edge (#826).
  const start = Math.max(0, (content - text) / 2);
  return {
    text,
    medium: px('--wiki-table-medium-width'),
    wide: px('--layout-container-width'),
    room: Math.max(text, content - start - margin),
  };
};

/** The table's frame (its inner container, or the discussion wrapper's). */
const frameOf = (block: HTMLElement) =>
  block.querySelector<HTMLElement>('.block-inner-container:not(table *)');

/**
 * The first row whose cells are the table's columns (no merged cells), the
 * gutter cell of the row grip left out.
 */
const columnCellsOf = (table: HTMLTableElement, columns: number) => {
  for (const row of Array.from(table.rows)) {
    const cells = Array.from(row.cells).filter(
      (cell) => cell.getAttribute('contenteditable') !== 'false',
    );
    if (cells.length === columns && cells.every((cell) => cell.colSpan === 1)) {
      return cells;
    }
  }
  return null;
};

export type DragTarget = { kind: 'table' } | { kind: 'border'; index: number };

/** What the table shows while a drag is on. */
export type TablePreview = {
  width: number;
  sizes: number[];
  label: string;
  /**
   * A centred table's frame keeps its left edge during a drag (px from the
   * block's content box), so the right edge follows the pointer as for a
   * left-aligned table; null for a left-aligned table. It is centred again
   * at its new width when the drag ends.
   */
  pinnedLeft: number | null;
};

export type TableWidthDragApi = {
  start: (event: React.PointerEvent<HTMLElement>, target: DragTarget) => void;
  /** Arrow keys on a handle: 10px narrower or wider (mockup). */
  nudge: (event: React.KeyboardEvent<HTMLElement>, target: DragTarget) => void;
  /** The handle being dragged: `table` or `border-<index>`. */
  active: string | null;
};

/**
 * The drag of a top-level table, for its handles; null where the table
 * cannot be resized (nested, read-only, narrow content area).
 */
export const TableWidthDragContext =
  React.createContext<TableWidthDragApi | null>(null);

const keyOf = (target: DragTarget) =>
  target.kind === 'table' ? 'table' : `border-${target.index}`;

/** The direction of the speed zones in the label. */
const arrows = (speed: number) =>
  speed > 4
    ? ' ››'
    : speed > 0
      ? ' ›'
      : speed < -4
        ? ' ‹‹'
        : speed < 0
          ? ' ‹'
          : ' ·';

type Running = {
  target: DragTarget;
  state: TableDrag | BorderDrag;
  startSizes: number[];
  widths: StepWidths;
  pinnedLeft: number | null;
  frame: HTMLElement;
  scroller: HTMLElement;
  table: HTMLElement;
  /** The first column's left edge, from the table's. */
  columnsOffset: number;
  startX: number;
  pointerX: number;
  moved: boolean;
  time: number;
  raf: number;
  shown: string;
  release: () => void;
};

/**
 * What a drag or a nudge starts from: the frame, the scroll container, the
 * table and the step widths, and the columns as they are rendered (a table
 * on a step as it is displayed; without a row of single cells, the stored
 * widths scaled to the table, or equal columns). Null when the table
 * cannot be measured.
 */
const measureTable = (block: HTMLElement, node: TTableElement) => {
  const frame = frameOf(block);
  const scroller = frame?.querySelector<HTMLElement>(
    ':scope > .overflow-x-auto',
  );
  const table = scroller?.querySelector('table');
  if (!frame || !scroller || !table) return null;
  const widths = measureStepWidths(block);
  const columns = getTableColumnCount(node);
  const cells = columnCellsOf(table, columns);
  const tableBox = table.getBoundingClientRect();
  const stored = (node.colSizes as number[] | undefined) ?? [];
  const rendered = cells
    ? cells.map((cell) => cell.getBoundingClientRect().width)
    : stored.length === columns && stored.every((size) => size > 0)
      ? stored.map((size) => (size * tableBox.width) / sumOf(stored))
      : Array.from({ length: columns }, () => tableBox.width / columns);
  const startSizes = seedSizes(rendered);
  if (!startSizes) return null;
  const columnsOffset = cells
    ? cells[0].getBoundingClientRect().left - tableBox.left
    : 0;
  return {
    frame,
    scroller,
    table,
    tableBox,
    widths,
    startSizes,
    columnsOffset,
  };
};

/**
 * Applies the drag rules to where the pointer and the table are now
 * (`frames`: the time since the last frame, for the speed); returns the
 * input it read.
 */
const advance = (drag: Running, frames: number) => {
  const input: DragInput = {
    pointerX: drag.pointerX,
    edgeX: drag.frame.getBoundingClientRect().right,
    tableX: drag.table.getBoundingClientRect().left + drag.columnsOffset,
    frames,
  };
  input.tableStartX = input.tableX + drag.scroller.scrollLeft;
  drag.state =
    drag.state.kind === 'table'
      ? moveTableDrag(drag.state, input, drag.widths)
      : moveBorderDrag(drag.state, input, drag.widths);
  return input;
};

/**
 * The drag controller of a table: `start` for the handles' pointerdown,
 * `preview` for the table while a drag is on. `onCommit` stores the result
 * (the shadow knows the width transforms). A drag is cancelled, nothing
 * stored, when `enabled` turns false or the table unmounts.
 */
export function useTableWidthDrag({
  blockRef,
  element,
  enabled,
  stepName,
  onCommit,
}: {
  blockRef: React.RefObject<HTMLElement | null>;
  element: TTableElement;
  enabled: boolean;
  stepName: (step: TableWidth) => string;
  onCommit: (change: WidthChange) => void;
}) {
  const intl = useIntl();
  const setColSizeOverrides = useTableSet('colSizeOverrides') as (
    value: Map<number, number>,
  ) => void;
  const [preview, setPreview] = React.useState<TablePreview | null>(null);
  const [active, setActive] = React.useState<string | null>(null);
  const running = React.useRef<Running | null>(null);
  const latest = React.useRef({ element, stepName, onCommit, intl });
  latest.current = { element, stepName, onCommit, intl };

  const finish = React.useCallback(
    (commit: boolean) => {
      const drag = running.current;
      if (!drag) return;
      running.current = null;
      cancelAnimationFrame(drag.raf);
      drag.release();
      // Where the pointer was released, which no frame may have seen yet
      // (no time passed: no growth by speed).
      if (commit && drag.moved) advance(drag, 0);
      const sizes =
        drag.state.kind === 'table'
          ? tableDragSizes(drag.state)
          : drag.state.sizes;
      const change =
        commit && drag.moved
          ? dragResult(
              sizes,
              drag.startSizes,
              drag.widths,
              drag.state.kind === 'table' ? drag.state.step : null,
              { byWidth: drag.state.kind !== 'table' },
            )
          : null;
      setActive(null);
      const clear = () => {
        setPreview(null);
        setColSizeOverrides(new Map());
      };
      if (!change) {
        clear();
        return;
      }
      // The preview goes once the stored width has rendered (as Plate's
      // column resizing does): otherwise the table showed its old width
      // for a render, and a scrolled frame lost its scroll position.
      latest.current.onCommit(change);
      setTimeout(clear, 0);
    },
    [setColSizeOverrides],
  );

  // One frame of a drag: the rules of wikiTableCustomWidth.ts on where the
  // pointer and the table are now.
  const tick = React.useCallback(
    (now: number) => {
      const drag = running.current;
      if (!drag) return;
      const input = advance(drag, (now - drag.time) / (1000 / 60));
      drag.time = now;
      const { state, widths } = drag;
      const sizes =
        state.kind === 'table' ? tableDragSizes(state) : state.sizes;
      const width = sumOf(sizes);
      const { intl: currentIntl, stepName: nameOf } = latest.current;
      const px = (value: number) => formatPx(currentIntl, value);
      const speedMode = state.mode === 'speed';
      let label: string;
      if (state.kind === 'table') {
        // What releasing here stores: the step, the custom width, or
        // nothing (the table as it is).
        const shown = shownWidth(
          dragResult(sizes, drag.startSizes, widths, state.step, {
            byWidth: false,
          }),
          latest.current.element,
          Math.round(state.width),
        );
        label = shown.step
          ? `${nameOf(shown.step)} (${px(shown.width)})`
          : px(shown.width);
      } else {
        const { index } = state;
        const table = currentIntl.formatMessage(messages.tableWidth, {
          width: px(width),
        });
        label =
          index < sizes.length - 1
            ? `${px(sizes[index])} | ${px(sizes[index + 1])}` +
              (width !== sumOf(drag.startSizes) ? ` · ${table}` : '')
            : `${px(sizes[index])} · ${table}`;
      }
      if (speedMode) label += arrows(state.speed);
      // As in the mockup's render: the label from the start of the drag
      // (the speed zones are not drawn, decided on 2026-11-16; the arrows of the
      // label show the speed).
      const shown = `${sizes.join(',')}|${label}`;
      if (shown !== drag.shown) {
        drag.shown = shown;
        setColSizeOverrides(new Map(sizes.map((size, index) => [index, size])));
        setPreview({ width, sizes, label, pinnedLeft: drag.pinnedLeft });
      }
      // Keep the growing edge in view, in speed mode only: the table's end
      // while the handle grows it past the room, the dragged border
      // otherwise. Positioning never scrolls (the border is at the
      // pointer), and the drag rules do not measure the scrolled table
      // while positioning: a pointer held still changes nothing.
      const { scroller } = drag;
      if (speedMode && state.kind === 'table') {
        if (width > speedRoomOf(widths) + 0.5) {
          scroller.scrollLeft = scroller.scrollWidth;
        }
      } else if (speedMode && state.kind === 'border') {
        const borderX = input.tableX + sumOf(sizes.slice(0, state.index + 1));
        const visible = input.edgeX - 24;
        if (borderX > visible) scroller.scrollLeft += borderX - visible;
      }
      drag.raf = requestAnimationFrame(tick);
    },
    [setColSizeOverrides],
  );

  const start = React.useCallback(
    (event: React.PointerEvent<HTMLElement>, target: DragTarget) => {
      const block = blockRef.current;
      if (!enabled || !block || running.current || event.button !== 0) return;
      const measured = measureTable(block, latest.current.element);
      if (!measured) return;
      const { frame, scroller, table, startSizes, columnsOffset } = measured;
      // A centred table: its frame keeps its left edge while dragged, the
      // speed zones start at the right margin seen from there (the steps
      // stay those of the room).
      let { widths } = measured;
      let pinnedLeft: number | null = null;
      if (block.classList.contains(CENTERED_CLASS)) {
        const { style, content } = measureBlock(block);
        pinnedLeft =
          frame.getBoundingClientRect().left -
          block.getBoundingClientRect().left -
          (Number.parseFloat(style.paddingLeft) || 0);
        const margin =
          Number.parseFloat(
            style.getPropertyValue('--wiki-table-side-margin'),
          ) || 0;
        widths = {
          ...widths,
          speedRoom: Math.max(widths.text, content - pinnedLeft - margin),
        };
      }
      // Keep the caret where it is, select nothing.
      event.preventDefault();
      event.stopPropagation();
      const pointerX = event.clientX;
      const edgeX = frame.getBoundingClientRect().right;
      const state =
        target.kind === 'table'
          ? startTableDrag(startSizes, pointerX, edgeX, widths)
          : startBorderDrag(startSizes, target.index, pointerX, widths);
      const handle = event.currentTarget;
      const pointerId = event.pointerId;
      const onMove = (moveEvent: PointerEvent) => {
        const drag = running.current;
        if (!drag) return;
        drag.pointerX = moveEvent.clientX;
        if (moveEvent.clientX !== drag.startX) drag.moved = true;
        // A release that never arrived (outside the window).
        if (moveEvent.buttons === 0) finish(true);
      };
      // As in the mockup's drag loop, a cancelled pointer ends the drag
      // like a release: what it reached is stored. (The mockup also ends on
      // `lostpointercapture`; here the handles can go away during a drag,
      // the window became too narrow, and that ends it storing nothing,
      // see `enabled` below.)
      const onUp = () => finish(true);
      try {
        handle.setPointerCapture(pointerId);
      } catch {
        // Not capturable (a synthetic event): the window listeners do.
      }
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      document.body.classList.add('wiki-table-dragging');
      running.current = {
        target,
        state,
        startSizes,
        widths,
        pinnedLeft,
        frame,
        scroller,
        table,
        columnsOffset,
        startX: pointerX,
        pointerX,
        moved: false,
        time: performance.now(),
        raf: 0,
        shown: '',
        release: () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
          document.body.classList.remove('wiki-table-dragging');
          try {
            if (handle.hasPointerCapture(pointerId)) {
              handle.releasePointerCapture(pointerId);
            }
          } catch {
            // The handle is gone.
          }
        },
      };
      setActive(keyOf(target));
      running.current.raf = requestAnimationFrame(tick);
    },
    [blockRef, enabled, finish, tick],
  );

  // A table that can no longer be resized (the window became too narrow,
  // the editor read-only) or that goes away ends its drag, storing nothing.
  React.useEffect(() => {
    if (!enabled) finish(false);
  }, [enabled, finish]);
  React.useEffect(() => () => finish(false), [finish]);

  // As in the mockup: the arrow keys move a focused handle by 10px, the
  // table's handle scaling all columns, a border or the last edge its
  // column; the result is a custom width, one change per key.
  const nudge = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>, target: DragTarget) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const block = blockRef.current;
      if (!enabled || !block || running.current) return;
      event.preventDefault();
      event.stopPropagation();
      const measured = measureTable(block, latest.current.element);
      if (!measured) return;
      const delta = event.key === 'ArrowRight' ? NUDGE : -NUDGE;
      const change =
        target.kind === 'table'
          ? nudgeTable(measured.startSizes, delta, measured.widths)
          : nudgeColumn(measured.startSizes, target.index, delta);
      if (change) latest.current.onCommit(change);
    },
    [blockRef, enabled],
  );

  const api = React.useMemo<TableWidthDragApi>(
    () => ({ start, nudge, active }),
    [start, nudge, active],
  );
  return { api, preview };
}

/**
 * The double edge on the right of a table's frame: the last column's edge
 * and the table's handle, with the label while dragging. Children of the frame, next to the scroll container.
 */
export function TableEdgeHandles({
  api,
  preview,
  columns,
}: {
  api: TableWidthDragApi;
  preview: TablePreview | null;
  columns: number;
}) {
  const intl = useIntl();
  const last = columns - 1;
  // The last column's edge highlights the row under the pointer, as a
  // border between two columns does in its cell; not while dragging.
  const showSegment = (event: React.PointerEvent<HTMLElement>) => {
    if (api.active) return;
    const edge = event.currentTarget;
    const table = edge.parentElement?.querySelector('table');
    if (!table) return;
    const row = Array.from(table.rows)
      .map((item) => item.getBoundingClientRect())
      .find((box) => event.clientY >= box.top && event.clientY < box.bottom);
    if (!row) return;
    const top = edge.getBoundingClientRect().top;
    edge.style.setProperty(
      '--wiki-table-segment-top',
      `${Math.max(0, row.top - top)}px`,
    );
    edge.style.setProperty(
      '--wiki-table-segment-height',
      `${row.bottom - Math.max(row.top, top)}px`,
    );
  };
  return (
    <>
      <div
        className="wiki-table-edge wiki-table-column-edge"
        contentEditable={false}
        suppressContentEditableWarning
        role="separator"
        aria-orientation="vertical"
        aria-label={intl.formatMessage(messages.resizeLastColumn)}
        data-resizing={api.active === `border-${last}`}
        tabIndex={0}
        onPointerMove={showSegment}
        onPointerDown={(event) =>
          api.start(event, { kind: 'border', index: last })
        }
        onKeyDown={(event) => api.nudge(event, { kind: 'border', index: last })}
      />
      <div
        className="wiki-table-edge wiki-table-resize-handle"
        contentEditable={false}
        suppressContentEditableWarning
        role="separator"
        aria-orientation="vertical"
        aria-label={intl.formatMessage(messages.resizeTable)}
        data-resizing={api.active === 'table'}
        tabIndex={0}
        onPointerDown={(event) => api.start(event, { kind: 'table' })}
        onKeyDown={(event) => api.nudge(event, { kind: 'table' })}
      />
      {preview && (
        <span className="wiki-table-resize-label" contentEditable={false}>
          {preview.label}
        </span>
      )}
    </>
  );
}

/**
 * The border right of column `index`, between two columns of a top-level
 * table (in place of Plate's column resize handle).
 */
export function ColumnBorderGrip({
  api,
  index,
}: {
  api: TableWidthDragApi;
  index: number;
}) {
  const intl = useIntl();
  return (
    <div
      className="wiki-table-column-border"
      role="separator"
      aria-orientation="vertical"
      aria-label={intl.formatMessage(messages.resizeColumn)}
      data-col={index}
      data-resizing={api.active === `border-${index}`}
      tabIndex={0}
      onPointerDown={(event) => api.start(event, { kind: 'border', index })}
      onKeyDown={(event) => api.nudge(event, { kind: 'border', index })}
    />
  );
}
