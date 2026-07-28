import config from '@plone/volto/registry';

export function getStateColor(reviewState: string): string {
  const workflowMapping: Record<string, { color?: string }> =
    config.settings.workflowMapping ?? {};
  if (workflowMapping[reviewState]?.color) {
    return workflowMapping[reviewState].color!;
  }
  return 'grey';
}

export function getParentPath(path: string): string {
  if (path === '/') return '/';
  const parent = path.split('/').slice(0, -1).join('/');
  return parent || '/';
}

/**
 * Plone's short content id (last path segment), as used by the
 * `@ordering` endpoint's `obj_id`. Works on both API and app-relative
 * `@id` values, since they share the same trailing segment.
 */
export function getShortId(id: string): string {
  return id.replace(/\/$/, '').split('/').pop() ?? '';
}

export function collectAncestorPaths(
  currentPath: string,
  rootPath: string = '/',
): string[] {
  const parts = currentPath.split('/').filter(Boolean);
  const ancestors: string[] = ['/'];
  let acc = '';
  for (const part of parts) {
    acc += '/' + part;
    ancestors.push(acc);
  }
  const rootIndex = ancestors.indexOf(rootPath);
  return rootIndex === -1 ? ancestors : ancestors.slice(rootIndex);
}
