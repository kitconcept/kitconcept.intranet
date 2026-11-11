import type { Page } from '@playwright/test';

import { editable } from '../fixtures/editor';
import { openInEditor, openInView } from '../fixtures/pages';
import { createTablePage, type TablePageId } from '../fixtures/wiki-pages';
import { login } from '../tests/login';
import { expect, test } from '../tests/test';

// Intranet-specific: the wiki tables use the intranet's shadow of
// @plone/plate's table-node(-static), so snapshot both demo table pages.

test.beforeEach(async ({ page }) => {
  await login(page);
});

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
}

const pages: TablePageId[] = [
  'projektbudget-2026',
  'teilnehmende-konsortialtreffen',
];

for (const id of pages) {
  test(`view: table page ${id}`, async ({ page }) => {
    const { contentPath } = await createTablePage(page, id);
    await openInView(page, contentPath);
    await expect(page.locator('main table').first()).toBeVisible();
    await settle(page);

    await expect(page).toHaveScreenshot(`view-table-${id}.png`, {
      fullPage: true,
    });
  });

  test(`edit: table page ${id}`, async ({ page }) => {
    const { contentPath } = await createTablePage(page, id);
    await openInEditor(page, contentPath);
    await expect(editable(page).locator('table').first()).toBeVisible();
    await settle(page);

    await expect(page).toHaveScreenshot(`edit-table-${id}.png`, {
      fullPage: true,
    });
  });
}
