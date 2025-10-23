import type { ConfigType } from '@plone/registry';
import IntranetCSSInjector from '../slots/IntranetCSSInjector/IntranetCSSInjector';
import DocumentByLine from '../slots/DocumentByLine/DocumentByLine';
import Rating from '../components/Rating/Rating';
import StickyFeedbackButton from '../components/StickyFeedbackButton/StickyFeedbackButton';

export default function install(config: ConfigType) {
  config.registerSlotComponent({
    slot: 'aboveHeader',
    name: 'IntranetCSSInjector',
    component: IntranetCSSInjector,
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
    slot: 'belowContent',
    name: 'Content Binder',
    component: Rating,
  });

  return config;
}
