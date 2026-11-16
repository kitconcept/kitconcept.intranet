import { ToggleButton } from '@plone/components';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import cx from 'classnames';
import Toast from '@plone/volto/components/manage/Toast/Toast';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { toggleWatch } from '../../actions/watch/watch';
import EyeIcon from './EyeIcon';

const messages = defineMessages({
  watch: {
    id: 'Watch this content',
    defaultMessage: 'Watch this content',
  },
  unwatch: {
    id: 'Stop watching this content',
    defaultMessage: 'Stop watching this content',
  },
  watchLabel: {
    id: 'Watch',
    defaultMessage: 'Watch',
  },
  watchingLabel: {
    id: 'Watching',
    defaultMessage: 'Watching',
  },
  watchStarted: {
    id: 'You are now watching this content and will be notified of changes by email.',
    defaultMessage:
      'You are now watching this content and will be notified of changes by email.',
  },
  watchStopped: {
    id: 'You will no longer receive updates for this content.',
    defaultMessage: 'You will no longer receive updates for this content.',
  },
  watchFailed: {
    id: 'Something went wrong while changing the watch status.',
    defaultMessage: 'Something went wrong while changing the watch status.',
  },
});

/**
 * Eye toggle to start or stop watching the current content item.
 *
 * Renders nothing unless the feature is enabled, the content has the
 * watchers behavior (the `watch` component is present) and the user is
 * logged in. `showLabel` adds the text "Watch" / "Watching" next to the eye.
 */
const WatchButton = ({
  showLabel = false,
  size = 33,
  className = undefined,
}) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const content = useSelector((state) => state.content.data);
  const enabled = useSelector(
    (state) => state.site.data?.['kitconcept.intranet.enable_content_watching'],
  );
  const loggedIn = useSelector((state) => Boolean(state.userSession.token));
  const watchComponent = content?.['@components']?.watch;
  const [watching, setWatching] = useState(!!watchComponent?.watching);

  useEffect(() => {
    setWatching(!!watchComponent?.watching);
  }, [watchComponent?.watching]);

  if (!enabled || !watchComponent || !loggedIn) {
    return null;
  }

  const onWatch = () => {
    dispatch(toggleWatch(flattenToAppURL(content['@id'])))
      .then((resp) => {
        const nowWatching = !!resp?.watching;
        setWatching(nowWatching);
        toast.success(
          <Toast
            success
            title={intl.formatMessage(
              nowWatching ? messages.watchStarted : messages.watchStopped,
            )}
            content=""
          />,
        );
      })
      .catch(() => {
        toast.error(
          <Toast
            error
            title={intl.formatMessage(messages.watchFailed)}
            content=""
          />,
        );
      });
  };

  // The accessible name stays the same; `aria-pressed` tells whether the
  // user is watching. The tooltip says what a click will do.
  const tooltip = intl.formatMessage(
    watching ? messages.unwatch : messages.watch,
  );

  return (
    <ToggleButton
      className={cx('watch-button', className, { watching })}
      aria-label={intl.formatMessage(messages.watch)}
      isSelected={watching}
      onChange={onWatch}
    >
      <span className="icon-wrapper" title={tooltip}>
        <EyeIcon filled={watching} size={size} />
      </span>
      {showLabel && (
        <span className="watch-button-label" aria-hidden="true">
          {intl.formatMessage(
            watching ? messages.watchingLabel : messages.watchLabel,
          )}
        </span>
      )}
    </ToggleButton>
  );
};

export default WatchButton;
