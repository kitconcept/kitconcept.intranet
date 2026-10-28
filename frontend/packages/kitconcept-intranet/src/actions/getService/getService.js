export const GET_SERVICE = 'GET_SERVICE';

/**
 * Simple get service (get API service without using the redux store)
 * @function getService
 * @param {string} path Service path.
 * @returns {Object} Action.
 */
export function getService(path) {
  return {
    type: GET_SERVICE,
    request: {
      op: 'get',
      path: path,
    },
  };
}
