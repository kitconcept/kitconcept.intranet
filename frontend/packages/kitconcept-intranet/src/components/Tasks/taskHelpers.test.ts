import { describe, expect, it } from 'vitest';
import {
  dueState,
  formatDue,
  taskDueDate,
  taskQuery,
  taskSourceUrl,
  type Task,
} from './taskHelpers';

describe('My tasks query', () => {
  it('filters all tasks by workspace on the server before pagination', () => {
    const query = taskQuery(25, 'all', '/work');
    expect(query.query.some((item) => item.i === 'task_assignees')).toBe(false);
    expect(query.query).toContainEqual({
      i: 'path',
      o: 'plone.app.querystring.operation.string.absolutePath',
      v: '/work',
    });
    expect(query.b_start).toBe(25);
    expect(query.metadata_fields).toContain('task_assignee_details');
    expect(query.metadata_fields).toContain('task_workspace');
    expect(
      taskQuery(0, 'mine', '/work').query.some(
        (item) => item.i === 'task_assignees',
      ),
    ).toBe(true);
  });
  it('filters open tasks using the server-side current user and batches before display', () => {
    const query = taskQuery(25);
    expect(query.b_start).toBe(25);
    expect(query.query).toContainEqual({
      i: 'task_assignees',
      o: 'plone.app.querystring.operation.string.currentUser',
    });
    expect(query.sort_on).toBe('task_due_date');
    expect(query.query[2].v).toEqual(['open']);
  });
});

describe('Due dates', () => {
  it('uses the browser calendar day across a timezone boundary', () => {
    const now = new Date('2026-10-13T02:00:00Z');
    expect(dueState('2026-10-13', 'America/Los_Angeles', now)).toEqual({
      overdue: false,
      tomorrow: true,
    });
    expect(dueState('2026-10-11', 'America/Los_Angeles', now).overdue).toBe(
      true,
    );
  });
  it('renders the ceiling sentinel as missing and derives source links from @id', () => {
    const task = {
      '@id': 'http://localhost/plone/work/page/++tasks++items/uuid',
      task_due_date: '4000-01-01T00:00:00+00:00',
    } as Task;
    expect(taskDueDate(task)).toBeNull();
    expect(taskSourceUrl(task)).toBe('http://localhost/plone/work/page');
  });
  it('formats calendar dates without shifting them', () => {
    expect(formatDue('2026-10-12', 'en-GB')).toBe('12 Oct 2026');
  });
});
