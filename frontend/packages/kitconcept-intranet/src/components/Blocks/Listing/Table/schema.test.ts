import { describe, expect, it } from 'vitest';
import { applySchemaDefaults } from '@plone/volto/helpers/Blocks/Blocks';
import { tableColumnsSchemaEnhancer } from './schema';
import { defaultTableFields } from './columns';

const intl = {
  formatMessage: ({ defaultMessage }: { defaultMessage: string }) =>
    defaultMessage,
} as any;

const schema = (fields: string[]) => ({
  fieldsets: [{ id: 'default', fields }],
  properties: {},
});

const listingEnhancer = tableColumnsSchemaEnhancer('variation');
const searchEnhancer = tableColumnsSchemaEnhancer('listingBodyTemplate');

// What Volto saves into the block data when the block is added, when its
// sidebar opens, and what it renders in the view
const withDefaults = (data: Record<string, any>) =>
  applySchemaDefaults({
    data,
    schema: listingEnhancer({
      schema: schema(['variation', 'headline']),
      formData: data,
      intl,
    }),
    intl,
  });

describe('tableColumnsSchemaEnhancer', () => {
  it('gives every new block the default columns, whatever the variation', () => {
    expect(withDefaults({}).tableColumns).toEqual(defaultTableFields);
    expect(withDefaults({ variation: 'summary' }).tableColumns).toEqual(
      defaultTableFields,
    );
  });

  it('keeps a saved selection, also an empty one', () => {
    expect(withDefaults({ tableColumns: ['Subject'] }).tableColumns).toEqual([
      'Subject',
    ]);
    expect(
      withDefaults({ tableColumns: ['Creator', 'ModificationDate'] })
        .tableColumns,
    ).toEqual(['Creator', 'ModificationDate']);
    expect(withDefaults({ tableColumns: [] }).tableColumns).toEqual([]);
  });

  it('gives each block its own copy of the defaults', () => {
    expect(withDefaults({}).tableColumns).not.toBe(defaultTableFields);
  });

  it('shows the field below the variation when the Listing block is a table', () => {
    const result = listingEnhancer({
      schema: schema(['variation', 'headline', 'querystring']),
      formData: { variation: 'listingTable' },
      intl,
    });
    expect(result.fieldsets[0].fields).toEqual([
      'variation',
      'tableColumns',
      'headline',
      'querystring',
    ]);
  });

  it('shows the field below the results template when the Search block is a table', () => {
    const result = searchEnhancer({
      schema: schema(['listingBodyTemplate', 'headline']),
      formData: { listingBodyTemplate: 'listingTable' },
      intl,
    });
    expect(result.fieldsets[0].fields).toEqual([
      'listingBodyTemplate',
      'tableColumns',
      'headline',
    ]);
  });

  it('hides the field for other variations', () => {
    const result = listingEnhancer({
      schema: schema(['variation', 'headline']),
      formData: { variation: 'summary' },
      intl,
    });
    expect(result.fieldsets[0].fields).toEqual(['variation', 'headline']);
    expect(result.properties.tableColumns).toBeDefined();
  });
});
