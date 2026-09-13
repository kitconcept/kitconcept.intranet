import { useIntl } from 'react-intl';
import cx from 'classnames';
import { Button, Menu, MenuItem, MenuTrigger } from '@plone/components';
import { ChevrondownIcon } from '@plone/components/Icons';
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
  const activeTitle = activeWorkspace ? activeWorkspace.title : siteTitle;
  const activeInitial = activeTitle?.[0]?.toUpperCase() ?? 'S';

  const switcherItems = [{ '@id': '/', title: siteTitle }, ...workspaces];

  return (
    <MenuTrigger>
      <Button className="navigation-tree-header">
        <div className="nav-tree-site-logo" aria-hidden>
          {activeInitial}
        </div>
        <div className="nav-tree-site-info">
          <span className="nav-tree-site-label">
            {intl.formatMessage(messages.siteLabel)}
          </span>
          <span className="nav-tree-site-title">{activeTitle}</span>
        </div>
        <ChevrondownIcon aria-hidden className="nav-tree-switcher-chevron" />
      </Button>
      <Menu
        aria-label={intl.formatMessage(messages.workspaceSwitcherLabel)}
        className="nav-tree-switcher-menu"
      >
        {switcherItems.map((item) => {
          const isActive =
            item['@id'] === '/'
              ? !activeWorkspace
              : activeWorkspace?.['@id'] === item['@id'];
          return (
            <MenuItem
              key={item['@id']}
              href={flattenToAppURL(item['@id'])}
              className={cx('nav-tree-switcher-item', {
                'is-active': isActive,
              })}
            >
              <span className="nav-tree-switcher-avatar" aria-hidden>
                {item.title?.[0]?.toUpperCase() ?? 'W'}
              </span>
              <span className="nav-tree-switcher-item-title">{item.title}</span>
              {isActive && (
                <Icon
                  name={checkSVG}
                  size="16px"
                  className="nav-tree-switcher-check"
                />
              )}
            </MenuItem>
          );
        })}
        {isWorkspacesLoading && (
          <MenuItem isDisabled className="nav-tree-switcher-item">
            <span className="nav-tree-switcher-item-title">
              {intl.formatMessage(messages.loading)}
            </span>
          </MenuItem>
        )}
      </Menu>
    </MenuTrigger>
  );
}

export default NavigationTreeHeader;
