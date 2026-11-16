import { Button } from 'react-aria-components';
import { MenuTrigger } from '@plone/components';
import { ChevronDown } from 'lucide-react';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import globeSVG from '@plone/volto/icons/globe.svg';
import WorkspaceMarker from '../WorkspaceMarker/WorkspaceMarker';
import WorkspaceSwitcherMenu from '../WorkspaceSwitcher/WorkspaceSwitcherMenu';

type Props = {
  label: string;
  selectedPath: string | null;
  selectedTitle: string;
  allLabel: string;
  workspaces: { '@id': string; title: string }[];
  disabled?: boolean;
  isLoading?: boolean;
  onChange: (path: string | null) => void;
};

/** Workspace chip modeled after search, opening the shared workspace switcher menu. */
export default function WorkspaceSelector({
  label,
  selectedPath,
  selectedTitle,
  allLabel,
  workspaces,
  disabled,
  isLoading = false,
  onChange,
}: Props) {
  return (
    <MenuTrigger>
      <Button
        isDisabled={disabled}
        className={`header-search-chip workspace-selector${selectedPath ? ' is-active' : ''}`}
      >
        {selectedPath ? (
          <WorkspaceMarker title={selectedTitle} size={16} />
        ) : (
          <Icon name={globeSVG} size="14px" />
        )}
        <span
          className="workspace-selector-label"
          title={`${label}: ${selectedTitle}`}
        >
          {label}: {selectedTitle}
        </span>
        <ChevronDown aria-hidden="true" size={12} />
      </Button>
      <WorkspaceSwitcherMenu
        className="workspace-selector-menu"
        workspaces={workspaces}
        isLoading={isLoading}
        selectedId={selectedPath}
        ariaLabel={label}
        showPortal
        portalTitle={allLabel}
        portalIcon={<Icon name={globeSVG} size="18px" />}
        onSelect={onChange}
      />
    </MenuTrigger>
  );
}
