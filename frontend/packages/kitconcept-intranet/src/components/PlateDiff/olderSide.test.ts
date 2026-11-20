import { describe, expect, it } from 'vitest';
import { computeDiff } from '@platejs/diff';
import type { TElement, Value } from 'platejs';
import { olderSide } from './olderSide';

const cell = (text: string, props: Record<string, unknown> = {}) => ({
  type: 'td',
  id: `c-${text}`,
  children: [{ type: 'p', id: `p-${text}`, children: [{ text }] }],
  ...props,
});

const table = (props: Record<string, unknown>, cellProps = {}): TElement => ({
  type: 'table',
  id: 't',
  children: [
    {
      type: 'tr',
      id: 'r',
      children: [cell('a', cellProps), cell('b'), cell('c')],
    },
  ],
  ...props,
});

/** The diff node of a table changed from `before` to `after`. */
const diffed = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  cellBefore = {},
  cellAfter = {},
) =>
  computeDiff(
    [table(before, cellBefore)] as Value,
    [table(after, cellAfter)] as Value,
    { ignoreProps: ['id'] },
  )[0] as TElement;

describe('olderSide', () => {
  it('gives a table its older column widths back (not set before)', () => {
    const node = diffed({}, { colSizes: [424, 184, 305] });
    expect(node.colSizes).toEqual([424, 184, 305]);
    const older = olderSide(node);
    expect('colSizes' in older).toBe(false);
    // The diff marks stay, for the change label and the frame.
    expect(older.diffOperation).toEqual(node.diffOperation);
  });

  it('gives back an older width and alignment, removes a newer one', () => {
    const older = olderSide(
      diffed(
        { blockWidth: 'default', tableAlign: 'center' },
        { blockWidth: 'medium', tableWidth: 1180 },
      ),
    );
    expect(older.blockWidth).toBe('default');
    expect(older.tableAlign).toBe('center');
    expect('tableWidth' in older).toBe(false);
  });

  it('reaches updated nodes at any depth', () => {
    const node = diffed({}, {}, {}, { background: '#ff0' });
    const older = olderSide(node);
    const firstCell = (older.children[0] as TElement).children[0] as TElement;
    expect('background' in firstCell).toBe(false);
  });

  it('returns an unchanged node as it is', () => {
    const node = table({ colSizes: [100, 200, 300] });
    expect(olderSide(node)).toBe(node);
  });
});
