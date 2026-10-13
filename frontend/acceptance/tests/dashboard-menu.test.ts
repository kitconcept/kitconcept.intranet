import { createContent } from './content';
import { login } from './login';
import { expect, test } from './test';

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('Personal tools link to the current user Person dashboard', async ({
  page,
}) => {
  // The Person id differs from the userid, so the link must come from the
  // `username` lookup, not from the userid.
  await createContent(page, {
    contentType: 'Person',
    contentId: 'site-admin',
    contentTitle: 'Site Admin',
    bodyModifier: (body) => ({
      ...body,
      first_name: 'Site',
      last_name: 'Admin',
      username: 'admin',
    }),
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
  await page.goto('/');
  await page.locator('#toolbar-personal').click();

  const menu = page.locator('.personal-tools');
  await expect(menu.getByRole('link', { name: 'Tasks' })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);
});
