import installSettings from './config/settings';

const applyConfig = (config) => {
  installSettings(config);

  return config;
};

export default applyConfig;
