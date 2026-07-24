import { useLocation } from 'react-router-dom';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { collectAncestorPaths } from './utils';
import { useWorkspaceSwitcher } from './useWorkspaceSwitcher';

export function useActiveWorkspace() {
  const location = useLocation();
  const currentPath = flattenToAppURL(location.pathname);
  const { workspaces, isLoading } = useWorkspaceSwitcher();

  const ancestorPaths = collectAncestorPaths(currentPath);
  const activeWorkspace = workspaces.find((ws) =>
    ancestorPaths.includes(flattenToAppURL(ws['@id'])),
  );

  return { workspaces, activeWorkspace, isLoading };
}
