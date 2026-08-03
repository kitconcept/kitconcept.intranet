import type { ConfigType } from '@plone/registry';
import { ContentTypeCondition } from '@plone/volto/helpers/Slots';
import IntranetCSSInjector from '../slots/IntranetCSSInjector/IntranetCSSInjector';
import DocumentByLine from '../slots/DocumentByLine/DocumentByLine';
import AboutThisContent from '../slots/AboutThisContent/AboutThisContent';
import FollowUsLogoAndLinks from '../components/Footer/slots/FollowUsLogoAndLinks';
import ContentInteractions from '../components/ContentInteractions/ContentInteractions';
import StickyFeedbackButton from '../components/StickyFeedbackButton/StickyFeedbackButton';
import ListingDisclaimer from '../slots/ListingDisclaimer/ListingDisclaimer';
import NavigationTreePortal from '../components/NavigationTree/NavigationTreePortal';
import HideFooter from '../slots/HideFooter/HideFooter';

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
    slot: 'preFooter',
    name: 'AboutThisContent',
    component: AboutThisContent,
    predicates: [ContentTypeCondition(['Document', 'WikiPage', 'Workspace'])],
  });
  config.registerSlotComponent({
    slot: 'belowContent',
    name: 'Content Interactions',
    component: ContentInteractions,
    predicates: [
      ({ content }) =>
        !['Document', 'Event', 'News Item', 'WikiPage', 'Workspace'].includes(
          content?.['@type'],
        ),
    ],
  });
  config.registerSlotComponent({
    name: 'PostFooterFollowUsLogoAndLinks',
    slot: 'postFooter',
    component: FollowUsLogoAndLinks,
  });
  config.registerSlotComponent({
    name: 'ListingDisclaimer',
    slot: 'aboveListingItems',
    component: ListingDisclaimer,
  });
  config.registerSlotComponent({
    slot: 'aboveApp',
    name: 'NavigationTree2',
    component: NavigationTreePortal,
    predicates: [ContentTypeCondition(['WikiPage', 'Workspace'])],
  });
  config.registerSlotComponent({
    slot: 'aboveApp',
    name: 'HideFooter',
    component: HideFooter,
    predicates: [ContentTypeCondition(['WikiPage', 'Workspace'])],
  });

  return config;
}
