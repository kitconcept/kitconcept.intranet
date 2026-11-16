---
myst:
  html_meta:
    description: "Reference for the notification center's frontend: components, Redux actions, reducer, and configuration."
    keywords: "notifications, NotificationBell, NotificationsPoller, Redux, reducer, headerTools, react-aria-components"
doc_type: reference
audience: developer
status: draft
last_updated: 2026-11-16
---

# Notification center components

The frontend of the notification center lives in the `@kitconcept/intranet` package.
Its UI is built with [React Aria Components](https://react-spectrum.adobe.com/react-aria/) and icons from [`lucide-react`](https://lucide.dev/).

## Files

All paths are relative to `frontend/packages/kitconcept-intranet/src/`.

| Path | Contents |
|------|----------|
| `config/notifications.ts` | `installNotifications(config)`: registers everything below. |
| `components/Notifications/NotificationBell.tsx` | Header bell, badge, and dropdown. |
| `components/Notifications/NotificationsPoller.tsx` | Fetches the latest notifications. Renders nothing. |
| `components/Notifications/Notifications.tsx` | The `/notifications` overview page. |
| `components/Notifications/NotificationItem.tsx` | One notification, used by the dropdown and the overview page. |
| `components/Notifications/NotificationSettings.tsx` | The preferences checkboxes. |
| `components/Notifications/NotificationsMenu.tsx` | The **Notifications** entry in the toolbar's personal menu. |
| `components/Notifications/helpers.ts` | Types, constants, i18n messages, and `groupByDay`. |
| `components/Notifications/Notifications.scss` | Styles. |
| `actions/notifications/notifications.js` | Redux actions. |
| `reducers/notifications/notifications.js` | Redux reducer. |
| `constants/ActionTypes.js` | `GET_NOTIFICATIONS`, `MARK_NOTIFICATIONS_READ`, `GET_NOTIFICATION_SETTINGS`, `UPDATE_NOTIFICATION_SETTINGS`. |

## Configuration

`installNotifications(config)` is called from the package's `index.ts` and changes the configuration as follows.

| Setting | Value |
|---------|-------|
| `config.addonReducers.notifications` | The notifications reducer. |
| `config.addonRoutes` | `/notifications` → `Notifications`, `exact`. |
| `config.settings.nonContentRoutes` | Adds `/notifications`, so the route isn't treated as content. |
| `config.settings.appExtras` | `NotificationsMenu` and `NotificationsPoller`, both matching `/`. |
| `headerTools` slot | `NotificationBell`, registered under the name `NotificationBell`. |

The compact workspace header, `components/Header/Header.tsx`, renders `<NotificationBell />` directly after the search.

To remove the bell from the main header in a project, unregister the slot component:

```ts
config.unRegisterSlotComponent('headerTools', 'NotificationBell', 0);
```

## Components

### `NotificationBell`

The bell button with the unread badge, and a popover listing the latest notifications.

- Takes no props.
- Renders nothing when there's no user token.
- Reads `unread` and the `latest` subrequest from the store. It doesn't fetch on mount.
- Opening the dropdown dispatches `getNotifications('latest', {bSize: 5})`.
- The badge shows the count, or `9+` above nine.
- The button's accessible name includes the unread count, for example "Notifications, 6 unread."

Built with `DialogTrigger`, `Button`, `Popover`, `Dialog`, and `Heading`.

### `NotificationsPoller`

Keeps the unread count and the `latest` subrequest fresh.
Mounted once as an app extra, because the header can render the `headerTools` slot more than once.

It dispatches `getNotifications('latest', {bSize: 5})`:

- when a user token appears, for example after login;
- when the path name changes;
- every `POLL_INTERVAL` milliseconds (60 000) while a user is logged in and the tab is visible;
- when a hidden tab becomes visible again.

While `document.visibilityState` is `hidden`, the timer is stopped.
A tab opened in the background fetches once, then waits until it's shown.

The poller relies on the browser's HTTP cache: the backend answers unchanged lists with `304 Not Modified`, and the browser serves the stored response.
See {ref}`notifications-api-caching`.

Exports:

| Name | Value | Description |
|------|-------|-------------|
| `LATEST_SUBREQUEST` | `'latest'` | Subrequest key shared by the poller and the bell. |
| `DROPDOWN_SIZE` | `5` | Number of notifications in the dropdown. |

### `Notifications`

The overview page at `/notifications`.

- Redirects anonymous users to `/login?return_url=/notifications`.
- Loads the `list` subrequest, 25 notifications at a time. **Load more** grows the batch by 25.
- Has an **All** and an **Unread** tab (RAC `Tabs`). The **Unread** tab requests `unread_only` and hides entries as soon as they're read.
- Groups entries by day with `groupByDay`.
- The gear button opens `NotificationSettings` in a `Popover`.
- Portals the Volto toolbar into the page, like other non-content routes.

### `NotificationItem`

One notification.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `item` | `Notification` | Yes | The notification to render. |
| `onRead` | `(id: string) => void` | Yes | Called to mark the notification as read. |
| `onNavigate` | `() => void` | No | Called after following one of its links, for example to close the popover. |
| `compact` | `boolean` | No | Dropdown variant: no reason line and no check button. Default `false`. |

Following the title link, or the **View changes** link of a `modified` notification, calls `onRead` for unread notifications.
**View changes** links to `<item URL>/historyview`.

The text comes from the `messages` entry named after `item.type`, with the `actor`, `title`, and `state` values.
The icon comes from the `icons` map in the same file: `Heart`, `Pencil`, and `Workflow`.

### `NotificationSettings`

A `CheckboxGroup` with one `Checkbox` per type in `NOTIFICATION_TYPES`.

- Dispatches `getNotificationSettings()` on mount.
- Renders nothing until the preferences are loaded.
- Each change dispatches `updateNotificationSettings()` with the full set of types.

### `NotificationsMenu`

Plugs a **Notifications** link to `/notifications` into the `toolbar-user-menu` pluggable, with the ID `intranet-notifications`.

## Actions

Exported from `actions/index.js`.

| Action | Request | Description |
|--------|---------|-------------|
| `getNotifications(subrequest = 'list', {bSize = 25, bStart = 0, unreadOnly = false} = {})` | `GET /@notifications` | Loads notifications into the given subrequest. |
| `markNotificationsRead(ids?)` | `PATCH /@notifications` | Marks the given IDs as read, or all without `ids`. |
| `getNotificationSettings()` | `GET /@notifications-settings` | Loads the preferences. |
| `updateNotificationSettings(data)` | `PATCH /@notifications-settings` | Saves the preferences. |

## Reducer

The reducer is mounted at `state.notifications`.

```ts
type NotificationsState = {
  unread: number;
  subrequests: Record<string, NotificationList>;
  settings: Record<NotificationType, boolean> | null;
};

type NotificationList = {
  items: Notification[];
  items_total: number;
  loaded: boolean;
  loading: boolean;
  error?: unknown;
};
```

| Action | Effect |
|--------|--------|
| `GET_NOTIFICATIONS_PENDING` | Sets `loading` on the subrequest, keeping its items. |
| `GET_NOTIFICATIONS_SUCCESS` | Replaces the subrequest's items and `items_total`, and sets `unread` from the response. |
| `GET_NOTIFICATIONS_FAIL` | Empties the subrequest and stores the error. |
| `MARK_NOTIFICATIONS_READ_SUCCESS` | Marks the items as read in **every** subrequest. Lowers `unread` by the number of those items that were unread, or sets it to `0` when all are marked as read. |
| `GET_NOTIFICATION_SETTINGS_SUCCESS`, `UPDATE_NOTIFICATION_SETTINGS_SUCCESS` | Stores the preferences in `settings`. |

Subrequest keys in use: `latest` (bell and poller) and `list` (overview page).

## Helpers

Exported from `components/Notifications/helpers.ts`.

| Name | Description |
|------|-------------|
| `Notification`, `NotificationType`, `NotificationList`, `NotificationsState` | Types matching the {doc}`REST API </developer/reference/api/notifications>`. |
| `NOTIFICATION_TYPES` | `['like', 'modified', 'transition']`. The order of the preferences checkboxes. |
| `POLL_INTERVAL` | `60_000`. |
| `messages` | `react-intl` messages, including one per notification type. |
| `settingMessages` | The preference label of each notification type. |
| `groupByDay(items, now?)` | Groups notifications, newest first, under the keys `today`, `yesterday`, or an ISO date `YYYY-MM-DD`, in the browser's time zone. |

## CSS classes

The main classes, for theming:

| Class | Element |
|-------|---------|
| `.notification-bell` | The bell button. |
| `.notification-badge` | The unread badge. |
| `.notification-popover` | The dropdown and the preferences popover. |
| `.notification-item` | One notification. Modifiers: `.unread`, `.compact`, `.notification-<type>`. |
| `.notifications-view` | The overview page. |
| `.notification-settings` | The preferences. |

## See also

- {doc}`/developer/concepts/notifications`
- {doc}`/developer/reference/api/notifications`
- {doc}`/developer/how-to-guides/add-notification-type`
- {doc}`slots`
