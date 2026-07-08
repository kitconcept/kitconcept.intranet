import config from '@plone/volto/registry';

export function getStateColor(reviewState: string): string {
  const workflowMapping: Record<string, { color?: string }> =
    config.settings.workflowMapping ?? {};
  if (workflowMapping[reviewState]?.color) {
    return workflowMapping[reviewState].color!;
  }
  return 'grey';
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
