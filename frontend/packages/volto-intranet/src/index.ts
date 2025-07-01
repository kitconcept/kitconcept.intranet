import './theme/custom.scss';
import { ConfigType } from '@plone/registry';
import installSettings from './config/settings';
import installSlots from './config/slots';

declare module '@plone/types' {
  export interface GetSiteResponse {
    'kitconcept.intranet.custom_css': string;
  }
}

const applyConfig = (config: ConfigType) => {
  installSettings(config);
  installSlots(config);
  (
    config.settings.solrSearchOptions as { showSearchInput?: boolean }
  ).showSearchInput = false;
  return config;
};

export default applyConfig;
