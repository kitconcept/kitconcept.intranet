import { describe, expect, it } from 'vitest';
import type { TElement, Value } from 'platejs';
import { createSlateEditor } from 'platejs';
import {
  customWidthOf,
  dragChange,
  type DragWidth,
  fitColSizes,
  seedColSizes,
  stepWidth,
  frameWidthOf,
  insertedColSizes,
  dragWidth,
  isTableWidth,
  TABLE_WIDTH_KEY,
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

  it('drops a step wider than the room; Full width wins over a step as wide', () => {
    expect(widthGuides(narrow)).toEqual([
      { step: 'default', width: 780 },
      { step: 'full', width: 1040 },
    ]);
    expect(widthGuides({ ...wide, room: 1440 })).toEqual([
      { step: 'default', width: 780 },
      { step: 'medium', width: 1040 },
      { step: 'full', width: 1440 },
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
  it('is the step or the custom width within the room', () => {
    expect(frameWidthOf(table({ blockWidth: 'medium' }), wide)).toBe(1040);
    expect(frameWidthOf(table(), wide)).toBe(780);
    expect(frameWidthOf(table({ tableWidth: 960 }), wide)).toBe(960);
    expect(frameWidthOf(table({ tableWidth: 3000 }), wide)).toBe(1580);
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

  it('stops at the text column and at the room, which are steps too', () => {
    expect(dragWidth(500, wide)).toEqual({ width: 780, step: 'default' });
    expect(dragWidth(3000, wide)).toEqual({ width: 1580, step: 'full' });
    expect(dragWidth(3000, narrow)).toEqual({ width: 1040, step: 'full' });
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

describe('dragChange', () => {
  const medium: DragWidth = { width: 1040, step: 'medium' };

  it('is nothing for a drag that ends where the table is', () => {
    expect(dragChange(table({ blockWidth: 'medium' }), medium)).toBeNull();
    expect(
      dragChange(table({ tableWidth: 960 }), { width: 960, step: null }),
    ).toBeNull();
  });

  it('stores a custom width that changed by a few pixels', () => {
    expect(
      dragChange(table({ tableWidth: 960 }), { width: 970, step: null }),
    ).toEqual({ step: null, tableWidth: 970, colSizes: undefined });
    expect(
      dragChange(table({ tableWidth: 960 }), { width: 959, step: null }),
    ).toEqual({ step: null, tableWidth: 959, colSizes: undefined });
  });

  it('is nothing when a frame clamped to the room ends at the room', () => {
    const clamped = { startWidth: 1091, room: 1091 };
    const atRoom: DragWidth = { width: 1091, step: 'full' };
    expect(dragChange(table({ tableWidth: 1180 }), atRoom, clamped)).toBeNull();
    expect(
      dragChange(table({ blockWidth: 'layout' }), atRoom, clamped),
    ).toBeNull();
    // A real shrink below the room is stored.
    expect(
      dragChange(
        table({ tableWidth: 1180 }),
        { width: 891, step: null },
        clamped,
      ),
    ).toEqual({ step: null, tableWidth: 891, colSizes: undefined });
    // A frame that was narrower than the room may grow to it.
    expect(
      dragChange(table({ tableWidth: 960 }), atRoom, {
        startWidth: 960,
        room: 1091,
      }),
    ).toEqual({ step: 'full', tableWidth: null, colSizes: undefined });
  });

  it('is nothing when the frame is narrower than the text column', () => {
    const narrow = { startWidth: 631, room: 780, text: 780 };
    expect(
      dragChange(
        table({ blockWidth: 'medium' }),
        { width: 780, step: 'default' },
        narrow,
      ),
    ).toBeNull();
    expect(
      dragChange(
        table({ blockWidth: 'full', tableWidth: 1300 }),
        { width: 780, step: 'default' },
        narrow,
      ),
    ).toBeNull();
  });

  it('stores a step and removes the custom width', () => {
    expect(
      dragChange(table({ blockWidth: 'medium', tableWidth: 960 }), medium),
    ).toEqual({ step: 'medium', tableWidth: null, colSizes: undefined });
  });

  it('stores a custom width', () => {
    expect(
      dragChange(table({ tableWidth: 960 }), { width: 1000, step: null }),
    ).toEqual({ step: null, tableWidth: 1000, colSizes: undefined });
  });

  it('keeps column widths that fit, scales down those that do not', () => {
    expect(
      dragChange(table({ colSizes: [0, 0, 0, 0] }), medium)?.colSizes,
    ).toBeUndefined();
    expect(
      dragChange(table({ blockWidth: 'medium', colSizes: [400, 400, 240] }), {
        width: 900,
        step: null,
      })?.colSizes,
    ).toEqual([346, 346, 208]);
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
