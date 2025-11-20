import type { ConfigType } from '@plone/registry';
import RssDefaultTemplate from '../components/Blocks/RSS/DefaultTemplate';
import RssGridTemplate from '../components/Blocks/RSS/GridTemplate';
import RssSummaryTemplate from '../components/Blocks/RSS/SummaryTemplate';
import type { StyleDefinition } from '@plone/types';
import EventCalendarTemplate from '../components/Blocks/Listing/EventCalendarTemplate';
import SolrListingView from '../components/Blocks/SolrListing/View';
import SolrListingEdit from '../components/Blocks/SolrListing/Edit';
import searchSVG from '@plone/volto/icons/zoom-in.svg';

declare module '@plone/types' {
  export interface BlocksConfigData {
    rssBlock: BlockConfigBase;
    solr_listing: BlockConfigBase;
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
  ].filter((variation) => !!variation);

  config.blocks.blocksConfig.listing = {
    ...config.blocks.blocksConfig.listing,
    variations: listingBlockVariations,
  };
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

  config.blocks.blocksConfig.solr_listing = {
    title: 'Solr Listing',
    id: 'solr_listing',
    icon: searchSVG,
    view: SolrListingView,
    edit: SolrListingEdit,
    restricted: false,
    mostUsed: true,
    sidebarTab: 1,
  };
  return config;
}
