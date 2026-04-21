/**
 * review reducer.
 * @module reducers/review
 */

import { POSTPONE_REVIEW } from '../../constants/ActionTypes';
import { DELEGATE_REVIEW } from '../../constants/ActionTypes';
import { APPROVE_REVIEW } from '../../constants/ActionTypes';

const initialState = {
  error: null,
  loaded: false,
  loading: false,
};

/**
 * review reducer.
 * @function review
 * @param {Object} state Current state.
 * @param {Object} action Action to be handled.
 * @returns {Object} New state.
 */
export default function review(state = initialState, action = {}) {
  switch (action.type) {
    case `${POSTPONE_REVIEW}_PENDING`:
      return {
        ...state,
        error: null,
        loaded: false,
        loading: true,
      };
    case `${POSTPONE_REVIEW}_SUCCESS`:
      return {
        ...state,
        error: null,
        loaded: true,
        loading: false,
      };
    case `${POSTPONE_REVIEW}_FAIL`:
      return {
        ...state,
        error: action.error,
        loaded: false,
        loading: false,
      };
    case `${DELEGATE_REVIEW}_PENDING`:
      return {
        ...state,
        error: null,
        loaded: false,
        loading: true,
      };
    case `${DELEGATE_REVIEW}_SUCCESS`:
      return {
        ...state,
        error: null,
        loaded: true,
        loading: false,
      };
    case `${DELEGATE_REVIEW}_FAIL`:
      return {
        ...state,
        error: action.error,
        loaded: false,
        loading: false,
      };
    case `${APPROVE_REVIEW}_PENDING`:
      return {
        ...state,
        error: null,
        loaded: false,
        loading: true,
      };
    case `${APPROVE_REVIEW}_SUCCESS`:
      return {
        ...state,
        error: null,
        loaded: true,
        loading: false,
      };
    case `${APPROVE_REVIEW}_FAIL`:
      return {
        ...state,
        error: action.error,
        loaded: false,
        loading: false,
      };
    default:
      return state;
  }
}
