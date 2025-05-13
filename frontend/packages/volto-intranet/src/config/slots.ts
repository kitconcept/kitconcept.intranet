import { ConfigType } from '@plone/registry';
import CustomCSS from '../slots/CustomCSS/CustomCSS';

export default function install(config: ConfigType) {
  config.registerSlotComponent({
    slot: 'aboveHeader',
    name: 'CustomCSS',
    component: CustomCSS,
  });

  return config;
}
