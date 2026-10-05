import { describe, expect, it } from 'vitest';
import {
  columnKind,
  filterRowIndices,
  parseDate,
  parseNumber,
  sortRowIndices,
} from './tableSort';

describe('parseNumber', () => {
  it('reads German numbers and amounts', () => {
    expect(parseNumber('1.455.000 €')).toBe(1455000);
    expect(parseNumber('922.500 €')).toBe(922500);
    expect(parseNumber('-3,5 %')).toBe(-3.5);
    expect(parseNumber('+12 %')).toBe(12);
    expect(parseNumber('120')).toBe(120);
    expect(parseNumber('1234.5')).toBe(1234.5);
  });
  it('rejects text and dates', () => {
    expect(parseNumber('im Plan')).toBeNull();
    expect(parseNumber('31.07.2026')).toBeNull();
    expect(parseNumber('')).toBeNull();
  });
});

describe('parseDate', () => {
  it('reads German and ISO dates', () => {
    expect(parseDate('31.07.2026')).toBe(Date.UTC(2026, 6, 31));
    expect(parseDate('1.2.26')).toBe(Date.UTC(2026, 1, 1));
    expect(parseDate('2026-07-31')).toBe(Date.UTC(2026, 6, 31));
  });
  it('rejects impossible dates and text', () => {
    expect(parseDate('31.02.2026')).toBeNull();
    expect(parseDate('KW 38')).toBeNull();
  });
});

describe('columnKind', () => {
  it('ignores empty cells', () => {
    expect(columnKind(['1.000 €', '', '20 €'])).toBe('number');
    expect(columnKind(['01.02.2026', '15.01.2026'])).toBe('date');
    expect(columnKind(['10', 'zehn'])).toBe('text');
    expect(columnKind(['', ''])).toBe('text');
  });
});

describe('sortRowIndices', () => {
  const rows = [
    ['Beta', '10', '15.01.2026'],
    ['alpha', '1.455.000 €', ''],
    ['Gamma', '20', '31.12.2025'],
    ['Äpfel', '', '01.02.2026'],
  ];
  it('sorts text with the German collator, case-insensitively', () => {
    expect(sortRowIndices(rows, 0, 'ascending')).toEqual([1, 3, 0, 2]);
    expect(sortRowIndices(rows, 0, 'descending')).toEqual([2, 0, 3, 1]);
  });
  it('sorts numbers numerically, empty cells last', () => {
    expect(sortRowIndices(rows, 1, 'ascending')).toEqual([0, 2, 1, 3]);
    expect(sortRowIndices(rows, 1, 'descending')).toEqual([1, 2, 0, 3]);
  });
  it('sorts dates chronologically, empty cells last', () => {
    expect(sortRowIndices(rows, 2, 'ascending')).toEqual([2, 0, 3, 1]);
  });
  it('is stable for equal values', () => {
    expect(sortRowIndices([['a'], ['b'], ['a']], 0, 'ascending')).toEqual([
      0, 2, 1,
    ]);
  });
});

describe('filterRowIndices', () => {
  const rows = [
    ['Dr. Miriam Engelhardt', 'DFNT', 'Koordination'],
    ['Dr. Clara Beck', 'TU Aachen', 'WP3'],
    ['Jonas Keller', 'Uni Leiden', 'WP5'],
  ];
  it('matches all words, case-insensitively, across cells', () => {
    expect(filterRowIndices(rows, 'aachen')).toEqual([1]);
    expect(filterRowIndices(rows, 'dr wp3')).toEqual([1]);
    expect(filterRowIndices(rows, 'DR')).toEqual([0, 1]);
    expect(filterRowIndices(rows, 'nichts')).toEqual([]);
  });
  it('an empty query keeps all rows', () => {
    expect(filterRowIndices(rows, '  ')).toEqual([0, 1, 2]);
  });
});
