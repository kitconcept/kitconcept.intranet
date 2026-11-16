import { describe, expect, it } from 'vitest';
import type { TElement } from 'platejs';
import { csvRowsToTable, parseCsvRows } from './wikiCsvPastePlugin';

describe('parseCsvRows', () => {
  it('reads a German CSV export with semicolons and a header row', () => {
    expect(
      parseCsvRows(
        'Arbeitspaket;Budget;Status\nWP1 Koordination;120000;im Plan\nWP2 Synthese;250000;verzögert\n',
      ),
    ).toEqual([
      ['Arbeitspaket', 'Budget', 'Status'],
      ['WP1 Koordination', '120000', 'im Plan'],
      ['WP2 Synthese', '250000', 'verzögert'],
    ]);
  });

  it('reads tab-separated text', () => {
    expect(parseCsvRows('Name\tOrt\nMiriam\tBonn\nSophie\tKöln')).toEqual([
      ['Name', 'Ort'],
      ['Miriam', 'Bonn'],
      ['Sophie', 'Köln'],
    ]);
  });

  it('reads comma-separated text with three or more columns', () => {
    expect(parseCsvRows('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('keeps delimiters inside quoted fields', () => {
    expect(
      parseCsvRows('Name;Bemerkung\n"Beck, Clara";"Kapitel 1; 2"\n'),
    ).toEqual([
      ['Name', 'Bemerkung'],
      ['Beck, Clara', 'Kapitel 1; 2'],
    ]);
  });

  it('trims the cells', () => {
    expect(parseCsvRows('Name ; Ort \n Miriam ;Bonn  ')).toEqual([
      ['Name', 'Ort'],
      ['Miriam', 'Bonn'],
    ]);
  });

  it('accepts Windows line ends, a byte order mark and blank lines', () => {
    expect(parseCsvRows('﻿a;b\r\n1;2\r\n\r\n3;4\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('is not a table: a single line', () => {
    expect(parseCsvRows('a;b;c')).toBeNull();
  });

  it('is not a table: prose with one comma per line', () => {
    expect(parseCsvRows('Hallo, Welt\nSchönen Tag, Miriam')).toBeNull();
  });

  it('is not a table: rows with different numbers of fields', () => {
    expect(parseCsvRows('a;b;c\n1;2\n3;4;5')).toBeNull();
  });

  it('is not a table: one column', () => {
    expect(parseCsvRows('Zeile eins\nZeile zwei\nZeile drei')).toBeNull();
  });

  it('is not a table: empty text', () => {
    expect(parseCsvRows('')).toBeNull();
    expect(parseCsvRows('\n\n')).toBeNull();
  });
});

describe('csvRowsToTable', () => {
  const editor = { getType: (key: string) => key };
  const text = (cell: TElement) =>
    ((cell.children[0] as TElement).children[0] as { text: string }).text;

  it('builds a table with a header row and one paragraph per cell', () => {
    const table = csvRowsToTable(editor, [
      ['Name', 'Ort'],
      ['Miriam', 'Bonn'],
    ]);
    expect(table.type).toBe('table');
    const [header, body] = table.children as TElement[];
    expect(header.type).toBe('tr');
    expect(header.children.map((cell) => (cell as TElement).type)).toEqual([
      'th',
      'th',
    ]);
    expect(header.children.map((cell) => text(cell as TElement))).toEqual([
      'Name',
      'Ort',
    ]);
    expect(body.children.map((cell) => (cell as TElement).type)).toEqual([
      'td',
      'td',
    ]);
    expect(body.children.map((cell) => text(cell as TElement))).toEqual([
      'Miriam',
      'Bonn',
    ]);
    expect((header.children[0] as TElement).children[0]).toEqual({
      type: 'p',
      children: [{ text: 'Name' }],
    });
  });
});
