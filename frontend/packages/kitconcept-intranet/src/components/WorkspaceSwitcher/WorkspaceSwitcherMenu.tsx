import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useIntl } from 'react-intl';
import cx from 'classnames';
import {
  Autocomplete,
  Input,
  SearchField,
  useFilter,
} from 'react-aria-components';
import {
  Button,
  Menu,
  MenuItem,
  MenuSection,
  MenuSectionHeader,
} from '@plone/components';
import { CloseIcon, SearchIcon } from '@plone/components/Icons';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import checkSVG from '@plone/volto/icons/check.svg';
import { messages } from '../NavigationTree/messages';
import WorkspaceMarker from '../WorkspaceMarker/WorkspaceMarker';

type Workspace = { '@id': string; title: string };

const PORTAL_KEY = '__portal__';

interface WorkspaceSwitcherMenuProps {
  workspaces: Workspace[];
  isLoading: boolean;
  /** '@id' of the selected workspace; null selects the portal row. */
  selectedId: string | null;
  /** Overrides the portal row's checkmark, when selection is not just "no workspace". */
  isPortalSelected?: boolean;
  /** Render the top portal row (the site, or "All workspaces" in filters). */
  showPortal: boolean;
  portalTitle: string;
  portalSectionLabel?: string;
  /** Second line under the portal row title, e.g. "Search in all areas". */
  portalDescription?: string;
  /** Defaults to a marker of the portal title; pass null for no icon. */
  portalIcon?: ReactNode;
  /** Select instead of navigate: called with the '@id', or null for the portal row. */
  onSelect?: (id: string | null) => void;
  /** Accessible name of the menu; defaults to the sidebar's switcher label. */
  ariaLabel?: string;
  className?: string;
}

/** Searchable workspace list shared by the sidebar switcher and the workspace filters. */
export default function WorkspaceSwitcherMenu({
  workspaces,
  isLoading,
  selectedId,
  isPortalSelected = !selectedId,
  showPortal,
  portalTitle,
  portalSectionLabel,
  portalDescription,
  portalIcon,
  onSelect,
  ariaLabel,
  className,
}: WorkspaceSwitcherMenuProps) {
  const intl = useIntl();
  const [query, setQuery] = useState('');
  const { contains } = useFilter({ sensitivity: 'base' });
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Portal stays visible while searching, so only workspaces are filtered.
  const filteredWorkspaces = workspaces.filter((item) =>
    contains(item.title ?? '', query),
  );

  // The scrollbar is only shown while the list is being scrolled.
  const onMenuScroll = () => {
    setIsScrolling(true);
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 800);
  };

  useEffect(
    () => () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    },
    [],
  );

  const renderItem = (
    id: string,
    title: string,
    isActive: boolean,
    icon: ReactNode,
    description?: string,
  ) => (
    <MenuItem
      key={id}
      id={id}
      href={onSelect ? undefined : flattenToAppURL(id)}
      textValue={title}
      className={cx('nav-tree-switcher-item', {
        'is-active': isActive,
      })}
    >
      {icon}
      <span
        className="nav-tree-switcher-item-title"
        title={description ? `${title} – ${description}` : title}
      >
        {title}
        {description && (
          <span className="nav-tree-switcher-item-description">
            {description}
          </span>
        )}
      </span>
      {isActive && (
        <Icon name={checkSVG} size="16px" className="nav-tree-switcher-check" />
      )}
    </MenuItem>
  );

  return (
    <Autocomplete inputValue={query} onInputChange={setQuery}>
      <SearchField
        className="nav-tree-switcher-search"
        aria-label={intl.formatMessage(messages.workspaceSearchPlaceholder)}
        // Focus the search when the dropdown opens, so typing filters right away.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
      >
        <SearchIcon aria-hidden />
        <Input
          placeholder={intl.formatMessage(messages.workspaceSearchPlaceholder)}
        />
        {/* SearchField wires this Button up to clear the input. */}
        <Button aria-label={intl.formatMessage(messages.clearSearch)}>
          <CloseIcon aria-hidden />
        </Button>
      </SearchField>
      <Menu
        aria-label={
          ariaLabel ?? intl.formatMessage(messages.workspaceSwitcherLabel)
        }
        className={cx('nav-tree-switcher-menu', className, {
          'is-scrolling': isScrolling,
        })}
        onScroll={onMenuScroll}
        onAction={
          onSelect &&
          ((key) => onSelect(key === PORTAL_KEY ? null : String(key)))
        }
      >
        {showPortal && (
          <MenuSection>
            {portalSectionLabel && (
              <MenuSectionHeader className="nav-tree-switcher-section">
                {portalSectionLabel}
              </MenuSectionHeader>
            )}
            {renderItem(
              onSelect ? PORTAL_KEY : '/',
              portalTitle,
              isPortalSelected,
              portalIcon === undefined ? (
                <WorkspaceMarker title={portalTitle} size={20} />
              ) : (
                portalIcon
              ),
              portalDescription,
            )}
          </MenuSection>
        )}
        <MenuSection>
          <MenuSectionHeader className="nav-tree-switcher-section">
            {intl.formatMessage(
              query ? messages.workspaceMatches : messages.allWorkspaces,
              { count: filteredWorkspaces.length },
            )}
          </MenuSectionHeader>
          {filteredWorkspaces.map((item) =>
            renderItem(
              item['@id'],
              item.title,
              selectedId === item['@id'],
              <WorkspaceMarker title={item.title} size={20} />,
            ),
          )}
          {isLoading && (
            <MenuItem isDisabled className="nav-tree-switcher-item is-empty">
              <span className="nav-tree-switcher-item-title">
                {intl.formatMessage(messages.loading)}
              </span>
            </MenuItem>
          )}
          {!isLoading && filteredWorkspaces.length === 0 && (
            <MenuItem isDisabled className="nav-tree-switcher-item is-empty">
              <span className="nav-tree-switcher-item-title">
                {intl.formatMessage(messages.noWorkspaceFound)}
              </span>
            </MenuItem>
          )}
        </MenuSection>
      </Menu>
    </Autocomplete>
  );
}
