import { ConfigType } from '@plone/registry';
import installSettings from './config/settings';
import installSlots from './config/slots';
import installBlocks from './config/blocks';

declare module '@plone/types' {
  export interface GetSiteResponse {
    'kitconcept.intranet.custom_css': string;
    'kitconcept.person_squared_images': boolean;
  }
}

const applyConfig = (config: ConfigType) => {
  installSettings(config);
  installSlots(config);
  installBlocks(config);
  return config;
};

export default applyConfig;
