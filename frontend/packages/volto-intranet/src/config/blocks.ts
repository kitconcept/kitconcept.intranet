import { ConfigType } from '@plone/registry';
import EventCalendarTemplate from '../components/Blocks/Listing/EventCalendarTemplate';

export default function install(config: ConfigType) {
  const listingBlockVariations = [
    ...(config.blocks.blocksConfig.listing.variations || []),
    {
      id: 'listDate',
      title: 'list with Date',
      template: EventCalendarTemplate,
    },
  ].filter((variation) => !!variation);

  config.blocks.blocksConfig.listing = {
    ...config.blocks.blocksConfig.listing,
    variations: listingBlockVariations,
  };

  config.blocks.blocksConfig.listing = {
    ...config.blocks.blocksConfig.listing,
    variations: listingBlockVariations,
  };
  return config;
}
