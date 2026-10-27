import { AI_EDIT, AI_EDIT_AVAILABLE } from '../../constants/ActionTypes';

/**
 * Ask the AI assistant about the page being edited or added (POC, see
 * AI_EDIT_PLAN.md).
 * @param {string} url Content URL (edit form) or URL of the folder the
 *   content is added to (add form).
 * @param {Object} data `{language, messages, page, block_types, repair?}`
 *   (see the harness, components/AIEdit/harness).
 */
export function aiEdit(url, data) {
  return {
    type: AI_EDIT,
    request: {
      op: 'post',
      path: `${url}/@ai-edit`,
      data,
    },
  };
}

/**
 * May the current user use the AI assistant here? Same permission as `aiEdit`:
 * the request fails with 401 without it.
 * @param {string} url Content URL (edit form) or URL of the folder the
 *   content is added to (add form).
 */
export function aiEditAvailable(url) {
  return {
    type: AI_EDIT_AVAILABLE,
    request: {
      op: 'get',
      path: `${url}/@ai-edit`,
    },
  };
}
