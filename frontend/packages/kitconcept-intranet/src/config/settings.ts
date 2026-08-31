import type { ConfigType } from '@plone/registry';
import type { VLTSettings } from '@kitconcept/volto-light-theme/types';
import FeedBackForm from '../components/FeedBackForm/FeedBackForm';
import DocumentReviewPlug from '@kitconcept/intranet/components/Toolbar/DocumentReviewPlug';
import feedbackContactForm from '../reducers/feedbackContactForm/feedbackContactForm';
import Header from '../components/Header/Header';

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

  config.settings.appExtras = [
    ...config.settings.appExtras,
    { match: '/', component: DocumentReviewPlug, props: {} },
  ];

  config.settings.isMultilingual = false;
  config.settings.nonContentRoutes = nonContentRoutes;
  config.settings.defaultLanguage = process.env.SITE_DEFAULT_LANGUAGE || 'de';
  config.settings.supportedLanguages = ['de', 'en'];

  // Volto Light Theme Configuration
  config.registerUtility({
    name: 'workspaces',
    type: 'header',
    method: Header,
  });
  (config.settings.vlt as VLTSettings).components.header = 'workspaces';
  config.settings.intranetHeader = true;
  config.settings.siteLabel = 'Intranet';
  config.settings.displayLogout = false;

  config.settings.apiExpanders = [
    ...config.settings.apiExpanders,
    { match: '', GET_CONTENT: ['byline', 'clm'] },
  ];

  return config;
}
