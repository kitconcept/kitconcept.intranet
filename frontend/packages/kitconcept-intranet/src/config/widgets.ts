import type { ConfigType } from '@plone/registry';
import InheritedFieldWrapper from '../components/widgets/InheritedFieldWrapper';
import ContentTypeWorkflow from '../components/widgets/ContentTypeWorkflow';

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
  config.widgets.id.responsibilities = config.widgets.widget.token;
  config.widgets.widget.contentTypeWorkflow = ContentTypeWorkflow;
  return config;
};

export default install;
