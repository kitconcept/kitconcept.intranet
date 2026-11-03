/**
 * Custom table width (work item 824): the resize handle on the right edge of
 * a wiki table stores a pixel width on the table node, `tableWidth`, next to
 * the width step (`blockWidth`, see wikiTableWidthPlugin.ts). It is a
 * property of its own because @plone/plate's block width plugin resets a
 * `blockWidth` it does not know.
 *
 * While `tableWidth` is set the table has left the steps: its width is
 * min(tableWidth, room), the room reaching from the text column's left
 * edge (where a wide table starts, #826) to the content area's right edge
 * minus a 10px margin, never less than the text column
 * (theme/components/_wikiTable.scss, `--wiki-table-room`). `blockWidth`
 * keeps its value meanwhile, the `wiki-table-custom-width` class wins over
 * it in the CSS. Choosing a step in the width menu removes `tableWidth`.
 *
 * `WikiTableCustomWidthPlugin` renders the width (an inline
 * `--wiki-table-width` and the class on the table's block; editor, view and
 * history diff) and removes a `tableWidth` that is not a positive number.
 * The rest of the module is the drag model of the handle: the step widths
 * as guides, snapping, and the column widths scaled with the table.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/824
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
};

export type WidthGuide = { step: TableWidth; width: number };

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
 * The guides a drag snaps to, narrowest first: the four steps, without the
 * ones outside [text, room]. Where two steps have the same width (often
 * Wide and the room), the wider step wins, so a drag
 * to the edge stores Full width as the menu would; except Text width, which
 * a table on a narrow screen keeps.
 */
export function widthGuides({ text, medium, wide, room }: StepWidths) {
  const guides: WidthGuide[] = [];
  const candidates: WidthGuide[] = [
    { step: 'default', width: text },
    { step: 'medium', width: medium },
    { step: 'layout', width: wide },
    { step: 'full', width: room },
  ];
  for (const guide of candidates) {
    if (!Number.isFinite(guide.width)) continue;
    if (guide.width < text - 0.5 || guide.width > room + 0.5) continue;
    const last = guides.at(-1);
    if (last && Math.abs(last.width - guide.width) < 1) {
      if (last.step !== 'default') guides[guides.length - 1] = guide;
      continue;
    }
    guides.push(guide);
  }
  return guides;
}

export type DragWidth = { width: number; step: TableWidth | null };

/**
 * The width for a drag that has reached `candidate` px: clamped to
 * [text, room] and snapped to the nearest guide within `tolerance`.
 */
export function dragWidth(
  candidate: number,
  widths: StepWidths,
  tolerance = SNAP_TOLERANCE,
): DragWidth {
  const max = Math.max(widths.text, widths.room);
  const width = Math.min(Math.max(candidate, widths.text), max);
  let best: WidthGuide | null = null;
  for (const guide of widthGuides(widths)) {
    const distance = Math.abs(guide.width - width);
    if (
      distance <= tolerance &&
      (!best || distance < Math.abs(best.width - width))
    ) {
      best = guide;
    }
  }
  return best
    ? { width: best.width, step: best.step }
    : { width: Math.round(width), step: null };
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
 * Column widths to store before a column border is dragged, or null when
 * the stored ones render as they are.
 *
 * Plate's column resizing writes the dragged column's new width next to the
 * stored `colSizes`. When those do not add up to the table's width (columns
 * never resized are stored as 0, or the table was widened, see
 * `fitColSizes`), the fixed table layout stretches every column, the
 * dragged one too, so its border jumped on the first pixel and then ran
 * ahead of the pointer. Seeding every column with its rendered width first
 * makes the stored widths add up to the table, and the border follows the
 * pointer. `rendered` are the columns' rendered widths in px; the result
 * is whole pixels adding up to their sum rounded down (never wider than
 * the table, which would scroll).
 */
export function seedColSizes(
  colSizes: readonly number[] | undefined,
  rendered: readonly number[],
): number[] | null {
  if (!rendered.length || rendered.some((size) => !(size > 0))) return null;
  if (
    colSizes?.length === rendered.length &&
    colSizes.every((size, index) => Math.abs(size - rendered[index]) <= 1)
  ) {
    return null;
  }
  return roundToTotal(
    rendered,
    rendered.reduce((sum, size) => sum + size, 0),
  );
}

/**
 * The width of a top-level table's frame from its step or custom width
 * (min(width, room), never less than the text column).
 */
export function frameWidthOf(table: TElement, widths: StepWidths): number {
  const custom = customWidthOf(table);
  if (custom === null) {
    return stepWidth(
      typeof table.blockWidth === 'string' ? table.blockWidth : 'default',
      widths,
    );
  }
  return Math.max(widths.text, Math.min(custom, widths.room));
}

/**
 * Column widths after a column was inserted, or undefined to keep them.
 *
 * Plate stores 0 for the new column (`before`: the old `colSizes`; `after`:
 * with the 0 inserted at `index`, the new column's index), which renders at
 * the minimum width; when the stored widths already filled the frame, the
 * table then scrolled. The new column gets the width of the column it was
 * inserted next to (`side`: inserted before or after it), and all widths
 * are fitted to the frame (`fitColSizes`).
 * A table whose columns were never resized (all 0) stretches on its own and
 * keeps them.
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

/** What a drag of the resize handle writes on the table node. */
export type DragChange = {
  /** The step to store (the custom width is removed), or null. */
  step: TableWidth | null;
  /** The custom width to store, or null when a step is stored. */
  tableWidth: number | null;
  /** New column widths, or undefined to keep them. */
  colSizes?: number[];
};

/**
 * What a drag that ended on `next` changes on `table`, or null when it
 * changes nothing:
 * - it ended on the step the table has (and no custom width), or on
 *   exactly the custom width it has;
 * - the frame was at the room when the drag started (`startWidth`: a step
 *   or a custom width wider than the room, clamped to it) and the drag
 *   ended at the room again. Only a real shrink below the room changes
 *   such a table; a table wider than the editor's room would otherwise
 *   become Full width on a tiny drag;
 * - the frame was narrower than the text column (`text`): the content area
 *   is, and every width is the content area there (the editor shows no
 *   handle then; this is a second guard).
 */
export function dragChange(
  table: TElement,
  next: DragWidth,
  {
    startWidth,
    room,
    text,
  }: { startWidth?: number; room?: number; text?: number } = {},
): DragChange | null {
  if (
    startWidth !== undefined &&
    text !== undefined &&
    startWidth < text - 0.5
  ) {
    return null;
  }
  const custom = customWidthOf(table);
  const step =
    typeof table.blockWidth === 'string' ? table.blockWidth : 'default';
  if (
    room !== undefined &&
    startWidth !== undefined &&
    startWidth >= room - 0.5 &&
    next.width >= room - 0.5
  ) {
    return null;
  }
  if (next.step ? custom === null && next.step === step : false) return null;
  if (!next.step && custom !== null && custom === next.width) return null;
  return {
    step: next.step,
    tableWidth: next.step ? null : next.width,
    colSizes: fitColSizes(table.colSizes as number[] | undefined, next.width),
  };
}
