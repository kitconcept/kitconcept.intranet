import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { Key } from 'react-aria-components';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { searchContent } from '@plone/volto/actions/search/search';
import { collectAncestorPaths } from './utils';

export interface SearchItem {
  '@id': string;
  '@type': string;
  title: string;
  is_folderish: boolean;
  review_state: string;
}

export const ROOT_ID = '/';
const WORKSPACE_PORTAL_TYPE = 'Workspace';

export function useNavigationTree(rootPath: string = ROOT_ID) {
  const dispatch = useDispatch();
  const location = useLocation();
  const currentPath = flattenToAppURL(location.pathname);

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set([rootPath]),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchedPaths = useRef<Set<string>>(new Set());

  const subrequests = useSelector(
    (state: any) => state.search?.subrequests ?? {},
  );

  function getChildrenForPath(path: string): SearchItem[] {
    return (subrequests[`nav-tree-${path}`]?.items ?? []).filter(
      (item: SearchItem) => item['@type'] !== WORKSPACE_PORTAL_TYPE,
    );
  }

  function isLoadingForPath(path: string): boolean {
    return subrequests[`nav-tree-${path}`]?.loading ?? false;
  }

  const dispatchFetch = useCallback(
    (path: string) => {
      return dispatch(
        searchContent(
          path,
          {
            'path.depth': 1,
            sort_on: 'getObjPositionInParent',
            metadata_fields: ['is_folderish', 'review_state'],
            b_size: 100,
          },
          `nav-tree-${path}`,
        ),
      );
    },
    [dispatch],
  );

  useEffect(() => {
    const ancestors = collectAncestorPaths(currentPath, rootPath);
    for (const path of ancestors) {
      if (!fetchedPaths.current.has(path)) {
        fetchedPaths.current.add(path);
        dispatchFetch(path);
      }
    }
    setExpandedKeys((prev) => new Set([...prev, ...ancestors]));
  }, [currentPath, rootPath, dispatchFetch]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedSearch) return;
    dispatch(
      searchContent(
        rootPath,
        {
          Title: `${debouncedSearch}*`,
          metadata_fields: ['is_folderish', 'review_state'],
          b_size: 50,
        },
        'nav-tree-search',
      ),
    );
  }, [debouncedSearch, dispatch, rootPath]);

  const handleExpandedChange = useCallback(
    (newKeys: Set<Key>) => {
      for (const key of newKeys) {
        const path =
          key === rootPath ? rootPath : flattenToAppURL(key as string);
        if (!fetchedPaths.current.has(path)) {
          fetchedPaths.current.add(path);
          dispatchFetch(path);
        }
      }
      setExpandedKeys(new Set(newKeys as Set<string>));
    },
    [dispatchFetch, rootPath],
  );

  const expandPath = useCallback(
    (path: string) => {
      if (!fetchedPaths.current.has(path)) {
        fetchedPaths.current.add(path);
        dispatchFetch(path);
      }
      setExpandedKeys((prev) =>
        prev.has(path) ? prev : new Set([...prev, path]),
      );
    },
    [dispatchFetch],
  );

  const searchResults: SearchItem[] = (
    subrequests['nav-tree-search']?.items ?? []
  ).filter((item: SearchItem) => item['@type'] !== WORKSPACE_PORTAL_TYPE);
  const isSearchLoading = !!subrequests['nav-tree-search']?.loading;
  const rootChildren = getChildrenForPath(rootPath);
  const isRootLoading = isLoadingForPath(rootPath);

  return {
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
    refetchPath: dispatchFetch,
    expandPath,
  };
}
