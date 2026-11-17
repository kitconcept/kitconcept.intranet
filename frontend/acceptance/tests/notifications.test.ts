import type { APIRequestContext, Page } from '@playwright/test';
import { login } from './login';
import { expect, test } from './test';

const apiURL =
  process.env.API_PATH ||
  `http://${process.env.BACKEND_HOST || '127.0.0.1'}:55001/${process.env.SITE_ID || 'plone'}`;

const PASSWORD = 'notifications-secret';
const AUTHOR = 'notify-author';
const ACTOR = 'notify-actor';

function basicAuth(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

function headers(username: string, password = PASSWORD) {
  return {
    Accept: 'application/json',
    Authorization: basicAuth(username, password),
  };
}

/** Create the author and the colleague who acts on the author's page. */
async function createUsers(request: APIRequestContext) {
  for (const [username, fullname, roles] of [
    [AUTHOR, 'Anna Author', ['Member', 'Contributor', 'Editor']],
    [ACTOR, 'Ben Colleague', ['Member', 'Contributor', 'Editor', 'Reviewer']],
  ] as const) {
    const response = await request.post(`${apiURL}/@users`, {
      headers: headers('admin', 'secret'),
      data: {
        username,
        fullname,
        email: `${username}@example.com`,
        password: PASSWORD,
        roles,
      },
    });
    expect(response.ok()).toBeTruthy();
  }
}

/** A page authored by AUTHOR, with likes enabled. */
async function createAuthorPage(
  request: APIRequestContext,
  id: string,
  title: string,
) {
  const response = await request.post(apiURL, {
    headers: headers(AUTHOR),
    data: { '@type': 'Document', id, title, enable_likes: true },
  });
  expect(response.ok()).toBeTruthy();
}

async function like(request: APIRequestContext, id: string) {
  const response = await request.post(`${apiURL}/${id}/@vote`, {
    headers: headers(ACTOR),
  });
  expect(response.ok()).toBeTruthy();
}

async function edit(request: APIRequestContext, id: string) {
  const response = await request.patch(`${apiURL}/${id}`, {
    headers: headers(ACTOR),
    data: { description: 'Edited by a colleague' },
  });
  expect(response.ok()).toBeTruthy();
}

async function publish(request: APIRequestContext, id: string) {
  const response = await request.post(`${apiURL}/${id}/@workflow/publish`, {
    headers: headers(ACTOR),
  });
  expect(response.ok()).toBeTruthy();
}

async function loginAsAuthor(page: Page) {
  await login(page, { username: AUTHOR, password: PASSWORD });
}

const bell = (page: Page) =>
  page.locator('.header .tools').getByRole('button', {
    name: /^Notifications/,
  });

test.describe('Notification center', () => {
  // Each test seeds users, pages and activity through the REST API first.
  test.describe.configure({ timeout: 30_000 });

  test.beforeEach(async ({ request }) => {
    await createUsers(request);
    await createAuthorPage(request, 'travel-policy', 'Travel policy');
  });

  test('the bell shows unread notifications and marks them as read', async ({
    page,
    request,
  }) => {
    await like(request, 'travel-policy');
    await loginAsAuthor(page);
    await page.goto('/');

    await expect(bell(page)).toHaveAccessibleName('Notifications, 1 unread');
    await expect(bell(page).locator('.notification-badge')).toHaveText('1');

    await bell(page).click();
    const dropdown = page.locator('.notification-dropdown');
    await expect(dropdown).toContainText('Ben Colleague liked Travel policy');
    await expect(
      dropdown.getByRole('link', { name: 'Travel policy' }),
    ).toHaveAttribute('href', '/travel-policy');

    await dropdown.getByRole('button', { name: 'Mark all as read' }).click();
    await expect(bell(page)).toHaveAccessibleName('Notifications');
    await expect(bell(page).locator('.notification-badge')).toHaveCount(0);
  });

  test('the overview page lists, filters and marks notifications', async ({
    page,
    request,
  }) => {
    await createAuthorPage(request, 'onboarding', 'Onboarding guide');
    await like(request, 'travel-policy');
    await edit(request, 'onboarding');
    await publish(request, 'travel-policy');

    await loginAsAuthor(page);
    await page.goto('/notifications');

    const view = page.locator('.notifications-view');
    await expect(
      view.getByRole('heading', { name: 'Notifications', level: 1 }),
    ).toBeVisible();
    const items = view.locator('.notification-item');
    await expect(items).toHaveCount(3);
    // Newest first.
    await expect(items.nth(0)).toContainText(
      'Ben Colleague changed the state of Travel policy to Published',
    );
    await expect(items.nth(1)).toContainText(
      'Ben Colleague edited Onboarding guide',
    );
    await expect(
      items.nth(1).getByRole('link', { name: 'View changes' }),
    ).toHaveAttribute('href', '/onboarding/historyview');
    await expect(items.nth(2)).toContainText('Ben Colleague liked Travel policy');
    await expect(view.getByRole('heading', { name: 'Today' })).toBeVisible();

    await items.nth(2).getByRole('button', { name: 'Mark as read' }).click();
    await expect(items.nth(2)).not.toHaveClass(/unread/);
    await expect(view.getByRole('tab', { name: 'Unread (2)' })).toBeVisible();

    await view.getByRole('tab', { name: 'Unread (2)' }).click();
    await expect(items).toHaveCount(2);
    // Entries read in the Unread tab leave the list right away.
    await items.nth(0).getByRole('button', { name: 'Mark as read' }).click();
    await expect(items).toHaveCount(1);

    await view.getByRole('button', { name: 'Mark all as read' }).click();
    await expect(view.getByText('No unread notifications.')).toBeVisible();
  });

  test('preferences behind the gear turn a notification type off', async ({
    page,
    request,
  }) => {
    await loginAsAuthor(page);
    await page.goto('/notifications');

    await page
      .getByRole('button', { name: 'Notification preferences' })
      .click();
    const likes = page.getByRole('checkbox', {
      name: 'Someone likes content I author',
    });
    await expect(likes).toBeChecked();
    // RAC hides the native input visually: click its label.
    await page.getByText('Someone likes content I author').click();
    await expect(likes).not.toBeChecked();

    // The change is saved on the server, so new likes are not notified.
    await expect
      .poll(async () => {
        const response = await request.get(
          `${apiURL}/@notifications-settings`,
          { headers: headers(AUTHOR) },
        );
        return (await response.json()).like;
      })
      .toBe(false);
    await like(request, 'travel-policy');
    await page.reload();
    await expect(page.locator('.notifications-view')).toContainText(
      "You're all caught up.",
    );
  });

  test('your own changes do not notify you', async ({ page, request }) => {
    const response = await request.patch(`${apiURL}/travel-policy`, {
      headers: headers(AUTHOR),
      data: { description: 'My own edit' },
    });
    expect(response.ok()).toBeTruthy();

    await loginAsAuthor(page);
    await page.goto('/');
    await expect(bell(page)).toHaveAccessibleName('Notifications');
  });

  test('anonymous users see no bell and are sent to login', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.notification-bell')).toHaveCount(0);

    await page.goto('/notifications');
    await expect(page).toHaveURL(/\/login\?return_url=%2Fnotifications/);
  });
});
