import { defineMessages } from 'react-intl';

export type NotificationType = 'like' | 'modified' | 'transition';

export type Notification = {
  '@id': string;
  id: string;
  type: NotificationType;
  title: string;
  portal_type: string;
  created: string;
  read: boolean;
  actor: { id: string; fullname: string };
  transition?: string;
  review_state?: string;
  review_state_title?: string;
};

export type NotificationList = {
  items: Notification[];
  items_total: number;
  loaded: boolean;
  loading: boolean;
  error?: unknown;
};

export type NotificationsState = {
  unread: number;
  subrequests: Record<string, NotificationList>;
  settings: Record<NotificationType, boolean> | null;
};

export const NOTIFICATION_TYPES: NotificationType[] = [
  'like',
  'modified',
  'transition',
];

/** How often the unread count is refreshed while the page stays open. */
export const POLL_INTERVAL = 60_000;

export const messages = defineMessages({
  notifications: { id: 'Notifications', defaultMessage: 'Notifications' },
  bellLabel: {
    id: 'notificationsBellLabel',
    defaultMessage:
      '{count, plural, =0 {Notifications} one {Notifications, # unread} other {Notifications, # unread}}',
  },
  like: {
    id: 'notificationLike',
    defaultMessage: '{actor} liked {title}',
  },
  modified: {
    id: 'notificationModified',
    defaultMessage: '{actor} edited {title}',
  },
  transition: {
    id: 'notificationTransition',
    defaultMessage: '{actor} changed the state of {title} to {state}',
  },
  reasonAuthor: {
    id: 'notificationReasonAuthor',
    defaultMessage: 'You are an author of this item',
  },
  viewChanges: { id: 'View changes', defaultMessage: 'View changes' },
  markAsRead: { id: 'Mark as read', defaultMessage: 'Mark as read' },
  markAllAsRead: { id: 'Mark all as read', defaultMessage: 'Mark all as read' },
  seeAll: {
    id: 'See all notifications',
    defaultMessage: 'See all notifications',
  },
  empty: {
    id: 'notificationsEmpty',
    defaultMessage:
      "You're all caught up. New activity on your content shows up here.",
  },
  emptyUnread: {
    id: 'notificationsEmptyUnread',
    defaultMessage: 'No unread notifications.',
  },
  all: { id: 'notificationsFilterAll', defaultMessage: 'All' },
  unread: {
    id: 'notificationsFilterUnread',
    defaultMessage: 'Unread ({count})',
  },
  filter: { id: 'Notification filter', defaultMessage: 'Notification filter' },
  today: { id: 'Today', defaultMessage: 'Today' },
  yesterday: { id: 'Yesterday', defaultMessage: 'Yesterday' },
  loading: {
    id: 'Loading notifications',
    defaultMessage: 'Loading notifications...',
  },
  loadError: {
    id: 'Unable to load notifications',
    defaultMessage: 'Unable to load notifications.',
  },
  loadMore: { id: 'Load more', defaultMessage: 'Load more' },
  preferences: {
    id: 'Notification preferences',
    defaultMessage: 'Notification preferences',
  },
  preferencesHelp: {
    id: 'notificationPreferencesHelp',
    defaultMessage: 'Choose what you want to be notified about.',
  },
  settingLike: {
    id: 'notificationSettingLike',
    defaultMessage: 'Someone likes content I author',
  },
  settingModified: {
    id: 'notificationSettingModified',
    defaultMessage: 'Someone edits content I author',
  },
  settingTransition: {
    id: 'notificationSettingTransition',
    defaultMessage:
      'Someone changes the state of content I author (publish, retract, …)',
  },
});

export const settingMessages = {
  like: messages.settingLike,
  modified: messages.settingModified,
  transition: messages.settingTransition,
};

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

/** Group notifications (already newest first) under day keys. */
export function groupByDay(
  items: Notification[],
  now: Date = new Date(),
): { key: 'today' | 'yesterday' | string; items: Notification[] }[] {
  const today = startOfDay(now);
  const yesterday = today - 24 * 60 * 60 * 1000;
  const groups: { key: string; items: Notification[] }[] = [];
  for (const item of items) {
    const day = startOfDay(new Date(item.created));
    const key =
      day === today
        ? 'today'
        : day === yesterday
          ? 'yesterday'
          : new Date(day).toISOString().slice(0, 10);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(item);
    else groups.push({ key, items: [item] });
  }
  return groups;
}
