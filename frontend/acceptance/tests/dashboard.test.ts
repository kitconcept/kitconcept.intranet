import type { Page } from '@playwright/test';
import { createContent } from './content';
import { login } from './login';
import { expect, test } from './test';

const apiURL =
  process.env.API_PATH ||
  `http://${process.env.BACKEND_HOST || '127.0.0.1'}:55001/${process.env.SITE_ID || 'plone'}`;

type Credentials = { username: string; password: string };

const basicAuth = ({ username, password }: Credentials) =>
  `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

const adminAuth = basicAuth({ username: 'admin', password: 'secret' });

const OWNER = { username: 'dashboard-owner', password: 'owner-secret' };
const OTHER = { username: 'dashboard-other', password: 'other-secret' };

const HEADLINES = [
  'Recently modified',
  'Recently created',
  'Recently created by me',
  'My workspaces',
  'News from my organisational units',
  'Events from my organisational units',
  'Submitted for publication',
];

/** Create a site user and a published Person that belongs to them. */
async function createUserWithPerson(
  page: Page,
  { username, password }: Credentials,
  personId: string,
) {
  // A Person `username` must be a Plone site user: the Zope root `admin` is
  // not in the users vocabulary.
  const response = await page.request.post(`${apiURL}/@users`, {
    headers: { Accept: 'application/json', Authorization: adminAuth },
    data: { username, email: `${username}@example.com`, password },
  });
  expect(response.ok()).toBeTruthy();

  await createContent(page, {
    contentType: 'Person',
    contentId: personId,
    contentTitle: personId,
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      first_name: 'Dashboard',
      last_name: personId,
      username,
    }),
  });
}

/** GET the dashboard over the API as admin, to check what the page can't show. */
function getDashboard(page: Page, personId: string) {
  return page.request.get(`${apiURL}/${personId}/dashboard`, {
    headers: { Accept: 'application/json', Authorization: adminAuth },
  });
}

test.describe('Personal dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await createUserWithPerson(page, OWNER, 'owner-person');
  });

  test('shows the default dashboard before it is created', async ({ page }) => {
    await login(page, OWNER);
    await page.goto('/owner-person/dashboard');

    await expect(
      page.locator('main').getByRole('heading', { level: 1 }),
    ).toHaveText('Dashboard');
    for (const headline of HEADLINES) {
      await expect(
        page.locator('main .block.listing').getByRole('heading', {
          name: headline,
          exact: true,
        }),
      ).toBeVisible();
    }

    // Only the default blocks are shown, the dashboard is not created yet
    expect((await getDashboard(page, 'owner-person')).status()).toBe(404);
  });

  test('creates the dashboard on edit and saves changes', async ({ page }) => {
    await login(page, OWNER);
    await page.goto('/owner-person/dashboard');

    await page
      .locator('#toolbar')
      .getByRole('button', { name: 'Edit' })
      .click();
    await expect(page).toHaveURL(/\/owner-person\/dashboard\/edit$/);

    // The page can't show these: the dashboard now exists, is private and
    // has the default blocks
    const response = await getDashboard(page, 'owner-person');
    expect(response.status()).toBe(200);
    const dashboard = await response.json();
    expect(dashboard['@type']).toBe('Dashboard');
    expect(dashboard.review_state).toBe('private');
    expect(dashboard.blocks_layout.items).toHaveLength(6);

    const title = page.getByRole('textbox', { name: 'Content title' });
    await title.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('My dashboard');
    await page
      .locator('#toolbar')
      .getByRole('button', { name: 'Save' })
      .click();
    await expect(page).toHaveURL(/\/owner-person\/dashboard$/);

    const heading = page.locator('main').getByRole('heading', { level: 1 });
    await expect(heading).toHaveText('My dashboard');
    await expect(
      page.locator('main .block.listing').getByRole('heading', {
        name: 'Recently modified',
        exact: true,
      }),
    ).toBeVisible();

    // Still there after a reload, so it was saved
    await page.reload();
    await expect(heading).toHaveText('My dashboard');
  });

  test('other users and anonymous cannot see the dashboard', async ({
    page,
  }) => {
    await createUserWithPerson(page, OTHER, 'other-person');

    // Create the owner's dashboard
    const created = await page.request.post(
      `${apiURL}/owner-person/@dashboard`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: basicAuth(OWNER),
        },
      },
    );
    expect(created.ok()).toBeTruthy();

    const listings = page.locator('main .block.listing');

    // Another user gets the Unauthorized page, not the owner's listings
    await login(page, OTHER);
    await page.goto('/owner-person/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Unauthorized' }),
    ).toBeVisible();
    await expect(listings).toHaveCount(0);

    // Anonymous is sent to the login form
    await page.context().clearCookies();
    await page.goto('/owner-person/dashboard');
    await expect(page).toHaveURL(/\/owner-person\/dashboard\/login\?/);
    await expect(listings).toHaveCount(0);
  });
});
