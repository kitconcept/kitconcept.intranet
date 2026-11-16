import { TOGGLE_WATCH } from './../../constants/ActionTypes';

/**
 * Start or stop watching a content item for the current user.
 * The response says whether the user watches it now: `{ watching: bool }`.
 */
export function toggleWatch(url) {
  return {
    type: TOGGLE_WATCH,
    request: {
      op: 'post',
      path: `${url}/@watch`,
    },
  };
}
