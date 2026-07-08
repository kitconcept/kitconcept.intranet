import type { Page } from '@playwright/test';
import { expect, test } from './test';
import { login } from './login';
import { createContent } from './content';

async function createNavTreeContent(page: Page): Promise<{
  sectionId: string;
  sectionPath: string;
  childId: string;
  childPath: string;
}> {
  const idSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const sectionId = `nav-tree-section-${idSuffix}`;
  const childId = `nav-tree-child-${idSuffix}`;

  await createContent(page, {
    contentType: 'Document',
    contentId: sectionId,
    contentTitle: 'Nav Tree Test Section',
    path: '',
    transition: 'publish',
  });

  await createContent(page, {
    contentType: 'Document',
    contentId: childId,
    contentTitle: 'Nav Tree Child Document',
    path: sectionId,
    transition: 'publish',
  });

  return {
    sectionId,
    sectionPath: `/${sectionId}`,
    childId,
    childPath: `/${sectionId}/${childId}`,
  };
}

test.describe('NavigationTree', () => {
  test.describe('panel visibility', () => {
    test('navigation tree panel is visible by default when logged in', async ({
      page,
    }) => {
      await login(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).toBeVisible();
    });

    test('panel shows the site title in the header', async ({ page }) => {
      await login(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      const siteTitle = page.locator('.nav-tree-site-title');
      await expect(siteTitle).toBeVisible();
      await expect(siteTitle).toHaveText('Site');
    });

    test('navigation tree panel is visible on edit pages', async ({ page }) => {
      await login(page);
      await page.goto('/edit', { waitUntil: 'networkidle' });

      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).toBeVisible();
    });
  });

  test.describe('tree navigation', () => {
    test('root site item is visible and expanded by default', async ({
      page,
    }) => {
      await login(page);
      await createNavTreeContent(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      const nav = page.locator('nav.navigation-tree');
      await expect(nav).toBeVisible();
      await expect(nav.getByRole('row').first()).toBeVisible();
    });

    test('clicking a section chevron expands its children', async ({
      page,
    }) => {
      await login(page);
      await createNavTreeContent(page);

      await page.goto('/', { waitUntil: 'networkidle' });

      const nav = page.locator('nav.navigation-tree');

      const sectionRow = nav.getByRole('row', {
        name: 'Nav Tree Test Section',
      });
      await expect(sectionRow).toBeVisible();

      await sectionRow.locator('button[slot="chevron"]').click();

      await expect(
        nav.locator('.nav-tree-title', { hasText: 'Nav Tree Child Document' }),
      ).toBeVisible();
    });

    test('clicking a tree item navigates to that URL', async ({ page }) => {
      await login(page);
      const { sectionPath } = await createNavTreeContent(page);

      await page.goto('/', { waitUntil: 'networkidle' });

      const nav = page.locator('nav.navigation-tree');
      const sectionTitle = nav
        .getByRole('row', { name: 'Nav Tree Test Section' })
        .locator('.nav-tree-title');
      await expect(sectionTitle).toBeVisible();

      await sectionTitle.click();
      await expect(page).toHaveURL(new RegExp(sectionPath + '$'));
    });

    test('current page item has is-current class', async ({ page }) => {
      await login(page);
      const { sectionPath } = await createNavTreeContent(page);

      await page.goto(sectionPath, { waitUntil: 'networkidle' });

      const nav = page.locator('nav.navigation-tree');
      const sectionRow = nav.getByRole('row', {
        name: 'Nav Tree Test Section',
      });
      await expect(sectionRow).toHaveClass(/is-current/);
    });
  });

  test.describe('search', () => {
    test('search input is visible', async ({ page }) => {
      await login(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      await expect(page.locator('.nav-tree-search-input')).toBeVisible();
    });

    test('typing in search shows flat search results', async ({ page }) => {
      await login(page);
      await createNavTreeContent(page);

      await page.goto('/', { waitUntil: 'networkidle' });

      const searchInput = page.locator('.nav-tree-search-input');
      const searchResponse = page.waitForResponse(
        (resp) => resp.url().includes('@search') && resp.status() === 200,
      );
      await searchInput.fill('Nav Tree Child Document');
      await searchResponse;

      const nav = page.locator('nav.navigation-tree');
      await expect(
        nav.locator('.nav-tree-title', { hasText: 'Nav Tree Child Document' }),
      ).toBeVisible();
    });

    test('clearing search restores tree view', async ({ page }) => {
      await login(page);
      await createNavTreeContent(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      const nav = page.locator('nav.navigation-tree');
      const searchInput = page.locator('.nav-tree-search-input');

      const searchResponse = page.waitForResponse(
        (resp) => resp.url().includes('@search') && resp.status() === 200,
      );
      await searchInput.fill('Nav Tree Child');
      await searchResponse;
      await expect(
        nav.locator('.nav-tree-title', { hasText: 'Nav Tree Child Document' }),
      ).toBeVisible();

      await page.locator('.nav-tree-search-clear').click();
      await expect(
        nav.locator('.nav-tree-title', { hasText: 'Nav Tree Test Section' }),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('open/close state', () => {
    test('close button hides the panel', async ({ page }) => {
      await login(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).toBeVisible();

      await page.locator('.nav-tree-close').click();

      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).not.toBeVisible();
      await expect(page.locator('.navigation-tree-panel')).toBeAttached();
    });

    test('collapsed tab button reopens the panel', async ({ page }) => {
      await login(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      await page.locator('.nav-tree-close').click();
      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).not.toBeVisible();
      await page.locator('.navigation-tree-collapsed-tab').click();
      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).toBeVisible();
    });

    test('closed state persists across page reload', async ({ page }) => {
      await login(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      await page.locator('.nav-tree-close').click();
      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).not.toBeVisible();

      await page.reload({ waitUntil: 'networkidle' });

      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).not.toBeVisible();
    });

    test('open state persists across page reload', async ({ page }) => {
      await login(page);
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.locator('.nav-tree-close').click();
      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).not.toBeVisible();

      await page.evaluate(() =>
        localStorage.setItem('navigation-tree-open', 'true'),
      );
      await page.reload({ waitUntil: 'networkidle' });

      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).toBeVisible();
    });
  });
});
