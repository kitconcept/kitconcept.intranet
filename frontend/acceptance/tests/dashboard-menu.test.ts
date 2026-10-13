import { createContent } from './content';
import { login } from './login';
import { expect, test } from './test';

const apiURL =
  process.env.API_PATH ||
  `http://${process.env.BACKEND_HOST || '127.0.0.1'}:55001/${process.env.SITE_ID || 'plone'}`;

test('Personal tools link to the current user Person dashboard', async ({
  page,
}) => {
  // A Person `username` must be a Plone site user: the Zope root `admin` is
  // not in the users vocabulary, so create one and log in as it.
  const response = await page.request.post(`${apiURL}/@users`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from('admin:secret').toString('base64')}`,
    },
    data: {
      username: 'dashboard-user',
      email: 'dashboard-user@example.com',
      password: 'dashboard-secret',
    },
  });
  expect(response.ok()).toBeTruthy();

  // The Person id differs from the userid, so the link must come from the
  // `username` lookup, not from the userid.
  await createContent(page, {
    contentType: 'Person',
    contentId: 'site-admin',
    contentTitle: 'Site Admin',
    // The lookup searches as the logged-in Member, who cannot see a private
    // Person.
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      first_name: 'Site',
      last_name: 'Admin',
      username: 'dashboard-user',
    }),
  });

  await login(page, {
    username: 'dashboard-user',
    password: 'dashboard-secret',
  });
  await page.goto('/');
  await page.locator('#toolbar-personal').click();

  const dashboard = page
    .locator('.personal-tools')
    .getByRole('link', { name: 'Dashboard' });
  await expect(dashboard).toHaveAttribute('href', '/site-admin/dashboard');
});

test('Personal tools hide the Dashboard link without a Person', async ({
  page,
}) => {
  await login(page);
  await page.goto('/');
  await page.locator('#toolbar-personal').click();

  const menu = page.locator('.personal-tools');
  await expect(menu.getByRole('link', { name: 'Tasks' })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);
});
