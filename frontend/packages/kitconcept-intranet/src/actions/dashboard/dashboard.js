import { GET_DASHBOARD, CREATE_DASHBOARD } from '../../constants/ActionTypes';

/** Get the default blocks for the dashboard of the Person at `url`. */
export function getDashboard(url) {
  return {
    type: GET_DASHBOARD,
    request: {
      op: 'get',
      path: `${url}/@dashboard`,
    },
  };
}

/** Create the dashboard of the current user inside their Person at `url`. */
export function createDashboard(url) {
  return {
    type: CREATE_DASHBOARD,
    request: {
      op: 'post',
      path: `${url}/@dashboard`,
    },
  };
}
