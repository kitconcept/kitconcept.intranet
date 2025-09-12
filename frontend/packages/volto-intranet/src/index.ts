import type { ConfigType } from '@plone/registry';
import installSettings from './config/settings';
import installSlots from './config/slots';
import installWidgets from './config/widgets';
import installBlocks from './config/blocks';
import type { CustomInheritBehavior, BlocksConfigSettings } from './types';
import { defineMessages } from 'react-intl';

declare module '@plone/types' {
  export interface GetSiteResponse {
    'kitconcept.intranet.custom_css': string;
    'kitconcept.person_picture_aspect_ratio': 'rounded1to1' | 'squared4to5';
  }

  export interface Expanders {
    inherit: {
      'kitconcept.blocks.config': CustomInheritBehavior<BlocksConfigSettings>;
    };
  }
}
defineMessages({
  FollowUs: {
    id: 'Follow Us',
    defaultMessage: 'Follow Us',
  },
  FollowUsBlock: {
    id: 'Follow Us Block',
    defaultMessage: 'Follow Us Block',
  },
});

const applyConfig = (config: ConfigType) => {
  installSettings(config);
  installSlots(config);
  installWidgets(config);
  installBlocks(config);
  return config;
};

export default applyConfig;
