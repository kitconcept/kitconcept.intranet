import { defineMessages, type IntlShape } from 'react-intl';
import Indexes from '@plone/volto/constants/Indexes';
import { cellTypes, isEmptyValue } from './cellTypes';

// A table column shows one catalog metadata field of each item.
// A plain string is the metadata field name, e.g. `'Subject'`.
export type TableColumnConfig =
  | string
  | {
      // Metadata field, or several: the first one that is not empty is shown
      field: string | string[];
      // Header label (a message id). Defaults to Volto's label for the field.
      title?: string;
      // Key of `cellTypes`. Defaults to Volto's type for the field, or `string`.
      type?: string;
      // Used in the cell class name (`cell-id-<id>`), must be unique in the
      // table. Defaults to the first field.
      id?: string;
      // Keep the header label for screen readers only
      hideTitle?: boolean;
      // The column names the rows for screen readers (`<th scope="row">`)
      rowHeader?: boolean;
    };

export type TableColumn = {
  id: string;
  fields: string[];
  title: string;
  // Key of `cellTypes`, `string` when the configured type does not exist
  type: string;
  hideTitle: boolean;
  rowHeader: boolean;
};

// Volto's catalog metadata registry, the columns of the folder contents view
const volto_indexes: Record<string, { label: string; type: string }> = Indexes;

// Metadata fields of Volto's registry that editors cannot pick as columns
export const ignoredTableFields: string[] = [
  'sortable_title', // not metadata, the title column is always shown
  'portal_type', // the type id, `Type` shows its title
  'id',
  'UID',
  'is_folderish',
  'exclude_from_nav',
];

// Picked metadata fields shown from other fields or with another cell type
// than Volto's
export const tableFieldOverrides: Record<
  string,
  { field?: string | string[]; type?: string }
> = {
  // plone.restapi adds the translated type title to every item
  Type: { field: ['type_title', 'Type'] },
  Description: { type: 'smartText' },
};

// Columns shown first in every table, before the ones the editor picks
export const fixedTableColumns: TableColumnConfig[] = [
  {
    id: 'contentTypeIcon',
    field: '@type',
    title: 'Content type',
    type: 'contentTypeIcon',
    hideTitle: true,
  },
  // Items without a title show their id, like the summaries
  {
    id: 'title',
    field: ['title', 'id'],
    title: 'Title',
    type: 'link',
    rowHeader: true,
  },
];

// Columns of a table whose editor has not picked any
export const defaultTableFields: string[] = [
  'Creator',
  'Type',
  'ModificationDate',
];

// Header labels of the fixed columns, so that they get extracted for i18n
defineMessages({
  contentType: { id: 'Content type', defaultMessage: 'Content type' },
  title: { id: 'Title', defaultMessage: 'Title' },
});

export const getTableFieldChoices = (intl: IntlShape) =>
  Object.keys(volto_indexes)
    .filter((field) => !ignoredTableFields.includes(field))
    .map((field) => [
      field,
      intl.formatMessage({
        id: volto_indexes[field].label,
        defaultMessage: volto_indexes[field].label,
      }),
    ]);

export const normalizeColumn = (column: TableColumnConfig): TableColumn => {
  const config =
    typeof column === 'string'
      ? { id: column, field: column, ...tableFieldOverrides[column] }
      : column;
  const fields = Array.isArray(config.field) ? config.field : [config.field];
  const id = config.id ?? fields[0];
  const index = volto_indexes[id];
  const configuredType = config.type ?? index?.type;
  const type =
    configuredType && cellTypes[configuredType] ? configuredType : 'string';
  return {
    id,
    fields,
    title: config.title ?? index?.label ?? id,
    type,
    hideTitle: config.hideTitle ?? false,
    rowHeader: config.rowHeader ?? false,
  };
};

export const getTableColumns = (fields: string[] = defaultTableFields) =>
  [
    ...fixedTableColumns,
    ...[...new Set(fields)].filter(
      (field) => !ignoredTableFields.includes(field),
    ),
  ].map(normalizeColumn);

export const getCellValue = (item: any, column: TableColumn) => {
  const isEmpty = cellTypes[column.type].isEmpty ?? isEmptyValue;
  const field = column.fields.find((name) => !isEmpty(item[name]));
  return field ? item[field] : null;
};
