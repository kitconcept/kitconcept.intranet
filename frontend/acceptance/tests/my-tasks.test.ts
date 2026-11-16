import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';
import { savePage } from '../fixtures/table';
import {
  createWikiPageWithValue,
  getWikiValue as getStoredValue,
} from '../fixtures/wiki-pages';
import { nativeBlockSections } from '../fixtures/native-blocks';
import { editable } from '../fixtures/editor';
import { login } from './login';
import { expect, test } from './test';
import { createWikiPage } from './content';

test.describe.configure({ timeout: 30_000 });

test('Long workspace and source labels truncate, and selected tabs keep their results', async ({
  page,
}) => {
  const workspaceTitle = 'A workspace with a very long name '.repeat(6).trim();
  const sourceTitle = 'A source with a very long name '.repeat(6).trim();
  await createWikiPage(page, {
    contentId: 'long-labels',
    contentTitle: sourceTitle,
    wikiId: 'long-workspace',
    wikiTitle: workspaceTitle,
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      blocks: {
        ...(body.blocks as Record<string, unknown>),
        __somersault__: {
          '@type': '__somersault__',
          value: [
            {
              type: 'p',
              listStyleType: 'todo',
              checked: false,
              children: [{ text: 'Long labels task' }],
            },
          ],
        },
      },
    }),
  });
  await page.goto('/tasks');
  const row = page.locator('.tasks-view tbody tr');
  await expect(row).toHaveCount(1);
  for (const tab of ['My tasks', 'All tasks']) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    await expect(row).toHaveCount(1);
    await page.getByRole('tab', { name: tab, exact: true }).click();
    await expect(row).toHaveCount(1);
    await expect(
      page.getByText('Loading tasks...', { exact: true }),
    ).toHaveCount(0);
  }
  await expect(row.locator('.tasks-view-workspace a')).toHaveAttribute(
    'title',
    workspaceTitle,
  );
  await expect(row.locator('.tasks-view-source a')).toHaveAttribute(
    'title',
    sourceTitle,
  );
  for (const label of [
    row.locator('.tasks-view-workspace-label'),
    row.locator('.tasks-view-source a'),
  ]) {
    await expect(label).toHaveCSS('text-overflow', 'ellipsis');
    await expect
      .poll(() =>
        label.evaluate((element) => element.scrollWidth > element.clientWidth),
      )
      .toBe(true);
  }
  await page.getByRole('button', { name: /^Workspace:/ }).click();
  await page
    .getByRole('menuitem', { name: workspaceTitle, exact: true })
    .click();
  await expect(page.locator('.workspace-selector-label')).toHaveAttribute(
    'title',
    'Workspace: ' + workspaceTitle,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(row).toHaveCount(1);
  expect(
    await page
      .locator('.tasks-view')
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('My tasks lists open assigned tasks and follows source links', async ({
  page,
}) => {
  const path = await createNativeBlocksPage(page, ['lists'], {
    title: 'Task source',
    extra: [
      {
        type: 'p',
        listStyleType: 'todo',
        checked: false,
        children: [
          { text: 'Dated task ' },
          { type: 'date', value: '2026-01-01', children: [{ text: '' }] },
        ],
      },
      {
        type: 'p',
        listStyleType: 'todo',
        checked: false,
        children: [
          { text: 'Someone else task ' },
          {
            type: 'mention',
            key: 'another-user',
            value: 'Another User',
            mentionId: 'other',
            children: [{ text: '' }],
          },
        ],
      },
    ],
  });
  await page.goto('/tasks');
  await expect(
    page.getByRole('heading', { name: 'Tasks', exact: true }),
  ).toBeVisible();
  const rows = page.locator('.tasks-view tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Dated task');
  await expect(rows.first().locator('.tasks-view-text')).toHaveCSS(
    'font-weight',
    '300',
  );
  await expect(rows.first().locator('.tasks-view-source a')).toHaveCSS(
    'font-size',
    '14px',
  );
  await expect(
    rows.first().locator('.tasks-view-workspace .workspace-marker'),
  ).toBeVisible();
  await expect(rows.last()).toContainText('To-do pending');
  await expect(page.getByText('To-do done', { exact: true })).toHaveCount(0);
  await expect(
    page.getByText('Someone else task', { exact: false }),
  ).toHaveCount(0);
  await expect(
    rows.first().getByRole('img', { name: 'Overdue' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'playwright/results/tasks-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    rows.first().getByRole('link', { name: 'Task source' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'playwright/results/tasks-mobile.png',
    fullPage: true,
  });
  const overflowing = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.tasks-view, .tasks-view *'))
      .filter((el) => el.getBoundingClientRect().right > window.innerWidth)
      .map((el) => ({
        tag: el.tagName,
        className: el.className,
        right: el.getBoundingClientRect().right,
      })),
  );
  expect(overflowing).toEqual([]);
  await rows.first().getByRole('link', { name: 'Task source' }).click();
  await page.waitForURL(path);
});

test('Editor completion and reopening update My tasks while preserving identity', async ({
  page,
}) => {
  const { contentPath: path } = await createWikiPageWithValue(page, {
    contentId: 'task-completion',
    title: 'Task source',
    value: nativeBlockSections.lists,
  });
  const initial = await getStoredValue(page, path);
  const todo = initial.find(
    (node) => node.listStyleType === 'todo' && !node.checked,
  )!;
  expect(todo.taskId).toBeTruthy();
  await openInEditor(page, path);
  await editable(page).getByRole('checkbox').first().click();
  await savePage(page, path);
  const completed = (await getStoredValue(page, path)).find(
    (node) => node.taskId === todo.taskId,
  )!;
  expect(completed.checked).toBe(true);
  expect(completed.taskCompleted).toBeTruthy();
  await page.goto('/tasks');
  await expect(
    page.getByText('No open tasks match these filters.', { exact: true }),
  ).toBeVisible();
  await openInEditor(page, path);
  await editable(page).getByRole('checkbox').first().click();
  await savePage(page, path);
  await page.goto('/tasks');
  await expect(page.locator('.tasks-view tbody tr')).toHaveCount(1);
  await expect(page.locator('.tasks-view')).toContainText('To-do pending');
});

test('My tasks retries failed requests', async ({ page }) => {
  await page.route('**/*querystring-search*', (route) =>
    route.fulfill({ status: 500, body: '{}' }),
  );
  await page.goto('/tasks');
  await expect(page.locator('.tasks-view').getByRole('alert')).toContainText(
    'Unable to load tasks.',
  );
  await page.unroute('**/*querystring-search*');
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(
    page.getByText('No open tasks match these filters.', { exact: true }),
  ).toBeVisible();
});

test('Personal tools links to My tasks without a toolbar shadow', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#toolbar-personal').click();
  await page.getByRole('link', { name: 'Tasks', exact: true }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.locator('#toolbar-personal')).toBeVisible();
});

test('My tasks requires login', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/tasks');
  await expect(page).toHaveURL(/\/login\?return_url=%2Ftasks$/);
});

test('My tasks batches long lists without dropping undated tasks', async ({
  page,
}) => {
  await createNativeBlocksPage(page, ['lists'], {
    extra: Array.from({ length: 25 }, (_, i) => ({
      type: 'p',
      listStyleType: 'todo',
      checked: false,
      children: [{ text: `Additional task ${i + 1}` }],
    })),
  });
  await page.goto('/tasks');
  await expect(page.locator('.tasks-view tbody tr')).toHaveCount(25);
  await expect(page.locator('.tasks-view-pagination')).toContainText(
    '1-25 / 26',
  );
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.locator('.tasks-view tbody tr')).toHaveCount(1);
  await expect(page.locator('.tasks-view-pagination')).toContainText(
    '26-26 / 26',
  );
  await page
    .getByRole('button', { name: 'Previous page', exact: true })
    .click();
  await expect(page.locator('.tasks-view tbody tr')).toHaveCount(25);
});

test('Task tabs show all assignees and filter both scopes by workspace', async ({
  page,
}) => {
  const task = (text: string, users: string[] = []) => ({
    type: 'p',
    listStyleType: 'todo',
    checked: false,
    children: [
      { text },
      ...users.map((user) => ({
        type: 'mention',
        key: user,
        value: user,
        mentionId: user,
        children: [{ text: '' }],
      })),
    ],
  });
  const create = async (
    id: string,
    title: string,
    value: Record<string, unknown>[],
  ) => {
    await createWikiPage(page, {
      contentId: id,
      contentTitle: title,
      wikiId: id + '-workspace',
      wikiTitle: title + ' workspace',
      transition: 'publish',
      bodyModifier: (body) => ({
        ...body,
        blocks: {
          ...(body.blocks as Record<string, unknown>),
          __somersault__: { '@type': '__somersault__', value },
        },
      }),
    });
  };
  await create('alpha', 'Alpha', [
    task('Own task'),
    task('Shared task', ['admin', 'another-user']),
  ]);
  await create('beta', 'Beta', [task('Other task', ['another-user'])]);
  await page.goto('/tasks');
  const rows = page.locator('.tasks-view tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(page.locator('.tasks-view-count')).toHaveText('2 tasks');
  await expect(
    page.getByRole('columnheader', { name: 'Workspace', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('columnheader', { name: 'Assignee', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('tab', { name: 'All tasks', exact: true }).click();
  await expect(rows).toHaveCount(3);
  await expect(page.locator('.tasks-view-count')).toHaveText('3 tasks');
  await expect(
    page.getByRole('columnheader', { name: 'Assignee', exact: true }),
  ).toBeVisible();
  const shared = rows.filter({ hasText: 'Shared task' });
  await expect(shared.locator('.tasks-view-assignee')).toHaveCount(2);
  await expect(shared.locator('.person-pill')).toHaveCount(2);
  await expect(shared).toContainText('another-user');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.tasks-view').screenshot({
    path: 'playwright/results/tasks-all-desktop.png',
    animations: 'disabled',
  });
  await page.getByRole('button', { name: /^Workspace:/ }).click();
  await page
    .getByRole('menuitem', { name: 'Beta workspace', exact: true })
    .click();
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText('Other task');
  await expect(page.locator('.tasks-view-count')).toHaveText('1 task');
  await page.getByRole('tab', { name: 'My tasks', exact: true }).click();
  await expect(rows).toHaveCount(0);
  await expect(page.locator('.tasks-view-count')).toHaveText('0 tasks');
  await page.getByRole('button', { name: /^Workspace:/ }).click();
  await page
    .getByRole('menuitem', { name: 'Alpha workspace', exact: true })
    .click();
  await expect(rows).toHaveCount(2);
  await expect(page.locator('#toolbar-personal')).toBeVisible();
  await page.goto('/beta-workspace/tasks');
  await expect(
    page.getByRole('heading', { name: 'Tasks', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Workspace: Beta workspace',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator('.tasks-view-count')).toHaveText('0 tasks');
  await expect(page.locator('#toolbar-personal')).toBeVisible();
  await page.getByRole('tab', { name: 'All tasks', exact: true }).click();
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText('Other task');
  await page.goto('/alpha-workspace/alpha/tasks');
  await expect(
    page.getByRole('button', {
      name: 'Workspace: Alpha workspace',
      exact: true,
    }),
  ).toBeVisible();
  await expect(rows).toHaveCount(2);
});
