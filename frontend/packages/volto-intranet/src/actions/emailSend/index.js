/**
 * emailSend actions.
 * @module actions/emailSend/emailSend
 */

import { EMAIL_SEND, CONTACTFORM_SUBMIT } from '../../constants/ActionTypes';

/**
 * Email notification function
 * @function emailSend
 * @param {string} to User id
 * @param {string} from User id
 * @param {string} message Old password.
 * @param {string} name New password.
 * @param {string} subject New password.
 * @returns {Object} Email Send action.
 */
export function emailSend(to, from, message, name, subject) {
  return {
    type: EMAIL_SEND,
    request: {
      op: 'post',
      path: '/@email-send',
      data: {
        to,
        from,
        message,
        name,
        subject,
      },
    },
  };
}

export function submitFeedbackContactForm(path, data) {
  return {
    type: CONTACTFORM_SUBMIT,
    request: {
      op: 'post',
      path: `${path}/@contact-form-feedback`,
      data,
    },
  };
}
