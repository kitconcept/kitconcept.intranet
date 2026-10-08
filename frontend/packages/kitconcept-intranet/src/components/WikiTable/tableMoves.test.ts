import { describe, expect, it } from 'vitest';
import {
  hasMergedCells,
  isHeaderRow,
  moveTargetIndex,
  reorder,
} from './tableMoves';

const cell = (type: string, extra = {}) => ({
  type,
  children: [{ text: '' }],
  ...extra,
});

describe('moveTargetIndex', () => {
  it('moves down: after the target, one index less once removed', () => {
    expect(moveTargetIndex(0, 2, 'after')).toBe(2);
    expect(moveTargetIndex(0, 2, 'before')).toBe(1);
  });
  it('moves up: before the target keeps its index', () => {
    expect(moveTargetIndex(3, 1, 'before')).toBe(1);
    expect(moveTargetIndex(3, 1, 'after')).toBe(2);
  });
  it('dropping on itself is a no-op', () => {
    expect(moveTargetIndex(2, 2, 'before')).toBe(2);
    expect(moveTargetIndex(2, 2, 'after')).toBe(2);
  });
});

describe('reorder', () => {
  it('moves an item and leaves the input untouched', () => {
    const list = ['a', 'b', 'c', 'd'];
    expect(reorder(list, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(reorder(list, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(list).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('isHeaderRow / hasMergedCells', () => {
  it('detects header rows', () => {
    expect(
      isHeaderRow({ type: 'tr', children: [cell('th'), cell('th')] }),
    ).toBe(true);
    expect(
      isHeaderRow({ type: 'tr', children: [cell('th'), cell('td')] }),
    ).toBe(false);
    expect(isHeaderRow(undefined)).toBe(false);
  });
  it('detects merged cells via props and attributes', () => {
    const plain = {
      type: 'table',
      children: [{ type: 'tr', children: [cell('td'), cell('td')] }],
    };
    expect(hasMergedCells(plain)).toBe(false);
    expect(
      hasMergedCells({
        type: 'table',
        children: [{ type: 'tr', children: [cell('td', { colSpan: 2 })] }],
      }),
    ).toBe(true);
    expect(
      hasMergedCells({
        type: 'table',
        children: [
          {
            type: 'tr',
            children: [cell('td', { attributes: { rowspan: '2' } })],
          },
        ],
      }),
    ).toBe(true);
  });
});
