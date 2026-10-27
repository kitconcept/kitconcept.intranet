import type { ConfigType } from '@plone/registry';
import installSettings from './config/settings';
import installSlots from './config/slots';
import installWidgets from './config/widgets';
import installBlocks from './config/blocks';
import installTasks from './config/tasks';
import installAiEdit from './config/aiEdit';
import PersonView from './components/theme/PersonView';
import PersonSummary from './components/Summary/PersonSummary';
import { defineMessages } from 'react-intl';
import PersonResultItem from './components/SolrSearch/resultItems/PersonResultItem';
import personSVG from '@plone/volto/icons/user.svg';

defineMessages({
  listDate: {
    id: 'List with date',
    defaultMessage: 'List with date',
  },
  listingTable: {
    id: 'Table',
    defaultMessage: 'Table',
  },
  // Solr facet labels
  organisationalUnit: {
    id: 'Organisational Unit',
    defaultMessage: 'Organisational Unit',
  },
  responsibilities: {
    id: 'Responsibilities',
    defaultMessage: 'Responsibilities',
  },
  // Solr facet field messages from @kitconcept/volto-solr, which ships no
  // translations for them:
  //   components/theme/SolrSearch/ShowMoreIndicator.jsx
  //   components/theme/SolrSearch/SearchConditionsFieldSearch.jsx
  showMore: {
    id: 'Show more',
    defaultMessage: 'Show more',
  },
  showLess: {
    id: 'Show less',
    defaultMessage: 'Show less',
  },
  search: {
    id: 'Search...',
    defaultMessage: 'Search...',
  },
  // Wiki table shadows (#655). The i18n extraction does not scan shadowed
  // files, so the messages of
  //   customizations/@kitconcept/volto-plate/plate/wiki/floating-toolbar-buttons.tsx
  //   customizations/@plone/plate/components/ui/table-node.tsx
  // are repeated here. Remove them once the shadows move to volto-plate.
  insertTable: {
    id: 'Insert table',
    defaultMessage: 'Insert table',
  },
  headerRow: {
    id: 'Header row',
    defaultMessage: 'Header row',
  },
  moveRowUp: {
    id: 'Move row up',
    defaultMessage: 'Move row up',
  },
  moveRowDown: {
    id: 'Move row down',
    defaultMessage: 'Move row down',
  },
  moveColumnLeft: {
    id: 'Move column left',
    defaultMessage: 'Move column left',
  },
  moveColumnRight: {
    id: 'Move column right',
    defaultMessage: 'Move column right',
  },
  // Slash menu shadow (#751):
  //   customizations/@kitconcept/volto-plate/plate/wiki/slash-menu.tsx
  csvTable: {
    id: 'CSV table',
    defaultMessage: 'CSV table',
  },
  // Table shadow (#750): customizations/@plone/plate/components/ui/table-node.tsx
  footerRow: {
    id: 'Footer row',
    defaultMessage: 'Footer row',
  },
  calculation: {
    id: 'Calculation',
    defaultMessage: 'Calculation',
  },
  none: {
    id: 'None',
    defaultMessage: 'None',
  },
  sum: {
    id: 'Sum',
    defaultMessage: 'Sum',
  },
  average: {
    id: 'Average',
    defaultMessage: 'Average',
  },
  minimum: {
    id: 'Minimum',
    defaultMessage: 'Minimum',
  },
  maximum: {
    id: 'Maximum',
    defaultMessage: 'Maximum',
  },
  count: {
    id: 'Count',
    defaultMessage: 'Count',
  },
});

declare module '@plone/types' {
  export interface GetSiteResponse {
    'kitconcept.person_picture_aspect_ratio': 'rounded1to1' | 'squared4to5';
  }
}

const applyConfig = (config: ConfigType) => {
  installSettings(config);
  installSlots(config);
  installWidgets(config);
  installBlocks(config);
  installTasks(config);
  installAiEdit(config);
  (
    config.settings.solrSearchOptions as { showSearchInput?: boolean }
  ).showSearchInput = false;

  config.views.contentTypesViews.Person = PersonView;
  config.registerComponent({
    name: 'Summary',
    component: PersonSummary,
    dependencies: ['Person'],
  });
  (
    config.settings.solrSearchOptions as {
      contentTypeSearchResultViews: Record<string, unknown>;
    }
  ).contentTypeSearchResultViews.Person = PersonResultItem;
  config.settings.contentIcons.Person = personSVG;

  // Empty search should show all results,
  // see https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/342
  (
    config.settings.solrSearchOptions as { doEmptySearch?: boolean }
  ).doEmptySearch = true;

  return config;
};

export default applyConfig;
