/**
 * Sorting and filtering of wiki table rows in the view (client-side only,
 * never stored). Pure functions on the cell texts of the body rows.
 */

export type SortDirection = 'ascending' | 'descending';
export type ColumnKind = 'number' | 'date' | 'text';

const collator = new Intl.Collator('de', {
  numeric: true,
  sensitivity: 'base',
});

/**
 * A number in German notation, e.g. "1.455.000 €", "-3,5 %", "+12", or a
 * plain "1234.5". Returns null for anything else.
 */
export function parseNumber(text: string): number | null {
  const value = text
    .replace(/[\s ]/g, '')
    .replace(/(€|\$|%|EUR|CHF|USD)$/i, '')
    .replace(/^(€|\$)/, '');
  if (!value) return null;
  if (/^[+-]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(value)) {
    return Number(value.replace(/\./g, '').replace(',', '.'));
  }
  if (/^[+-]?\d+(,\d+)?$/.test(value)) return Number(value.replace(',', '.'));
  if (/^[+-]?\d*\.\d+$/.test(value)) return Number(value);
  return null;
}

/** A date like "31.07.2026", "1.2.26" or "2026-07-31". Returns a timestamp. */
export function parseDate(text: string): number | null {
  const value = text.trim();
  let match = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    const date = new Date(Date.UTC(year, Number(m) - 1, Number(d)));
    return date.getUTCDate() === Number(d) ? date.getTime() : null;
  }
  match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, y, m, d] = match;
    return Date.UTC(Number(y), Number(m) - 1, Number(d));
  }
  return null;
}

/** Number or date if every non-empty value is one, text otherwise. */
export function columnKind(values: string[]): ColumnKind {
  const filled = values.map((v) => v.trim()).filter(Boolean);
  if (filled.length === 0) return 'text';
  if (filled.every((v) => parseNumber(v) !== null)) return 'number';
  if (filled.every((v) => parseDate(v) !== null)) return 'date';
  return 'text';
}

/**
 * Order of the body rows (indices into `rows`) sorted by column `col`.
 * Stable; empty cells go last in both directions.
 */
export function sortRowIndices(
  rows: string[][],
  col: number,
  direction: SortDirection,
): number[] {
  const values = rows.map((row) => (row[col] ?? '').trim());
  const kind = columnKind(values);
  const key = (v: string): number | string | null =>
    !v
      ? null
      : kind === 'number'
        ? parseNumber(v)
        : kind === 'date'
          ? parseDate(v)
          : v;
  const keys = values.map(key);
  const sign = direction === 'ascending' ? 1 : -1;
  return rows
    .map((_row, index) => index)
    .sort((a, b) => {
      const ka = keys[a];
      const kb = keys[b];
      if (ka === null || kb === null) {
        return ka === kb ? a - b : ka === null ? 1 : -1;
      }
      const order =
        typeof ka === 'number' && typeof kb === 'number'
          ? ka - kb
          : collator.compare(String(ka), String(kb));
      return order !== 0 ? sign * order : a - b;
    });
}

const normalize = (text: string) =>
  text.toLocaleLowerCase('de').replace(/\s+/g, ' ').trim();

/**
 * Indices of the rows matching `query`: every word must occur somewhere in
 * the row (case-insensitive). An empty query matches all rows.
 */
export function filterRowIndices(rows: string[][], query: string): number[] {
  const words = normalize(query).split(' ').filter(Boolean);
  const all = rows.map((_row, index) => index);
  if (words.length === 0) return all;
  return all.filter((index) => {
    const text = normalize(rows[index].join(' '));
    return words.every((word) => text.includes(word));
  });
}
