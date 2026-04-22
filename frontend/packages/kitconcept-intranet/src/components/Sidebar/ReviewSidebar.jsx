import { useState, Fragment, useCallback, useEffect, useRef } from 'react';
import { Button, Tab } from 'semantic-ui-react';
import { useSelector } from 'react-redux';
import { compose } from 'redux';
import { withCookies } from 'react-cookie';
import { defineMessages, useIntl } from 'react-intl';
import cx from 'classnames';
import { createPortal } from 'react-dom';

import BodyClass from '@plone/volto/helpers/BodyClass/BodyClass';
import { getCookieOptions } from '@plone/volto/helpers/Cookies/cookies';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import expandSVG from '@plone/volto/icons/left-key.svg';
import collapseSVG from '@plone/volto/icons/right-key.svg';
import DelegateReview from './DelegateReview';
import { useClient } from '@plone/volto/hooks/client/useClient';
import PostponeReview from './PostponeReview';

const messages = defineMessages({
  review: {
    id: 'Review',
    defaultMessage: 'Review',
  },
  shrinkSidebar: {
    id: 'Shrink sidebar',
    defaultMessage: 'Shrink sidebar',
  },
  expandSidebar: {
    id: 'Expand sidebar',
    defaultMessage: 'Expand sidebar',
  },
});

const ReviewSidebar = (props) => {
  const intl = useIntl();
  const { cookies, content, documentTab = true, review } = props;
  const [expanded, setExpanded] = useState(
    cookies.get('sidebar_expanded') !== 'false',
  );
  const isClient = useClient();
  const [size] = useState(0);
  const [showFull, setshowFull] = useState(true);
  const sidebarContainerRef = useRef(null);

  const tab = useSelector((state) => state.sidebar.tab);
  const toolbarExpanded = useSelector((state) => state.toolbar.expanded);

  useEffect(() => {
    const el = document.getElementById('sidebar');
    if (!el) return;
    const handler = (e) => e.stopImmediatePropagation();
    el.addEventListener('mousedown', handler);
    return () => el.removeEventListener('mousedown', handler);
  }, []);

  const onToggleExpanded = () => {
    cookies.set('sidebar_expanded', !expanded, getCookieOptions());
    setExpanded(!expanded);
    resetFullSizeSidebar();
  };

  const resetFullSizeSidebar = useCallback(() => {
    if (!expanded) {
      const sidebarContainer = sidebarContainerRef.current;
      if (!sidebarContainer) return;
      sidebarContainer.classList.remove('full-size');
      sidebarContainer.classList.remove('no-toolbar');
      setshowFull(true);
    }
  }, [expanded]);

  const onToggleFullSize = useCallback(() => {
    const sidebarContainer = sidebarContainerRef.current;
    if (!sidebarContainer) return;

    if (showFull) {
      sidebarContainer.classList.add('full-size');
      if (!toolbarExpanded) {
        sidebarContainer.classList.add('no-toolbar');
      } else {
        sidebarContainer.classList.remove('no-toolbar');
      }
    } else {
      sidebarContainer.classList.remove('full-size');
      sidebarContainer.classList.remove('no-toolbar');
    }
    setshowFull(!showFull);
  }, [showFull, toolbarExpanded]);

  return (
    <Fragment>
      <BodyClass
        className={expanded ? 'has-sidebar' : 'has-sidebar-collapsed'}
      />
      <div
        ref={sidebarContainerRef}
        className={cx('sidebar-container', { collapsed: !expanded })}
        style={size > 0 ? { width: size } : null}
      >
        <Button
          type="button"
          aria-label={
            expanded
              ? intl.formatMessage(messages.shrinkSidebar)
              : intl.formatMessage(messages.expandSidebar)
          }
          className={
            content && content.review_state
              ? `${content.review_state} trigger`
              : 'trigger'
          }
          onClick={onToggleExpanded}
        />
        <Button
          type="button"
          className="full-size-sidenav-btn"
          onClick={onToggleFullSize}
          aria-label="full-screen-sidenav"
        >
          <Icon
            className="full-size-icon"
            name={showFull ? expandSVG : collapseSVG}
          />
        </Button>

        <Tab
          menu={{
            secondary: true,
            pointing: true,
            attached: true,
            tabular: true,
            className: 'formtabs',
          }}
          className="tabs-wrapper"
          renderActiveOnly={false}
          activeIndex={tab}
          panes={[
            !!documentTab && {
              menuItem: {
                key: 'documentTab',
                as: 'button',
                className: 'ui button',
                content: intl.formatMessage(messages.review),
              },
              pane: (
                <Tab.Pane
                  key="review"
                  className="tab-wrapper"
                  id="sidebar-review"
                />
              ),
            },
          ].filter((tab) => tab)}
        />
      </div>
      {isClient &&
        review === 'DelegateReview' &&
        createPortal(
          <DelegateReview onClose={props.onClose} />,
          document.getElementById('sidebar-review'),
        )}
      {isClient &&
        review === 'PostponeReview' &&
        createPortal(
          <PostponeReview onClose={props.onClose} />,
          document.getElementById('sidebar-review'),
        )}

      <div className={expanded ? 'pusher expanded' : 'pusher'} />
    </Fragment>
  );
};

export default compose(withCookies)(ReviewSidebar);
