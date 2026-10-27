import { describe, expect, it } from 'vitest';
import { assignRefs } from './refs';

const refsOf = (blocks) =>
  blocks.map((block) =>
    block.children ? [block.ref, refsOf(block.children)] : block.ref,
  );

describe('assignRefs', () => {
  it('numbers blocks in page order, dotted inside containers', () => {
    const { blocks, refs } = assignRefs([
      { id: 'a' },
      { id: 'grid', children: [{ id: 'x' }, { id: 'y' }] },
      { id: 'b' },
    ]);
    expect(refsOf(blocks)).toEqual(['b1', ['b2', ['b2.1', 'b2.2']], 'b3']);
    expect(refs).toEqual({
      a: 'b1',
      grid: 'b2',
      x: 'b2.1',
      y: 'b2.2',
      b: 'b3',
    });
  });

  it('never reuses the ref of a removed block (D21)', () => {
    const first = assignRefs([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    // c (b3) is removed, a new block arrives: it gets b4, not b3
    const second = assignRefs(
      [{ id: 'a' }, { id: 'b' }, { id: 'new' }],
      first.refs,
    );
    expect(refsOf(second.blocks)).toEqual(['b1', 'b2', 'b4']);
  });

  it('never reuses refs inside a container either', () => {
    const first = assignRefs([
      { id: 'g', children: [{ id: 'x' }, { id: 'y' }] },
    ]);
    const second = assignRefs(
      [{ id: 'g', children: [{ id: 'x' }, { id: 'z' }] }],
      first.refs,
    );
    expect(refsOf(second.blocks)).toEqual([['b1', ['b1.1', 'b1.3']]]);
  });

  it('keeps the ref of a moved block', () => {
    const first = assignRefs([
      { id: 'a' },
      { id: 'g', children: [{ id: 'x' }] },
    ]);
    const second = assignRefs(
      [{ id: 'g', children: [{ id: 'x' }, { id: 'a' }] }],
      first.refs,
    );
    expect(refsOf(second.blocks)).toEqual([['b2', ['b2.1', 'b1']]]);
  });

  it('does not change the mapping it gets', () => {
    const refs = { a: 'b1' };
    assignRefs([{ id: 'a' }, { id: 'b' }], refs);
    expect(refs).toEqual({ a: 'b1' });
  });
});
