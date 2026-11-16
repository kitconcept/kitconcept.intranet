import { describe, expect, it } from 'vitest';
import type { TElement } from 'platejs';
import {
  columnCount,
  widthForColumnCount,
  withPastedTableWidths,
} from './wikiTableWidthPlugin';

const cell = (props: Record<string, unknown> = {}): TElement => ({
  type: 'td',
  children: [{ type: 'p', children: [{ text: '' }] }],
  ...props,
});

const table = (
  columns: number,
  props: Record<string, unknown> = {},
): TElement => ({
  type: 'table',
  children: [0, 1].map(() => ({
    type: 'tr',
    children: Array.from({ length: columns }, () => cell()),
  })),
  ...props,
});

describe('widthForColumnCount', () => {
  it('keeps tables with up to 5 columns in the reading column', () => {
    expect([1, 2, 3, 4, 5].map(widthForColumnCount)).toEqual([
      'default',
      'default',
      'default',
      'default',
      'default',
    ]);
  });

  it('makes tables with 6 or 7 columns medium', () => {
    expect([6, 7].map(widthForColumnCount)).toEqual(['medium', 'medium']);
  });

  it('makes tables with 8 or 9 columns wide', () => {
    expect([8, 9].map(widthForColumnCount)).toEqual(['layout', 'layout']);
  });

  it('makes tables with 10 or more columns full width', () => {
    expect([10, 11, 25].map(widthForColumnCount)).toEqual([
      'full',
      'full',
      'full',
    ]);
  });
});

describe('columnCount', () => {
  it('counts the cells of the widest row', () => {
    const t = table(4);
    (t.children[1] as TElement).children.push(cell());
    expect(columnCount(t)).toBe(5);
  });

  it('counts merged cells with their span', () => {
    const t: TElement = {
      type: 'table',
      children: [
        { type: 'tr', children: [cell({ colSpan: 5 }), cell()] },
        { type: 'tr', children: [cell(), cell()] },
      ],
    };
    expect(columnCount(t)).toBe(6);
  });

  it('is 0 for a table without rows', () => {
    expect(columnCount({ type: 'table', children: [] })).toBe(0);
  });
});

describe('withPastedTableWidths', () => {
  it('stamps top-level tables with many columns', () => {
    const nodes = [
      { type: 'p', children: [{ text: '' }] },
      table(7),
      table(12),
    ];
    const result = withPastedTableWidths(nodes);
    expect(result.map((node) => (node as TElement).blockWidth)).toEqual([
      undefined,
      'medium',
      'full',
    ]);
    // The input is not changed.
    expect((nodes[1] as TElement).blockWidth).toBeUndefined();
  });

  it('leaves small tables and the fragment alone', () => {
    const nodes = [table(3), table(5)];
    expect(withPastedTableWidths(nodes)).toBe(nodes);
  });

  it('keeps the width of a table that has one (copied in the editor)', () => {
    const nodes = [table(8, { blockWidth: 'default' })];
    expect(withPastedTableWidths(nodes)).toBe(nodes);
  });

  it('uses the given table type', () => {
    const nodes = [{ ...table(8), type: 'wiki-table' }];
    expect(
      (withPastedTableWidths(nodes, 'wiki-table')[0] as TElement).blockWidth,
    ).toBe('layout');
  });
});
