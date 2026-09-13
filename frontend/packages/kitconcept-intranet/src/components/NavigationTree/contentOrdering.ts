import { orderContent } from '@plone/volto/actions/content/content';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { getShortId } from './utils';
import type { SearchItem } from './useNavigationTree';

/**
 * Move a freshly created item to the top of its parent folder.
 */
export function moveToTop(dispatch: any, parentPath: string, id: string) {
  return dispatch(orderContent(parentPath, id, 'top', []));
}

export function moveAfter(
  dispatch: any,
  parentPath: string,
  siblings: SearchItem[],
  targetPath: string,
  afterPath: string,
) {
  const targetIndex = siblings.findIndex(
    (child) => flattenToAppURL(child['@id']) === targetPath,
  );
  const afterIndex = siblings.findIndex(
    (child) => flattenToAppURL(child['@id']) === afterPath,
  );
  if (targetIndex === -1 || afterIndex === -1) return Promise.resolve();

  const delta = afterIndex + 1 - targetIndex;
  if (delta === 0) return Promise.resolve();

  return dispatch(orderContent(parentPath, getShortId(targetPath), delta, []));
}
