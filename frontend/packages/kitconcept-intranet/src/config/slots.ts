import type { ConfigType } from '@plone/registry';
import IntranetCSSInjector from '../slots/IntranetCSSInjector/IntranetCSSInjector';
import DocumentByLine from '../slots/DocumentByLine/DocumentByLine';
import FollowUsLogoAndLinks from '../components/Footer/slots/FollowUsLogoAndLinks';
import ContentInteractions from '../components/ContentInteractions/ContentInteractions';
import StickyFeedbackButton from '../components/StickyFeedbackButton/StickyFeedbackButton';
import ResultsDisclamer from '../components/Blocks/Listing/ResultsDisclamer';

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
    name: 'Content Interactions',
    component: ContentInteractions,
  });
  config.registerSlotComponent({
    name: 'PostFooterFollowUsLogoAndLinks',
    slot: 'postFooter',
    component: FollowUsLogoAndLinks,
  });
  config.registerSlotComponent({
    name: 'ResultsDisclamer',
    slot: 'aboveListingItems',
    component: ResultsDisclamer,
  });

  return config;
}
