import { CONTACTFORM_SUBMIT } from '../../constants/ActionTypes';

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
