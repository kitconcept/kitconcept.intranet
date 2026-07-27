import { defineMessages, useIntl } from 'react-intl';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
} from '@plone/components';
import { ChevronrightIcon, MoreoptionsIcon } from '@plone/components/Icons';

import useHeaderBreadcrumbs from './useHeaderBreadcrumbs';

const messages = defineMessages({
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
  const hiddenItems = items.length > 3 ? items.slice(1, -2) : [];
  const visibleItems = items.length > 3 ? items.slice(-2) : items.slice(1);
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
        separator={items.length > 1 ? separator : undefined}
      >
        {rootItem.title}
      </Breadcrumb>

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
                <MenuItem id={item['@id']} href={item['@id']}>
                  {item.title}
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
