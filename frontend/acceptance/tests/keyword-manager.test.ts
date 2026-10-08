import type { Page } from '@playwright/test';
import { test, expect } from './test';
import { createContent } from './content';
import { login } from './login';

const CONTROLPANEL_PATH = '/controlpanel/keyword-manager';

async function createDocWithKeywords(
  page: Page,
  id: string,
  subjects: string[],
) {
  await createContent(page, {
    contentType: 'Document',
    contentId: id,
    contentTitle: id,
    bodyModifier: (body) => ({ ...body, subjects }),
  });
}

async function openKeywordManager(page: Page) {
  await page.goto(CONTROLPANEL_PATH);
  await expect(
    page.getByRole('heading', { name: /keyword manager/i }).first(),
  ).toBeVisible();
}

const keywordRow = (page: Page, keyword: string) =>
  page.getByRole('row').filter({ hasText: keyword });

const selectKeyword = async (page: Page, keyword: string) => {
  const row = keywordRow(page, keyword);
  await row.locator('.checkbox').click();
  await expect(row.getByRole('checkbox')).toBeChecked();
};

test.describe('Keyword Manager control panel', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('is reachable from the site setup overview', async ({ page }) => {
    await page.goto('/controlpanel');
    await page.getByRole('link', { name: /keyword manager/i }).click();
    await expect(page).toHaveURL(/keyword-manager/i);
  });

  test('lists existing keywords', async ({ page }) => {
    await createDocWithKeywords(page, 'doc-a', ['alpha', 'beta']);

    await openKeywordManager(page);
    await expect(keywordRow(page, 'alpha')).toBeVisible();
    await expect(keywordRow(page, 'beta')).toBeVisible();
  });

  test('shows the number of selected keywords', async ({ page }) => {
    await createDocWithKeywords(page, 'doc-a', ['alpha', 'beta']);

    await openKeywordManager(page);
    await expect(page.getByText('No keyword selected')).toBeVisible();

    await selectKeyword(page, 'alpha');
    await expect(page.getByText('1 keyword(s) selected')).toBeVisible();

    await selectKeyword(page, 'beta');
    await expect(page.getByText('2 keyword(s) selected')).toBeVisible();
  });

  test('disables bulk actions without a selection', async ({ page }) => {
    await createDocWithKeywords(page, 'doc-a', ['alpha']);

    await openKeywordManager(page);
    await expect(
      page.getByRole('button', { name: 'Rename keyword selection' }),
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Delete keyword selection' }),
    ).toBeDisabled();

    await selectKeyword(page, 'alpha');
    await expect(
      page.getByRole('button', { name: 'Rename keyword selection' }),
    ).toBeEnabled();
    await expect(
      page.getByRole('button', { name: 'Delete keyword selection' }),
    ).toBeEnabled();
  });

  test('renames a keyword', async ({ page }) => {
    await createDocWithKeywords(page, 'doc-a', ['old-keyword']);

    await openKeywordManager(page);
    await selectKeyword(page, 'old-keyword');
    await page
      .getByRole('button', { name: 'Rename keyword selection' })
      .click();

    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Rename keyword' }),
    ).toBeVisible();
    await dialog
      .getByRole('textbox', { name: /new keyword name/i })
      .fill('new-keyword');
    await dialog.getByRole('button', { name: 'Rename', exact: true }).click();

    await expect(page.getByText('1 keywords updated')).toBeVisible();
    await expect(keywordRow(page, 'new-keyword')).toBeVisible();
    await expect(keywordRow(page, 'old-keyword')).toHaveCount(0);
  });

  test('merges two keywords under a new name', async ({ page }) => {
    await createDocWithKeywords(page, 'doc-a', ['merge-a']);
    await createDocWithKeywords(page, 'doc-b', ['merge-b']);

    await openKeywordManager(page);
    await selectKeyword(page, 'merge-a');
    await selectKeyword(page, 'merge-b');
    await page
      .getByRole('button', { name: 'Rename keyword selection' })
      .click();

    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: /rename & merge/i }),
    ).toBeVisible();

    // With 2+ selected the modal defaults to "select existing keyword";
    // switch to the "new name" radio (the second one) to enable the text field.
    await dialog.locator('.react-aria-Radio').nth(1).click();
    await expect(dialog.getByRole('radio').nth(1)).toBeChecked();
    await dialog
      .getByRole('textbox', { name: /new keyword name/i })
      .fill('merged');
    await dialog
      .getByRole('button', { name: 'Rename & Merge', exact: true })
      .click();

    await expect(page.getByText('2 keywords updated')).toBeVisible();
    await expect(keywordRow(page, 'merged')).toBeVisible();
    await expect(keywordRow(page, 'merge-a')).toHaveCount(0);
    await expect(keywordRow(page, 'merge-b')).toHaveCount(0);
  });

  test('deletes a keyword via the row action', async ({ page }) => {
    await createDocWithKeywords(page, 'doc-a', ['to-delete', 'keep']);

    await openKeywordManager(page);
    await page
      .getByRole('button', { name: 'Delete keyword to-delete', exact: true })
      .click();

    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByText(/about to delete the keyword/i),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.getByText('1 keywords deleted')).toBeVisible();
    await expect(keywordRow(page, 'to-delete')).toHaveCount(0);
    await expect(keywordRow(page, 'keep')).toBeVisible();
  });

  test('deletes multiple selected keywords', async ({ page }) => {
    await createDocWithKeywords(page, 'doc-a', ['del-a', 'del-b', 'keep']);

    await openKeywordManager(page);
    await selectKeyword(page, 'del-a');
    await selectKeyword(page, 'del-b');
    await page
      .getByRole('button', { name: 'Delete keyword selection' })
      .click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/about to delete 2 selected/i)).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.getByText('2 keywords deleted')).toBeVisible();
    await expect(keywordRow(page, 'del-a')).toHaveCount(0);
    await expect(keywordRow(page, 'del-b')).toHaveCount(0);
    await expect(keywordRow(page, 'keep')).toBeVisible();
  });

  test('cancelling the delete dialog keeps the keyword', async ({ page }) => {
    await createDocWithKeywords(page, 'doc-a', ['keep']);

    await openKeywordManager(page);
    await page
      .getByRole('button', { name: 'Delete keyword keep', exact: true })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Cancel' })
      .click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(keywordRow(page, 'keep')).toBeVisible();
  });

  test('shows an error toast when deleting fails', async ({ page }) => {
    await createDocWithKeywords(page, 'doc-a', ['error-keyword']);

    await openKeywordManager(page);

    // Fail mutating requests to the keyword endpoint (verify the URL in the network tab)
    await page.route(/keyword/i, (route) =>
      route.request().method() === 'GET'
        ? route.continue()
        : route.fulfill({ status: 500, body: '{"message":"boom"}' }),
    );

    await page
      .getByRole('button', {
        name: 'Delete keyword error-keyword',
        exact: true,
      })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete', exact: true })
      .click();

    await expect(
      page.getByText('The selected keywords could not be deleted.'),
    ).toBeVisible();
    await expect(keywordRow(page, 'error-keyword')).toBeVisible();
  });
});
