/**
 * Root reducer.
 * @module reducers/root
 */

import defaultReducers from '@plone/volto/reducers';
import feedbackContactForm from './feedbackContactForm/feedbackContactForm';

/**
 * Root reducer.
 * @function
 * @param {Object} state Current state.
 * @param {Object} action Action to be handled.
 * @returns {Object} New state.
 */
const reducers = {
  ...defaultReducers,

  feedbackContactForm,
  // Add your reducers here
};

export default reducers;
