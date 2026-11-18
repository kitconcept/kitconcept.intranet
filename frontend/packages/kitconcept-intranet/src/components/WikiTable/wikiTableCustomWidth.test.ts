import { describe, expect, it } from 'vitest';
import type { TElement, Value } from 'platejs';
import { createSlateEditor } from 'platejs';
import {
  type BorderDrag,
  customWidthOf,
  type DragInput,
  deletedColumnChange,
  dragResult,
  fitColSizes,
  hasColumnWidths,
  seedColSizes,
  seedSizes,
  shownWidth,
  stepWidth,
  frameWidthOf,
  insertedColSizes,
  dragWidth,
  isTableWidth,
  moveBorderDrag,
  nudgeColumn,
  nudgeTable,
  moveTableDrag,
  placeBorder,
  presetFor,
  scaleTo,
  scaledCellWidth,
  scaledTableMinWidth,
  speedFor,
  startBorderDrag,
  startTableDrag,
  stepColSizes,
  sumOf,
  TABLE_WIDTH_KEY,
  tableDragSizes,
  type TableDrag,
  widthGuides,
  WikiTableCustomWidthPlugin,
  withoutInvalidTableWidths,
} from './wikiTableCustomWidth';

const table = (props: Record<string, unknown> = {}): TElement => ({
  type: 'table',
  children: [
    {
      type: 'tr',
      children: [
        { type: 'td', children: [{ type: 'p', children: [{ text: 'a' }] }] },
      ],
    },
  ],
  ...props,
});

// A 1920px window: every step has its own width.
const wide = { text: 780, medium: 1040, wide: 1440, room: 1580 };
// A 1440px window: Wide is wider than the room.
const narrow = { text: 780, medium: 1040, wide: 1440, room: 1040 };

describe('isTableWidth / customWidthOf', () => {
  it('takes positive finite numbers only', () => {
    expect([1180, 0.5].map(isTableWidth)).toEqual([true, true]);
    expect(
      [0, -10, Number.NaN, Infinity, '1180', null, undefined, {}].map(
        isTableWidth,
      ),
    ).toEqual([false, false, false, false, false, false, false, false]);
  });

  it('reads the width of a table node', () => {
    expect(customWidthOf(table({ tableWidth: 1180 }))).toBe(1180);
    expect(customWidthOf(table({ tableWidth: '1180' }))).toBeNull();
    expect(customWidthOf(table())).toBeNull();
    expect(customWidthOf(undefined)).toBeNull();
  });
});

describe('withoutInvalidTableWidths', () => {
  it('removes a width that is not a positive number, at any depth', () => {
    const value: Value = [
      table({ id: 'a', tableWidth: 0 }),
      table({ id: 'b', tableWidth: 1180 }),
      {
        type: 'column_group',
        children: [
          {
            type: 'column',
            children: [table({ id: 'c', tableWidth: 'wide' })],
          },
        ],
      },
    ];
    const result = withoutInvalidTableWidths(value);
    expect(result).not.toBe(value);
    expect(TABLE_WIDTH_KEY in (result[0] as TElement)).toBe(false);
    expect((result[0] as TElement).id).toBe('a');
    expect(result[1]).toBe(value[1]);
    const nested = (result[2] as TElement).children[0] as TElement;
    expect(TABLE_WIDTH_KEY in (nested.children[0] as TElement)).toBe(false);
  });

  it('returns the value itself when nothing changes', () => {
    const value: Value = [table({ tableWidth: 1180 }), table()];
    expect(withoutInvalidTableWidths(value)).toBe(value);
  });
});

describe('WikiTableCustomWidthPlugin', () => {
  it('normalises an invalid width away and keeps a valid one', () => {
    const editor = createSlateEditor({
      plugins: [WikiTableCustomWidthPlugin],
      value: [table({ tableWidth: 1180 }), table()],
    });
    editor.tf.setNodes({ [TABLE_WIDTH_KEY]: -5 } as never, { at: [1] });
    expect(TABLE_WIDTH_KEY in editor.children[1]).toBe(false);
    expect((editor.children[0] as TElement).tableWidth).toBe(1180);
  });

  it('cleans the initial value', () => {
    const editor = createSlateEditor({
      plugins: [WikiTableCustomWidthPlugin],
      value: [table({ tableWidth: 'x' }), table({ tableWidth: 900 })],
    });
    expect(TABLE_WIDTH_KEY in editor.children[0]).toBe(false);
    expect((editor.children[1] as TElement).tableWidth).toBe(900);
  });
});

describe('widthGuides', () => {
  it('has the four steps on a wide window', () => {
    expect(widthGuides(wide)).toEqual([
      { step: 'default', width: 780 },
      { step: 'medium', width: 1040 },
      { step: 'layout', width: 1440 },
      { step: 'full', width: 1580 },
    ]);
  });

  it('takes the steps within the room; the narrower one where two meet (mockup)', () => {
    expect(widthGuides(narrow)).toEqual([
      { step: 'default', width: 780 },
      { step: 'medium', width: 1040 },
    ]);
    expect(widthGuides({ ...wide, room: 1440 })).toEqual([
      { step: 'default', width: 780 },
      { step: 'medium', width: 1040 },
      { step: 'layout', width: 1440 },
    ]);
  });

  it('keeps Text width when the room is the text column (small screen)', () => {
    expect(widthGuides({ ...wide, room: 780 })).toEqual([
      { step: 'default', width: 780 },
    ]);
  });
});

describe('stepWidth', () => {
  it('is the step within the room', () => {
    expect(
      ['default', 'medium', 'layout', 'full'].map((step) =>
        stepWidth(step, wide),
      ),
    ).toEqual([780, 1040, 1440, 1580]);
    expect(
      ['default', 'medium', 'layout', 'full'].map((step) =>
        stepWidth(step, narrow),
      ),
    ).toEqual([780, 1040, 1040, 1040]);
  });

  it('fits stored column widths for a narrower step', () => {
    // 1600px of columns and "Text width": they no longer scroll.
    expect(
      fitColSizes([400, 400, 400, 400], stepWidth('default', wide)),
    ).toEqual([195, 195, 195, 195]);
  });
});

describe('frameWidthOf', () => {
  it('is the step within the room or the custom width (not clamped, #836)', () => {
    expect(frameWidthOf(table({ blockWidth: 'medium' }), wide)).toBe(1040);
    expect(frameWidthOf(table(), wide)).toBe(780);
    expect(frameWidthOf(table({ tableWidth: 960 }), wide)).toBe(960);
    expect(frameWidthOf(table({ tableWidth: 3000 }), wide)).toBe(3000);
    // Never less than the text width.
    expect(frameWidthOf(table({ tableWidth: 500 }), wide)).toBe(780);
  });
});

describe('insertedColSizes', () => {
  it('gives the new column the width of its neighbour and fits the frame', () => {
    // Four columns filling 780px, a column inserted after column 1.
    expect(
      insertedColSizes(
        [195, 195, 195, 195],
        [195, 195, 0, 195, 195],
        2,
        'after',
        780,
      ),
    ).toEqual([156, 156, 156, 156, 156]);
    // Before column 0: the current column moved to index 1.
    expect(
      insertedColSizes([300, 600], [0, 300, 600], 0, 'before', 780),
    ).toEqual([195, 195, 390]);
  });

  it('keeps the widths when they still fit', () => {
    expect(
      insertedColSizes([200, 200], [200, 0, 200], 1, 'after', 780),
    ).toEqual([200, 200, 200]);
  });

  it('leaves never resized columns and tables without widths alone', () => {
    expect(insertedColSizes([0, 0, 0], [0, 0, 0, 0], 1, 'after', 780)).toBe(
      undefined,
    );
    expect(insertedColSizes(undefined, undefined, 0, 'after', 780)).toBe(
      undefined,
    );
  });

  it('uses the insert position, also next to a column stored as 0', () => {
    // Caret in column 0 (stored 0), a column inserted before it: the new
    // column takes that 0 (not the 300 next to the guessed position), the
    // widths are fitted to the frame, a 0 counting as 120.
    expect(
      insertedColSizes([0, 300, 300], [0, 0, 300, 300], 0, 'before', 780),
    ).toEqual([0, 0, 270, 270]);
    // After column 0: the new column is at index 1.
    expect(
      insertedColSizes([200, 300, 280], [200, 0, 300, 280], 1, 'after', 780),
    ).toEqual([159, 159, 239, 223]);
  });

  it('keeps zeros, which count as the minimum width', () => {
    expect(
      insertedColSizes([0, 330, 330], [0, 330, 0, 330], 2, 'after', 780),
    ).toEqual([0, 220, 220, 220]);
  });
});

describe('dragWidth', () => {
  it('gives a free width between the guides, in whole pixels', () => {
    expect(dragWidth(1180.4, wide)).toEqual({ width: 1180, step: null });
  });

  it('snaps to a guide within the tolerance', () => {
    expect(dragWidth(1045, wide)).toEqual({ width: 1040, step: 'medium' });
    expect(dragWidth(1028, wide)).toEqual({ width: 1040, step: 'medium' });
    expect(dragWidth(1027, wide)).toEqual({ width: 1027, step: null });
    expect(dragWidth(1435, wide)).toEqual({ width: 1440, step: 'layout' });
  });

  it('stops at the text column, snaps to the room, does not stop there', () => {
    expect(dragWidth(500, wide)).toEqual({ width: 780, step: 'default' });
    // Not bounded by the room (the speed zones take over past it).
    expect(dragWidth(3000, wide)).toEqual({ width: 3000, step: null });
    expect(dragWidth(1585, wide)).toEqual({ width: 1580, step: 'full' });
    // A fractional room in whole pixels.
    expect(dragWidth(1095, { ...narrow, room: 1091.5 })).toEqual({
      width: 1091,
      step: 'layout',
    });
  });
});

describe('fitColSizes', () => {
  it('leaves a table without column widths alone', () => {
    expect(fitColSizes(undefined, 1000)).toBeUndefined();
    expect(fitColSizes([], 1000)).toBeUndefined();
  });

  it('never grows the columns: the table layout stretches them', () => {
    expect(fitColSizes([200, 300, 500], 1500)).toBeUndefined();
    expect(fitColSizes([200, 300, 500], 1000)).toBeUndefined();
    // Columns never resized (0) stay 0.
    expect(fitColSizes([0, 0, 0, 0], 1040)).toBeUndefined();
    expect(fitColSizes([0, 0, 0, 0], 780)).toBeUndefined();
  });

  it('scales columns that do not fit down proportionally', () => {
    expect(fitColSizes([300, 450, 750], 1000)).toEqual([200, 300, 500]);
  });

  it('keeps a 0, which counts as the minimum width', () => {
    expect(fitColSizes([0, 360, 540], 780)).toEqual([0, 264, 396]);
  });

  it('adds up to the width exactly', () => {
    expect(fitColSizes([400, 400, 400], 1000)).toEqual([334, 333, 333]);
  });

  it('keeps the minimum column width; the other columns share the rest', () => {
    expect(fitColSizes([200, 600, 300], 600)).toEqual([120, 320, 160]);
    // A column narrower than the minimum keeps its width.
    expect(fitColSizes([100, 600, 300], 600)).toEqual([100, 333, 167]);
    // When the minimums do not fit, the table scrolls.
    expect(fitColSizes([200, 200, 200], 300)).toEqual([120, 120, 120]);
  });
});

// The drag model of work item 836 (mockup of #828). Screen coordinates:
// the table starts at x = 100; the frame's right edge is at 100 + the
// table's width while it fits, at 100 + room once it is wider.
const at = (
  pointerX: number,
  width: number,
  room: number,
  extra: Partial<DragInput> = {},
): DragInput => ({
  pointerX,
  edgeX: 100 + Math.min(width, room),
  tableX: 100,
  frames: 1,
  ...extra,
});

describe('scaleTo', () => {
  it('scales proportionally in whole pixels; the widest takes the rest', () => {
    expect(scaleTo([260, 260, 260], 1040)).toEqual([346, 347, 347]);
    expect(sumOf(scaleTo([100, 200, 300], 1000))).toBe(1000);
    expect(scaleTo([200, 400], 900)).toEqual([300, 600]);
  });

  it('keeps the minimum; the sum is then more than the width', () => {
    expect(scaleTo([100, 700], 780)).toEqual([120, 660]);
    expect(sumOf(scaleTo([200, 200, 200, 200, 200, 200, 200], 780))).toBe(840);
  });

  it('never exceeds a fractional width', () => {
    expect(sumOf(scaleTo([300, 300], 1091.5))).toBe(1091);
  });
});

describe('placeBorder', () => {
  it('moves the border: wider to the right, narrower to the left', () => {
    expect(placeBorder([200, 200, 200], 0, 250, null)).toEqual([250, 200, 200]);
    expect(placeBorder([200, 200, 200], 1, 330, null)).toEqual([200, 130, 200]);
  });

  it('past the minimum the columns to the left give way, right to left', () => {
    expect(placeBorder([200, 200, 200], 1, 300, null)).toEqual([180, 120, 200]);
    expect(placeBorder([200, 200, 200], 1, 100, null)).toEqual([120, 120, 200]);
  });

  it('stops at the minimum total (the text width for the last column)', () => {
    expect(placeBorder([300, 300, 300], 2, 600, 780)).toEqual([300, 300, 180]);
    expect(placeBorder([300, 300, 300], 2, 500, 780)).toEqual([300, 300, 180]);
    expect(placeBorder([400, 400, 400], 2, 500, 780)).toEqual([400, 260, 120]);
  });
});

describe('speedFor', () => {
  it('has a slow and a fast zone past the edge and inside it', () => {
    expect([40, 24, 1, 0, -28, -29, -64, -65].map(speedFor)).toEqual([
      12, 4, 4, 0, 0, -4, -4, -12,
    ]);
  });
});

describe('presetFor', () => {
  it('is the step a width lands on exactly, the narrower one when two meet', () => {
    expect(presetFor(780, wide)).toBe('default');
    expect(presetFor(1040, wide)).toBe('medium');
    expect(presetFor(1580, wide)).toBe('full');
    expect(presetFor(1041, wide)).toBeNull();
    // Medium is the room: Medium (the mockup's `presetFor`).
    expect(presetFor(1040, narrow)).toBe('medium');
    // Wide is the room: Wide (Full width is its own guide only on a room
    // wider than Wide, 1580 above).
    expect(presetFor(1091, { ...wide, room: 1091.4 })).toBe('layout');
  });
});

describe('hasColumnWidths', () => {
  it('is true only with a positive width for every column', () => {
    expect(hasColumnWidths([400, 400, 400], 3)).toBe(true);
    // #824 data: a custom width without a column drag.
    expect(hasColumnWidths(undefined, 3)).toBe(false);
    expect(hasColumnWidths([], 3)).toBe(false);
    expect(hasColumnWidths([400, 400], 3)).toBe(false);
    expect(hasColumnWidths([400, 0, 400], 3)).toBe(false);
    expect(hasColumnWidths([400, 400, 400, 400], 3)).toBe(false);
  });
});

describe('seedSizes', () => {
  it('rounds the rendered columns to whole pixels adding up to their sum', () => {
    expect(seedSizes([260.2, 260.2, 260.2])).toEqual([260, 260, 260]);
    expect(seedSizes([233.4, 233.3, 233.3])).toEqual([234, 233, 233]);
    expect(sumOf(seedSizes([363.8, 363.8, 363.9])!)).toBe(1091);
    expect(seedSizes([])).toBeNull();
    expect(seedSizes([100, 0])).toBeNull();
  });
});

describe('table handle drag', () => {
  const start = () => startTableDrag([260, 260, 260], 880, 880, wide);
  const move = (drag: TableDrag, pointerX: number, extra = {}) =>
    moveTableDrag(drag, at(pointerX, drag.width, wide.room, extra), wide);

  it('follows the pointer and scales all columns', () => {
    const drag = move(start(), 980);
    expect(drag.width).toBe(880);
    expect(drag.step).toBeNull();
    expect(tableDragSizes(drag)).toEqual([294, 293, 293]);
  });

  it('snaps to a step and stores it', () => {
    const drag = move(start(), 1136);
    expect([drag.width, drag.step]).toEqual([1040, 'medium']);
    expect(
      dragResult(tableDragSizes(drag), [260, 260, 260], wide, drag.step, {
        byWidth: false,
      }),
    ).toEqual({ colSizes: [346, 347, 347], step: 'medium', tableWidth: null });
    // The handle stores only the step it snapped to (mockup); a width on a
    // step without a snap (in speed mode) stays a custom width.
    expect(
      dragResult([347, 347, 346], [260, 260, 260], wide, null, {
        byWidth: false,
      }),
    ).toEqual({ colSizes: [347, 347, 346], step: null, tableWidth: 1040 });
  });

  it('stays above the text width', () => {
    expect(move(start(), 300).width).toBe(780);
  });

  it('grows by the speed zones past the room, also with the pointer held still', () => {
    // The pointer 30px past the room's edge in one move: the edge follows
    // it (as in the mockup), the pointer is past the frame's edge: speed.
    let drag = move(start(), 100 + wide.room + 30);
    expect([drag.width, drag.mode]).toEqual([wide.room + 30, 'speed']);
    // Held 30px past the frame's edge (pinned at the room): fast.
    drag = move(drag, 100 + wide.room + 30);
    expect([drag.width, drag.speed]).toEqual([wide.room + 42, 12]);
    drag = move(drag, 100 + wide.room + 30);
    expect(drag.width).toBe(wide.room + 54);
    // Slow zone, and the time that passed scales the speed.
    drag = move(drag, 100 + wide.room + 10, { frames: 2 });
    expect(drag.width).toBe(wide.room + 62);
    // Just inside: holds; further inside: shrinks.
    drag = move(drag, 100 + wide.room - 10);
    expect(drag.width).toBe(wide.room + 62);
    drag = move(drag, 100 + wide.room - 100);
    expect(drag.width).toBe(wide.room + 50);
  });

  it('snaps to the pointer once the table fits again', () => {
    let drag: TableDrag = {
      ...start(),
      mode: 'speed',
      width: wide.room + 2,
    };
    drag = move(drag, 100 + wide.room - 100);
    expect(drag.width).toBe(wide.room - 10);
    drag = move(drag, 100 + wide.room - 100);
    // Fits: the edge jumps to the pointer, positioning again.
    expect([drag.mode, drag.width]).toEqual(['abs', wide.room - 100]);
    drag = move(drag, 100 + wide.room - 200);
    expect(drag.width).toBe(wide.room - 200);
  });

  it('starts in speed mode on a table that already overflows', () => {
    const drag = startTableDrag([1000, 1000], 1680, 1680, wide);
    expect(drag.mode).toBe('speed');
    expect(moveTableDrag(drag, at(1680, 2000, wide.room), wide).width).toBe(
      2000,
    );
  });
});

describe('column border drag', () => {
  const move = (drag: BorderDrag, pointerX: number, extra = {}) =>
    moveBorderDrag(
      drag,
      at(pointerX, sumOf(drag.sizes), wide.room, extra),
      wide,
    );

  it('shares the width with the right neighbour; the table stays', () => {
    const drag = startBorderDrag([260, 260, 260], 0, 360, wide);
    expect(move(drag, 400).sizes).toEqual([300, 220, 260]);
    expect(move(drag, 300).sizes).toEqual([200, 320, 260]);
  });

  it('grows the table once the neighbour is at its minimum', () => {
    const drag = startBorderDrag([260, 260, 260], 0, 360, wide);
    expect(move(drag, 600).sizes).toEqual([500, 120, 260]);
    // Back: the neighbour gets its width back from the grown total, the
    // table does not shrink.
    let moved = move(drag, 600);
    moved = move(moved, 400);
    expect(moved.sizes).toEqual([300, 320, 260]);
    expect(sumOf(moved.sizes)).toBe(880);
  });

  it('past its minimum the columns to its left give way; the table stays', () => {
    const drag = startBorderDrag([260, 260, 260], 1, 620, wide);
    expect(move(drag, 400).sizes).toEqual([180, 120, 480]);
    expect(move(drag, 300).sizes).toEqual([120, 120, 540]);
    expect(sumOf(move(drag, 0).sizes)).toBe(780);
  });

  it('a table grown onto a step width stores the step', () => {
    const drag = move(
      startBorderDrag([260, 260, 260], 0, 360, wide),
      360 + 260 + 140,
    );
    expect(drag.sizes).toEqual([660, 120, 260]);
    expect(dragResult(drag.sizes, [260, 260, 260], wide)).toEqual({
      colSizes: [660, 120, 260],
      step: 'medium',
      tableWidth: null,
    });
    // One pixel off: the custom width.
    expect(dragResult([661, 120, 260], [260, 260, 260], wide)?.tableWidth).toBe(
      1041,
    );
  });

  it('keeps the width when the table did not change', () => {
    const drag = move(startBorderDrag([260, 260, 260], 0, 360, wide), 400);
    expect(dragResult(drag.sizes, [260, 260, 260], wide)).toEqual({
      colSizes: [300, 220, 260],
      step: null,
      tableWidth: null,
    });
    expect(dragResult([260, 260, 260], [260, 260, 260], wide)).toBeNull();
  });
});

describe('positioning past the room (the #828 mockup)', () => {
  // A pointer moved far past the frame's edge in one step: the edge
  // follows it (as in the mockup), then the speed zones take over.
  const move = (drag: BorderDrag, pointerX: number) =>
    moveBorderDrag(drag, at(pointerX, sumOf(drag.sizes), wide.room), wide);

  it("the last column's edge follows the pointer, then speed mode", () => {
    const drag = move(startBorderDrag([260, 260, 260], 2, 880, wide), 1880);
    expect([drag.sizes, drag.mode]).toEqual([[260, 260, 1260], 'speed']);
  });

  it('a border whose neighbour is at its minimum follows the pointer', () => {
    const drag = move(startBorderDrag([260, 260, 260], 0, 360, wide), 1360);
    expect([drag.sizes, drag.mode]).toEqual([[1260, 120, 260], 'speed']);
  });
});

describe('a pointer held still (work item 836)', () => {
  // The frame scrolls (the table's left edge moves left) while the pointer
  // stays: positioning does not follow the scrolled table.
  it('changes no width on a border between two columns', () => {
    let drag = startBorderDrag([600, 600, 600], 0, 700, wide);
    const input = (tableX: number): DragInput => ({
      pointerX: 1668,
      edgeX: 1680,
      tableX,
      frames: 1,
    });
    drag = moveBorderDrag(drag, input(100), wide);
    const held = drag.sizes;
    for (const tableX of [76, 52, 28, 4]) {
      drag = moveBorderDrag(drag, input(tableX), wide);
      expect(drag.sizes).toEqual(held);
    }
  });

  it("changes no width on the last column's edge after the snap back", () => {
    let drag = startBorderDrag([1000, 1000], 1, 1680, wide);
    expect(drag.mode).toBe('speed');
    // 40px inside, the frame scrolled by 420px: the table shrinks slowly
    // while it is wider than the room.
    drag = moveBorderDrag(
      drag,
      { pointerX: 1640, edgeX: 1680, tableX: -320, tableStartX: 100 },
      wide,
    );
    expect([drag.mode, sumOf(drag.sizes), drag.speed]).toEqual([
      'speed',
      1996,
      -4,
    ]);
    // Once it fits, the edge snaps to the pointer, measured from where the
    // table starts unscrolled.
    drag = { ...drag, sizes: [1000, 580], base: [1000, 580] };
    drag = moveBorderDrag(
      drag,
      { pointerX: 1640, edgeX: 1680, tableX: 100, tableStartX: 100 },
      wide,
    );
    expect([drag.mode, sumOf(drag.sizes)]).toEqual(['abs', 1540]);
    const held = drag.sizes;
    // The frame scrolls back while the pointer stays.
    for (const tableX of [-300, -100, 100]) {
      drag = moveBorderDrag(
        drag,
        { pointerX: 1640, edgeX: 1680, tableX, tableStartX: 100, frames: 1 },
        wide,
      );
      expect(drag.sizes).toEqual(held);
    }
  });
});

describe('a border between two columns after the speed zones (work item 836)', () => {
  it('snaps to the pointer in the scrolled frame and stays under it', () => {
    // The speed zones grew the table to 2109px; the frame (right edge at
    // 1680) is scrolled so that the border is in view at 1656: the table
    // starts at -73 instead of 100.
    let drag: BorderDrag = {
      ...startBorderDrag([260, 260, 260], 0, 360, wide),
      mode: 'speed',
      sizes: [1729, 120, 260],
      base: [1729, 120, 260],
    };
    const input = (pointerX: number): DragInput => ({
      pointerX,
      edgeX: 1680,
      tableX: -73,
      tableStartX: 100,
      frames: 1,
    });
    // 150px inside the frame's edge: the border snaps under the pointer.
    drag = moveBorderDrag(drag, input(1530), wide);
    expect(drag.mode).toBe('abs');
    expect(-73 + drag.sizes[0]).toBe(1530);
    expect(drag.sizes).toEqual([1603, 246, 260]);
    // And it follows the pointer from there; the table keeps its width.
    drag = moveBorderDrag(drag, input(1480), wide);
    expect(-73 + drag.sizes[0]).toBe(1480);
    expect(sumOf(drag.sizes)).toBe(2109);
  });
});

describe('last column edge drag', () => {
  const move = (drag: BorderDrag, pointerX: number, extra = {}) =>
    moveBorderDrag(
      drag,
      at(pointerX, sumOf(drag.sizes), wide.room, extra),
      wide,
    );

  it('resizes the last column, the table follows', () => {
    const drag = startBorderDrag([260, 260, 260], 2, 880, wide);
    expect(move(drag, 980).sizes).toEqual([260, 260, 360]);
    expect(dragResult([260, 260, 360], [260, 260, 260], wide)).toEqual({
      colSizes: [260, 260, 360],
      step: null,
      tableWidth: 880,
    });
  });

  it('stops at the text width', () => {
    const drag = startBorderDrag([400, 400, 400], 2, 1300, wide);
    expect(move(drag, 600).sizes).toEqual([400, 260, 120]);
    expect(sumOf(move(drag, 0).sizes)).toBe(780);
  });

  it('a width on a step stores the step', () => {
    const drag = startBorderDrag([260, 260, 260], 2, 880, wide);
    const sizes = move(drag, 880 + 260).sizes;
    expect(sumOf(sizes)).toBe(1040);
    expect(dragResult(sizes, [260, 260, 260], wide)?.step).toBe('medium');
  });

  it('grows by the speed zones past the room and snaps back inside', () => {
    const room = wide.room;
    let drag = startBorderDrag([500, 500, 500], 2, 1600, wide);
    drag = move(drag, 100 + room + 40);
    expect([sumOf(drag.sizes), drag.mode]).toEqual([room + 40, 'speed']);
    drag = move(drag, 100 + room + 40);
    expect(sumOf(drag.sizes)).toBe(room + 52);
    drag = move(drag, 100 + room - 20);
    expect(sumOf(drag.sizes)).toBe(room + 52);
    // Inside by more than 64px: the table shrinks fast while it is wider
    // than the room (as the table's handle), the last column first.
    drag = move(drag, 100 + room - 300);
    expect([drag.mode, sumOf(drag.sizes)]).toEqual(['speed', room + 40]);
    expect(drag.speed).toBe(-12);
    for (let i = 0; i < 4; i++) drag = move(drag, 100 + room - 300);
    expect(sumOf(drag.sizes)).toBe(room - 8);
    // It fits: the edge snaps to the pointer, positioning from here.
    drag = move(drag, 100 + room - 300);
    expect([drag.mode, sumOf(drag.sizes)]).toEqual(['abs', room - 300]);
    drag = move(drag, 100 + room - 350);
    expect(sumOf(drag.sizes)).toBe(room - 350);
  });

  it('starts in speed mode on a table that already overflows', () => {
    const drag = startBorderDrag([1000, 1000], 1, 1680, wide);
    expect(drag.mode).toBe('speed');
  });
});

describe('stepColSizes', () => {
  it('scales stored column widths to the step', () => {
    expect(stepColSizes([400, 400, 400, 400], 780)).toEqual([
      195, 195, 195, 195,
    ]);
    expect(stepColSizes([200, 300], 1000)).toEqual([400, 600]);
  });

  it('keeps columns never resized and widths that are the step already', () => {
    expect(stepColSizes(undefined, 780)).toBeUndefined();
    expect(stepColSizes([0, 0, 0], 780)).toBeUndefined();
    expect(stepColSizes([260, 260, 260], 780)).toBeUndefined();
  });
});

describe('seedColSizes', () => {
  it('is nothing when the stored widths render as they are', () => {
    expect(seedColSizes([200, 300, 280], [200, 300, 280])).toBeNull();
    expect(seedColSizes([200, 300, 280], [200.4, 299.6, 280.5])).toBeNull();
    // A table wider than its frame scrolls and renders as stored.
    expect(seedColSizes([400, 400, 400], [400, 400, 400])).toBeNull();
  });

  it('seeds columns never resized (0) from their rendered widths', () => {
    expect(seedColSizes(undefined, [195, 195, 195, 195])).toEqual([
      195, 195, 195, 195,
    ]);
    expect(seedColSizes([0, 0, 0], [260, 260, 260])).toEqual([260, 260, 260]);
  });

  it('seeds widths that add up to less than the table (stretched)', () => {
    expect(seedColSizes([150, 200, 250], [195, 260, 325])).toEqual([
      195, 260, 325,
    ]);
  });

  it('gives whole pixels that add up to the rendered sum, rounded down', () => {
    const seeded = seedColSizes(undefined, [233.4, 233.3, 233.3])!;
    expect(seeded.reduce((a, b) => a + b, 0)).toBe(700);
    expect(seeded).toEqual([234, 233, 233]);
  });

  it('is nothing without measurable columns', () => {
    expect(seedColSizes(undefined, [])).toBeNull();
    expect(seedColSizes(undefined, [100, 0])).toBeNull();
  });
});

describe('deletedColumnChange', () => {
  it('makes the custom width the sum of the columns left', () => {
    expect(deletedColumnChange([400, 400, 400], [400, 400], wide)).toEqual({
      colSizes: [400, 400],
      step: null,
      tableWidth: 800,
    });
  });

  it('stores a step the sum lands on', () => {
    expect(deletedColumnChange([520, 520, 300], [520, 520], wide)).toEqual({
      colSizes: [520, 520],
      step: 'medium',
      tableWidth: null,
    });
  });

  it('scales the columns up to the text width', () => {
    expect(deletedColumnChange([300, 300, 300], [300, 300], wide)).toEqual({
      colSizes: [390, 390],
      step: 'default',
      tableWidth: null,
    });
  });

  it('first scales columns that add up to less than the width (#824 data)', () => {
    expect(
      deletedColumnChange([260, 260, 260], [260, 260], wide, 1300),
    ).toEqual({ colSizes: [433, 433], step: null, tableWidth: 866 });
    // Already adding up: as they are.
    expect(
      deletedColumnChange([400, 400, 400], [400, 400], wide, 1200),
    ).toEqual({ colSizes: [400, 400], step: null, tableWidth: 800 });
  });

  it('leaves columns never resized and other changes alone', () => {
    expect(deletedColumnChange([0, 0, 0], [0, 0], wide)).toBeNull();
    expect(deletedColumnChange(undefined, [300], wide)).toBeNull();
    expect(deletedColumnChange([300, 300], [300, 300], wide)).toBeNull();
  });
});

describe('a table clamped to the room (work items 824, 836)', () => {
  // Wide on a 1091px room: rendered 1091px, the columns as displayed.
  const clamped = { text: 780, medium: 1040, wide: 1440, room: 1091.4 };
  const start = [364, 364, 363];

  it('is nothing when a frame clamped to the room ends at the room', () => {
    let drag = startTableDrag(start, 1200, 1200, clamped);
    // 3px to the left: snaps to the room, which is Wide here.
    drag = moveTableDrag(
      drag,
      { pointerX: 1197, edgeX: 1200, tableX: 109, frames: 1 },
      clamped,
    );
    expect(drag.step).toBe('layout');
    const change = dragResult(tableDragSizes(drag), start, clamped, drag.step);
    expect(change).toBeNull();
    // The label shows the table as it is: Wide, not Full width.
    expect(shownWidth(change, table({ blockWidth: 'layout' }), 1091)).toEqual({
      step: 'layout',
      width: 1091,
    });
    expect(shownWidth(change, table({ tableWidth: 1300 }), 1091)).toEqual({
      step: null,
      width: 1300,
    });
  });

  it('stores and names a real change', () => {
    const change = dragResult([300, 300, 291], start, clamped, null);
    expect(change).toEqual({
      colSizes: [300, 300, 291],
      step: null,
      tableWidth: 891,
    });
    expect(shownWidth(change, table({ blockWidth: 'layout' }), 891)).toEqual({
      step: null,
      width: 891,
    });
    expect(
      shownWidth(
        { colSizes: [], step: 'medium', tableWidth: null },
        table({ blockWidth: 'layout' }),
        1040,
      ),
    ).toEqual({ step: 'medium', width: 1040 });
  });
});

describe('keyboard nudges (the #828 mockup)', () => {
  it('the table handle scales all columns, always a custom width', () => {
    expect(nudgeTable([260, 260, 260], 10, wide)).toEqual({
      colSizes: [264, 263, 263],
      step: null,
      tableWidth: 790,
    });
    expect(nudgeTable([260, 260, 260], -10, wide)).toBeNull();
  });

  it('a border or the last edge resizes its column, the table follows', () => {
    expect(nudgeColumn([260, 260, 260], 0, 10)).toEqual({
      colSizes: [270, 260, 260],
      step: null,
      tableWidth: 790,
    });
    expect(nudgeColumn([120, 260], 0, -10)).toBeNull();
  });
});

describe('a centred table: the speed zones from its own limit', () => {
  // Its frame keeps its left edge while dragged, further left than the
  // text column: it may get wider than the room before the right margin.
  const centred = { ...wide, speedRoom: 1700 };

  it('positions past the room up to the speed room, then speed mode', () => {
    let drag = startTableDrag([260, 260, 260], 880, 880, centred);
    // 1650px: past the room (1580), the frame still follows the pointer.
    drag = moveTableDrag(drag, at(880 + 870, 1650, 1700), centred);
    expect([drag.width, drag.mode]).toEqual([1650, 'abs']);
    // At the speed room and past its edge: speed.
    drag = moveTableDrag(drag, at(880 + 940, 1700, 1700), centred);
    expect([drag.width, drag.mode]).toEqual([1720, 'speed']);
  });

  it("the last column's edge, likewise", () => {
    let drag = startBorderDrag([260, 260, 260], 2, 880, centred);
    drag = moveBorderDrag(drag, at(880 + 870, 1650, 1700), centred);
    expect([sumOf(drag.sizes), drag.mode]).toEqual([1650, 'abs']);
  });
});

describe('scaledCellWidth / scaledTableMinWidth', () => {
  it("is a cell's share of the stored column widths", () => {
    expect(scaledCellWidth([360, 480, 600], 3, 0, 1)).toBe('25%');
    expect(scaledCellWidth([360, 480, 600], 3, 2, 1)).toBe(
      `${(600 / 1440) * 100}%`,
    );
    // A merged cell spans its columns.
    expect(scaledCellWidth([360, 480, 600], 3, 0, 2)).toBe(
      `${(840 / 1440) * 100}%`,
    );
  });

  it('counts a column without a width as the minimum', () => {
    expect(scaledCellWidth(undefined, 4, 1, 1)).toBe('25%');
    expect(scaledCellWidth([0, 360], 2, 0, 1)).toBe(`${(120 / 480) * 100}%`);
  });

  it('keeps the narrowest column at the minimum width', () => {
    // Its narrowest column is a quarter: 480px.
    expect(scaledTableMinWidth([360, 480, 600], 3)).toBe(480);
    // Eight columns never resized: 960px, wider than Text width (scrolls).
    expect(scaledTableMinWidth(undefined, 8)).toBe(960);
    expect(scaledTableMinWidth([], 0)).toBe(0);
  });
});
