import './theme/custom.scss';
import { ConfigType } from '@plone/registry';
import installSettings from './config/settings';
import installSlots from './config/slots';

type State = {
  site: { data: { 'collective.solr.active': boolean } };
};

declare module '@plone/types' {
  export interface GetSiteResponse {
    'kitconcept.intranet.custom_css': string;
  }
}

const applyConfig = (config: ConfigType) => {
  installSettings(config);
  installSlots(config);
  const solrSearchOptions = config.settings.solrSearchOptions as {
    showSearchInput?: boolean;
    isBackendAvailable?: (state: any) => boolean;
  };
  config.settings.solrSearchOptions = {
    ...solrSearchOptions,
    showSearchInput: false,
    isBackendAvailable: (state: State) =>
      !!state.site?.data?.['collective.solr.active'],
  };
  return config;
};

export default applyConfig;
