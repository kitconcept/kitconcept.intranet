import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { searchContent } from '@plone/volto/actions/search/search';
import type { SearchItem } from './useNavigationTree';

const WORKSPACE_SWITCHER_SUBREQUEST = 'nav-tree-workspace-switcher';

export function useWorkspaceSwitcher(options?: { enabled?: boolean }) {
  const dispatch = useDispatch();
  // enabled=false defers the fetch (e.g. the search dialog only needs
  // the list once it is opened); the redux subrequest is shared, so a
  // list already fetched by another consumer is reused as-is.
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    dispatch(
      searchContent(
        '/',
        {
          portal_type: 'Workspace',
          sort_on: 'sortable_title',
          b_size: 100,
        },
        WORKSPACE_SWITCHER_SUBREQUEST,
      ),
    );
  }, [dispatch, enabled]);

  const subrequest = useSelector(
    (state: any) => state.search?.subrequests?.[WORKSPACE_SWITCHER_SUBREQUEST],
  );

  return {
    workspaces: (subrequest?.items ?? []) as SearchItem[],
    isLoading: !!subrequest?.loading,
  };
}
