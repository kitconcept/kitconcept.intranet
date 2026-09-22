import type { ConfigType } from '@plone/registry';
import type { Content, GetSlotArgs, SlotPredicate } from '@plone/types';
import { ContentTypeCondition } from '@plone/volto/helpers/Slots';
import { getBaseUrl, isCmsUi } from '@plone/volto/helpers/Url/Url';
import IntranetCSSInjector from '../slots/IntranetCSSInjector/IntranetCSSInjector';
import DocumentByLine from '../slots/DocumentByLine/DocumentByLine';
import AboutThisContent from '../slots/AboutThisContent/AboutThisContent';
import ContentInteractions from '../components/ContentInteractions/ContentInteractions';
import StickyFeedbackButton from '../components/StickyFeedbackButton/StickyFeedbackButton';
import ListingDisclaimer from '../slots/ListingDisclaimer/ListingDisclaimer';
import NavigationTreePortal from '../components/NavigationTree/NavigationTreePortal';
import HideFooter from '../slots/HideFooter/HideFooter';
import CommentsSlot from '../slots/Comments/CommentsSlot';

const isWorkspaceDescendant = ({ content }: { content: Content }) =>
  Boolean(
    content?.['@components']?.inherit?.['kitconcept.plate.workspace']?.from?.[
      '@id'
    ],
  );

function isWorkspaceOrDescendant(contentTypes: string[]): SlotPredicate {
  const contentTypeCondition = ContentTypeCondition(contentTypes);
  return (args: GetSlotArgs) =>
    contentTypeCondition(args) || isWorkspaceDescendant(args);
}

function shouldShowContentInteractions(args: GetSlotArgs): boolean {
  return !isWorkspaceOrDescendant([
    'Document',
    'Event',
    'News Item',
    'WikiPage',
    'Workspace',
  ])(args);
}

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
    predicates: [
      ContentTypeCondition([
        'Document',
        'WikiPage',
        'Workspace',
        'Event',
        'News Item',
      ]),
    ],
  });
  config.registerSlotComponent({
    slot: 'preFooter',
    name: 'Comments',
    component: CommentsSlot,
    predicates: [
      ({ content, location }) => {
        const pathname = location.pathname;
        const contentPath = pathname === '/' ? '' : pathname;

        return (
          Boolean(content?.allow_discussion) &&
          !isCmsUi(pathname) &&
          getBaseUrl(pathname) === contentPath
        );
      },
    ],
  });
  config.registerSlotComponent({
    slot: 'belowContent',
    name: 'Content Interactions',
    component: ContentInteractions,
    predicates: [shouldShowContentInteractions],
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
    predicates: [isWorkspaceOrDescendant(['WikiPage', 'Workspace'])],
  });
  config.registerSlotComponent({
    slot: 'aboveApp',
    name: 'HideFooter',
    component: HideFooter,
    predicates: [isWorkspaceOrDescendant(['WikiPage', 'Workspace'])],
  });

  return config;
}
