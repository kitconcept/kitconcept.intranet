/**
 * Footer row and column sums of wiki tables.
 *
 * A table's last row can be its footer row (`footer: true` on the row): it
 * is not sorted or filtered in the view and is styled like the header row.
 * A footer cell with `calc: 'sum'` shows the sum of the numbers in its
 * column (the body rows between header and footer); the editor writes the
 * sum into the cell whenever the table changes, so the stored page, the
 * view and the history diff hold the number as text.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/750
 */
import { NodeApi, type TElement } from 'platejs';

import { isHeaderRow } from './tableMoves';
import { parseNumber } from './tableSort';

export const FOOTER_KEY = 'footer';
export const CALC_KEY = 'calc';
export const CALC_SUM = 'sum';

export const isFooterRow = (row: TElement | undefined): boolean =>
  !!row && row[FOOTER_KEY] === true;

export const isSumCell = (cell: TElement | undefined): boolean =>
  !!cell && cell[CALC_KEY] === CALC_SUM;

/** The index range `[from, to)` of the body rows of a table. */
export function bodyRowRange(table: TElement): [number, number] {
  const rows = table.children as TElement[];
  const from = isHeaderRow(rows[0]) ? 1 : 0;
  const to = isFooterRow(rows.at(-1)) ? rows.length - 1 : rows.length;
  return [from, Math.max(from, to)];
}

/** The decimals the value is written with ("12,50 €" → 2, "180.000" → 0). */
function decimalsOf(value: string): number {
  const digits = value.replace(/[\s ]/g, '').replace(/[^\d.,]+$/, '');
  const match = digits.match(/[,.](\d+)$/);
  if (!match) return 0;
  // "1.455.000": groups of three after a point are thousands, not decimals.
  if (!digits.includes(',') && /^[+-]?\d{1,3}(\.\d{3})+$/.test(digits)) {
    return 0;
  }
  return match[1].length;
}

/**
 * The sum of the numbers among `values`, written like them: German
 * grouping and decimals when the values use them, the common unit (€, %,
 * …) kept. `null` when none of the values is a number.
 */
export function formatSum(values: string[]): string | null {
  const numbers = values
    .map((value) => parseNumber(value))
    .filter((number): number is number => number !== null);
  if (numbers.length === 0) return null;
  const sum = numbers.reduce((total, number) => total + number, 0);
  const numeric = values.filter((value) => parseNumber(value) !== null);
  const decimals = Math.max(...numeric.map(decimalsOf));
  const grouped = numeric.some((value) =>
    /\d[.\s ]\d{3}(\D|$)/.test(value.replace(/,\d+$/, '')),
  );
  const unit = commonUnit(numeric);
  const text = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouped,
  }).format(sum);
  return unit ? `${text}${unit}` : text;
}

/** The suffix (e.g. " €", " %") all numeric values share, or "". */
function commonUnit(values: string[]): string {
  const suffixes = values.map(
    (value) => value.match(/(\s*(€|\$|%|EUR|CHF|USD))$/i)?.[1] ?? '',
  );
  const first = suffixes[0] ?? '';
  return suffixes.every((suffix) => suffix === first) ? first : '';
}

export type SumUpdate = { row: number; col: number; text: string };

/**
 * The sum cells of the table's footer row whose text is out of date, with
 * the text they should show.
 */
export function sumUpdates(table: TElement): SumUpdate[] {
  const rows = table.children as TElement[];
  const footer = rows.at(-1);
  if (!isFooterRow(footer)) return [];
  const [from, to] = bodyRowRange(table);
  const updates: SumUpdate[] = [];
  (footer!.children as TElement[]).forEach((cell, col) => {
    if (!isSumCell(cell)) return;
    const values = rows
      .slice(from, to)
      .map((row) =>
        NodeApi.string((row.children as TElement[])[col] ?? { text: '' }),
      );
    const text = formatSum(values) ?? '';
    if (NodeApi.string(cell) !== text) {
      updates.push({ row: rows.length - 1, col, text });
    }
  });
  return updates;
}
