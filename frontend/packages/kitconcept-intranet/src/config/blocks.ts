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
import CsvTableEdit from '../components/Blocks/CsvTable/Edit';
import CsvTableView from '../components/Blocks/CsvTable/View';
import { CsvTableSchema } from '../components/Blocks/CsvTable/schema';
import tableSVG from '@plone/volto/icons/table.svg';

declare module '@plone/types' {
  export interface BlocksConfigData {
    rssBlock: BlockConfigBase;
    contactList: BlockConfigBase;
    csvtable: BlockConfigBase;
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
  const intranetListingVariations = [
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
  ];

  config.blocks.blocksConfig.listing = {
    ...config.blocks.blocksConfig.listing,
    variations: [
      ...(config.blocks.blocksConfig.listing.variations || []),
      ...intranetListingVariations,
    ].filter((variation) => !!variation),
    schemaEnhancer: composeSchema(
      config.blocks.blocksConfig.listing.schemaEnhancer,
      tableColumnsSchemaEnhancer('variation'),
    ),
  };

  // The Grid block keeps its own copy of the listing config (see
  // volto-light-theme's `config/blocks.tsx`), so it needs the same additions
  const gridListing = config.blocks.blocksConfig.gridBlock.blocksConfig.listing;
  config.blocks.blocksConfig.gridBlock.blocksConfig.listing = {
    ...gridListing,
    variations: [
      ...(gridListing.variations || []),
      ...intranetListingVariations,
    ].filter((variation) => !!variation),
    schemaEnhancer: composeSchema(
      gridListing.schemaEnhancer,
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

  // CSV table: a CSV file inside the intranet shown as a read-only wiki
  // table. A Plone block inside Wiki Pages only (inserted from the slash
  // menu, like the wiki image), hence `restricted`.
  // https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/751
  config.blocks.blocksConfig.csvtable = {
    id: 'csvtable',
    title: 'CSV table',
    icon: tableSVG,
    group: 'common',
    view: CsvTableView,
    edit: CsvTableEdit,
    blockSchema: CsvTableSchema,
    restricted: true,
    mostUsed: false,
    sidebarTab: 1,
    // Required by this package's own `BlockConfigBase` augmentation above.
    templates: {},
  };

  return config;
}
