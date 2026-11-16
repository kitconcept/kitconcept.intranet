import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getNotifications } from '../../actions/notifications/notifications';
import { POLL_INTERVAL } from './helpers';

export const LATEST_SUBREQUEST = 'latest';
export const DROPDOWN_SIZE = 5;

/**
 * Keep the unread count and the latest notifications fresh: on login, on
 * every navigation and on a slow poll. Mounted once as an app extra, because
 * the header renders the bell more than once (desktop and mobile tools).
 *
 * Hidden tabs don't poll. When a tab becomes visible again, it refreshes
 * right away and resumes polling. The backend answers polls that find
 * nothing new with 304 Not Modified, which the browser serves from its cache.
 */
export default function NotificationsPoller() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const token = useSelector((state: any) => state.userSession?.token);

  useEffect(() => {
    if (!token) return;
    const refresh = () =>
      dispatch(getNotifications(LATEST_SUBREQUEST, { bSize: DROPDOWN_SIZE }));
    let timer: number | undefined;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(refresh, POLL_INTERVAL);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        window.clearInterval(timer);
        timer = undefined;
      } else {
        refresh();
        start();
      }
    };

    // Navigating happens in a visible tab; a tab opened in the background
    // fetches once and then waits until it's shown.
    refresh();
    if (document.visibilityState !== 'hidden') start();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [dispatch, token, pathname]);

  return null;
}
