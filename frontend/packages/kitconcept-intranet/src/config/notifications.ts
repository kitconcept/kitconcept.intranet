import type { ConfigType } from '@plone/registry';
import notifications from '../reducers/notifications/notifications';
import NotificationBell from '../components/Notifications/NotificationBell';
import Notifications from '../components/Notifications/Notifications';
import NotificationsMenu from '../components/Notifications/NotificationsMenu';
import NotificationsPoller from '../components/Notifications/NotificationsPoller';

/** Notification center: reducer, header bell, overview route, menu entry. */
export default function installNotifications(config: ConfigType) {
  config.addonReducers = {
    ...config.addonReducers,
    notifications,
  };
  config.addonRoutes = [
    ...(config.addonRoutes || []),
    { path: '/notifications', exact: true, component: Notifications },
  ];
  config.settings.nonContentRoutes = [
    ...config.settings.nonContentRoutes,
    '/notifications',
  ];
  config.settings.appExtras = [
    ...(config.settings.appExtras || []),
    { match: '/', component: NotificationsMenu, props: {} },
    { match: '/', component: NotificationsPoller, props: {} },
  ];
  config.registerSlotComponent({
    slot: 'headerTools',
    name: 'NotificationBell',
    component: NotificationBell,
  });
  return config;
}
