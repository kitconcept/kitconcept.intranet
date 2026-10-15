/**
 * Footer row and column calculations of wiki tables.
 *
 * A table's last row can be its footer row (`footer: true` on the row): it
 * is not sorted or filtered in the view and is styled like the header row.
 * A footer cell with a `calc` (`sum`, `average`, `min`, `max` or `count`)
 * shows that calculation over its column (the body rows between header and
 * footer); the editor writes the result into the cell whenever the table
 * changes, so the stored page, the view and the history diff hold it as
 * text.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/750
 */
import { NodeApi, type TElement } from 'platejs';

import { isHeaderRow } from './tableMoves';
import { parseDate, parseNumber } from './tableSort';

/** Appended to a result when non-empty cells could not be used. */
const skippedNote = (skipped: number) =>
  skipped > 0 ? ` (${skipped} übersprungen)` : '';

export const FOOTER_KEY = 'footer';
export const CALC_KEY = 'calc';
export const CALC_SUM = 'sum';

/** The calculations a footer cell can show, in menu order. */
export const CALC_KINDS = ['sum', 'average', 'min', 'max', 'count'] as const;
export type CalcKind = (typeof CALC_KINDS)[number];

export const isFooterRow = (row: TElement | undefined): boolean =>
  !!row && row[FOOTER_KEY] === true;

/** The calculation of a footer cell, or `null`. */
export const calcOf = (cell: TElement | undefined): CalcKind | null => {
  const kind = cell?.[CALC_KEY];
  return CALC_KINDS.includes(kind as CalcKind) ? (kind as CalcKind) : null;
};

export const isSumCell = (cell: TElement | undefined): boolean =>
  calcOf(cell) === CALC_SUM;

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
 * `result` written like the numeric `values` of its column: German grouping
 * and decimals when the values use them (plus `extraDecimals`), the common
 * unit (€, %, …) kept.
 */
function formatLike(
  result: number,
  numeric: string[],
  extraDecimals = 0,
): string {
  const decimals = Math.max(...numeric.map(decimalsOf)) + extraDecimals;
  const grouped = numeric.some((value) =>
    /\d[.\s ]\d{3}(\D|$)/.test(value.replace(/,\d+$/, '')),
  );
  const unit = commonUnit(numeric);
  const text = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouped,
  }).format(result);
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

/**
 * The sum of the numbers among `values`, written like them. `null` when
 * none of the values is a number.
 */
export function formatSum(values: string[]): string | null {
  return formatCalc('sum', values);
}

/**
 * The calculation `kind` over `values`: sum and average written like the
 * numbers (the average with one more decimal), min and max as the cell
 * text of the smallest or largest value (numbers, or dates in a date
 * column), count as the number of non-empty cells. Non-empty cells that
 * cannot be used are skipped and the result says how many. `null` when
 * the calculation has nothing to work on.
 */
export function formatCalc(kind: CalcKind, values: string[]): string | null {
  const filled = values.filter((value) => value.trim() !== '');
  if (kind === 'count') {
    return filled.length > 0 ? String(filled.length) : null;
  }
  // A date column: more cells read as dates than as numbers (a stray text
  // cell does not make it a text column).
  const dates =
    (kind === 'min' || kind === 'max') &&
    filled.filter((value) => parseDate(value) !== null).length >
      filled.filter((value) => parseNumber(value) !== null).length;
  const parse = dates ? parseDate : parseNumber;
  const usable = filled.filter((value) => parse(value) !== null);
  const numbers = usable.map((value) => parse(value) as number);
  if (numbers.length === 0) return null;
  const note = skippedNote(filled.length - usable.length);
  switch (kind) {
    case 'sum':
      return (
        formatLike(
          numbers.reduce((total, number) => total + number, 0),
          usable,
        ) + note
      );
    case 'average':
      return (
        formatLike(
          numbers.reduce((total, number) => total + number, 0) / numbers.length,
          usable,
          1,
        ) + note
      );
    case 'min':
      return usable[numbers.indexOf(Math.min(...numbers))].trim() + note;
    case 'max':
      return usable[numbers.indexOf(Math.max(...numbers))].trim() + note;
  }
}

/** Cell texts of column `col` of `rows`. */
const columnTexts = (rows: TElement[], col: number): string[] =>
  rows.map((row) =>
    NodeApi.string((row.children as TElement[])[col] ?? { text: '' }),
  );

/**
 * A copy of the footer row whose calculated cells show the results over
 * `bodyRows` (for the view, where a filter hides rows: the results then
 * cover the visible rows). Cells without a calculation are kept as they
 * are; ids are kept, so the static renderer treats the copy as the same
 * row.
 */
export function footerRowOver(
  footer: TElement,
  bodyRows: TElement[],
): TElement {
  let changed = false;
  const children = (footer.children as TElement[]).map((cell, col) => {
    const kind = calcOf(cell);
    if (!kind) return cell;
    const text = formatCalc(kind, columnTexts(bodyRows, col)) ?? '';
    if (NodeApi.string(cell) === text) return cell;
    changed = true;
    const paragraph = cell.children[0] as TElement;
    return {
      ...cell,
      children: [{ ...paragraph, children: [{ text }] }],
    };
  });
  return changed ? { ...footer, children } : footer;
}

export type SumUpdate = { row: number; col: number; text: string };

/**
 * The calculated cells of the table's footer row whose text is out of
 * date, with the text they should show.
 */
export function sumUpdates(table: TElement): SumUpdate[] {
  const rows = table.children as TElement[];
  const footer = rows.at(-1);
  if (!isFooterRow(footer)) return [];
  const [from, to] = bodyRowRange(table);
  const updates: SumUpdate[] = [];
  (footer!.children as TElement[]).forEach((cell, col) => {
    const kind = calcOf(cell);
    if (!kind) return;
    const text = formatCalc(kind, columnTexts(rows.slice(from, to), col)) ?? '';
    if (NodeApi.string(cell) !== text) {
      updates.push({ row: rows.length - 1, col, text });
    }
  });
  return updates;
}
