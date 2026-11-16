/**
 * Pastes CSV text as a wiki table.
 *
 * Plain text pasted into the editor is handled line by line by the markdown
 * and plain-text paste plugins. This plugin runs before them (Plate tries
 * the parsers of later plugins first) and claims the paste only when the
 * text is a table: at least two rows, at least two columns, every row with
 * the same number of fields, separated by semicolons, tabs or commas. The
 * first row becomes the header row, as in a table inserted from the menu.
 *
 * A comma also separates words in prose, so with commas three columns or
 * more are required. Pasted content that carries formatted HTML (Excel,
 * Confluence, web pages) is left to the HTML parsers; the plain HTML of a
 * code editor is ignored and the text is taken (see pasteFromCodeEditor.ts).
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/751
 */
import Papa from 'papaparse';
import { KEYS, type SlateEditor, type TElement } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

import { htmlIsPlainText } from './pasteFromCodeEditor';

/** Field separators that are tried, in this order. */
export const CSV_DELIMITERS = [';', '\t', ','];

/** A CSV table needs at least this many rows (header included). */
export const MIN_ROWS = 2;

/**
 * The rows of a CSV text, cells trimmed, or `null` when the text is not a
 * table.
 */
export function parseCsvRows(text: string): string[][] | null {
  const trimmed = text.replace(/^﻿/, '').trim();
  if (!trimmed.includes('\n')) return null;
  const result = Papa.parse<string[]>(trimmed, {
    delimitersToGuess: CSV_DELIMITERS,
    skipEmptyLines: 'greedy',
  });
  if (result.errors.length > 0) return null;
  const rows = result.data;
  if (rows.length < MIN_ROWS) return null;
  const columns = rows[0].length;
  if (columns < 2) return null;
  if (rows.some((row) => row.length !== columns)) return null;
  if (result.meta.delimiter === ',' && columns < 3) return null;
  return rows.map((row) => row.map((cell) => cell.trim()));
}

/** A table element from CSV rows: the first row is the header row. */
export function csvRowsToTable(
  editor: Pick<SlateEditor, 'getType'>,
  rows: string[][],
): TElement {
  const paragraph = editor.getType(KEYS.p);
  const cell = (type: string, text: string): TElement => ({
    type,
    children: [{ type: paragraph, children: [{ text }] }],
  });
  const row = (cellType: string, texts: string[]): TElement => ({
    type: editor.getType(KEYS.tr),
    children: texts.map((text) => cell(cellType, text)),
  });
  const [header, ...body] = rows;
  return {
    type: editor.getType(KEYS.table),
    children: [
      row(editor.getType(KEYS.th), header),
      ...body.map((texts) => row(editor.getType(KEYS.td), texts)),
    ],
  };
}

export const WikiCsvPastePlugin = createPlatePlugin({
  key: 'wikiCsvPaste',
}).extend(({ editor }) => ({
  parser: {
    format: 'text/plain',
    query: ({ data, dataTransfer }) =>
      htmlIsPlainText(dataTransfer.getData('text/html')) &&
      parseCsvRows(data) !== null,
    deserialize: ({ data }) => {
      const rows = parseCsvRows(data);
      if (!rows) return undefined;
      // Empty paragraphs around the table keep it out of the block the
      // caret is in and leave the caret below the table afterwards.
      const empty = (): TElement => ({
        type: editor.getType(KEYS.p),
        children: [{ text: '' }],
      });
      return [empty(), csvRowsToTable(editor, rows), empty()];
    },
  },
}));
