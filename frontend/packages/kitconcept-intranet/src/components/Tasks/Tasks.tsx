import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { Link, Redirect, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Toolbar from '@plone/volto/components/manage/Toolbar/Toolbar';
import { useClient } from '@plone/volto/hooks/client/useClient';
import { AlertCircle, ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';
import Api from '@plone/volto/helpers/Api/Api';
import { useWorkspaceSwitcher } from '../NavigationTree/useWorkspaceSwitcher';
import { Tabs, TabList, Tab, TabPanel } from 'react-aria-components';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';

import {
  dueState,
  formatDue,
  taskDueDate,
  taskSourceUrl,
  taskQuery,
  TASK_BATCH_SIZE,
  type Task,
} from './taskHelpers';
import './Tasks.scss';
import PersonPill from '../PersonPill/PersonPill';
import WorkspaceMarker from '../WorkspaceMarker/WorkspaceMarker';
import WorkspaceFilter from './WorkspaceFilter';

type Results = { items: Task[]; items_total: number };

const messages = defineMessages({
  overdue: { id: 'Overdue', defaultMessage: 'Overdue' },
  tomorrow: { id: 'Tomorrow', defaultMessage: 'Tomorrow' },
  noDueDate: { id: 'No due date', defaultMessage: 'No due date' },
  taskPages: { id: 'Task pages', defaultMessage: 'Task pages' },
  previousPage: { id: 'Previous page', defaultMessage: 'Previous page' },
  nextPage: { id: 'Next page', defaultMessage: 'Next page' },
  taskScope: { id: 'Task scope', defaultMessage: 'Task scope' },
});

/** Authenticated, read-only task list backed by the standard querystring-search API. */
export default function Tasks() {
  const intl = useIntl();
  const { pathname } = useLocation();
  const isClient = useClient();
  const token = useSelector((state: any) => state.userSession?.token);
  const [scope, setScope] = React.useState<'mine' | 'all'>('mine');
  const [workspaceSelection, setWorkspaceSelection] = React.useState<{
    pathname: string;
    value: string;
  } | null>(null);
  const { workspaces, isLoading: loadingWorkspaces } = useWorkspaceSwitcher({
    enabled: !!token,
  });
  const containingPath = pathname.replace(/\/tasks\/?$/, '');
  const routeWorkspace =
    workspaces
      .map((item) => flattenToAppURL(item['@id']))
      .filter(
        (path) =>
          containingPath === path || containingPath.startsWith(path + '/'),
      )
      .sort((a, b) => b.length - a.length)[0] || '';
  const workspace =
    workspaceSelection?.pathname === pathname
      ? workspaceSelection.value
      : routeWorkspace;
  const [start, setStart] = React.useState(0);
  const [retry, setRetry] = React.useState(0);
  const [results, setResults] = React.useState<Results | null>(null);
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setStart(0);
    setLoading(true);
  }, [pathname]);

  React.useEffect(() => {
    if (!token || (containingPath && loadingWorkspaces)) return;
    // Ignore responses from an obsolete page request or an unmounted view.
    let active = true;
    setLoading(true);
    setError(false);
    (new Api() as any)
      .post('/@querystring-search', {
        data: taskQuery(start, scope, workspace),
      })
      .then((response: Results) => {
        if (active) setResults(response);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    token,
    start,
    retry,
    scope,
    workspace,
    containingPath,
    loadingWorkspaces,
  ]);

  if (!token)
    return (
      <Redirect to={`/login?return_url=${encodeURIComponent(pathname)}`} />
    );

  return (
    <section
      className={scope === 'all' ? 'tasks-view all-tasks' : 'tasks-view'}
      aria-labelledby="tasks-view-title"
    >
      <h1 id="tasks-view-title">
        <FormattedMessage id="Tasks" defaultMessage="Tasks" />
      </h1>
      <Tabs
        selectedKey={scope}
        onSelectionChange={(key) => {
          if (key === scope) return;
          setScope(key as 'mine' | 'all');
          setStart(0);
          setLoading(true);
        }}
      >
        <TabList
          className="tasks-view-tabs"
          aria-label={intl.formatMessage(messages.taskScope)}
        >
          <Tab id="mine">
            <FormattedMessage id="My tasks" defaultMessage="My tasks" />
          </Tab>
          <Tab id="all">
            <FormattedMessage id="All tasks" defaultMessage="All tasks" />
          </Tab>
        </TabList>
        <TabPanel id={scope}>
          <div className="tasks-view-filters">
            <WorkspaceFilter
              value={workspace}
              disabled={loadingWorkspaces}
              workspaces={workspaces.map((item) => ({
                path: flattenToAppURL(item['@id']),
                title: item.title,
              }))}
              onChange={(value) => {
                if (value === workspace) return;
                setWorkspaceSelection({ pathname, value });
                setStart(0);
                setLoading(true);
              }}
            />
            {!loading && !error && (
              <span className="tasks-view-count" role="status">
                <FormattedMessage
                  id="taskCount"
                  defaultMessage="{count, plural, one {# task} other {# tasks}}"
                  values={{ count: results?.items_total ?? 0 }}
                />
              </span>
            )}
          </div>
          {loading ? (
            <p role="status">
              <FormattedMessage
                id="Loading tasks"
                defaultMessage="Loading tasks..."
              />
            </p>
          ) : error ? (
            <div role="alert" className="tasks-view-error">
              <FormattedMessage
                id="Unable to load tasks"
                defaultMessage="Unable to load tasks."
              />
              <button
                type="button"
                onClick={() => setRetry((value) => value + 1)}
              >
                <RotateCw size={16} aria-hidden="true" />
                <FormattedMessage id="Retry" defaultMessage="Retry" />
              </button>
            </div>
          ) : !results?.items_total ? (
            <p>
              <FormattedMessage
                id="No open tasks match these filters."
                defaultMessage="No open tasks match these filters."
              />
            </p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th scope="col">
                      <FormattedMessage id="Task" defaultMessage="Task" />
                    </th>
                    {scope === 'all' && (
                      <th scope="col">
                        <FormattedMessage
                          id="Task assignee"
                          defaultMessage="Assignee"
                        />
                      </th>
                    )}
                    <th scope="col">
                      <FormattedMessage
                        id="Workspace"
                        defaultMessage="Workspace"
                      />
                    </th>
                    <th scope="col">
                      <FormattedMessage id="Source" defaultMessage="Source" />
                    </th>
                    <th scope="col">
                      <FormattedMessage id="Due" defaultMessage="Due" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.items.map((task) => {
                    const dueDate = taskDueDate(task);
                    const state = dueDate ? dueState(dueDate) : null;
                    const overdueLabel = intl.formatMessage(messages.overdue);
                    return (
                      <tr key={task.UID}>
                        <td className="tasks-view-text">{task.title}</td>
                        {scope === 'all' && (
                          <td className="tasks-view-assignees">
                            {task.task_assignee_details?.map((assignee) => (
                              <span
                                key={assignee.id}
                                className="tasks-view-assignee"
                              >
                                <PersonPill
                                  id={assignee.id}
                                  fullname={assignee.title}
                                  compact
                                />
                              </span>
                            ))}
                          </td>
                        )}
                        <td className="tasks-view-workspace">
                          {task.task_workspace ? (
                            <Link
                              to={flattenToAppURL(task.task_workspace['@id'])}
                              title={task.task_workspace.title}
                            >
                              <WorkspaceMarker
                                title={task.task_workspace.title}
                                size={18}
                              />
                              <span className="tasks-view-workspace-label">
                                {task.task_workspace.title}
                              </span>
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="tasks-view-source">
                          <Link
                            to={flattenToAppURL(taskSourceUrl(task))}
                            title={task.task_source_title}
                          >
                            {task.task_source_title}
                          </Link>
                        </td>
                        <td
                          className={
                            state?.overdue
                              ? 'tasks-view-due overdue'
                              : 'tasks-view-due'
                          }
                        >
                          {state?.overdue && (
                            <span
                              title={overdueLabel}
                              role="img"
                              aria-label={overdueLabel}
                            >
                              <AlertCircle size={14} aria-hidden="true" />
                            </span>
                          )}
                          {dueDate ? (
                            <time dateTime={dueDate}>
                              {state?.tomorrow
                                ? intl.formatMessage(messages.tomorrow)
                                : formatDue(dueDate, intl.locale)}
                            </time>
                          ) : (
                            <span
                              aria-label={intl.formatMessage(
                                messages.noDueDate,
                              )}
                            >
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {results.items_total > TASK_BATCH_SIZE && (
                <nav
                  className="tasks-view-pagination"
                  aria-label={intl.formatMessage(messages.taskPages)}
                >
                  <button
                    type="button"
                    disabled={start === 0}
                    onClick={() => setStart(start - TASK_BATCH_SIZE)}
                    aria-label={intl.formatMessage(messages.previousPage)}
                  >
                    <ArrowLeft size={18} aria-hidden="true" />
                  </button>
                  <span>
                    {start + 1}-
                    {Math.min(start + TASK_BATCH_SIZE, results.items_total)} /{' '}
                    {results.items_total}
                  </span>
                  <button
                    type="button"
                    disabled={start + TASK_BATCH_SIZE >= results.items_total}
                    onClick={() => setStart(start + TASK_BATCH_SIZE)}
                    aria-label={intl.formatMessage(messages.nextPage)}
                  >
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </nav>
              )}
            </>
          )}
        </TabPanel>
      </Tabs>
      {isClient &&
        document.getElementById('toolbar') &&
        createPortal(
          <Toolbar pathname={pathname} inner={<span />} />,
          document.getElementById('toolbar')!,
        )}
    </section>
  );
}
