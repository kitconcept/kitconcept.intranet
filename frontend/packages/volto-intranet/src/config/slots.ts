import { ConfigType } from '@plone/registry';
import CustomCSS from '../slots/CustomCSS/CustomCSS';
import DocumentByLine from '../slots/DocumentByLine/DocumentByLine';
import StickyFeedbackButton from '../components/StickyFeedbackButton/StickyFeedbackButton';

export default function install(config: ConfigType) {
  config.registerSlotComponent({
    slot: 'aboveHeader',
    name: 'CustomCSS',
    component: CustomCSS,
  });
  config.registerSlotComponent({
    slot: 'belowContentTitle',
    name: 'documentByLine',
    component: DocumentByLine,
  });
  config.registerSlotComponent({
    name: 'PostFooterFollowUsLogoAndLinks',
    slot: 'headerTools',
    component: StickyFeedbackButton,
  });

  return config;
}
