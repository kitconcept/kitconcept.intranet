import { useIntl } from 'react-intl';
import WorkspaceSelector from '../WorkspaceSelector/WorkspaceSelector';

type Workspace = { path: string; title: string };

export default function WorkspaceFilter({
  value,
  workspaces,
  disabled,
  onChange,
}: {
  value: string;
  workspaces: Workspace[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const intl = useIntl();
  const all = intl.formatMessage({
    id: 'All workspaces',
    defaultMessage: 'All workspaces',
  });
  return (
    <WorkspaceSelector
      label={intl.formatMessage({
        id: 'Workspace',
        defaultMessage: 'Workspace',
      })}
      selectedPath={value || null}
      selectedTitle={
        workspaces.find((item) => item.path === value)?.title || all
      }
      allLabel={all}
      workspaces={workspaces.map((item) => ({
        '@id': item.path,
        title: item.title,
      }))}
      disabled={disabled}
      onChange={(path) => onChange(path || '')}
    />
  );
}
