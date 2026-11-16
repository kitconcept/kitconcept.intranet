import { defineMessages, type IntlShape } from 'react-intl';
import { defaultTableFields, getTableFieldChoices } from './columns';

const messages = defineMessages({
  tableColumns: {
    id: 'Columns',
    defaultMessage: 'Columns',
  },
  tableColumnsDescription: {
    id: 'Content type and title are always shown.',
    defaultMessage: 'Content type and title are always shown.',
  },
});

// The columns field of a block that can show its items as a table, keyed by
// the block data field that selects the table: `variation` in the Listing
// block, `listingBodyTemplate` in the Search block.
export const tableColumnsSchemaEnhancer =
  (variationField: string) =>
  ({
    schema,
    formData,
    intl,
  }: {
    schema: any;
    formData?: Record<string, any>;
    intl: IntlShape;
  }) => {
    schema.properties.tableColumns = {
      title: intl.formatMessage(messages.tableColumns),
      description: intl.formatMessage(messages.tableColumnsDescription),
      type: 'array',
      widget: 'array',
      choices: getTableFieldChoices(intl),
      ...(formData?.tableColumns === undefined && {
        default: [...defaultTableFields],
      }),
    };

    if (formData?.[variationField] === 'listingTable') {
      const fields = schema.fieldsets[0].fields;
      fields.splice(fields.indexOf(variationField) + 1, 0, 'tableColumns');
    }

    return schema;
  };
