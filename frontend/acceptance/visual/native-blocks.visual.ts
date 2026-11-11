// Copied from @kitconcept/volto-plate (kitconcept/volto-plate#95,
// frontend/acceptance/visual/native-blocks.visual.ts). Keep it in sync with
// volto-plate; intranet-specific snapshots go into wiki-tables.visual.ts.

import type { Locator, Page } from '@playwright/test';

import { editable } from '../fixtures/editor';
import {
  ALL_NATIVE_BLOCK_SECTIONS,
  type NativeBlockSection,
} from '../fixtures/native-blocks';
import {
  createNativeBlocksPage,
  openInEditor,
  openInView,
} from '../fixtures/pages';
import { login } from '../tests/login';
import { expect, test } from '../tests/test';

// Snapshots of every native block of the wiki presets, in the public view
// (wiki renderer) and in the editor, plus a page with all of them together, so
// spacing between blocks is covered too. See `playwright-visual.config.ts`.

test.beforeEach(async ({ page }) => {
  await login(page);
});

/** Waits for fonts and moves the pointer away, so hover styles don't leak. */
async function settle(page: Page, target: Locator) {
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await expect(target).toBeVisible();
}

for (const section of ALL_NATIVE_BLOCK_SECTIONS) {
  test(`view: ${section}`, async ({ page }) => {
    const path = await createNativeBlocksPage(page, [section]);
    const content = await openInView(page, path);
    await settle(page, content);

    await expect(content).toHaveScreenshot(`view-${section}.png`);
  });

  test(`edit: ${section}`, async ({ page }) => {
    const path = await createNativeBlocksPage(page, [section]);
    await openInEditor(page, path);
    const content = editable(page);
    await settle(page, content);

    await expect(content).toHaveScreenshot(`edit-${section}.png`);
  });
}

const allSections: NativeBlockSection[] = ALL_NATIVE_BLOCK_SECTIONS;

test('view: all native blocks', async ({ page }) => {
  const path = await createNativeBlocksPage(page, allSections);
  await openInView(page, path);
  await settle(page, page.locator('.typeset').first());

  await expect(page).toHaveScreenshot('view-all.png', { fullPage: true });
});

test('edit: all native blocks', async ({ page }) => {
  const path = await createNativeBlocksPage(page, allSections);
  await openInEditor(page, path);
  await settle(page, editable(page));

  await expect(page).toHaveScreenshot('edit-all.png', { fullPage: true });
});
