import type { ConfigType } from '@plone/registry';
import installSettings from './config/settings';
import installSlots from './config/slots';
import installWidgets from './config/widgets';
import installBlocks from './config/blocks';
import PersonView from './components/theme/PersonView';
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
  config.views.contentTypesViews.Person = PersonView;
  return config;
};

export default applyConfig;
