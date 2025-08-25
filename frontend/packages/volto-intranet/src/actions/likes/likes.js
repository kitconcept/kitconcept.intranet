import {
  GET_LIKES,
  ADD_LIKE,
  REMOVE_LIKE,
} from './../../constants/ActionTypes';

export function getLikes(url) {
  return {
    type: GET_LIKES,
    request: {
      op: 'get',
      path: `${url}/@votes`,
    },
  };
}

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
      op: 'del',
      path: `${url}/@vote`,
    },
  };
}
