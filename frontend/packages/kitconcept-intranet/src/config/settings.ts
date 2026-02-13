import type { ConfigType } from '@plone/registry';
import type { apiExpandersType } from '@plone/types';
import FeedBackForm from '../components/FeedBackForm/FeedBackForm';
import feedbackContactForm from '../reducers/feedbackContactForm/feedbackContactForm';
import ReturnToOriginalToast from '../components/ReturnToOriginalToast/ReturnToOriginalToast';

export default function install(config: ConfigType) {
  const nonContentRoutes = [
    ...config.settings.nonContentRoutes,
    '/feedback-form',
    /^.*\/feedback-form$/,
  ];
  config.addonRoutes = [
    ...config.addonRoutes,
    {
      path: ['/feedback-form', '/**/feedback-form'],
      component: FeedBackForm,
    },
  ];
  config.addonReducers = {
    ...config.addonReducers,
    feedbackContactForm,
  };
  config.settings.isMultilingual = false;
  config.settings.nonContentRoutes = nonContentRoutes;
  config.settings.defaultLanguage = process.env.SITE_DEFAULT_LANGUAGE || 'de';
  config.settings.supportedLanguages = ['de', 'en'];

  // Volto Light Theme Configuration
  config.settings.intranetHeader = true;
  config.settings.siteLabel = 'Intranet';
  config.settings.displayLogout = false;
  config.settings.appExtras = [
    ...config.settings.appExtras,
    {
      match: '/',
      component: ReturnToOriginalToast,
    },
  ];
  const EXPANDERS_INHERIT_BEHAVIORS = 'kitconcept.blocks.config';

  config.settings.apiExpanders = [
    ...config.settings.apiExpanders,
    { match: '', GET_CONTENT: ['byline', 'clm'] },
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
