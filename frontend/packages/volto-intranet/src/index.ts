import type { ConfigType } from '@plone/registry';
import installSettings from './config/settings';
import installSlots from './config/slots';
import installWidgets from './config/widgets';
import installBlocks from './config/blocks';
import type { CustomInheritBehavior, BlocksConfigSettings } from './types';

declare module '@plone/types' {
  export interface GetSiteResponse {
    'kitconcept.intranet.custom_css': string;
    'kitconcept.person_squared_images': boolean;
  }

  export interface Expanders {
    inherit: {
      'kitconcept.blocks.config': CustomInheritBehavior<BlocksConfigSettings>;
    };
  }
}

const applyConfig = (config: ConfigType) => {
  installSettings(config);
  installSlots(config);
  installWidgets(config);
  installBlocks(config);
  return config;
};

export default applyConfig;
