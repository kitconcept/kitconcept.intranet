/** Summaries avoid client-side task fetches or duplicated source URL metadata. */
export type Task = {
  '@id': string;
  UID: string;
  title: string;
  task_due_date: string;
  task_source_title: string;
  task_workspace: { '@id': string; title: string } | null;
  task_assignee_details: {
    id: string;
    title: string;
    portrait?: string | null;
  }[];
};

export const TASK_BATCH_SIZE = 25;

/** Filter by the authenticated user on the server, then sort and batch there. */
export function taskQuery(
  start = 0,
  scope: 'mine' | 'all' = 'mine',
  workspace = '',
) {
  return {
    query: [
      {
        i: 'portal_type',
        o: 'plone.app.querystring.operation.selection.any',
        v: ['Inline Task'],
      },
      ...(scope === 'mine'
        ? [
            {
              i: 'task_assignees',
              o: 'plone.app.querystring.operation.string.currentUser',
            },
          ]
        : []),
      {
        i: 'task_status',
        o: 'plone.app.querystring.operation.selection.any',
        v: ['open'],
      },
      ...(workspace
        ? [
            {
              i: 'path',
              o: 'plone.app.querystring.operation.string.absolutePath',
              v: workspace,
            },
          ]
        : []),
    ],
    sort_on: 'task_due_date',
    sort_order: 'ascending',
    b_start: start,
    b_size: TASK_BATCH_SIZE,
    metadata_fields: [
      'UID',
      'task_due_date',
      'task_source_title',
      'task_workspace',
      'task_assignee_details',
    ],
  };
}

/** Preserve calendar dates and hide the backend's undated-last DateIndex sentinel. */
export function taskDueDate(task: Task) {
  const date = task.task_due_date?.slice(0, 10);
  return date === '4000-01-01' ? null : date;
}

/** Strip the virtual task traversal suffix to link to its containing page. */
export function taskSourceUrl(task: Task) {
  return task['@id'].split('/++tasks++items/')[0];
}

/** Compare calendar dates against today in the browser's timezone. */
export function dueState(
  iso: string,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  now = new Date(),
) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  // UTC arithmetic advances a calendar day even across local daylight-saving changes.
  const tomorrow = new Date(`${today}T00:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return {
    overdue: iso < today,
    tomorrow: iso === tomorrow.toISOString().slice(0, 10),
  };
}

/** Format a calendar date without converting UTC midnight to the previous day. */
export function formatDue(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${iso}T00:00:00Z`));
}
