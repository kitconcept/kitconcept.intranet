/**
 * Custom table width (work item 824) and the width model of work item 836.
 *
 * A table stores either a width step (`blockWidth`, see
 * wikiTableWidthPlugin.ts: Text width, Medium, Wide, Full width) or a
 * custom width in px, `tableWidth`, a property of its own because
 * @plone/plate's block width plugin resets a `blockWidth` it does not
 * know; plus the column widths in px (`colSizes`).
 *
 * The model of work item 836 (mockup and decisions of research ticket
 * #828):
 * - Once set, `colSizes` are the columns' widths. A custom width is the sum
 *   of the columns and the table renders exactly that wide, also when it is
 *   wider than the room: it then scrolls inside its frame, and the frame
 *   widens into the area left of the text column (theme/components/
 *   _wikiTable.scss). The lower bound is the text width.
 * - A table on a step renders the step width; its columns are scaled to it
 *   on display (the fixed table layout does that) and stored scaled to it
 *   when a step is chosen.
 * - The first drag of a column border or of one of the two right edges
 *   stores every column's rendered width (`seedSizes`).
 * - A border between two columns moves width between the column and its
 *   right neighbour; the table grows only once the neighbour is at its
 *   minimum, and never shrinks (`startBorderDrag` / `moveBorderDrag`).
 * - The last column's own edge (inner right edge) resizes that column, the
 *   table follows; the table handle (outer right edge) scales all columns
 *   (`startTableDrag` / `moveTableDrag`). Shrinking a column past its
 *   minimum shrinks the columns to its left, right to left
 *   (`placeBorder`).
 * - Past the room, the pointer's distance from the frame's right edge sets
 *   the speed of the growth, not the width (`speedFor`); a drag frame loop
 *   applies it while the pointer is held still. The moment the table fits
 *   again its edge snaps to the pointer.
 * - A drag that ends exactly on a step width stores the step, not the
 *   number (`presetFor`).
 *
 * `WikiTableCustomWidthPlugin` renders the width (an inline
 * `--wiki-table-width` and the class on the table's block; editor, view and
 * history diff) and removes a `tableWidth` that is not a positive number.
 *
 * Tickets: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/824
 *          https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/836
 */
import type { IntlShape } from 'react-intl';
import type { TElement, Value } from 'platejs';
import { createSlatePlugin, ElementApi, KEYS } from 'platejs';

import type { TableWidth } from './wikiTableWidthPlugin';

/** The node property holding the custom width in px. */
export const TABLE_WIDTH_KEY = 'tableWidth';

/** The class on a table's block while it has a custom width. */
export const CUSTOM_WIDTH_CLASS = 'wiki-table-custom-width';

/** The CSS custom property carrying the custom width. */
export const TABLE_WIDTH_VAR = '--wiki-table-width';

/** Plate's cells are never narrower than this (table-node.tsx). */
export const MIN_COLUMN_WIDTH = 120;

/** A drag that ends this close to a step width stores the step. */
export const SNAP_TOLERANCE = 12;

/** Whether `value` is a usable custom width: a positive, finite number. */
export const isTableWidth = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * A width in px as the width menu, the drag label and the history diff
 * show it: "1180px", no digit grouping.
 */
export const formatPx = (intl: IntlShape, width: number) =>
  `${intl.formatNumber(width, { useGrouping: false })}px`;

/** The custom width of a table node, or null. */
export const customWidthOf = (node: unknown): number | null => {
  const value = (node as Record<string, unknown> | null | undefined)?.[
    TABLE_WIDTH_KEY
  ];
  return isTableWidth(value) ? value : null;
};

/**
 * `value` without a `tableWidth` that is not a positive number, on tables at
 * any depth. Returns `value` itself when nothing changes.
 */
export function withoutInvalidTableWidths(
  value: Value,
  tableType: string = KEYS.table,
): Value {
  let changed = false;
  const clean = (node: TElement): TElement => {
    let result = node;
    if (
      node.type === tableType &&
      TABLE_WIDTH_KEY in node &&
      !isTableWidth(node[TABLE_WIDTH_KEY])
    ) {
      const { [TABLE_WIDTH_KEY]: _invalid, ...rest } = node;
      result = rest as TElement;
      changed = true;
    }
    if (!Array.isArray(result.children)) return result;
    const children = result.children.map((child) =>
      ElementApi.isElement(child) ? clean(child) : child,
    );
    return children.every((child, index) => child === result.children[index])
      ? result
      : { ...result, children };
  };
  const result = value.map((node) =>
    ElementApi.isElement(node) ? clean(node) : node,
  ) as Value;
  return changed ? result : value;
}

export const WikiTableCustomWidthPlugin = createSlatePlugin({
  key: 'wikiTableCustomWidth',
  inject: {
    isBlock: true,
    targetPlugins: [KEYS.table],
    nodeProps: {
      nodeKey: TABLE_WIDTH_KEY,
      // Replaces Plate's `slate-tableWidth-<n>` class, which no rule can
      // use, with one class for every custom width.
      transformClassName: ({ nodeValue }) =>
        isTableWidth(nodeValue) ? CUSTOM_WIDTH_CLASS : undefined,
      transformStyle: ({ nodeValue }) =>
        (isTableWidth(nodeValue)
          ? { [TABLE_WIDTH_VAR]: `${nodeValue}px` }
          : {}) as unknown as CSSStyleDeclaration,
    },
  },
  // Plate 53 takes a returned value as the editor's children (undefined:
  // unchanged); the caller's array may be frozen state and is never
  // mutated.
  normalizeInitialValue: ({ editor, value }) => {
    const cleaned = withoutInvalidTableWidths(
      value,
      editor.getType(KEYS.table),
    );
    return cleaned !== value ? cleaned : undefined;
  },
}).overrideEditor(({ editor, tf: { normalizeNode } }) => ({
  transforms: {
    normalizeNode(entry, options) {
      const [node, path] = entry;
      if (
        ElementApi.isElement(node) &&
        node.type === editor.getType(KEYS.table) &&
        TABLE_WIDTH_KEY in node &&
        !isTableWidth(node[TABLE_WIDTH_KEY])
      ) {
        editor.tf.unsetNodes(TABLE_WIDTH_KEY, { at: path });
        return;
      }
      normalizeNode(entry, options);
    },
  },
}));

/** The step widths of a table in px, as the CSS resolves them. */
export type StepWidths = {
  /** Text width, `default`: also the narrowest a table can be. */
  text: number;
  /** Medium, `medium`. */
  medium: number;
  /** Wide, `layout`. */
  wide: number;
  /** Full width, `full`: the room; also the widest a table can be. */
  room: number;
  /**
   * Where the speed zones start, when not at the room: the widest the
   * frame gets during a drag of a centred table, whose frame keeps its left
   * edge while dragged (see `speedRoomOf`).
   */
  speedRoom?: number;
};

export type WidthGuide = { step: TableWidth; width: number };

/** The width from which a drag goes on by the speed zones. */
export const speedRoomOf = (widths: StepWidths) =>
  widths.speedRoom ?? widths.room;

/** The width a step gives a table: min(step, room); Full width is the room. */
export function stepWidth(step: string, widths: StepWidths): number {
  const width =
    step === 'medium'
      ? widths.medium
      : step === 'layout'
        ? widths.wide
        : step === 'full'
          ? widths.room
          : widths.text;
  return Math.max(widths.text, Math.min(width, widths.room));
}

/**
 * The guides a drag snaps to, narrowest first (mockup `guides`): Text
 * width, Medium and Wide within the room, and Full width, the room. Where
 * two steps have the same width the first, narrower one is the guide
 * (Wide on a window where Wide is the room), as `presetFor` names it.
 */
export function widthGuides({ text, medium, wide, room }: StepWidths) {
  const guides: WidthGuide[] = [];
  const candidates: WidthGuide[] = [
    { step: 'default', width: text },
    { step: 'medium', width: Math.min(medium, room) },
    { step: 'layout', width: Math.min(wide, room) },
    { step: 'full', width: room },
  ];
  for (const guide of candidates) {
    if (!Number.isFinite(guide.width)) continue;
    if (guides.some((seen) => Math.abs(seen.width - guide.width) < 1)) {
      continue;
    }
    guides.push(guide);
  }
  return guides;
}

export type DragWidth = { width: number; step: TableWidth | null };

/**
 * The width of the table's handle at `candidate` px (mockup handle drag):
 * never less than the text width, not bounded by the room (past it the
 * speed zones take over), snapped to the guides within `tolerance` (every
 * guide in turn, narrowest first, the last one in reach winning). Whole
 * pixels: a guide's width may be fractional (the room), it is rounded
 * down, so the columns never add up to more than the room.
 */
export function dragWidth(
  candidate: number,
  widths: StepWidths,
  tolerance = SNAP_TOLERANCE,
): DragWidth {
  let width = Math.max(candidate, widths.text);
  let step: TableWidth | null = null;
  for (const guide of widthGuides(widths)) {
    if (Math.abs(width - guide.width) <= tolerance) {
      width = guide.width;
      step = guide.step;
    }
  }
  return { width: step ? Math.floor(width) : Math.round(width), step };
}

/**
 * `values` as whole pixels that add up to `total` rounded down: each is
 * rounded down, the pixels left go to the largest remainders.
 */
function roundToTotal(values: readonly number[], total: number): number[] {
  const result = values.map((value) => Math.floor(value));
  let rest = Math.floor(total) - result.reduce((sum, value) => sum + value, 0);
  const order = values
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; rest > 0 && order.length; i = (i + 1) % order.length) {
    result[order[i].index] += 1;
    rest -= 1;
  }
  return result;
}

/**
 * Column widths for a table whose frame becomes `width` px wide, or
 * undefined when the stored ones stay as they are.
 *
 * The stored `colSizes` are never grown, and a 0 (a column that was never
 * resized, rendered at the minimum width) stays 0: when the columns add up
 * to less than the frame, the fixed table layout stretches them
 * proportionally on its own (#823). Only when they add up to more (a 0
 * counting as the minimum) are they scaled down proportionally so that they
 * fit, none below the minimum width (a column that is narrower already
 * keeps its width). When even the minimums do not fit, the table scrolls
 * inside its frame.
 */
export function fitColSizes(
  colSizes: readonly number[] | undefined,
  width: number,
  minWidth = MIN_COLUMN_WIDTH,
): number[] | undefined {
  if (!colSizes?.length || !Number.isFinite(width) || width <= 0) {
    return undefined;
  }
  const isSet = (size: number) => Number.isFinite(size) && size > 0;
  const total = colSizes.reduce(
    (sum, size) => sum + (isSet(size) ? size : minWidth),
    0,
  );
  if (total <= width) return undefined;
  const zeros = colSizes.filter((size) => !isSet(size)).length;
  // The narrowest a stored column becomes.
  const floorOf = (index: number) => Math.min(colSizes[index], minWidth);
  const pinned = new Set<number>();
  let scaled: number[] = [];
  let available = 0;
  for (;;) {
    const free = colSizes
      .map((_size, index) => index)
      .filter((index) => isSet(colSizes[index]) && !pinned.has(index));
    available =
      width -
      zeros * minWidth -
      [...pinned].reduce((sum, index) => sum + floorOf(index), 0);
    const freeTotal = free.reduce((sum, index) => sum + colSizes[index], 0);
    if (!free.length || available <= 0 || freeTotal <= 0) {
      free.forEach((index) => pinned.add(index));
      scaled = [];
      break;
    }
    const factor = available / freeTotal;
    const next = colSizes.map((size) => size * factor);
    const below = free.filter((index) => next[index] < floorOf(index));
    scaled = next;
    if (!below.length) break;
    below.forEach((index) => pinned.add(index));
  }
  const result = colSizes.map((size, index) =>
    !isSet(size) ? 0 : pinned.has(index) ? floorOf(index) : 0,
  );
  // Whole pixels: the free columns fill what is available.
  const free = colSizes
    .map((_size, index) => index)
    .filter((index) => isSet(colSizes[index]) && !pinned.has(index));
  roundToTotal(
    free.map((index) => scaled[index]),
    available,
  ).forEach((size, i) => {
    result[free[i]] = size;
  });
  return result.every((size, index) => size === colSizes[index])
    ? undefined
    : result;
}

/**
 * Column widths to store before a column border of a nested table (in a
 * column; Plate's column resizing, work item 824) is dragged, or null when
 * the stored ones render as they are.
 *
 * Plate's column resizing writes the dragged column's new width next to the
 * stored `colSizes`. When those do not add up to the table's width (columns
 * never resized are stored as 0), the fixed table layout stretches every
 * column, the dragged one too, so its border jumped on the first pixel and
 * then ran ahead of the pointer. Seeding every column with its rendered
 * width first makes the stored widths add up to the table, and the border
 * follows the pointer. `rendered` are the columns' rendered widths in px;
 * the result is whole pixels adding up to their sum rounded down (never
 * wider than the table, which would scroll).
 */
export function seedColSizes(
  colSizes: readonly number[] | undefined,
  rendered: readonly number[],
): number[] | null {
  if (
    colSizes?.length === rendered.length &&
    colSizes.every((size, index) => Math.abs(size - rendered[index]) <= 1)
  ) {
    return null;
  }
  return seedSizes(rendered);
}

/**
 * The width of a cell of a table on a step (no custom width) as a share of
 * the table's width, for its columns `col` to `col + span - 1` of
 * `columns`: the stored column widths are proportions there (the table
 * renders the step's width, min(step, room), and its columns are scaled
 * to it). As px widths the fixed table layout made the table as wide as
 * their sum, so a step chosen on a wide screen scrolled on a narrower one.
 * A column without a stored width counts as the minimum width; the table's
 * minimum width keeps every column at least that wide
 * (`scaledTableMinWidth`). A share and not `max(120px, …%)`: the fixed
 * table layout takes a width mixing px and % as auto.
 */
export function scaledCellWidth(
  colSizes: readonly number[] | undefined,
  columns: number,
  col: number,
  span: number,
  minWidth = MIN_COLUMN_WIDTH,
): string {
  const size = (index: number) => {
    const value = colSizes?.[index];
    return typeof value === 'number' && value > 0 ? value : minWidth;
  };
  let total = 0;
  for (let index = 0; index < columns; index++) total += size(index);
  let width = 0;
  for (let index = col; index < col + span; index++) width += size(index);
  return total > 0 ? `${(width / total) * 100}%` : 'auto';
}

/**
 * The minimum width in px of a table on a step whose cells take their
 * share of its width (`scaledCellWidth`): wide enough for its narrowest
 * column to keep the minimum width. Where that is wider than the step the
 * table scrolls in its frame, as a table with px columns did.
 */
export function scaledTableMinWidth(
  colSizes: readonly number[] | undefined,
  columns: number,
  minWidth = MIN_COLUMN_WIDTH,
): number {
  const sizes = Array.from({ length: columns }, (_value, index) => {
    const value = colSizes?.[index];
    return typeof value === 'number' && value > 0 ? value : minWidth;
  });
  if (!sizes.length) return 0;
  return Math.ceil((minWidth * sumOf(sizes)) / Math.min(...sizes));
}

/** The sum of `sizes`. */
export const sumOf = (sizes: readonly number[]) =>
  sizes.reduce((total, size) => total + size, 0);

/**
 * Column widths to start a drag from: the columns' rendered widths in whole
 * pixels that add up to their sum, rounded down (work item 824 stored them on
 * the first move of a border; since 836 every drag starts from them, so a
 * table on a step is dragged as it is displayed). Null without measurable
 * columns.
 */
export function seedSizes(rendered: readonly number[]): number[] | null {
  if (!rendered.length || rendered.some((size) => !(size > 0))) return null;
  return roundToTotal(rendered, sumOf(rendered));
}

/**
 * `sizes` scaled proportionally to add up to `width`, in whole pixels, none
 * below the minimum; the widest column takes what rounding leaves (mockup
 * `scaleTo`). When the minimums do not fit, the sum is more than `width`.
 */
export function scaleTo(
  sizes: readonly number[],
  width: number,
  minWidth = MIN_COLUMN_WIDTH,
): number[] {
  const total = sumOf(sizes);
  if (!sizes.length || !(total > 0)) return [...sizes];
  // Never wider than `width` (a step's width may be fractional).
  const target = Math.floor(width);
  const factor = target / total;
  const result = sizes.map((size) =>
    Math.max(minWidth, Math.round(size * factor)),
  );
  const widest = result.indexOf(Math.max(...result));
  result[widest] = Math.max(minWidth, result[widest] + target - sumOf(result));
  return result;
}

/**
 * Column widths with the right border of column `index` at `position` px
 * from the table's left edge, from `base` (mockup `placeBorder`). A border
 * right of where the column ends makes the column wider; one left of it
 * makes it narrower, down to the minimum, and then the columns to its left
 * give way one by one, right to left, each down to the minimum. `minTotal`
 * (the text width, for the last column) is the narrowest the columns up to
 * `index` together may become; null for no bound.
 */
export function placeBorder(
  base: readonly number[],
  index: number,
  position: number,
  minTotal: number | null,
  minWidth = MIN_COLUMN_WIDTH,
): number[] {
  const sizes = [...base];
  const upto = sumOf(base.slice(0, index + 1));
  let request = upto - position;
  if (request <= 0) {
    sizes[index] = Math.round(position - sumOf(base.slice(0, index)));
    return sizes;
  }
  request = Math.min(
    request,
    upto - minWidth * (index + 1),
    minTotal === null ? Infinity : upto - minTotal,
  );
  for (let k = index; k >= 0 && request > 0; k--) {
    const take = Math.max(0, Math.min(request, base[k] - minWidth));
    sizes[k] = Math.round(base[k] - take);
    request -= take;
  }
  return sizes;
}

/**
 * Speed of a drag past the room, in px per frame (60 per second), from the
 * pointer's distance to the frame's right edge (mockup `speedFor`): up to
 * 24px past the edge slow (4, about 240px per second), further out fast
 * (12); pulled back inside by more than 28px it shrinks slowly, by more
 * than 64px fast; in between it holds.
 */
export const speedFor = (distance: number) =>
  distance > 24
    ? 12
    : distance > 0
      ? 4
      : distance < -64
        ? -12
        : distance < -28
          ? -4
          : 0;

/**
 * Positioning turns into speed mode once the pointer is this far past the
 * frame's edge (the mockup: any distance past it). A whole pixel: the
 * editor's room is often fractional and a table at it renders in whole
 * pixels, so its edge moves by a fraction of a pixel when a drag starts.
 */
export const SPEED_FROM = 1;

/** A column edge in speed mode snaps back to the pointer this far inside. */
export const SNAP_BACK_DISTANCE = 28;

/**
 * The step whose width `width` is (within half a pixel), or null (mockup
 * `presetFor`): a drag that ends exactly there stores the step, so the
 * width menu and the history say "Text width", not "780px". Where two
 * steps have the same width the narrower one, as for the guides.
 */
export function presetFor(
  width: number,
  widths: StepWidths,
): TableWidth | null {
  return (
    widthGuides(widths).find((guide) => Math.abs(guide.width - width) < 0.5)
      ?.step ?? null
  );
}

/** Where the pointer and the table are, read once per frame of a drag. */
export type DragInput = {
  /** The pointer's x on the screen. */
  pointerX: number;
  /** The frame's right edge (both right edges are pinned there). */
  edgeX: number;
  /** The table's left edge; it moves left when the frame scrolls. */
  tableX: number;
  /**
   * The table's left edge with the frame not scrolled (where it is once it
   * fits again); `tableX` when not given. A snap back to the pointer is
   * measured from here, so the edge lands under the pointer.
   */
  tableStartX?: number;
  /** Frames (of 1/60 s) since the last input; scales the speed. */
  frames?: number;
};

/** Speed in px for this input, `speedFor` scaled to the time that passed. */
const speedOf = (distance: number, frames = 1) =>
  Math.round(speedFor(distance) * Math.min(Math.max(frames, 0), 3));

/** The drag of the table handle (outer right edge). */
export type TableDrag = {
  kind: 'table';
  mode: 'abs' | 'speed';
  /** The column widths the drag started from; scaled to the width. */
  startSizes: number[];
  /** The width and the pointer where positioning started. */
  anchorX: number;
  anchorWidth: number;
  /** Where on the handle it was grabbed, from the frame's edge. */
  offset: number;
  width: number;
  /** The step the width snapped to, or null. */
  step: TableWidth | null;
  /** The last growth per frame (for the arrows of the label). */
  speed: number;
};

/**
 * Starts a drag of the table handle. A table that already overflows the
 * room starts in speed mode: its edge is pinned to the frame, the pointer's
 * distance from it is the only sensible control.
 */
export function startTableDrag(
  startSizes: readonly number[],
  pointerX: number,
  edgeX: number,
  widths: StepWidths,
): TableDrag {
  const width = sumOf(startSizes);
  return {
    kind: 'table',
    mode: width > speedRoomOf(widths) + 0.5 ? 'speed' : 'abs',
    startSizes: [...startSizes],
    anchorX: pointerX,
    anchorWidth: width,
    offset: edgeX - pointerX,
    width,
    step: null,
    speed: 0,
  };
}

/**
 * The table handle after the pointer moved (or a frame passed): below the
 * room the edge follows the pointer and snaps to the steps; past the room
 * the speed zones grow and shrink it; when it fits again the edge snaps to
 * the pointer.
 */
export function moveTableDrag(
  drag: TableDrag,
  { pointerX, edgeX, tableX, tableStartX = tableX, frames }: DragInput,
  widths: StepWidths,
  tolerance = SNAP_TOLERANCE,
): TableDrag {
  const { text } = widths;
  const room = speedRoomOf(widths);
  const distance = pointerX + drag.offset - edgeX;
  if (drag.mode === 'abs') {
    const next = dragWidth(
      drag.anchorWidth + (pointerX - drag.anchorX),
      widths,
      tolerance,
    );
    const atRoom = next.width >= Math.floor(room);
    return {
      ...drag,
      width: next.width,
      step: next.step,
      speed: 0,
      mode: atRoom && distance >= SPEED_FROM ? 'speed' : 'abs',
    };
  }
  if (distance > 0 || drag.width > room + 0.5) {
    const speed = speedOf(distance, frames);
    return {
      ...drag,
      width: Math.max(text, drag.width + speed),
      step: null,
      speed,
    };
  }
  // The table fits again: its edge snaps to the pointer at once, from
  // here the pointer positions it.
  const width = Math.max(
    text,
    Math.round(pointerX + drag.offset - tableStartX),
  );
  return {
    ...drag,
    mode: 'abs',
    anchorX: pointerX,
    anchorWidth: width,
    width,
    step: null,
    speed: 0,
  };
}

/** The column widths of a table handle drag. */
export const tableDragSizes = (drag: TableDrag) =>
  scaleTo(drag.startSizes, drag.width);

/**
 * The drag of a column border: between two columns (`index` below the last
 * column) or the last column's own edge (the inner right edge).
 */
export type BorderDrag = {
  kind: 'border';
  mode: 'abs' | 'speed';
  index: number;
  /** The widths the border is placed from (the table grew: the new ones). */
  base: number[];
  sizes: number[];
  /**
   * Positioning: the border is at `anchorPosition` (px from the table's
   * left edge) when the pointer is at `anchorX`, and moves with the
   * pointer. It is not measured against the table on the screen, which
   * moves when the frame scrolls: a pointer held still never changes a
   * width.
   */
  anchorX: number;
  anchorPosition: number;
  speed: number;
};

/**
 * Starts a drag of the right border of column `index`. The last column's
 * edge on a table that already overflows the room starts in speed mode.
 */
export function startBorderDrag(
  startSizes: readonly number[],
  index: number,
  pointerX: number,
  widths: StepWidths,
): BorderDrag {
  const last = index >= startSizes.length - 1;
  return {
    kind: 'border',
    mode:
      last && sumOf(startSizes) > speedRoomOf(widths) + 0.5 ? 'speed' : 'abs',
    index,
    base: [...startSizes],
    sizes: [...startSizes],
    anchorX: pointerX,
    anchorPosition: sumOf(startSizes.slice(0, index + 1)),
    speed: 0,
  };
}

/**
 * The column widths after the border moved (or a frame passed).
 *
 * Between two columns: the column and its right neighbour share their
 * total, the table width stays; once the neighbour is at its minimum the
 * column grows and the table with it, also past the room (once the
 * pointer is past the frame's edge, by the speed zones); shrinking gives the width back to the neighbour, and past the
 * column's minimum the columns to its left give way. A border drag never
 * shrinks the table. Pulled back inside by more than 28px after the speed
 * zones, the border snaps to the pointer.
 *
 * The last column's edge: only that column changes, the table follows,
 * down to the text width (the columns to its left give way past its
 * minimum); past the room by the speed zones, in both directions like the
 * table's handle: pulled back inside, the table shrinks by the speed zones
 * until it fits again, then the edge snaps to the pointer (measured once,
 * from where the table starts unscrolled; from there the border moves
 * with the pointer). As decided on 2026-11-16 from the mockup's
 * behaviour: in v23 the snap at 28px inside is measured against the
 * scrolled table, which shrinks it frame by frame until it fits; this is
 * that behaviour as a rule.
 */
export function moveBorderDrag(
  drag: BorderDrag,
  { pointerX, edgeX, tableX, tableStartX = tableX, frames }: DragInput,
  widths: StepWidths,
  minWidth = MIN_COLUMN_WIDTH,
): BorderDrag {
  const { index } = drag;
  const last = index >= drag.sizes.length - 1;
  const distance = pointerX - edgeX;
  let { mode, base, sizes, anchorX, anchorPosition } = drag;
  let speed = 0;
  if (mode === 'speed' && last) {
    if (distance > 0 || sumOf(sizes) > speedRoomOf(widths)) {
      // As the table's handle: past the edge the table grows by the speed
      // zones; pulled back inside it shrinks by them (just inside it
      // holds), the columns to the left giving way past the last one's
      // minimum, down to the text width; until it fits again.
      speed = speedOf(distance, frames);
      sizes =
        speed >= 0
          ? sizes.map((size, k) => (k === index ? size + speed : size))
          : placeBorder(
              sizes,
              index,
              sumOf(sizes) + speed,
              widths.text,
              minWidth,
            );
      base = sizes;
    } else {
      // It fits: the edge snaps to the pointer, measured from where the
      // table starts (the frame is not scrolled any more); from there the
      // pointer positions it.
      mode = 'abs';
      anchorX = pointerX;
      anchorPosition = pointerX - tableStartX;
      base = sizes;
    }
  } else if (mode === 'speed') {
    if (distance > -SNAP_BACK_DISTANCE) {
      // Past the edge: grow by the speed; just inside: hold.
      speed = Math.max(0, speedOf(distance, frames));
      sizes = [...sizes];
      sizes[index] = Math.max(minWidth, sizes[index] + speed);
      base = sizes;
    } else {
      // Back inside the frame by more than 28px: the border snaps to the
      // pointer (mockup). A border between two columns never shrinks the
      // table, the frame stays scrolled (positioning does not scroll):
      // measured from the table where it is.
      mode = 'abs';
      anchorX = pointerX;
      anchorPosition = pointerX - tableX;
      base = sizes;
    }
  }
  if (mode === 'abs') {
    const position = Math.round(anchorPosition + pointerX - anchorX);
    if (last) {
      sizes = placeBorder(base, index, position, widths.text, minWidth);
    } else {
      sizes = placeBorder(base, index, position, null, minWidth);
      sizes[index + 1] = Math.max(
        minWidth,
        sumOf(base.slice(0, index + 2)) - sumOf(sizes.slice(0, index + 1)),
      );
      // The table grew: the width to give back to the neighbour from.
      if (sumOf(sizes) > sumOf(base)) base = sizes;
    }
    if (
      sumOf(sizes) >= Math.floor(speedRoomOf(widths)) &&
      distance >= SPEED_FROM
    ) {
      mode = 'speed';
    }
  }
  return { ...drag, mode, base, sizes, anchorX, anchorPosition, speed };
}

/** What a finished drag stores on the table node. */
export type WidthChange = {
  colSizes: number[];
  /** The step to store (the custom width is removed)… */
  step: TableWidth | null;
  /** …or the custom width; both null: the width stays as it is. */
  tableWidth: number | null;
};

/**
 * What a drag that ended with the columns at `sizes` stores, or null when
 * it changes nothing (`startSizes`: the widths it started from). A width
 * that is exactly a step stores the step (`byWidth`, the borders), or the
 * step the table's handle snapped to (`snapped`); a column border between
 * two columns that kept the table's width leaves the width as it is.
 */
export function dragResult(
  sizes: readonly number[],
  startSizes: readonly number[],
  widths: StepWidths,
  snapped: TableWidth | null = null,
  { byWidth = true }: { byWidth?: boolean } = {},
): WidthChange | null {
  if (
    sizes.length === startSizes.length &&
    sizes.every((size, index) => size === startSizes[index])
  ) {
    return null;
  }
  const width = sumOf(sizes);
  if (!snapped && width === sumOf(startSizes)) {
    return { colSizes: [...sizes], step: null, tableWidth: null };
  }
  // The table's handle stores the step it snapped to, the edges and
  // borders the step their width lands on (mockup: `snap` for the handle,
  // `presetFor` for the borders).
  const step = snapped ?? (byWidth ? presetFor(width, widths) : null);
  return {
    colSizes: [...sizes],
    step,
    tableWidth: step ? null : width,
  };
}

/**
 * What the label of the table's handle shows for a drag that would store
 * `change` (`width`: the width it is at): the step it stores, or the
 * custom width. A drag that stores nothing (`change` null: a table
 * clamped to the room dragged to the room, which snaps to Full width
 * without changing a column) shows the table as it is, its stored step or
 * custom width: the label never names a step that releasing does not
 * store (work items 824 and 836).
 */
export function shownWidth(
  change: WidthChange | null,
  table: TElement,
  width: number,
): { step: TableWidth | null; width: number } {
  if (change) return { step: change.step, width };
  const custom = customWidthOf(table);
  if (custom !== null) return { step: null, width: custom };
  return {
    step:
      typeof table.blockWidth === 'string'
        ? (table.blockWidth as TableWidth)
        : 'default',
    width,
  };
}

/**
 * What a column delete stores on a table with a custom width (work item
 * 836), or null: the width is the sum of the columns left
 * (`after`, from `before`), by the rule of a drag's end (`dragResult`: a
 * sum exactly on a step stores the step); below the text width the
 * columns are scaled up to it. Columns never resized (stored as 0) are
 * left alone. Stored columns that do not add up to the custom width
 * (`tableWidth`; #824 never grew them, the table stretched them) are
 * first scaled as the table displayed them.
 */
export function deletedColumnChange(
  before: readonly number[] | undefined,
  after: readonly number[] | undefined,
  widths: StepWidths,
  tableWidth?: number,
): WidthChange | null {
  if (
    !before?.length ||
    !after?.length ||
    after.length >= before.length ||
    after.some((size) => !(size > 0))
  ) {
    return null;
  }
  const shown =
    tableWidth && Math.abs(sumOf(before) - tableWidth) > 0.5
      ? scaleTo(after, (sumOf(after) * tableWidth) / sumOf(before))
      : [...after];
  const sizes =
    sumOf(shown) < widths.text ? scaleTo(shown, widths.text) : shown;
  return dragResult(sizes, before, widths);
}

/**
 * The width a top-level table renders at: its step (min(step, room)) or
 * its custom width, which is not bounded by the room (it scrolls) but
 * never less than the text width.
 */
export function frameWidthOf(table: TElement, widths: StepWidths): number {
  const custom = customWidthOf(table);
  if (custom === null) {
    return stepWidth(
      typeof table.blockWidth === 'string' ? table.blockWidth : 'default',
      widths,
    );
  }
  return Math.max(widths.text, custom);
}

/**
 * Column widths for a step chosen in the width menu: the stored widths
 * scaled to the step's width, or undefined to keep them (none stored, or
 * columns never resized, stored as 0: they share the table's width on
 * their own).
 */
export function stepColSizes(
  colSizes: readonly number[] | undefined,
  width: number,
): number[] | undefined {
  if (!colSizes?.length || colSizes.some((size) => !(size > 0))) {
    return undefined;
  }
  const scaled = scaleTo(colSizes, width);
  return scaled.every((size, index) => size === colSizes[index])
    ? undefined
    : scaled;
}

/**
 * Column widths after a column was inserted, or undefined to keep them.
 *
 * Plate stores 0 for the new column (`before`: the old `colSizes`; `after`:
 * with the 0 inserted at `index`, the new column's index), which renders at
 * the minimum width. The new column gets the width of the column it was
 * inserted next to (`side`: inserted before or after it), and all widths
 * are fitted to `frame`, the table's width (`fitColSizes`); when even the
 * minimums do not fit, they add up to more (a custom width then follows
 * them, see the shadow's `insertColumn`). A table whose columns were never
 * resized (all 0) stretches on its own and keeps them.
 */
export function insertedColSizes(
  before: readonly number[] | undefined,
  after: readonly number[] | undefined,
  index: number,
  side: 'before' | 'after',
  frame: number,
): number[] | undefined {
  if (
    !before?.length ||
    !after ||
    after.length !== before.length + 1 ||
    index < 0 ||
    index >= after.length
  ) {
    return undefined;
  }
  if (before.every((size) => !(size > 0))) return undefined;
  // Inserted before the current column, which moved one to the right, or
  // after it.
  const from = side === 'before' ? index + 1 : index - 1;
  const next = [...after];
  next[index] = after[from] ?? 0;
  return fitColSizes(next, frame) ?? next;
}

/** How far an arrow key moves a width handle (mockup keyboard nudge). */
export const NUDGE = 10;

/**
 * An arrow key on the table's handle (mockup): the table `delta` px wider
 * or narrower, all columns scaled, never below the text width; always a
 * custom width. Null when nothing changes.
 */
export function nudgeTable(
  startSizes: readonly number[],
  delta: number,
  widths: StepWidths,
): WidthChange | null {
  const width = Math.max(widths.text, sumOf(startSizes) + delta);
  if (width === sumOf(startSizes)) return null;
  const colSizes = scaleTo(startSizes, width);
  return { colSizes, step: null, tableWidth: sumOf(colSizes) };
}

/**
 * An arrow key on a column border or the last column's edge (mockup): the
 * column `delta` px wider or narrower, down to the minimum; the table
 * follows, a custom width. Null when nothing changes.
 */
export function nudgeColumn(
  startSizes: readonly number[],
  index: number,
  delta: number,
  minWidth = MIN_COLUMN_WIDTH,
): WidthChange | null {
  const colSizes = [...startSizes];
  colSizes[index] = Math.max(minWidth, colSizes[index] + delta);
  if (colSizes[index] === startSizes[index]) return null;
  return { colSizes, step: null, tableWidth: sumOf(colSizes) };
}
