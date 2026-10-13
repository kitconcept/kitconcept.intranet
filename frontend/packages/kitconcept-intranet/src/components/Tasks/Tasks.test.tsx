import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import Tasks from './Tasks';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('@plone/volto/components/manage/Toolbar/Toolbar', () => ({
  default: () => null,
}));
vi.mock('@plone/volto/hooks/client/useClient', () => ({
  useClient: () => false,
}));

vi.mock('@plone/volto/helpers/Api/Api', () => ({
  default: class {
    post = post;
  },
}));
vi.mock('react-redux', () => ({
  useSelector: (selector: any) => selector({ userSession: { token: 'token' } }),
}));
vi.mock('../NavigationTree/useWorkspaceSwitcher', () => ({
  useWorkspaceSwitcher: () => ({
    workspaces: [{ '@id': '/work', title: 'Work' }],
    isLoading: false,
  }),
}));
vi.mock('@plone/volto/helpers/Url/Url', () => ({
  flattenToAppURL: (url: string) => url,
}));

describe('Task tabs', () => {
  it('preselects the containing workspace and lets the user clear it', async () => {
    post.mockResolvedValue({ items_total: 0, items: [] });
    render(
      <IntlProvider locale="en">
        <MemoryRouter initialEntries={['/work/tasks']}>
          <Tasks />
        </MemoryRouter>
      </IntlProvider>,
    );
    await screen.findByText('0 tasks');
    expect(
      screen.getByRole('button', { name: 'Workspace: Work' }),
    ).toBeTruthy();
    expect(post.mock.lastCall?.[1].data.query).toContainEqual(
      expect.objectContaining({ i: 'path', v: '/work' }),
    );
    fireEvent.click(screen.getByRole('button', { name: /^Workspace:/ }));
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: 'All workspaces',
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(
        post.mock.lastCall?.[1].data.query.some(
          (item: any) => item.i === 'path',
        ),
      ).toBe(false),
    );
  });
  it('switches scope, renders multiple assignees, and keeps the workspace filter across tabs', async () => {
    post.mockResolvedValue({
      items_total: 26,
      items: [
        {
          '@id': '/work/page/++tasks++items/task',
          UID: 'task',
          title: 'Write report',
          task_source_title: 'Meeting notes',
          task_due_date: '4000-01-01T00:00:00Z',
          task_workspace: { '@id': '/work', title: 'Work' },
          task_assignee_details: [
            { id: 'alice', title: 'Alice' },
            { id: 'bob', title: 'Bob' },
          ],
        },
      ],
    });
    render(
      <IntlProvider locale="en">
        <MemoryRouter>
          <Tasks />
        </MemoryRouter>
      </IntlProvider>,
    );
    await screen.findByText('26 tasks');
    fireEvent.click(screen.getByRole('tab', { name: 'My tasks' }));
    await screen.findByText('26 tasks');
    expect(screen.queryByText('Loading tasks...')).toBeNull();
    expect(screen.queryByRole('columnheader', { name: 'Assignee' })).toBeNull();
    expect(
      screen.getByRole('columnheader', { name: 'Workspace' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(post.mock.lastCall?.[1].data.b_start).toBe(25));
    fireEvent.click(screen.getByRole('tab', { name: 'All tasks' }));
    await screen.findByRole('columnheader', { name: 'Assignee' });
    fireEvent.click(screen.getByRole('tab', { name: 'All tasks' }));
    await screen.findByText('Alice');
    expect(screen.queryByText('Loading tasks...')).toBeNull();
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Bob')).toBeTruthy();
    expect(post.mock.lastCall?.[1].data.b_start).toBe(0);
    expect(
      post.mock.lastCall?.[1].data.query.some(
        (item: any) => item.i === 'task_assignees',
      ),
    ).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /^Workspace:/ }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Work', exact: true }),
    );
    await waitFor(() =>
      expect(post.mock.lastCall?.[1].data.query).toContainEqual(
        expect.objectContaining({ i: 'path', v: '/work' }),
      ),
    );
    fireEvent.click(screen.getByRole('tab', { name: 'My tasks' }));
    await waitFor(() =>
      expect(post.mock.lastCall?.[1].data.query).toContainEqual(
        expect.objectContaining({ i: 'task_assignees' }),
      ),
    );
    expect(post.mock.lastCall?.[1].data.query).toContainEqual(
      expect.objectContaining({ i: 'path', v: '/work' }),
    );
  });
});
