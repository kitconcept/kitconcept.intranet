/**
 * Notification center reducer.
 * @module reducers/notifications/notifications
 */
import {
  GET_NOTIFICATIONS,
  GET_NOTIFICATION_SETTINGS,
  MARK_NOTIFICATIONS_READ,
  UPDATE_NOTIFICATION_SETTINGS,
} from '../../constants/ActionTypes';

const emptyList = { items: [], items_total: 0, loaded: false, loading: false };

const initialState = {
  unread: 0,
  subrequests: {},
  settings: null,
};

function markRead(list, ids) {
  return {
    ...list,
    items: list.items.map((item) =>
      !ids || ids.includes(item.id) ? { ...item, read: true } : item,
    ),
  };
}

export default function notifications(state = initialState, action = {}) {
  switch (action.type) {
    case `${GET_NOTIFICATIONS}_PENDING`:
      return {
        ...state,
        subrequests: {
          ...state.subrequests,
          [action.subrequest]: {
            ...(state.subrequests[action.subrequest] || emptyList),
            loading: true,
          },
        },
      };
    case `${GET_NOTIFICATIONS}_SUCCESS`:
      return {
        ...state,
        unread: action.result.unread,
        subrequests: {
          ...state.subrequests,
          [action.subrequest]: {
            items: action.result.items,
            items_total: action.result.items_total,
            loaded: true,
            loading: false,
          },
        },
      };
    case `${GET_NOTIFICATIONS}_FAIL`:
      return {
        ...state,
        subrequests: {
          ...state.subrequests,
          [action.subrequest]: { ...emptyList, error: action.error },
        },
      };
    case `${MARK_NOTIFICATIONS_READ}_SUCCESS`: {
      if (!action.ids) {
        return {
          ...state,
          unread: 0,
          subrequests: Object.fromEntries(
            Object.entries(state.subrequests).map(([key, list]) => [
              key,
              markRead(list),
            ]),
          ),
        };
      }
      // Only ids that were still unread lower the count.
      const wasUnread = new Set(
        Object.values(state.subrequests)
          .flatMap((list) => list.items)
          .filter((item) => !item.read && action.ids.includes(item.id))
          .map((item) => item.id),
      );
      return {
        ...state,
        unread: Math.max(state.unread - wasUnread.size, 0),
        subrequests: Object.fromEntries(
          Object.entries(state.subrequests).map(([key, list]) => [
            key,
            markRead(list, action.ids),
          ]),
        ),
      };
    }
    case `${GET_NOTIFICATION_SETTINGS}_SUCCESS`:
    case `${UPDATE_NOTIFICATION_SETTINGS}_SUCCESS`:
      return { ...state, settings: action.result };
    default:
      return state;
  }
}
