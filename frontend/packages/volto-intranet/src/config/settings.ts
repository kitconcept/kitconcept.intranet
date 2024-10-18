import { ConfigType } from '@plone/registry';

export default function install(config: ConfigType) {
  config.settings = {
    ...config.settings,
    isMultilingual: false,
    supportedLanguages: ['en'],
    defaultLanguage: 'en',
    // Volto Light Theme Configuration
    intranetHeader: true,
    siteLabel: 'Intranet',
  };
  // config.views.contentTypeSearchResultViews.Person = PersonResultItem;

  return config;
}
