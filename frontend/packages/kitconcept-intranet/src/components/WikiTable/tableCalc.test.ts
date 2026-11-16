import { describe, expect, it } from 'vitest';
import type { TElement } from 'platejs';
import {
  bodyRowRange,
  footerRowOver,
  formatCalc,
  formatSum,
  sumUpdates,
} from './tableCalc';

const cell = (type: string, text: string, props = {}) =>
  ({
    type,
    children: [{ type: 'p', children: [{ text }] }],
    ...props,
  }) as TElement;
const row = (type: string, texts: string[], props = {}) =>
  ({
    type: 'tr',
    children: texts.map((t) => cell(type, t)),
    ...props,
  }) as TElement;
const table = (rows: TElement[]) =>
  ({ type: 'table', children: rows }) as TElement;

describe('formatSum', () => {
  it('adds German amounts and keeps their format and unit', () => {
    expect(
      formatSum([
        '180.000 €',
        '420.000 €',
        '650.000 €',
        '95.000 €',
        '110.000 €',
      ]),
    ).toBe('1.455.000 €');
  });

  it('keeps decimals', () => {
    expect(formatSum(['1,5', '2,25'])).toBe('3,75');
    expect(formatSum(['12,50 €', '7,50 €'])).toBe('20,00 €');
  });

  it('writes plain numbers plainly', () => {
    expect(formatSum(['120000', '250000', '80000'])).toBe('450000');
  });

  it('skips cells that are not numbers and drops a unit they do not share', () => {
    expect(formatSum(['10 %', 'n/a', '5'])).toBe('15 (1 übersprungen)');
    expect(formatSum(['10 %', '', '5 %'])).toBe('15 %');
  });

  it('is null without numbers', () => {
    expect(formatSum(['im Plan', ''])).toBeNull();
    expect(formatSum([])).toBeNull();
  });
});

describe('formatCalc', () => {
  const hours = ['6', '0,5', '12', '1', '3,5', '2', '', '8'];
  const amounts = [
    '180.000 €',
    '420.000 €',
    '650.000 €',
    '95.000 €',
    '110.000 €',
  ];

  it('averages with one more decimal than the column', () => {
    expect(formatCalc('average', hours)).toBe('4,71');
    expect(formatCalc('average', amounts)).toBe('291.000,0 €');
    expect(formatCalc('average', ['2', '3'])).toBe('2,5');
  });

  it('gives min and max as the cell text of the extreme value', () => {
    expect(formatCalc('min', hours)).toBe('0,5');
    expect(formatCalc('max', hours)).toBe('12');
    expect(formatCalc('max', amounts)).toBe('650.000 €');
    expect(formatCalc('min', ['n/a', ' 7 €', '9 €'])).toBe(
      '7 € (1 übersprungen)',
    );
  });

  it('counts the non-empty cells, numbers or not', () => {
    expect(formatCalc('count', hours)).toBe('7');
    expect(formatCalc('count', ['im Plan', '', 'offen'])).toBe('2');
    expect(formatCalc('count', ['', ' '])).toBeNull();
  });

  it('sum equals formatSum', () => {
    expect(formatCalc('sum', hours)).toBe(formatSum(hours));
    expect(formatCalc('sum', hours)).toBe('33,0');
  });

  it('is null without numbers', () => {
    expect(formatCalc('average', ['a', 'b'])).toBeNull();
    expect(formatCalc('min', [])).toBeNull();
  });

  it('says how many non-empty cells were skipped', () => {
    expect(formatCalc('sum', ['6', 'n/a', '2', ''])).toBe('8 (1 übersprungen)');
    expect(formatCalc('average', ['1', 'x', 'y', '3'])).toBe(
      '2,0 (2 übersprungen)',
    );
    expect(formatCalc('max', ['1', '?', '3'])).toBe('3 (1 übersprungen)');
    // Empty cells are not skipped cells; count never skips.
    expect(formatCalc('sum', ['1', '', '2'])).toBe('3');
    expect(formatCalc('count', ['1', 'x', ''])).toBe('2');
  });

  it('takes min and max of a date column as dates', () => {
    const due = ['15.10.2026', '02.10.2026', '30.11.2026', '', '09.10.2026'];
    expect(formatCalc('min', due)).toBe('02.10.2026');
    expect(formatCalc('max', due)).toBe('30.11.2026');
    expect(formatCalc('min', ['15.10.2026', 'offen', '02.10.2026'])).toBe(
      '02.10.2026 (1 übersprungen)',
    );
    expect(formatCalc('sum', due)).toBeNull();
  });
});

describe('footerRowOver', () => {
  const footer = {
    type: 'tr',
    footer: true,
    id: 'f',
    children: [
      cell('td', 'Summe'),
      cell('td', '33,0', { calc: 'sum' }),
      cell('td', '8', { calc: 'count' }),
    ],
  } as TElement;
  const body = [row('td', ['a', '6', 'offen']), row('td', ['b', '2', ''])];

  it('recomputes the calculated cells over the given rows and keeps ids', () => {
    const over = footerRowOver(footer, body);
    expect(over.id).toBe('f');
    expect(over.children.map((c) => (c as TElement).id)).toEqual(
      footer.children.map((c) => (c as TElement).id),
    );
    const text = (c: TElement) =>
      ((c.children[0] as TElement).children[0] as { text: string }).text;
    expect((over.children as TElement[]).map(text)).toEqual([
      'Summe',
      '8',
      '1',
    ]);
  });

  it('returns the same row when nothing changes', () => {
    const same = footerRowOver(footer, [
      row('td', ['a', '33,0', 'x']),
      ...Array.from({ length: 7 }, (_, i) => row('td', [String(i), '', 'y'])),
    ]);
    expect(same).toBe(footer);
  });
});

describe('bodyRowRange', () => {
  it('leaves out the header and the footer row', () => {
    const t = table([
      row('th', ['a']),
      row('td', ['1']),
      row('td', ['2']),
      row('td', ['Summe'], { footer: true }),
    ]);
    expect(bodyRowRange(t)).toEqual([1, 3]);
  });

  it('takes every row without header and footer', () => {
    expect(bodyRowRange(table([row('td', ['1']), row('td', ['2'])]))).toEqual([
      0, 2,
    ]);
  });
});

describe('sumUpdates', () => {
  const budget = (gesamt: string) =>
    table([
      row('th', ['Arbeitspaket', 'Budget', 'Status']),
      row('td', ['WP1', '180.000 €', 'im Plan']),
      row('td', ['WP2', '420.000 €', 'im Plan']),
      {
        type: 'tr',
        footer: true,
        children: [
          cell('td', 'Gesamt'),
          cell('td', gesamt, { calc: 'sum' }),
          cell('td', ''),
        ],
      } as TElement,
    ]);

  it('reports a sum cell whose text is out of date', () => {
    expect(sumUpdates(budget('0 €'))).toEqual([
      { row: 3, col: 1, text: '600.000 €' },
    ]);
  });

  it('reports nothing when the sum is current', () => {
    expect(sumUpdates(budget('600.000 €'))).toEqual([]);
  });

  it('reports nothing without a footer row', () => {
    const t = budget('0 €');
    delete (t.children[3] as TElement).footer;
    expect(sumUpdates(t)).toEqual([]);
  });

  it('updates every kind of calculated cell', () => {
    const t = table([
      row('th', ['Aufgabe', 'Aufwand (h)', 'Status']),
      row('td', ['a', '6', 'offen']),
      row('td', ['b', '2', '']),
      {
        type: 'tr',
        footer: true,
        children: [
          cell('td', '', { calc: 'count' }),
          cell('td', '', { calc: 'average' }),
          cell('td', 'alt', { calc: 'max' }),
        ],
      } as TElement,
    ]);
    expect(sumUpdates(t)).toEqual([
      { row: 3, col: 0, text: '2' },
      { row: 3, col: 1, text: '4,0' },
      { row: 3, col: 2, text: '' },
    ]);
  });

  it('empties a sum cell of a column without numbers', () => {
    const t = table([
      row('td', ['a', 'x']),
      {
        type: 'tr',
        footer: true,
        children: [cell('td', 'alt', { calc: 'sum' }), cell('td', '')],
      } as TElement,
    ]);
    expect(sumUpdates(t)).toEqual([{ row: 1, col: 0, text: '' }]);
  });
});
