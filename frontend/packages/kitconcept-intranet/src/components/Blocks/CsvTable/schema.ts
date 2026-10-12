import { defineMessages } from 'react-intl';
import type { BlockSchemaArgs, JSONSchema } from '@plone/types';

const messages = defineMessages({
  csvTable: { id: 'CSV table', defaultMessage: 'CSV table' },
  csvFile: { id: 'CSV file', defaultMessage: 'CSV file' },
  csvFileDescription: {
    id: 'A CSV file inside the intranet. Pick it with the browse button or paste its address.',
    defaultMessage:
      'A CSV file inside the intranet. Pick it with the browse button or paste its address.',
  },
});

/**
 * Sidebar form of the CSV table block: the file to show. Volto's URL widget
 * offers the object browser next to the text field, so the file can be
 * picked inside the intranet or its address pasted.
 */
export function CsvTableSchema({ intl }: BlockSchemaArgs = {}): JSONSchema {
  const t = (message: { id: string; defaultMessage: string }) =>
    intl ? intl.formatMessage(message) : message.defaultMessage;
  return {
    title: t(messages.csvTable),
    fieldsets: [{ id: 'default', title: 'Default', fields: ['url'] }],
    properties: {
      url: {
        title: t(messages.csvFile),
        description: t(messages.csvFileDescription),
        widget: 'url',
      },
    },
    required: ['url'],
  };
}
