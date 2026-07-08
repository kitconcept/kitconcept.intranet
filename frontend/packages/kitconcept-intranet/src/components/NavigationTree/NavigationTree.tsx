import React, { useRef } from 'react';
import { useIntl } from 'react-intl';
import { TreeItem } from 'react-aria-components';
import { Tree, TreeItemContent } from '@plone/components';
import { ColumnbeforeIcon } from '@plone/components/Icons';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { messages } from './messages';
import { useNavigationTree, ROOT_ID } from './useNavigationTree';
import { useActiveWorkspace } from './useActiveWorkspace';
import { NavigationTreeHeader } from './NavigationTreeHeader';
import { NavigationTreeSearch } from './NavigationTreeSearch';
import { NavigationTreeItem } from './NavigationTreeItem';

interface NavigationTreeProps {
  siteTitle: string;
  onClose: () => void;
}

export function NavigationTree({ siteTitle, onClose }: NavigationTreeProps) {
  const intl = useIntl();
  const navigationLabel = intl.formatMessage(messages.navigationLabel);
  const siteNavigationLabel = intl.formatMessage(messages.siteNavigation);
  const {
    workspaces,
    activeWorkspace,
    isLoading: isWorkspacesLoading,
  } = useActiveWorkspace();
  const rootPath = activeWorkspace
    ? flattenToAppURL(activeWorkspace['@id'])
    : ROOT_ID;
  const {
    currentPath,
    expandedKeys,
    handleExpandedChange,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    searchResults,
    isSearchLoading,
    rootChildren,
    isRootLoading,
    getChildrenForPath,
    isLoadingForPath,
    fetchedPaths,
  } = useNavigationTree(rootPath);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    const container = wrapperRef.current?.parentElement;
    if (!container) return;
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = container.offsetWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = moveEvent.clientX - startX.current;
      const newWidth = Math.max(300, startWidth.current + delta);
      if (container) container.style.width = `${newWidth}px`;
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <aside
      className="navigation-tree-wrapper"
      ref={wrapperRef}
      aria-label={siteNavigationLabel}
    >
      <NavigationTreeHeader
        siteTitle={siteTitle}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        isWorkspacesLoading={isWorkspacesLoading}
      />

      <NavigationTreeSearch
        searchQuery={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      <div className="navigation-tree-nav-label">
        <h2
          id="navigation-tree-heading"
          className="navigation-tree-nav-heading"
        >
          {navigationLabel}
        </h2>
        <button
          type="button"
          className="nav-tree-close"
          onClick={onClose}
          aria-label={intl.formatMessage(messages.closePanel)}
        >
          <ColumnbeforeIcon />
        </button>
      </div>

      <nav
        className="navigation-tree"
        aria-label={`${siteTitle} ${navigationLabel}`}
      >
        {debouncedSearch ? (
          <>
            {isSearchLoading && (
              <div className="nav-tree-loading-text nav-tree-search-status">
                {intl.formatMessage(messages.loading)}
              </div>
            )}
            {!isSearchLoading && searchResults.length === 0 && (
              <div className="nav-tree-empty">
                {intl.formatMessage(messages.noResults)}
              </div>
            )}
            {searchResults.length > 0 && (
              <Tree
                aria-label={intl.formatMessage(messages.searchResults)}
                expandedKeys={expandedKeys}
                onExpandedChange={handleExpandedChange}
              >
                {searchResults.map((item) => (
                  <NavigationTreeItem
                    key={item['@id']}
                    item={item}
                    currentPath={currentPath}
                    fetchedPaths={fetchedPaths}
                    getChildrenForPath={getChildrenForPath}
                    isLoadingForPath={isLoadingForPath}
                  />
                ))}
              </Tree>
            )}
          </>
        ) : (
          <Tree
            aria-label={siteTitle}
            expandedKeys={expandedKeys}
            onExpandedChange={handleExpandedChange}
          >
            {isRootLoading && rootChildren.length === 0 && (
              <TreeItem
                id="root-loading"
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

            {rootChildren.map((item) => (
              <NavigationTreeItem
                key={item['@id']}
                item={item}
                currentPath={currentPath}
                fetchedPaths={fetchedPaths}
                getChildrenForPath={getChildrenForPath}
                isLoadingForPath={isLoadingForPath}
              />
            ))}
          </Tree>
        )}
      </nav>

      <button
        className="navigation-tree-resize-handle"
        onMouseDown={onMouseDown}
        aria-label={intl.formatMessage(messages.resizePanel)}
        type="button"
      />
    </aside>
  );
}

export default NavigationTree;
