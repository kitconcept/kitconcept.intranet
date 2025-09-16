import type { ConfigType } from '@plone/registry';
import CustomCSS from '../slots/CustomCSS/CustomCSS';
import DocumentByLine from '../slots/DocumentByLine/DocumentByLine';
import ConfigInjector from '../slots/ConfigInjector/ConfigInjector';
import FollowUsLogoAndLinks from '../components/Footer/slots/FollowUsLogoAndLinks';
import StickyFeedbackButton from '../components/StickyFeedbackButton/StickyFeedbackButton';

export default function install(config: ConfigType) {
  config.registerSlotComponent({
    slot: 'aboveHeader',
    name: 'ConfigInjector',
    component: ConfigInjector,
  });

  config.registerSlotComponent({
    slot: 'aboveHeader',
    name: 'CustomCSS',
    component: CustomCSS,
  });

  config.registerSlotComponent({
    name: 'StickyFeedbackButton',
    slot: 'aboveContent',
    component: StickyFeedbackButton,
  });
  config.registerSlotComponent({
    slot: 'belowContentTitle',
    name: 'documentByLine',
    component: DocumentByLine,
  });

  config.registerSlotComponent({
    name: 'PostFooterFollowUsLogoAndLinks',
    slot: 'postFooter',
    component: FollowUsLogoAndLinks,
  });

  return config;
}
