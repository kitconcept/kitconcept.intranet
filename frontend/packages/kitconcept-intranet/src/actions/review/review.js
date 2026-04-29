import {
  POSTPONE_REVIEW,
  DELEGATE_REVIEW,
  APPROVE_REVIEW,
} from '../../constants/ActionTypes';

export function postponeReview(url, data) {
  return {
    type: POSTPONE_REVIEW,
    request: {
      op: 'post',
      path: `${url}/@review/postpone`,
      data,
    },
  };
}
export function delegateReview(url, data) {
  return {
    type: DELEGATE_REVIEW,
    request: {
      op: 'post',
      path: `${url}/@review/delegate`,
      data,
    },
  };
}
export function approveReview(url) {
  return {
    type: APPROVE_REVIEW,
    request: {
      op: 'post',
      path: `${url}/@review/approve`,
    },
  };
}
