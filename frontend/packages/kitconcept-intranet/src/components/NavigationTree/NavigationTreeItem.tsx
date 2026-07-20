import React, { useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import cx from 'classnames';
import { MenuTrigger, Popover, TreeItem } from 'react-aria-components';
import { Button, Menu, MenuItem, TreeItemContent } from '@plone/components';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import Toast from '@plone/volto/components/manage/Toast/Toast';
import { getContentIcon } from '@plone/volto/helpers/Content/Content';
import {
  createContent,
  updateContent,
  deleteContent,
} from '@plone/volto/actions/content/content';
import { copyContent } from '@plone/volto/actions/clipboard/clipboard';
import addSVG from '@plone/volto/icons/add.svg';
import moreSVG from '@plone/volto/icons/more.svg';
import renameSVG from '@plone/volto/icons/rename.svg';
import copySVG from '@plone/volto/icons/copy.svg';
import deleteSVG from '@plone/volto/icons/delete.svg';
import { messages } from './messages';
import { getStateColor, getParentPath } from './utils';
import { moveToTop, moveAfter } from './contentOrdering';
import { useStickyFocus } from './useStickyFocus';
import { useSuppressRowKeyHandling } from './useSuppressRowKeyHandling';
import type { SearchItem } from './useNavigationTree';

interface NavigationTreeItemProps {
  item: SearchItem;
  currentPath: string;
  fetchedPaths: React.MutableRefObject<Set<string>>;
  getChildrenForPath: (path: string) => SearchItem[];
  isLoadingForPath: (path: string) => boolean;
  refetchPath: (path: string) => Promise<{ items: SearchItem[] }>;
  expandPath: (path: string) => void;
}

export function NavigationTreeItem({
  item,
  currentPath,
  fetchedPaths,
  getChildrenForPath,
  isLoadingForPath,
  refetchPath,
  expandPath,
}: NavigationTreeItemProps) {
  const intl = useIntl();
  const dispatch = useDispatch() as any;
  const itemPath = flattenToAppURL(item['@id']);
  const parentPath = getParentPath(itemPath);
  const isCurrent = currentPath === itemPath;
  const children = getChildrenForPath(itemPath);
  const isLoading = isLoadingForPath(itemPath);
  const isFetched = fetchedPaths.current.has(itemPath);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(item.title);
  const skipRenameSubmitRef = useRef(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  useStickyFocus(isRenaming, renameInputRef);

  const [isAdding, setIsAdding] = useState(false);
  const [addValue, setAddValue] = useState('Untitled');
  const addInputRef = useRef<HTMLInputElement>(null);
  useStickyFocus(isAdding, addInputRef);

  const showChevron =
    item.is_folderish &&
    (!isFetched || children.length > 0 || isLoading || isAdding);

  function showActionError(error?: unknown) {
    const message = (
      error as { response?: { body?: { message?: string } } } | undefined
    )?.response?.body?.message;
    toast.error(
      <Toast
        error
        title={intl.formatMessage(messages.actionError)}
        content={message}
      />,
    );
  }

  function submitRename() {
    setIsRenaming(false);
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== item.title) {
      dispatch(updateContent(itemPath, { title: trimmed }))
        .then(() => refetchPath(parentPath))
        .catch(showActionError);
    }
  }

  function cancelRename() {
    skipRenameSubmitRef.current = true;
    setRenameValue(item.title);
    setIsRenaming(false);
  }

  function handleRenameBlur() {
    if (skipRenameSubmitRef.current) {
      skipRenameSubmitRef.current = false;
      return;
    }
    submitRename();
  }

  useSuppressRowKeyHandling(isRenaming, renameInputRef, {
    onEnter: () => renameInputRef.current?.blur(),
    onEscape: () => {
      cancelRename();
      renameInputRef.current?.blur();
    },
  });

  async function duplicateItem() {
    try {
      const [{ target }] = await dispatch(copyContent([itemPath], parentPath));
      const newPath = flattenToAppURL(target);
      // Plone appends the copy at the end of the folder by default. Move it
      // to sit right after the original (so e.g. "Page" and "Page (copy)"
      // end up as consecutive siblings) instead of leaving it wherever it
      // landed.
      const { items = [] } = (await refetchPath(parentPath)) ?? {};
      await moveAfter(dispatch, parentPath, items, newPath, itemPath);
      refetchPath(parentPath);
    } catch (error) {
      showActionError(error);
    }
  }

  function handleMenuAction(key: React.Key) {
    if (key === 'rename') {
      setRenameValue(item.title);
      setIsRenaming(true);
    } else if (key === 'duplicate') {
      duplicateItem();
    } else if (key === 'delete') {
      dispatch(deleteContent(itemPath))
        .then(() => refetchPath(parentPath))
        .catch(showActionError);
    }
  }

  function startAdd() {
    expandPath(itemPath);
    setAddValue('Untitled');
    setIsAdding(true);
  }

  async function submitAdd() {
    const title = addValue.trim() || 'Untitled';
    try {
      const created = await dispatch(
        createContent(
          itemPath,
          { '@type': 'WikiPage', title },
          `nav-tree-add-${itemPath}`,
        ),
      );
      // Blur before the input unmounts (setIsAdding(false) below), so focus
      // goes nowhere instead of falling back onto the Tree root — which
      // would otherwise show react-aria's Tree focus-visible outline ring.
      addInputRef.current?.blur();
      setIsAdding(false);
      await moveToTop(dispatch, itemPath, created.id);
      refetchPath(itemPath);
    } catch (error) {
      showActionError(error);
    }
  }

  function cancelAdd() {
    setIsAdding(false);
  }

  useSuppressRowKeyHandling(isAdding, addInputRef, {
    onEnter: submitAdd,
    onEscape: () => addInputRef.current?.blur(), // triggers onBlur={cancelAdd}
  });

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
        {isRenaming ? (
          <input
            ref={renameInputRef}
            className="nav-tree-title-input"
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            onBlur={handleRenameBlur}
            onClick={(event) => event.stopPropagation()}
            aria-label={intl.formatMessage(messages.renameTitleLabel)}
          />
        ) : (
          <span className="nav-tree-title" title={item.title}>
            {item.title}
          </span>
        )}
        <span className="nav-tree-row-end">
          <span
            className="nav-tree-state-dot"
            style={{ background: getStateColor(item.review_state) }}
            aria-hidden
          />
          {!isRenaming && !isAdding && (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <span
              className={cx('nav-tree-row-actions', {
                'is-menu-open': isMenuOpen,
              })}
              onClick={(event) => event.stopPropagation()}
            >
              {item.is_folderish && (
                <Button
                  className="nav-tree-action-add"
                  aria-label={intl.formatMessage(messages.addNew)}
                  onPress={startAdd}
                >
                  <Icon name={addSVG} size="14px" />
                </Button>
              )}
              <MenuTrigger isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <Button
                  className="nav-tree-action-more"
                  aria-label={intl.formatMessage(messages.moreActions)}
                >
                  <Icon name={moreSVG} size="14px" />
                </Button>
                <Popover placement="bottom end" shouldFlip={false}>
                  <Menu
                    aria-label={intl.formatMessage(messages.moreActions)}
                    className="nav-tree-item-menu"
                    onAction={handleMenuAction}
                  >
                    <MenuItem id="rename" className="nav-tree-item-menu-item">
                      <Icon name={renameSVG} size="14px" />
                      {intl.formatMessage(messages.rename)}
                    </MenuItem>
                    <MenuItem
                      id="duplicate"
                      className="nav-tree-item-menu-item"
                    >
                      <Icon name={copySVG} size="14px" />
                      {intl.formatMessage(messages.duplicate)}
                    </MenuItem>
                    <MenuItem
                      id="delete"
                      className="nav-tree-item-menu-item is-danger"
                    >
                      <Icon name={deleteSVG} size="14px" />
                      {intl.formatMessage(messages.delete)}
                    </MenuItem>
                  </Menu>
                </Popover>
              </MenuTrigger>
            </span>
          )}
        </span>
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

      {isAdding && (
        <TreeItem id={`${item['@id']}-adding`} textValue={addValue}>
          <TreeItemContent>
            <Icon
              name={getContentIcon('Document', false)}
              size="16px"
              className="nav-tree-icon"
            />
            <input
              ref={addInputRef}
              className="nav-tree-title-input"
              value={addValue}
              onChange={(event) => setAddValue(event.target.value)}
              onBlur={cancelAdd}
              onClick={(event) => event.stopPropagation()}
              aria-label={intl.formatMessage(messages.renameTitleLabel)}
            />
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
          refetchPath={refetchPath}
          expandPath={expandPath}
        />
      ))}
    </TreeItem>
  );
}

export default NavigationTreeItem;
