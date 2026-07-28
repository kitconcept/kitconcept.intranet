import { defineMessages, useIntl } from 'react-intl';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
} from '@plone/components';
import {
  ChevronrightIcon,
  FolderIcon,
  HomeIcon,
  MoreoptionsIcon,
} from '@plone/components/Icons';

import useHeaderBreadcrumbs from './useHeaderBreadcrumbs';

const messages = defineMessages({
  home: {
    id: 'Home',
    defaultMessage: 'Home',
  },
  moreBreadcrumbs: {
    id: 'Show more breadcrumb items',
    defaultMessage: 'Show more breadcrumb items',
  },
});

type HeaderBreadcrumbsProps = {
  pathname: string;
};

const HeaderBreadcrumbs = ({ pathname }: HeaderBreadcrumbsProps) => {
  const intl = useIntl();
  const breadcrumbsProps = useHeaderBreadcrumbs(pathname);

  if (!breadcrumbsProps) {
    return null;
  }

  const { items } = breadcrumbsProps;
  const rootItem = items[0];
  const isCollapsed = items.length > 3;
  const parentItem = isCollapsed ? items[1] : null;
  const hiddenItems = isCollapsed
    ? items.slice(2, -1).map((item, depth) => ({ ...item, depth }))
    : [];
  const visibleItems = isCollapsed ? items.slice(-1) : items.slice(1);
  const collectionKey = items.map((item) => item['@id']).join('|');
  const separator = (
    <ChevronrightIcon
      aria-hidden="true"
      className="header-breadcrumb-separator"
      size="sm"
    />
  );

  return (
    <Breadcrumbs
      key={collectionKey}
      aria-label={breadcrumbsProps['aria-label']}
      className="header-breadcrumbs"
    >
      <Breadcrumb
        id={rootItem['@id']}
        href={rootItem['@id']}
        aria-label={intl.formatMessage(messages.home)}
        separator={items.length > 1 ? separator : undefined}
      >
        <HomeIcon
          aria-hidden="true"
          className="header-breadcrumb-home"
          size="sm"
        />
      </Breadcrumb>

      {parentItem && (
        <Breadcrumb
          id={parentItem['@id']}
          href={parentItem['@id']}
          separator={separator}
        >
          <span className="header-breadcrumb-parent">{parentItem.title}</span>
        </Breadcrumb>
      )}

      {hiddenItems.length > 0 && (
        <Breadcrumb separator={separator}>
          <MenuTrigger placement="bottom start">
            <Button
              className="header-breadcrumb-more-button"
              aria-label={intl.formatMessage(messages.moreBreadcrumbs)}
            >
              <MoreoptionsIcon aria-hidden="true" size="sm" />
            </Button>
            <Menu
              className="header-breadcrumb-menu"
              aria-label={intl.formatMessage(messages.moreBreadcrumbs)}
              items={hiddenItems}
            >
              {(item) => (
                <MenuItem
                  id={item['@id']}
                  href={item['@id']}
                  style={{ paddingInlineStart: 12 + item.depth * 12 }}
                >
                  <FolderIcon aria-hidden="true" size="sm" />
                  <span>{item.title}</span>
                </MenuItem>
              )}
            </Menu>
          </MenuTrigger>
        </Breadcrumb>
      )}

      {visibleItems.map((item) => (
        <Breadcrumb
          key={item['@id']}
          id={item['@id']}
          href={item['@id']}
          separator={separator}
        >
          {item.title}
        </Breadcrumb>
      ))}
    </Breadcrumbs>
  );
};

export default HeaderBreadcrumbs;
