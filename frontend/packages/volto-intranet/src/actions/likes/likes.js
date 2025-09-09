import { ADD_LIKE, REMOVE_LIKE } from './../../constants/ActionTypes';

export function addLike(url) {
  return {
    type: ADD_LIKE,
    request: {
      op: 'post',
      path: `${url}/@vote`,
    },
  };
}

export function removeLike(url) {
  return {
    type: REMOVE_LIKE,
    request: {
      op: 'post',
      path: `${url}/@vote`,
    },
  };
}
