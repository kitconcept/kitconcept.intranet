import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Button,
  Dialog,
  DialogTrigger,
  Popover,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from 'react-aria-components';
import { CheckCheck, Settings } from 'lucide-react';
import Toolbar from '@plone/volto/components/manage/Toolbar/Toolbar';
import { useClient } from '@plone/volto/hooks/client/useClient';
import {
  getNotifications,
  markNotificationsRead,
} from '../../actions/notifications/notifications';
import NotificationItem from './NotificationItem';
import NotificationSettings from './NotificationSettings';
import {
  groupByDay,
  messages,
  type NotificationList,
  type NotificationsState,
} from './helpers';
import './Notifications.scss';

const SUBREQUEST = 'list';
const PAGE_SIZE = 25;

type Filter = 'all' | 'unread';

/** Overview of all the current user's notifications; preferences behind the gear. */
export default function Notifications() {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const isClient = useClient();
  const token = useSelector((state: any) => state.userSession?.token);
  const [filter, setFilter] = useState<Filter>('all');
  const [size, setSize] = useState(PAGE_SIZE);
  const unread = useSelector(
    (state: { notifications: NotificationsState }) =>
      state.notifications?.unread ?? 0,
  );
  const list = useSelector(
    (state: { notifications: NotificationsState }) =>
      state.notifications?.subrequests?.[SUBREQUEST],
  ) as NotificationList | undefined;

  useEffect(() => {
    if (!token) return;
    dispatch(
      getNotifications(SUBREQUEST, {
        bSize: size,
        unreadOnly: filter === 'unread',
      }),
    );
  }, [dispatch, token, filter, size]);

  if (!token)
    return (
      <Redirect to={`/login?return_url=${encodeURIComponent(pathname)}`} />
    );

  const onRead = (id: string) => dispatch(markNotificationsRead([id]));
  // In the Unread tab, entries leave the list as soon as they are read.
  const visibleItems = (list?.items ?? []).filter(
    (item) => filter === 'all' || !item.read,
  );
  const groups = groupByDay(visibleItems);
  const dayLabel = (key: string) =>
    key === 'today'
      ? intl.formatMessage(messages.today)
      : key === 'yesterday'
        ? intl.formatMessage(messages.yesterday)
        : intl.formatDate(key, { dateStyle: 'long' } as any);

  return (
    <section
      className="notifications-view"
      aria-labelledby="notifications-title"
    >
      <div className="notifications-view-header">
        <h1 id="notifications-title">
          {intl.formatMessage(messages.notifications)}
        </h1>
        <div className="notifications-view-actions">
          {unread > 0 && (
            <Button
              className="notifications-mark-all"
              onPress={() => dispatch(markNotificationsRead())}
            >
              <CheckCheck size={16} aria-hidden="true" />
              {intl.formatMessage(messages.markAllAsRead)}
            </Button>
          )}
          <DialogTrigger>
            <Button
              className="notifications-settings-button"
              aria-label={intl.formatMessage(messages.preferences)}
            >
              <Settings size={20} aria-hidden="true" />
            </Button>
            <Popover
              placement="bottom end"
              className="notification-popover notifications-settings-popover"
            >
              <Dialog
                className="notifications-settings-dialog"
                aria-label={intl.formatMessage(messages.preferences)}
              >
                <NotificationSettings />
              </Dialog>
            </Popover>
          </DialogTrigger>
        </div>
      </div>
      <Tabs
        selectedKey={filter}
        onSelectionChange={(key) => {
          setFilter(key as Filter);
          setSize(PAGE_SIZE);
        }}
      >
        <TabList
          className="notifications-view-tabs"
          aria-label={intl.formatMessage(messages.filter)}
        >
          <Tab id="all">{intl.formatMessage(messages.all)}</Tab>
          <Tab id="unread">
            {intl.formatMessage(messages.unread, { count: unread })}
          </Tab>
        </TabList>
        <TabPanel id={filter}>
          {list?.error ? (
            <p role="alert">{intl.formatMessage(messages.loadError)}</p>
          ) : !list?.loaded ? (
            <p role="status">{intl.formatMessage(messages.loading)}</p>
          ) : !visibleItems.length ? (
            <p className="notification-empty">
              {intl.formatMessage(
                filter === 'unread' ? messages.emptyUnread : messages.empty,
              )}
            </p>
          ) : (
            <>
              {groups.map((group) => (
                <div key={group.key} className="notifications-day">
                  <h2>{dayLabel(group.key)}</h2>
                  <ul className="notification-list">
                    {group.items.map((item) => (
                      <NotificationItem
                        key={item.id}
                        item={item}
                        onRead={onRead}
                      />
                    ))}
                  </ul>
                </div>
              ))}
              {list.items_total > list.items.length && (
                <Button
                  className="notifications-load-more"
                  onPress={() => setSize((value) => value + PAGE_SIZE)}
                >
                  {intl.formatMessage(messages.loadMore)}
                </Button>
              )}
            </>
          )}
        </TabPanel>
      </Tabs>
      {isClient &&
        document.getElementById('toolbar') &&
        createPortal(
          <Toolbar pathname={pathname} inner={<span />} />,
          document.getElementById('toolbar')!,
        )}
    </section>
  );
}
