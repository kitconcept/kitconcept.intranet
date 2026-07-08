import React from 'react';
import { useIntl } from 'react-intl';
import { TreeItem } from 'react-aria-components';
import { TreeItemContent } from '@plone/components';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import { getContentIcon } from '@plone/volto/helpers/Content/Content';
import { messages } from './messages';
import { getStateColor } from './utils';
import type { SearchItem } from './useNavigationTree';

interface NavigationTreeItemProps {
  item: SearchItem;
  currentPath: string;
  fetchedPaths: React.MutableRefObject<Set<string>>;
  getChildrenForPath: (path: string) => SearchItem[];
  isLoadingForPath: (path: string) => boolean;
}

export function NavigationTreeItem({
  item,
  currentPath,
  fetchedPaths,
  getChildrenForPath,
  isLoadingForPath,
}: NavigationTreeItemProps) {
  const intl = useIntl();
  const itemPath = flattenToAppURL(item['@id']);
  const isCurrent = currentPath === itemPath;
  const children = getChildrenForPath(itemPath);
  const isLoading = isLoadingForPath(itemPath);
  const isFetched = fetchedPaths.current.has(itemPath);
  const showChevron =
    item.is_folderish && (!isFetched || children.length > 0 || isLoading);

  return (
    <TreeItem
      key={item['@id']}
      id={item['@id']}
      textValue={item.title}
      href={itemPath}
      hasChildItems={showChevron}
      className={({ defaultClassName }) =>
        isCurrent
          ? `${defaultClassName ?? ''} is-current`.trim()
          : defaultClassName ?? ''
      }
    >
      <TreeItemContent>
        <Icon
          name={getContentIcon(item['@type'], item.is_folderish)}
          size="16px"
          className="nav-tree-icon"
        />
        <span className="nav-tree-title" title={item.title}>
          {item.title}
        </span>
        <span
          className="nav-tree-state-dot"
          style={{ background: getStateColor(item.review_state) }}
          aria-hidden
        />
      </TreeItemContent>

      {item.is_folderish && isLoading && children.length === 0 && (
        <TreeItem
          id={`${item['@id']}-loading`}
          textValue={intl.formatMessage(messages.loading)}
          isDisabled
        >
          <TreeItemContent>
            <span className="nav-tree-loading-text">
              {intl.formatMessage(messages.loading)}
            </span>
          </TreeItemContent>
        </TreeItem>
      )}

      {children.map((child) => (
        <NavigationTreeItem
          key={child['@id']}
          item={child}
          currentPath={currentPath}
          fetchedPaths={fetchedPaths}
          getChildrenForPath={getChildrenForPath}
          isLoadingForPath={isLoadingForPath}
        />
      ))}
    </TreeItem>
  );
}

export default NavigationTreeItem;
