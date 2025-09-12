import type { ConfigType } from '@plone/registry';
import type { apiExpandersType } from '@plone/types';

export default function install(config: ConfigType) {
  config.settings.isMultilingual = false;
  config.settings.defaultLanguage = process.env.SITE_DEFAULT_LANGUAGE || 'de';
  config.settings.supportedLanguages = ['de', 'en'];

  // Volto Light Theme Configuration
  config.settings.intranetHeader = true;
  config.settings.siteLabel = 'Intranet';

  const EXPANDERS_INHERIT_BEHAVIORS = 'kitconcept.blocks.config';

  config.settings.apiExpanders = [
    ...config.settings.apiExpanders,
    { match: '', GET_CONTENT: ['byline', 'lcm'] },
    {
      match: '',
      GET_CONTENT: ['inherit'],
      querystring: (config, querystring) => {
        if (querystring['expand.inherit.behaviors']) {
          return {
            'expand.inherit.behaviors': querystring[
              'expand.inherit.behaviors'
            ].concat(',', EXPANDERS_INHERIT_BEHAVIORS),
          };
        } else {
          return {
            'expand.inherit.behaviors': EXPANDERS_INHERIT_BEHAVIORS,
          };
        }
      },
    } as apiExpandersType,
  ];

  return config;
}
