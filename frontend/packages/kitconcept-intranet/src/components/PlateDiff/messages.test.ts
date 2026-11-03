import { describe, expect, it } from 'vitest';
import { createIntl } from 'react-intl';
import { computeDiff, type DiffOperation } from '@platejs/diff';
import type { TElement, Value } from 'platejs';
import { changeSummary, withWidthContext } from './messages';

const intl = createIntl({ locale: 'en', messages: {} });

const update = (
  properties: Record<string, unknown>,
  newProperties: Record<string, unknown>,
) => ({ type: 'update', properties, newProperties }) as DiffOperation;

const table = (props: Record<string, unknown>): TElement => ({
  type: 'table',
  id: 't',
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

/** The summary of the table's update in the diff of two versions. */
const summaryOf = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) => {
  const [node] = computeDiff(
    [table(before)] as Value,
    [table(after)] as Value,
    {
      ignoreProps: ['id'],
      getUpdateProps: (old, properties, newProperties) =>
        withWidthContext(
          old as unknown as Record<string, unknown>,
          properties,
          newProperties,
        ),
    },
  ) as (TElement & { diffOperation?: DiffOperation })[];
  return node.diffOperation ? changeSummary(node.diffOperation, intl) : null;
};

describe('changeSummary', () => {
  it('describes property changes', () => {
    expect(
      changeSummary(
        update(
          { align: 'left', blockWidth: 'default' },
          { align: 'center', blockWidth: 'layout' },
        ),
        intl,
      ),
    ).toBe('Alignment: Left → Centred, Width: Standard → Wide');
  });

  it('is empty for an insert or a delete', () => {
    expect(changeSummary({ type: 'insert' } as DiffOperation, intl)).toBe('');
  });

  it('shows a step and a custom width as one width line', () => {
    expect(
      changeSummary(
        update(
          { blockWidth: 'medium' },
          { blockWidth: 'medium', tableWidth: 1180 },
        ),
        intl,
      ),
    ).toBe('Width: Medium → 1180px');
    expect(
      changeSummary(
        update(
          { blockWidth: 'medium', tableWidth: 1180 },
          { blockWidth: 'layout', tableWidth: undefined },
        ),
        intl,
      ),
    ).toBe('Width: 1180px → Wide');
    expect(
      changeSummary(update({ tableWidth: 1180 }, { tableWidth: 1500 }), intl),
    ).toBe('Width: 1180px → 1500px');
  });

  it('keeps the other properties next to the width line', () => {
    expect(
      changeSummary(
        update(
          { blockWidth: 'full', align: 'left' },
          { blockWidth: 'full', tableWidth: 1180, align: 'center' },
        ),
        intl,
      ),
    ).toBe('Width: Full width → 1180px, Alignment: Left → Centred');
  });

  it('writes the px value without digit grouping', () => {
    const de = createIntl({ locale: 'de', messages: {} });
    expect(
      changeSummary(
        update(
          { blockWidth: 'default' },
          { blockWidth: 'default', tableWidth: 1180 },
        ),
        de,
      ),
    ).toBe('Width: Standard → 1180px');
  });
});

describe('changeSummary of computeDiff with withWidthContext', () => {
  it('reads a drag from a step as "Medium → 1180px"', () => {
    expect(
      summaryOf(
        { blockWidth: 'medium' },
        { blockWidth: 'medium', tableWidth: 1180 },
      ),
    ).toBe('Width: Medium → 1180px');
  });

  it('reads a reset to a step as "1180px → Wide"', () => {
    expect(
      summaryOf(
        { blockWidth: 'medium', tableWidth: 1180 },
        { blockWidth: 'layout' },
      ),
    ).toBe('Width: 1180px → Wide');
    expect(
      summaryOf(
        { blockWidth: 'medium', tableWidth: 1180 },
        { blockWidth: 'medium' },
      ),
    ).toBe('Width: 1180px → Medium');
  });

  it('reads a changed custom width', () => {
    expect(
      summaryOf(
        { blockWidth: 'default', tableWidth: 900 },
        { blockWidth: 'default', tableWidth: 1180 },
      ),
    ).toBe('Width: 900px → 1180px');
  });

  it('leaves a step change without custom width as it was', () => {
    expect(summaryOf({ blockWidth: 'default' }, { blockWidth: 'full' })).toBe(
      'Width: Standard → Full width',
    );
  });
});

describe('changeSummary of column widths', () => {
  it('names the column widths in px', () => {
    expect(
      changeSummary(
        update({ colSizes: [180, 240, 360] }, { colSizes: [200, 240, 340] }),
        intl,
      ),
    ).toBe('Column widths: 180, 240, 360 px → 200, 240, 340 px');
    expect(changeSummary(update({}, { colSizes: [1200, 240] }), intl)).toBe(
      'Column widths: not set → 1200, 240 px',
    );
  });

  it('leaves them out next to a width change', () => {
    expect(
      changeSummary(
        update(
          { colSizes: [180, 240, 360], blockWidth: 'medium' },
          {
            colSizes: [272, 363, 545],
            blockWidth: 'medium',
            tableWidth: 1180,
          },
        ),
        intl,
      ),
    ).toBe('Width: Medium → 1180px');
    expect(
      changeSummary(
        update(
          { colSizes: [400, 400], blockWidth: 'full' },
          { colSizes: [390, 390], blockWidth: 'medium' },
        ),
        intl,
      ),
    ).toBe('Width: Full width → Medium');
  });
});

describe('changeSummary of a step change under a custom width', () => {
  it('names the step when both sides show the same custom width', () => {
    expect(
      changeSummary(
        update(
          { blockWidth: 'medium', tableWidth: 960 },
          { blockWidth: 'full', tableWidth: 960 },
        ),
        intl,
      ),
    ).toBe('Width: Medium → Full width');
    expect(
      summaryOf(
        { blockWidth: 'medium', tableWidth: 960 },
        { blockWidth: 'full', tableWidth: 960 },
      ),
    ).toBe('Width: Medium → Full width');
  });
});
