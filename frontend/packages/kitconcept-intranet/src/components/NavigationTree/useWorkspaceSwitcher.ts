import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { searchContent } from '@plone/volto/actions/search/search';
import type { SearchItem } from './useNavigationTree';

const WORKSPACE_SWITCHER_SUBREQUEST = 'nav-tree-workspace-switcher';

export function useWorkspaceSwitcher() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      searchContent(
        '/',
        {
          portal_type: 'Workspace',
          'path.depth': 1,
          sort_on: 'sortable_title',
          b_size: 100,
        },
        WORKSPACE_SWITCHER_SUBREQUEST,
      ),
    );
  }, [dispatch]);

  const subrequest = useSelector(
    (state: any) => state.search?.subrequests?.[WORKSPACE_SWITCHER_SUBREQUEST],
  );

  return {
    workspaces: (subrequest?.items ?? []) as SearchItem[],
    isLoading: !!subrequest?.loading,
  };
}
