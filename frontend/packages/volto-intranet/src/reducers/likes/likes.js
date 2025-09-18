/**
 * Likes reducer.
 * @module reducers/likes/likes
 */

import { TOGGLE_LIKE } from '../../constants/ActionTypes';

const initialState = {
  error: null,
  loaded: false,
  loading: false,
};

export default function likes(state = initialState, action = {}) {
  switch (action.type) {
    case `${TOGGLE_LIKE}_PENDING`:
      return {
        ...state,
        error: null,
        loaded: true,
        loading: false,
      };
    case `${TOGGLE_LIKE}_SUCCESS`:
      return {
        ...state,
        error: null,
        loaded: true,
        loading: false,
      };
    case `${TOGGLE_LIKE}_FAIL`:
      return {
        ...state,
        error: null,
        loaded: false,
        loading: false,
      };
    default:
      return state;
  }
}
