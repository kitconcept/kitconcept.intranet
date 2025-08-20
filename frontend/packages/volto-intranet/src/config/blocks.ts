import { ConfigType } from '@plone/registry';
import EventCalendarTemplate from '../components/Blocks/Listing/EventCalendarTemplate';

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

  return config;
}
