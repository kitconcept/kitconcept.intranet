import type React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { Button } from 'react-aria-components';
import { Check, Heart, Pencil, Workflow } from 'lucide-react';
import cx from 'classnames';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import VoltoRelativeDate from '@plone/volto/components/theme/FormattedDate/FormattedRelativeDate';
import { messages, type Notification } from './helpers';

// The JS component's inferred props mark every prop as required.
const FormattedRelativeDate = VoltoRelativeDate as React.ComponentType<{
  date: string;
}>;

const icons = { like: Heart, modified: Pencil, transition: Workflow };

type Props = {
  item: Notification;
  /** Mark this notification as read. */
  onRead: (id: string) => void;
  /** Called after following the item's link, e.g. to close a popover. */
  onNavigate?: () => void;
  /** Dropdown variant: no reason line and no separate read button. */
  compact?: boolean;
};

/** One notification: who did what to which item, when, and why you see it. */
export default function NotificationItem({
  item,
  onRead,
  onNavigate,
  compact = false,
}: Props) {
  const intl = useIntl();
  const Icon = icons[item.type] ?? Pencil;
  const url = flattenToAppURL(item['@id']);
  const follow = () => {
    if (!item.read) onRead(item.id);
    onNavigate?.();
  };

  return (
    <li
      className={cx('notification-item', `notification-${item.type}`, {
        unread: !item.read,
        compact,
      })}
    >
      <span className="notification-icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <div className="notification-body">
        <p className="notification-text">
          {intl.formatMessage(messages[item.type], {
            actor: <strong key="actor">{item.actor.fullname}</strong>,
            title: (
              <Link key="title" to={url} onClick={follow}>
                {item.title}
              </Link>
            ),
            state: (
              <strong key="state">
                {item.review_state_title ?? item.review_state}
              </strong>
            ),
          })}
        </p>
        <p className="notification-meta">
          <FormattedRelativeDate date={item.created} />
          {item.type === 'modified' && (
            <>
              {' · '}
              <Link to={`${url}/historyview`} onClick={follow}>
                {intl.formatMessage(messages.viewChanges)}
              </Link>
            </>
          )}
          {!compact && (
            <>
              {' · '}
              {intl.formatMessage(messages.reasonAuthor)}
            </>
          )}
        </p>
      </div>
      {!item.read && !compact && (
        <Button
          className="notification-mark-read"
          aria-label={intl.formatMessage(messages.markAsRead)}
          onPress={() => onRead(item.id)}
        >
          <Check size={16} aria-hidden="true" />
        </Button>
      )}
      {!item.read && <span className="notification-dot" aria-hidden="true" />}
    </li>
  );
}
