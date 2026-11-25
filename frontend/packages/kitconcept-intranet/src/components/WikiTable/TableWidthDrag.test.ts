import { afterEach, describe, expect, it } from 'vitest';
import type { TTableElement } from 'platejs';

import { columnsOffsetOf, measureColumnWidths } from './TableWidthDrag';
import { deletedColumnChange, sumOf } from './wikiTableCustomWidth';

const wide = { text: 780, medium: 1040, wide: 1440, room: 1580 };

/** Sets the box `getBoundingClientRect` reports for `element`. */
const place = (element: Element, left: number, width: number) => {
  element.getBoundingClientRect = () =>
    ({
      left,
      right: left + width,
      width,
      x: left,
      top: 0,
      bottom: 40,
      height: 40,
      y: 0,
    }) as DOMRect;
};

/**
 * A top-level table's block as the editor renders it: the frame, the scroll
 * container, the table with the row grip's gutter cell (width 0) in front of
 * each row. `rows`: the rendered width of each cell, row by row, with its
 * column span.
 */
const renderTable = (
  tableLeft: number,
  rows: { width: number; colSpan?: number }[][],
  gutterWidth = 0,
) => {
  const block = document.createElement('div');
  block.innerHTML =
    '<div class="block-inner-container"><div class="overflow-x-auto"><table><tbody></tbody></table></div></div>';
  const table = block.querySelector('table')!;
  const body = table.querySelector('tbody')!;
  let tableWidth = 0;
  for (const cells of rows) {
    const row = document.createElement('tr');
    const gutter = document.createElement('td');
    gutter.setAttribute('contenteditable', 'false');
    place(gutter, tableLeft, gutterWidth);
    row.appendChild(gutter);
    let x = tableLeft + gutterWidth;
    for (const { width, colSpan = 1 } of cells) {
      const cell = document.createElement('td');
      cell.colSpan = colSpan;
      place(cell, x, width);
      x += width;
      row.appendChild(cell);
    }
    tableWidth = x - tableLeft;
    body.appendChild(row);
  }
  place(table, tableLeft, tableWidth);
  document.body.appendChild(block);
  return block;
};

/** A table node of `columns` columns and two rows, with `props`. */
const tableNode = (
  columns: number,
  props: Record<string, unknown> = {},
  merged = false,
): TTableElement =>
  ({
    type: 'table',
    children: [0, 1].map(() => ({
      type: 'tr',
      children: merged
        ? [
            {
              type: 'td',
              colSpan: 2,
              children: [{ type: 'p', children: [{ text: '' }] }],
            },
            ...Array.from({ length: columns - 2 }, () => ({
              type: 'td',
              children: [{ type: 'p', children: [{ text: '' }] }],
            })),
          ]
        : Array.from({ length: columns }, () => ({
            type: 'td',
            children: [{ type: 'p', children: [{ text: '' }] }],
          })),
    })),
    ...props,
  }) as unknown as TTableElement;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('measureColumnWidths (a column delete on #824 data, work item 836)', () => {
  it('takes the rendered widths of a row of single cells, in whole pixels', () => {
    const block = renderTable(100, [
      [233.4, 233.3, 233.3].map((width) => ({ width })),
      [233.4, 233.3, 233.3].map((width) => ({ width })),
    ]);
    expect(
      measureColumnWidths(block, tableNode(3, { tableWidth: 700 })),
    ).toEqual([234, 233, 233]);
  });

  it('seeds a custom width without stored columns: a delete takes one column off', () => {
    const block = renderTable(100, [
      [300, 300, 300, 300].map((width) => ({ width })),
    ]);
    const before = measureColumnWidths(
      block,
      tableNode(4, { tableWidth: 1200 }),
    )!;
    expect(before).toEqual([300, 300, 300, 300]);
    expect(deletedColumnChange(before, before.slice(1), wide, 1200)).toEqual({
      colSizes: [300, 300, 300],
      step: null,
      tableWidth: 900,
    });
  });

  it('seeds a column never resized (0) as rendered, at the minimum; the sum is not scaled to the custom width again', () => {
    const block = renderTable(100, [
      [400, 120, 400, 400].map((width) => ({ width })),
    ]);
    const before = measureColumnWidths(
      block,
      tableNode(4, { tableWidth: 1200, colSizes: [400, 0, 400, 400] }),
    )!;
    expect(before).toEqual([400, 120, 400, 400]);
    expect(
      deletedColumnChange(before, [400, 120, 400], wide, sumOf(before)),
    ).toEqual({ colSizes: [400, 120, 400], step: null, tableWidth: 920 });
  });

  it('without a row of single cells: the stored widths scaled to the table, or equal columns', () => {
    const rows = [
      [{ width: 600, colSpan: 2 }, { width: 300 }, { width: 300 }],
      [{ width: 600, colSpan: 2 }, { width: 300 }, { width: 300 }],
    ];
    expect(
      measureColumnWidths(
        renderTable(0, rows),
        tableNode(
          4,
          { tableWidth: 1200, colSizes: [200, 200, 200, 200] },
          true,
        ),
      ),
    ).toEqual([300, 300, 300, 300]);
    expect(
      measureColumnWidths(
        renderTable(0, rows),
        tableNode(4, { tableWidth: 1200, colSizes: [400, 0, 400, 400] }, true),
      ),
    ).toEqual([300, 300, 300, 300]);
  });

  it('is null for a table that cannot be measured', () => {
    const block = document.createElement('div');
    expect(measureColumnWidths(block, tableNode(4))).toBeNull();
  });
});

describe('columnsOffsetOf', () => {
  const columnCells = (block: HTMLElement) =>
    Array.from(block.querySelectorAll('tr')[0].cells).slice(1);

  it('is where the row of single cells starts', () => {
    const block = renderTable(100, [[{ width: 300 }, { width: 300 }]], 24);
    const table = block.querySelector('table')!;
    expect(columnsOffsetOf(table, columnCells(block), 100)).toBe(24);
  });

  it('without a row of single cells: right of the gutter cell', () => {
    const block = renderTable(
      100,
      [[{ width: 600, colSpan: 2 }], [{ width: 600, colSpan: 2 }]],
      24,
    );
    expect(columnsOffsetOf(block.querySelector('table')!, null, 100)).toBe(24);
  });

  it('is 0 without a gutter cell (the view, a read-only editor)', () => {
    const table = document.createElement('table');
    table.insertRow().insertCell();
    expect(columnsOffsetOf(table, null, 100)).toBe(0);
  });
});
