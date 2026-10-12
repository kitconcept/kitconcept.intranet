import type { ConfigType } from '@plone/registry';
import RssDefaultTemplate from '../components/Blocks/RSS/DefaultTemplate';
import RssGridTemplate from '../components/Blocks/RSS/GridTemplate';
import RssSummaryTemplate from '../components/Blocks/RSS/SummaryTemplate';
import type { StyleDefinition } from '@plone/types';
import EventCalendarTemplate from '../components/Blocks/Listing/EventCalendarTemplate';
import TableTemplate from '../components/Blocks/Listing/Table/TableTemplate';
import { tableColumnsSchemaEnhancer } from '../components/Blocks/Listing/Table/schema';
import { composeSchema } from '@plone/volto/helpers/Extensions';
import { ContactListStylingSchema } from '../components/Blocks/ContactList/schema';

declare module '@plone/types' {
  export interface BlocksConfigData {
    rssBlock: BlockConfigBase;
    contactList: BlockConfigBase;
  }

  export interface BlockConfigBase {
    themes?: StyleDefinition[];
    templates: {
      [key: string]: {
        label: string;
        template: any;
      };
    };
  }
}

export default function install(config: ConfigType) {
  const listingBlockVariations = [
    ...(config.blocks.blocksConfig.listing.variations || []),
    {
      id: 'listDate',
      title: 'List with date',
      template: EventCalendarTemplate,
    },
    {
      id: 'listingTable',
      title: 'Table',
      template: TableTemplate,
    },
  ].filter((variation) => !!variation);

  config.blocks.blocksConfig.listing = {
    ...config.blocks.blocksConfig.listing,
    variations: listingBlockVariations,
    schemaEnhancer: composeSchema(
      config.blocks.blocksConfig.listing.schemaEnhancer,
      tableColumnsSchemaEnhancer('variation'),
    ),
  };
  config.blocks.blocksConfig.search.schemaEnhancer = composeSchema(
    config.blocks.blocksConfig.search.schemaEnhancer,
    tableColumnsSchemaEnhancer('listingBodyTemplate'),
  );
  config.blocks.blocksConfig.rssBlock.templates = {
    default: {
      label: 'List',
      template: RssDefaultTemplate,
    },
    grid: {
      label: 'Grid',
      template: RssGridTemplate,
    },
    summary: {
      label: 'List with image',
      template: RssSummaryTemplate,
    },
  };

  config.blocks.blocksConfig.contactList.schemaEnhancer =
    ContactListStylingSchema;

  return config;
}
