import type { ConfigType } from '@plone/registry';
import InheritedFieldWrapper from '../components/widgets/InheritedFieldWrapper';

declare module '@plone/types' {
  export interface WidgetsConfigById {
    responsible_person: React.ComponentType;
  }
}

const install = (config: ConfigType) => {
  config.widgets.id.responsible_person = InheritedFieldWrapper(
    config.widgets.widget.autocomplete,
    (content: any, props: any) => content?.['@components']?.clm?.[props.id],
  );
  return config;
};

export default install;
