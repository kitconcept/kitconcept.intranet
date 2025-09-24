import './theme/custom.scss';
import { ConfigType } from '@plone/registry';
import installSettings from './config/settings';
import installSlots from './config/slots';
import installWidgets from './config/widgets';
import installBlocks from './config/blocks';
import { defineMessages } from 'react-intl';

defineMessages({
  listDate: {
    id: 'List with date',
    defaultMessage: 'List with date',
  },
});

declare module '@plone/types' {
  export interface GetSiteResponse {
    'kitconcept.person_picture_aspect_ratio': 'rounded1to1' | 'squared4to5';
  }
}

const applyConfig = (config: ConfigType) => {
  installSettings(config);
  installSlots(config);
  installWidgets(config);
  installBlocks(config);
  (
    config.settings.solrSearchOptions as { showSearchInput?: boolean }
  ).showSearchInput = false;

  return config;
};

export default applyConfig;
