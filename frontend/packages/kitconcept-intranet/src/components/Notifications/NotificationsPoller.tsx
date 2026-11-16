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
 */
export default function NotificationsPoller() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const token = useSelector((state: any) => state.userSession?.token);

  useEffect(() => {
    if (!token) return;
    const refresh = () =>
      dispatch(getNotifications(LATEST_SUBREQUEST, { bSize: DROPDOWN_SIZE }));
    refresh();
    const timer = window.setInterval(refresh, POLL_INTERVAL);
    return () => window.clearInterval(timer);
  }, [dispatch, token, pathname]);

  return null;
}
