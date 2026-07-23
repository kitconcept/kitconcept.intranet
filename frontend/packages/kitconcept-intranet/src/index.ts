import type { ConfigType } from '@plone/registry';
import installSettings from './config/settings';
import installSlots from './config/slots';
import installWidgets from './config/widgets';
import installBlocks from './config/blocks';
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
  // Solr facet labels
  organisationalUnit: {
    id: 'Organisational Unit',
    defaultMessage: 'Organisational Unit',
  },
  responsibilities: {
    id: 'Responsibilities',
    defaultMessage: 'Responsibilities',
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
