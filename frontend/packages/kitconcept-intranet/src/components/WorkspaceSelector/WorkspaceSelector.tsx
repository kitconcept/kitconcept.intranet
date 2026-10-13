import { Button } from 'react-aria-components';
import { Menu, MenuItem, MenuTrigger } from '@plone/components';
import { ChevronDown } from 'lucide-react';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import globeSVG from '@plone/volto/icons/globe.svg';
import checkSVG from '@plone/volto/icons/check.svg';
import WorkspaceMarker from '../WorkspaceMarker/WorkspaceMarker';

type Props = {
  label: string;
  selectedPath: string | null;
  selectedTitle: string;
  allLabel: string;
  allDescription?: string;
  workspaces: { path: string; title: string }[];
  disabled?: boolean;
  onChange: (path: string | null) => void;
};

/** Workspace chip modeled after search, with a keyboard-accessible menu. */
export default function WorkspaceSelector({
  label,
  selectedPath,
  selectedTitle,
  allLabel,
  allDescription,
  workspaces,
  disabled,
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
      <Menu
        className="header-search-chip-menu header-search-scope-menu"
        aria-label={label}
        onAction={(key) => onChange(key === 'all' ? null : String(key))}
      >
        <MenuItem
          id="all"
          textValue={allLabel}
          className="react-aria-MenuItem header-search-scope-item is-everywhere"
        >
          <Icon name={globeSVG} size="18px" />
          <span className="header-search-scope-text">
            {allLabel}
            {allDescription && (
              <span className="header-search-scope-hint">{allDescription}</span>
            )}
          </span>
          {!selectedPath && (
            <Icon
              name={checkSVG}
              size="16px"
              className="header-search-scope-check"
            />
          )}
        </MenuItem>
        {workspaces.map((item) => (
          <MenuItem
            key={item.path}
            id={item.path}
            textValue={item.title}
            className="react-aria-MenuItem header-search-scope-item"
          >
            <WorkspaceMarker title={item.title} />
            <span className="header-search-scope-text" title={item.title}>
              {item.title}
            </span>
            {selectedPath === item.path && (
              <Icon
                name={checkSVG}
                size="16px"
                className="header-search-scope-check"
              />
            )}
          </MenuItem>
        ))}
      </Menu>
    </MenuTrigger>
  );
}
