import { describe, expect, it } from 'vitest';
import type { TElement } from 'platejs';
import { bodyRowRange, formatSum, sumUpdates } from './tableCalc';

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
    expect(formatSum(['10 %', 'n/a', '5'])).toBe('15');
    expect(formatSum(['10 %', '', '5 %'])).toBe('15 %');
  });

  it('is null without numbers', () => {
    expect(formatSum(['im Plan', ''])).toBeNull();
    expect(formatSum([])).toBeNull();
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
