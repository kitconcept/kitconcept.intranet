import { describe, expect, it } from 'vitest';
import type { TElement } from 'platejs';
import { csvTableValue, parseCsvFile } from './csvRows';

describe('parseCsvFile', () => {
  it('reads a semicolon file with a byte order mark and blank lines', () => {
    expect(parseCsvFile('﻿Name;Ort\r\nMiriam;Bonn\r\n\r\n')).toEqual([
      ['Name', 'Ort'],
      ['Miriam', 'Bonn'],
    ]);
  });

  it('pads short rows to the widest row', () => {
    expect(parseCsvFile('a,b,c\n1,2\n3,4,5,6')).toEqual([
      ['a', 'b', 'c', ''],
      ['1', '2', '', ''],
      ['3', '4', '5', '6'],
    ]);
  });

  it('accepts a single column', () => {
    expect(parseCsvFile('Zeile\neins\nzwei')).toEqual([
      ['Zeile'],
      ['eins'],
      ['zwei'],
    ]);
  });

  it('is null for an empty file', () => {
    expect(parseCsvFile('')).toBeNull();
    expect(parseCsvFile('\n \n')).toBeNull();
  });
});

describe('csvTableValue', () => {
  it('builds a table with a header row and ids on every node', () => {
    const [table] = csvTableValue([
      ['Name', 'Ort'],
      ['Miriam', 'Bonn'],
    ]);
    expect(table.type).toBe('table');
    expect(table.id).toBe('csv-table');
    const rows = table.children as TElement[];
    expect(rows.map((row) => row.id)).toEqual(['csv-r0', 'csv-r1']);
    expect(
      rows.map((row) => (row.children as TElement[]).map((cell) => cell.type)),
    ).toEqual([
      ['th', 'th'],
      ['td', 'td'],
    ]);
    expect(
      rows.map((row) => (row.children as TElement[]).map((cell) => cell.id)),
    ).toEqual([
      ['csv-r0-c0', 'csv-r0-c1'],
      ['csv-r1-c0', 'csv-r1-c1'],
    ]);
    expect((rows[1].children[0] as TElement).children[0]).toEqual({
      type: 'p',
      id: 'csv-r1-c0-p',
      children: [{ text: 'Miriam' }],
    });
  });
});
