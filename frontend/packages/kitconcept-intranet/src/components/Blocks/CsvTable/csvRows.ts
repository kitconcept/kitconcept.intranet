/**
 * Pure helpers of the CSV table block: parsing a CSV file and turning its
 * rows into the table value the wiki renderer shows.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/751
 */
import Papa from 'papaparse';
import type { TElement } from 'platejs';

import {
  CSV_DELIMITERS,
  csvRowsToTable,
} from '../../WikiTable/wikiCsvPastePlugin';

/**
 * The rows of a CSV file, cells trimmed and every row padded to the width
 * of the widest row, or `null` when the file holds no row. Unlike a paste,
 * the file is known to be CSV, so uneven rows are kept.
 */
export function parseCsvFile(text: string): string[][] | null {
  const result = Papa.parse<string[]>(text.replace(/^﻿/, ''), {
    delimitersToGuess: CSV_DELIMITERS,
    skipEmptyLines: 'greedy',
  });
  const rows = result.data.filter((row) => row.some((cell) => cell.trim()));
  if (rows.length === 0) return null;
  const width = Math.max(...rows.map((row) => row.length));
  return rows.map((row) => {
    const cells = row.map((cell) => cell.trim());
    while (cells.length < width) cells.push('');
    return cells;
  });
}

/**
 * The table element for the rows, as the wiki renderer expects it: the
 * first row is the header row and every node has an id (the static table
 * looks cells up by id for their size, borders and sort button).
 */
export function csvTableValue(rows: string[][]): TElement[] {
  const table = csvRowsToTable({ getType: (key: string) => key }, rows);
  table.id = 'csv-table';
  (table.children as TElement[]).forEach((row, rowIndex) => {
    row.id = `csv-r${rowIndex}`;
    (row.children as TElement[]).forEach((cell, colIndex) => {
      cell.id = `csv-r${rowIndex}-c${colIndex}`;
      (cell.children[0] as TElement).id = `csv-r${rowIndex}-c${colIndex}-p`;
    });
  });
  return [table];
}
