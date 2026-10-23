import { useEffect, useRef, useState } from 'react';
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
  MenuTrigger,
} from '@plone/components';
import {
  ChevrondownIcon,
  CloseIcon,
  SearchIcon,
} from '@plone/components/Icons';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import checkSVG from '@plone/volto/icons/check.svg';
import { messages } from './messages';
import type { SearchItem } from './useNavigationTree';

interface NavigationTreeHeaderProps {
  siteTitle: string;
  workspaces: SearchItem[];
  activeWorkspace: SearchItem | undefined;
  isWorkspacesLoading: boolean;
}

export function NavigationTreeHeader({
  siteTitle,
  workspaces,
  activeWorkspace,
  isWorkspacesLoading,
}: NavigationTreeHeaderProps) {
  const intl = useIntl();
  const [query, setQuery] = useState('');
  const { contains } = useFilter({ sensitivity: 'base' });
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTitle = activeWorkspace ? activeWorkspace.title : siteTitle;
  const activeInitial = activeTitle?.[0]?.toUpperCase() ?? 'S';

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
    item: Pick<SearchItem, '@id' | 'title'>,
    isActive: boolean,
  ) => (
    <MenuItem
      key={item['@id']}
      href={flattenToAppURL(item['@id'])}
      textValue={item.title}
      className={cx('nav-tree-switcher-item', {
        'is-active': isActive,
      })}
    >
      <span className="nav-tree-switcher-avatar" aria-hidden>
        {item.title?.[0]?.toUpperCase() ?? 'W'}
      </span>
      <span className="nav-tree-switcher-item-title" title={item.title}>
        {item.title}
      </span>
      {isActive && (
        <Icon name={checkSVG} size="16px" className="nav-tree-switcher-check" />
      )}
    </MenuItem>
  );

  return (
    <MenuTrigger onOpenChange={(isOpen) => !isOpen && setQuery('')}>
      <Button className="navigation-tree-header">
        <div className="nav-tree-site-logo" aria-hidden>
          {activeInitial}
        </div>
        <div className="nav-tree-site-info">
          <span className="nav-tree-site-label">
            {intl.formatMessage(
              activeWorkspace ? messages.workspaceLabel : messages.portalLabel,
            )}
          </span>
          <span className="nav-tree-site-title" title={activeTitle}>
            {activeTitle}
          </span>
        </div>
        <ChevrondownIcon aria-hidden className="nav-tree-switcher-chevron" />
      </Button>
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
            placeholder={intl.formatMessage(
              messages.workspaceSearchPlaceholder,
            )}
          />
          {/* SearchField wires this Button up to clear the input. */}
          <Button aria-label={intl.formatMessage(messages.clearSearch)}>
            <CloseIcon aria-hidden />
          </Button>
        </SearchField>
        <Menu
          aria-label={intl.formatMessage(messages.workspaceSwitcherLabel)}
          className={cx('nav-tree-switcher-menu', {
            'is-scrolling': isScrolling,
          })}
          onScroll={onMenuScroll}
        >
          <MenuSection>
            <MenuSectionHeader className="nav-tree-switcher-section">
              {intl.formatMessage(messages.portalLabel)}
            </MenuSectionHeader>
            {renderItem({ '@id': '/', title: siteTitle }, !activeWorkspace)}
          </MenuSection>
          <MenuSection>
            <MenuSectionHeader className="nav-tree-switcher-section">
              {intl.formatMessage(
                query ? messages.workspaceMatches : messages.allWorkspaces,
                { count: filteredWorkspaces.length },
              )}
            </MenuSectionHeader>
            {filteredWorkspaces.map((item) =>
              renderItem(item, activeWorkspace?.['@id'] === item['@id']),
            )}
            {isWorkspacesLoading && (
              <MenuItem isDisabled className="nav-tree-switcher-item is-empty">
                <span className="nav-tree-switcher-item-title">
                  {intl.formatMessage(messages.loading)}
                </span>
              </MenuItem>
            )}
            {!isWorkspacesLoading && filteredWorkspaces.length === 0 && (
              <MenuItem isDisabled className="nav-tree-switcher-item is-empty">
                <span className="nav-tree-switcher-item-title">
                  {intl.formatMessage(messages.noWorkspaceFound)}
                </span>
              </MenuItem>
            )}
          </MenuSection>
        </Menu>
      </Autocomplete>
    </MenuTrigger>
  );
}

export default NavigationTreeHeader;
