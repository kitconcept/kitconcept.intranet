import { TOOGLE_LIKE } from './../../constants/ActionTypes';

export function toogleLike(url) {
  return {
    type: TOOGLE_LIKE,
    request: {
      op: 'post',
      path: `${url}/@vote`,
    },
  };
}
