import { TOGGLE_LIKE } from './../../constants/ActionTypes';

export function toggleLike(url) {
  return {
    type: TOGGLE_LIKE,
    request: {
      op: 'post',
      path: `${url}/@vote`,
    },
  };
}
