/**
 * OVERRIDE Sidebar.jsx
 * REASON: AI assistant (see AI_EDIT_PLAN.md): adds an "AI" tab in the
 *         edit and add forms that assesses the page and proposes changes.
 * CHANGES (each marked with START/END CUSTOMIZATION):
 *         1. Imports: `config` (Volto registry), `loadable`, the lazily
 *            loaded `AIEditPanel`, `setAiTabIndex`, `useSelectionChanged`.
 *         2. (none: the tab's label and tooltip are `tabMessages` of
 *            AIEdit/sidebarTab.js, where the i18n extraction finds them)
 *         3. `aiTab`: show the tab in the edit and add forms when
 *            the assistant is available (`kitconcept.intranet.ai_edit_available`
 *            from @site), except for Plate content types. `aiOpened`: the
 *            panel is mounted the first time the tab is active (the tabs
 *            render all panes), so its code is fetched and the backend asked
 *            (permission, still switched on) only then; it stays mounted to
 *            keep the conversation. Back to the first tab when the AI tab is
 *            selected but not shown. Whether the editor changed the block
 *            selection is tracked from here, from the form's opening, and
 *            passed to the panel.
 *            Selecting a block keeps the AI tab open like the Order tab:
 *            its index is reported to AIEdit/sidebarTab.js, which the
 *            block Edit.jsx override reads.
 *         4. The "AI" tab (tooltip "AI editing assistant"), appended last so the index-based tab
 *            state of the other tabs is unchanged.
 *         Everything else is identical to the file version below.
 * FILE: https://github.com/plone/volto/blob/19.5.0/packages/volto/src/components/manage/Sidebar/Sidebar.jsx
 * FILE VERSION: Volto 19.5.0
 * DATE: 2026-10-09
 * DEVELOPER: Dante Álvarez
 */
import React, { useState, Fragment, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button, Tab } from 'semantic-ui-react';
import { useDispatch, useSelector } from 'react-redux';
import { compose } from 'redux';
import { withCookies } from 'react-cookie';
import { defineMessages, useIntl } from 'react-intl';
import cx from 'classnames';
import BodyClass from '@plone/volto/helpers/BodyClass/BodyClass';
import { getCookieOptions } from '@plone/volto/helpers/Cookies/cookies';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import forbiddenSVG from '@plone/volto/icons/forbidden.svg';
import { setSidebarTab } from '@plone/volto/actions/sidebar/sidebar';
import expandSVG from '@plone/volto/icons/left-key.svg';
import collapseSVG from '@plone/volto/icons/right-key.svg';
/* START CUSTOMIZATION: 1. imports */
import loadable from '@loadable/component';
import config from '@plone/volto/registry';
import {
  setAiTabIndex,
  tabMessages,
} from '../../../../../components/AIEdit/sidebarTab';
import { formType } from '../../../../../components/AIEdit/panelState';
import useSelectionChanged from '../../../../../components/AIEdit/useSelectionChanged';

const AIEditPanel = loadable(
  () =>
    import(
      /* webpackChunkName: "AIEdit" */ '../../../../../components/AIEdit/AIEditPanel'
    ),
);
/* END CUSTOMIZATION */

const messages = defineMessages({
  document: {
    id: 'Document',
    defaultMessage: 'Document',
  },
  block: {
    id: 'Block',
    defaultMessage: 'Block',
  },
  settings: {
    id: 'Settings',
    defaultMessage: 'Settings',
  },
  shrinkSidebar: {
    id: 'Shrink sidebar',
    defaultMessage: 'Shrink sidebar',
  },
  expandSidebar: {
    id: 'Expand sidebar',
    defaultMessage: 'Expand sidebar',
  },
  order: {
    id: 'Order',
    defaultMessage: 'Order',
  },
});

const Sidebar = (props) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const {
    cookies,
    content,
    documentTab,
    blockTab,
    settingsTab,
    orderTab = true,
  } = props;
  const [expanded, setExpanded] = useState(
    cookies.get('sidebar_expanded') !== 'false',
  );
  const [size] = useState(0);
  const [showFull, setshowFull] = useState(true);

  const tab = useSelector((state) => state.sidebar.tab);
  const toolbarExpanded = useSelector((state) => state.toolbar.expanded);
  const type = useSelector((state) => state.schema?.schema?.title);
  /* START CUSTOMIZATION: 3. when to show the AI tab */
  // In the edit and add forms of content with Volto blocks, when the assistant
  // is available (registry toggle on and LLM configured). The type is only
  // needed for the Plate check; `formType` reads it as the panel does (in
  // the add form from the ?type= parameter).
  const location = useSelector((state) => state.router?.location);
  const contentType = useSelector(formType);
  const aiAvailable = useSelector(
    (state) =>
      state.site?.data?.['kitconcept.intranet.ai_edit_available'] === true,
  );
  const isAddForm = /\/add$/.test(location?.pathname || '');
  const isForm = isAddForm || /\/edit$/.test(location?.pathname || '');
  // @site is loaded with the page and may be outdated: the panel asks the
  // backend when it is first opened and shows a message when the assistant was
  // switched off or the user lacks the permission.
  const aiTab =
    aiAvailable &&
    isForm &&
    !config.settings.PlateEditorContentTypes?.includes(contentType);
  // The AI tab comes after the others
  const aiTabIndex = [documentTab, blockTab, orderTab, settingsTab].filter(
    Boolean,
  ).length;
  const [aiOpened, setAiOpened] = useState(false);
  const selectionChanged = useSelectionChanged();
  React.useEffect(() => {
    if (aiTab && tab === aiTabIndex) setAiOpened(true);
    // The tab is global state: coming from a form with the AI tab open to
    // one without it, nothing would be shown
    if (!aiTab && tab === aiTabIndex) dispatch(setSidebarTab(0));
  }, [aiTab, tab, aiTabIndex, dispatch]);
  // Block selection keeps this tab open: the block Edit.jsx override
  // reads where it is (AIEdit/sidebarTab.js)
  React.useEffect(() => {
    setAiTabIndex(aiTab ? aiTabIndex : null);
    return () => setAiTabIndex(null);
  }, [aiTab, aiTabIndex]);
  /* END CUSTOMIZATION */

  const onToggleExpanded = () => {
    cookies.set('sidebar_expanded', !expanded, getCookieOptions());
    setExpanded(!expanded);
    resetFullSizeSidebar();
  };

  const resetFullSizeSidebar = useCallback(() => {
    if (!expanded) {
      const currentResizer = document.querySelector('#sidebar');
      const sidebarContainer =
        currentResizer.getElementsByClassName('sidebar-container')[0];
      sidebarContainer.classList.remove('full-size');
      sidebarContainer.classList.remove('no-toolbar');
      setshowFull(true);
    }
  }, [expanded]);

  const onToggleFullSize = useCallback(() => {
    const currentResizer = document.querySelector('#sidebar');
    const sidebarContainer =
      currentResizer.getElementsByClassName('sidebar-container')[0];

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

  const onTabChange = (event, data) => {
    event.nativeEvent.stopImmediatePropagation();
    dispatch(setSidebarTab(data.activeIndex));
  };

  return (
    <Fragment>
      <BodyClass
        className={expanded ? 'has-sidebar' : 'has-sidebar-collapsed'}
      />
      <div
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
          onTabChange={onTabChange}
          panes={[
            !!documentTab && {
              menuItem: {
                key: 'documentTab',
                as: 'button',
                className: 'ui button',
                type: 'button',
                content: type || intl.formatMessage(messages.document),
              },
              pane: (
                <Tab.Pane
                  key="metadata"
                  className="tab-wrapper"
                  id="sidebar-metadata"
                />
              ),
            },
            !!blockTab && {
              menuItem: {
                key: 'blockTab',
                as: 'button',
                className: 'ui button',
                type: 'button',
                content: intl.formatMessage(messages.block),
              },
              pane: (
                <Tab.Pane
                  key="properties"
                  className="tab-wrapper"
                  id="sidebar-properties"
                >
                  <Icon
                    className="tab-forbidden"
                    name={forbiddenSVG}
                    size="48px"
                  />
                </Tab.Pane>
              ),
            },
            !!orderTab && {
              menuItem: intl.formatMessage(messages.order),
              pane: (
                <Tab.Pane
                  key="order"
                  className="tab-wrapper"
                  id="sidebar-order"
                >
                  <Icon
                    className="tab-forbidden"
                    name={forbiddenSVG}
                    size="48px"
                  />
                </Tab.Pane>
              ),
            },
            !!settingsTab && {
              menuItem: intl.formatMessage(messages.settings),
              pane: (
                <Tab.Pane
                  key="settings"
                  className="tab-wrapper"
                  id="sidebar-settings"
                >
                  <Icon
                    className="tab-forbidden"
                    name={forbiddenSVG}
                    size="48px"
                  />
                </Tab.Pane>
              ),
            },
            /* START CUSTOMIZATION: 4. the AI tab */
            aiTab && {
              // Short like the other tabs; the tooltip says what it is
              menuItem: {
                key: 'aiTab',
                content: intl.formatMessage(tabMessages.ai),
                title: intl.formatMessage(tabMessages.aiTitle),
              },
              pane: (
                <Tab.Pane key="ai" className="tab-wrapper" id="sidebar-ai">
                  {aiOpened && (
                    <AIEditPanel selectionChanged={selectionChanged} />
                  )}
                </Tab.Pane>
              ),
            },
            /* END CUSTOMIZATION */
          ].filter((tab) => tab)}
        />
      </div>
      <div className={expanded ? 'pusher expanded' : 'pusher'} />
    </Fragment>
  );
};

Sidebar.propTypes = {
  documentTab: PropTypes.bool,
  blockTab: PropTypes.bool,
  settingsTab: PropTypes.bool,
};

Sidebar.defaultProps = {
  documentTab: true,
  blockTab: true,
  settingsTab: false,
};

export default compose(withCookies)(Sidebar);
