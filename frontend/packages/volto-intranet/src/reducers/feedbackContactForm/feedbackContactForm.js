/**
 * emailSend reducer.
 * @module reducers/emailSend
 */

import { CONTACTFORM_SUBMIT } from '../../constants/ActionTypes';

const initialState = {
  error: null,
  loaded: false,
  loading: false,
};

/**
 * emailSend reducer.
 * @function emailSend
 * @param {Object} state Current state.
 * @param {Object} action Action to be handled.
 * @returns {Object} New state.
 */
export default function feedbackContactForm(state = initialState, action = {}) {
  switch (action.type) {
    case `${CONTACTFORM_SUBMIT}_PENDING`:
      return {
        ...state,
        error: null,
        loaded: false,
        loading: true,
      };
    case `${CONTACTFORM_SUBMIT}_SUCCESS`:
      return {
        ...state,
        error: null,
        loaded: true,
        loading: false,
      };
    case `${CONTACTFORM_SUBMIT}_FAIL`:
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
