import { ConfigType } from '@plone/registry';
import FeedBackForm from '../components/FeedBackForm';
import feedbackContactForm from '../reducers/feedbackContactForm/feedbackContactForm';
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
  config.settings.supportedLanguages = ['en'];
  config.settings.defaultLanguage = 'en';
  config.settings.nonContentRoutes = nonContentRoutes;
  // Volto Light Theme Configuration
  config.settings.intranetHeader = true;
  config.settings.siteLabel = 'Intranet';

  // Add byline expander
  config.settings.apiExpanders = [
    ...config.settings.apiExpanders,
    { match: '', GET_CONTENT: ['byline', 'lcm'] },
  ];

  return config;
}
