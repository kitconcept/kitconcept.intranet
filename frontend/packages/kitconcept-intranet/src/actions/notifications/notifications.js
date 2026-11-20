/**
 * Notification center actions.
 * @module actions/notifications/notifications
 */
import {
  GET_NOTIFICATIONS,
  GET_NOTIFICATION_SETTINGS,
  MARK_NOTIFICATIONS_READ,
  UPDATE_NOTIFICATION_SETTINGS,
} from '../../constants/ActionTypes';

/**
 * Fetch the current user's notifications into `subrequest` ("latest" for the
 * header bell, "list" for the overview page).
 */
export function getNotifications(
  subrequest = 'list',
  { bSize = 25, bStart = 0, unreadOnly = false } = {},
) {
  const params = new URLSearchParams({
    b_size: String(bSize),
    b_start: String(bStart),
  });
  if (unreadOnly) params.set('unread_only', '1');
  return {
    type: GET_NOTIFICATIONS,
    subrequest,
    request: { op: 'get', path: `/@notifications?${params}` },
  };
}

/** Mark the given notifications as read, or all of them without `ids`. */
export function markNotificationsRead(ids) {
  return {
    type: MARK_NOTIFICATIONS_READ,
    ids,
    request: {
      op: 'patch',
      path: '/@notifications',
      data: ids ? { ids } : {},
    },
  };
}

export function getNotificationSettings() {
  return {
    type: GET_NOTIFICATION_SETTINGS,
    request: { op: 'get', path: '/@notifications-settings' },
  };
}

export function updateNotificationSettings(data) {
  return {
    type: UPDATE_NOTIFICATION_SETTINGS,
    request: { op: 'patch', path: '/@notifications-settings', data },
  };
}
