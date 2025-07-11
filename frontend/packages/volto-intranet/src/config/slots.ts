import { ConfigType } from '@plone/registry';
import CustomCSS from '../slots/CustomCSS/CustomCSS';
import DocumentByLine from '../slots/DocumentByLine/DocumentByLine';

export default function install(config: ConfigType) {
  config.registerSlotComponent({
    slot: 'aboveHeader',
    name: 'CustomCSS',
    component: CustomCSS,
  });
  config.registerSlotComponent({
    slot: 'belowContentTitle',
    name: 'documentByLine',
    component: DocumentByLine,
  });

  return config;
}
