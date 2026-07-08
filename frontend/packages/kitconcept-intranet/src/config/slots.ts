import type { ConfigType } from '@plone/registry';
import config from '@plone/volto/registry';
import IntranetCSSInjector from '../slots/IntranetCSSInjector/IntranetCSSInjector';
import DocumentByLine from '../slots/DocumentByLine/DocumentByLine';
import FollowUsLogoAndLinks from '../components/Footer/slots/FollowUsLogoAndLinks';
import ContentInteractions from '../components/ContentInteractions/ContentInteractions';
import StickyFeedbackButton from '../components/StickyFeedbackButton/StickyFeedbackButton';
import ListingDisclaimer from '../slots/ListingDisclaimer/ListingDisclaimer';
import NavigationTreePortal from '../components/NavigationTree/NavigationTreePortal';

const isNotSiteHome = ({ location }: { location?: { pathname?: string } }) => {
  const homePaths = [
    '/',
    ...(config.settings?.supportedLanguages ?? []).map(
      (lang: string) => `/${lang}`,
    ),
  ];
  return !homePaths.includes(location?.pathname ?? '');
};

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
    name: 'ListingDisclaimer',
    slot: 'aboveListingItems',
    component: ListingDisclaimer,
  });
  config.registerSlotComponent({
    slot: 'aboveApp',
    name: 'NavigationTree2',
    component: NavigationTreePortal,
    predicates: [isNotSiteHome],
  });

  return config;
}
