import { GET_TYPESETTINGS } from '@kitconcept/intranet/constants/ActionTypes';

export function getTypeSettings(id: string) {
  let requestPath = `/@type-settings/${id}`;

  return {
    type: GET_TYPESETTINGS,
    request: {
      op: 'get',
      path: requestPath,
    },
  };
}
