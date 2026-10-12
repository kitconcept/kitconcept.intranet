import { describe, expect, it } from 'vitest';
import {
  defaultTableFields,
  getCellValue,
  getTableColumns,
  getTableFieldChoices,
  ignoredTableFields,
  normalizeColumn,
} from './columns';

const intl = {
  formatMessage: ({ defaultMessage }: { defaultMessage: string }) =>
    defaultMessage,
} as any;

const dateColumn = normalizeColumn({
  field: ['start', 'effective', 'created'],
  type: 'date',
});

describe('getTableFieldChoices', () => {
  it("offers Volto's metadata fields with their labels", () => {
    const choices = getTableFieldChoices(intl);
    expect(choices).toContainEqual(['Creator', 'Creator']);
    expect(choices).toContainEqual(['ModificationDate', 'Last modified']);
    expect(choices).toContainEqual(['Subject', 'Tags']);
  });

  it('leaves out the ignored fields', () => {
    const fields = getTableFieldChoices(intl).map(([field]) => field);
    ignoredTableFields.forEach((field) => expect(fields).not.toContain(field));
  });

  it('offers all default fields', () => {
    const fields = getTableFieldChoices(intl).map(([field]) => field);
    defaultTableFields.forEach((field) => expect(fields).toContain(field));
  });
});

describe('getTableColumns', () => {
  it('shows the fixed columns and the default fields', () => {
    expect(
      getTableColumns().map(({ id, title, type }) => [id, title, type]),
    ).toEqual([
      ['contentTypeIcon', 'Content type', 'contentTypeIcon'],
      ['title', 'Title', 'link'],
      ['Creator', 'Creator', 'string'],
      ['Type', 'Type', 'string'],
      ['ModificationDate', 'Last modified', 'date'],
    ]);
  });

  it('shows the picked fields in their order, without ignored ones', () => {
    expect(
      getTableColumns(['Subject', 'UID', 'EffectiveDate']).map(({ id }) => id),
    ).toEqual(['contentTypeIcon', 'title', 'Subject', 'EffectiveDate']);
  });

  it('shows a field picked twice once', () => {
    expect(
      getTableColumns(['Creator', 'ModificationDate', 'ModificationDate']).map(
        ({ id }) => id,
      ),
    ).toEqual(['contentTypeIcon', 'title', 'Creator', 'ModificationDate']);
  });

  it('shows only the fixed columns when no field is picked', () => {
    expect(getTableColumns([]).map(({ id }) => id)).toEqual([
      'contentTypeIcon',
      'title',
    ]);
  });
});

describe('normalizeColumn', () => {
  it('takes label and type of a field name from Volto', () => {
    expect(normalizeColumn('Subject')).toMatchObject({
      id: 'Subject',
      fields: ['Subject'],
      title: 'Tags',
      type: 'array',
      hideTitle: false,
    });
  });

  it('falls back to the string cell type for unknown types', () => {
    const column = normalizeColumn({ field: 'location', type: 'missing' });
    expect(column.type).toBe('string');
  });

  it('shows descriptions with their links', () => {
    expect(normalizeColumn('Description').type).toBe('smartText');
  });

  it('falls back to the field name and the string type', () => {
    expect(normalizeColumn('head_title')).toMatchObject({
      id: 'head_title',
      fields: ['head_title'],
      title: 'head_title',
      type: 'string',
      hideTitle: false,
    });
  });
});

describe('getCellValue', () => {
  it('shows the translated type title in the Type column', () => {
    const column = normalizeColumn('Type');
    expect(column.title).toBe('Type');
    expect(getCellValue({ type_title: 'Seite', Type: 'Page' }, column)).toBe(
      'Seite',
    );
    expect(getCellValue({ Type: 'Page' }, column)).toBe('Page');
  });

  it('shows the first field that is not empty', () => {
    expect(
      getCellValue(
        {
          '@type': 'Event',
          start: '2026-11-03T09:00:00+00:00',
          effective: '2026-10-01T00:00:00+00:00',
        },
        dateColumn,
      ),
    ).toBe('2026-11-03T09:00:00+00:00');
    expect(
      getCellValue(
        { start: null, effective: '2026-10-01T00:00:00+00:00' },
        dateColumn,
      ),
    ).toBe('2026-10-01T00:00:00+00:00');
  });

  it('skips unset dates', () => {
    expect(
      getCellValue(
        {
          effective: '1969-12-31T00:00:00+00:00',
          created: '2026-09-01T00:00:00+00:00',
        },
        dateColumn,
      ),
    ).toBe('2026-09-01T00:00:00+00:00');
    expect(
      getCellValue(
        { ModificationDate: 'None' },
        normalizeColumn('ModificationDate'),
      ),
    ).toBeNull();
  });

  it('shows the id of items without a title', () => {
    const column = getTableColumns()[1];
    expect(getCellValue({ title: '', id: 'scan.pdf' }, column)).toBe(
      'scan.pdf',
    );
    expect(getCellValue({ title: 'Scan', id: 'scan.pdf' }, column)).toBe(
      'Scan',
    );
  });

  it('treats empty values as missing', () => {
    const column = normalizeColumn('Subject');
    expect(getCellValue({ Subject: [] }, column)).toBeNull();
    expect(getCellValue({ Subject: ['news'] }, column)).toEqual(['news']);
  });
});
