/**
 * Navigation reducer.
 * @module reducers/navigation/navigation
 */

import { ADD_LIKE, GET_LIKES, REMOVE_LIKE } from '../../constants/ActionTypes';

const initialState = {
  error: null,
  likes: 0,
  loaded: false,
  loading: false,
};

export default function likes(state = initialState, action = {}) {
  switch (action.type) {
    case `${ADD_LIKE}_PENDING`:
    case `${REMOVE_LIKE}_PENDING`:
      return {
        ...state,
        error: null,
        loaded: true,
        loading: false,
      };
    case `${GET_LIKES}_PENDING`:
      return {
        ...state,
        error: null,
        loaded: true,
        loading: false,
      };
    case `${ADD_LIKE}_SUCCESS`:
    case `${REMOVE_LIKE}_SUCCESS`:
      return {
        ...state,
        error: null,
        loaded: true,
        loading: false,
      };
    case `${GET_LIKES}_SUCCESS`:
      return {
        ...state,
        error: null,
        likes: state.likes,
        loaded: true,
        loading: false,
      };
    case `${ADD_LIKE}_FAIL`:
    case `${GET_LIKES}_FAIL`:
    case `${REMOVE_LIKE}FAIL`:
      return {
        ...state,
        error: null,
        loaded: true,
        loading: false,
      };
    default:
      return state;
  }
}
