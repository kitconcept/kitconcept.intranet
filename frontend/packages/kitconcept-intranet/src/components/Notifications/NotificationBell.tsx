import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Popover,
} from 'react-aria-components';
import { Bell } from 'lucide-react';
import {
  getNotifications,
  markNotificationsRead,
} from '../../actions/notifications/notifications';
import NotificationItem from './NotificationItem';
import { useNotificationsEnabled } from './useNotificationsEnabled';
import { DROPDOWN_SIZE, LATEST_SUBREQUEST } from './NotificationsPoller';
import {
  messages,
  type NotificationList,
  type NotificationsState,
} from './helpers';
import './Notifications.scss';

/** Header bell with unread badge and a dropdown of the latest notifications. */
export default function NotificationBell() {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [isOpen, setOpen] = useState(false);
  const token = useSelector((state: any) => state.userSession?.token);
  const enabled = useNotificationsEnabled();
  const unread = useSelector(
    (state: { notifications: NotificationsState }) =>
      state.notifications?.unread ?? 0,
  );
  const latest = useSelector(
    (state: { notifications: NotificationsState }) =>
      state.notifications?.subrequests?.[LATEST_SUBREQUEST],
  ) as NotificationList | undefined;

  // Fetching lives in NotificationsPoller; opening the dropdown refreshes it.
  const refresh = () =>
    dispatch(getNotifications(LATEST_SUBREQUEST, { bSize: DROPDOWN_SIZE }));

  if (!token || !enabled) return null;

  const onRead = (id: string) => dispatch(markNotificationsRead([id]));
  const badge = unread > 9 ? '9+' : String(unread);

  return (
    <DialogTrigger
      isOpen={isOpen}
      onOpenChange={(open) => {
        setOpen(open);
        if (open) refresh();
      }}
    >
      <Button
        className="notification-bell"
        aria-label={intl.formatMessage(messages.bellLabel, { count: unread })}
      >
        <Bell size={20} aria-hidden="true" />
        {unread > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {badge}
          </span>
        )}
      </Button>
      <Popover placement="bottom end" className="notification-popover">
        <Dialog className="notification-dropdown">
          <div className="notification-dropdown-header">
            <Heading slot="title">
              {intl.formatMessage(messages.notifications)}
            </Heading>
            {unread > 0 && (
              <Button
                className="notification-link-button"
                onPress={() => dispatch(markNotificationsRead())}
              >
                {intl.formatMessage(messages.markAllAsRead)}
              </Button>
            )}
          </div>
          {latest?.items?.length ? (
            <ul className="notification-list">
              {latest.items.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onRead={onRead}
                  onNavigate={() => setOpen(false)}
                  compact
                />
              ))}
            </ul>
          ) : (
            <p className="notification-empty">
              {intl.formatMessage(
                latest?.loaded ? messages.empty : messages.loading,
              )}
            </p>
          )}
          <Link
            className="notification-see-all"
            to="/notifications"
            onClick={() => setOpen(false)}
          >
            {intl.formatMessage(messages.seeAll)}
          </Link>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
