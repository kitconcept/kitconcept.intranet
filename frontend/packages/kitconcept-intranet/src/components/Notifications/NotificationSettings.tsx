import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Checkbox, CheckboxGroup, Label, Text } from 'react-aria-components';
import { Check } from 'lucide-react';
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '../../actions/notifications/notifications';
import {
  messages,
  NOTIFICATION_TYPES,
  settingMessages,
  type NotificationsState,
  type NotificationType,
} from './helpers';

/** One checkbox per notification type; each change is saved right away. */
export default function NotificationSettings() {
  const intl = useIntl();
  const dispatch = useDispatch();
  const settings = useSelector(
    (state: { notifications: NotificationsState }) =>
      state.notifications?.settings,
  );

  useEffect(() => {
    dispatch(getNotificationSettings());
  }, [dispatch]);

  if (!settings) return null;

  const enabled = NOTIFICATION_TYPES.filter((type) => settings[type]);

  return (
    <section className="notification-settings">
      <CheckboxGroup
        value={enabled}
        onChange={(values) =>
          dispatch(
            updateNotificationSettings(
              Object.fromEntries(
                NOTIFICATION_TYPES.map((type) => [type, values.includes(type)]),
              ) as Record<NotificationType, boolean>,
            ),
          )
        }
      >
        <Label className="notification-settings-title">
          {intl.formatMessage(messages.preferences)}
        </Label>
        <Text slot="description">
          {intl.formatMessage(messages.preferencesHelp)}
        </Text>
        {NOTIFICATION_TYPES.map((type) => (
          <Checkbox key={type} value={type} className="notification-checkbox">
            <span className="notification-checkbox-box" aria-hidden="true">
              <Check size={14} />
            </span>
            {intl.formatMessage(settingMessages[type])}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </section>
  );
}
