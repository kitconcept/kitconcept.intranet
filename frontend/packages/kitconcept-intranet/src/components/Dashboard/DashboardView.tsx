import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { defineMessages, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import config from '@plone/volto/registry';
import { getContent } from '@plone/volto/actions/content/content';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import Toast from '@plone/volto/components/manage/Toast/Toast';
import Toolbar from '@plone/volto/components/manage/Toolbar/Toolbar';
import RenderBlocks from '@plone/volto/components/theme/View/RenderBlocks';
import View from '@plone/volto/components/theme/View/View';
import ErrorView from '@plone/volto/components/theme/Error/Error';
import Helmet from '@plone/volto/helpers/Helmet/Helmet';
import { useClient } from '@plone/volto/hooks/client/useClient';
import { getParentUrl } from '@plone/volto/helpers/Url/Url';
import penSVG from '@plone/volto/icons/pen.svg';
import {
  getDashboard,
  createDashboard,
} from '../../actions/dashboard/dashboard';

const messages = defineMessages({
  dashboard: { id: 'Dashboard', defaultMessage: 'Dashboard' },
  edit: { id: 'Edit', defaultMessage: 'Edit' },
  error: { id: 'Error', defaultMessage: 'Error' },
  createError: {
    id: 'The dashboard could not be created.',
    defaultMessage: 'The dashboard could not be created.',
  },
});

/**
 * Route for `{person}/dashboard`.
 *
 * Shows the user's Dashboard if it exists. Otherwise shows the default blocks
 * of the Dashboard content type, with an edit button that creates it.
 */
export default function DashboardView(props: any) {
  // Strip a trailing slash so the parent is the Person, not the dashboard
  const pathname = props.location.pathname.replace(/\/+$/, '');
  const personPath = getParentUrl(pathname);
  const intl = useIntl();
  const dispatch = useDispatch();
  const history = useHistory();
  const isClient = useClient();
  const token = useSelector((state: any) => state.userSession?.token);
  const [status, setStatus] = useState<
    'loading' | 'exists' | 'default' | 'error'
  >('loading');
  const [defaultContent, setDefaultContent] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus('loading');
      try {
        await dispatch(getContent(pathname, null, 'dashboard'));
        if (!cancelled) setStatus('exists');
      } catch (contentError: any) {
        if (cancelled) return;
        if (contentError.status !== 404) {
          setError(contentError);
          setStatus('error');
          return;
        }
        // Not created yet: show the default blocks of the content type.
        // A 404 here means the parent is not a Person.
        try {
          const data = await dispatch(getDashboard(personPath));
          if (cancelled) return;
          setDefaultContent(data);
          setStatus('default');
        } catch (dashboardError: any) {
          if (cancelled) return;
          setError(dashboardError);
          setStatus('error');
        }
      }
    }
    if (token) load();
    return () => {
      cancelled = true;
    };
  }, [dispatch, pathname, personPath, token]);

  async function onEdit() {
    try {
      await dispatch(createDashboard(personPath));
      history.push(`${pathname}/edit`);
    } catch {
      toast.error(
        <Toast
          error
          title={intl.formatMessage(messages.error)}
          content={intl.formatMessage(messages.createError)}
        />,
      );
    }
  }

  // Anonymous users have no dashboard; this may be a normal page named
  // "dashboard", so let the regular content view handle it.
  if (!token || status === 'exists') return <View {...props} />;
  if (status === 'error') return <ErrorView error={error} />;
  if (status === 'loading') return null;

  const Container = config.getComponent({ name: 'Container' }).component;

  return (
    <Container id="page-document">
      <Helmet title={intl.formatMessage(messages.dashboard)} />
      <RenderBlocks
        {...props}
        // The dashboard doesn't exist yet: blocks that call the API relative
        // to the page (e.g. listing's @querystring-search) use the Person.
        path={personPath}
        content={{
          ...defaultContent,
          title: intl.formatMessage(messages.dashboard),
        }}
      />
      {isClient &&
        document.getElementById('toolbar') &&
        createPortal(
          <Toolbar
            pathname={pathname}
            hideDefaultViewButtons
            inner={
              <button
                aria-label={intl.formatMessage(messages.edit)}
                className="edit"
                onClick={onEdit}
              >
                <Icon
                  name={penSVG}
                  size="30px"
                  className="circled"
                  title={intl.formatMessage(messages.edit)}
                />
              </button>
            }
          />,
          document.getElementById('toolbar')!,
        )}
    </Container>
  );
}
