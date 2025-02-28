import { ConfigType } from '@plone/registry';
import installSettings from './config/settings';

const applyConfig = (config: ConfigType) => {
  installSettings(config);

  return config;
};

export default applyConfig;
// asd
