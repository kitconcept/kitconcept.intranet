import { createContent } from './content';
import { login } from './login';
import { expect, test } from './test';

test('a manager can delete and restore an item from the recycle bin', async ({
  page,
}) => {
  await login(page);
  await createContent(page, {
    contentType: 'Document',
    contentId: 'recycle-bin-item',
    contentTitle: 'Recycle bin item',
  });

  await page.goto('/recycle-bin-item/delete');
  const deleted = page.waitForResponse(
    (response) =>
      response.request().method() === 'DELETE' &&
      new URL(response.url()).pathname.endsWith('/recycle-bin-item'),
  );
  await page.getByRole('button', { name: 'Ok' }).click();
  await expect.poll(async () => (await deleted).ok()).toBe(true);

  await page.goto('/@@recyclebin');
  await expect(
    page.getByRole('heading', { name: 'Recycle bin', level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Recycle bin item' }),
  ).toBeVisible();

  const selection = page.getByLabel('Select Recycle bin item');
  await selection.locator('..').click();
  await expect(selection).toBeChecked();
  await page.getByRole('button', { name: 'Restore selected' }).click();

  await expect(page).toHaveURL(/\/recycle-bin-item\/?$/);
  await expect(page.getByRole('link', { name: 'Edit' })).toBeVisible();

  await page.goto('/@@recyclebin');
  await expect(page.getByText('The recycle bin is empty.')).toBeVisible();
});
