import type { Page } from '@playwright/test';
import { expect, test } from './test';
import { login } from './login';
import { createContent } from './content';

/* Superseded by createNavTreeWikiContent below: the NavigationTree slot now
   only renders on WikiPage/Workspace content (see
   frontend/packages/kitconcept-intranet/src/config/slots.ts), so a
   Document-only fixture never triggers the sidebar. Kept commented in case
   the content-type predicate changes again later.

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
*/

async function createNavTreeWikiContent(page: Page): Promise<{
  workspaceId: string;
  workspacePath: string;
  sectionId: string;
  sectionPath: string;
  childId: string;
  childPath: string;
}> {
  const idSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const workspaceId = `nav-tree-workspace-${idSuffix}`;
  const sectionId = `nav-tree-section-${idSuffix}`;
  const childId = `nav-tree-child-${idSuffix}`;

  await createContent(page, {
    contentType: 'Workspace',
    contentId: workspaceId,
    contentTitle: 'Nav Tree Test Workspace',
    path: '',
    transition: 'publish',
  });

  await createContent(page, {
    contentType: 'WikiPage',
    contentId: sectionId,
    contentTitle: 'Nav Tree Test Section',
    path: workspaceId,
    transition: 'publish',
  });

  await createContent(page, {
    contentType: 'WikiPage',
    contentId: childId,
    contentTitle: 'Nav Tree Child Document',
    path: `${workspaceId}/${sectionId}`,
    transition: 'publish',
  });

  return {
    workspaceId,
    workspacePath: `/${workspaceId}`,
    sectionId,
    sectionPath: `/${workspaceId}/${sectionId}`,
    childId,
    childPath: `/${workspaceId}/${sectionId}/${childId}`,
  };
}

test.describe('NavigationTree', () => {
  test.describe('panel visibility', () => {
    /*
    test('navigation tree panel is visible by default when logged in', async ({
      page,
    }) => {
      await login(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).toBeVisible();
    });
    */

    test('navigation tree panel is visible when viewing a Workspace', async ({
      page,
    }) => {
      await login(page);
      const { workspacePath } = await createNavTreeWikiContent(page);
      await page.goto(workspacePath, { waitUntil: 'networkidle' });

      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).toBeVisible();
    });

    /*
    test('panel shows the site title in the header', async ({ page }) => {
      await login(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      const siteTitle = page.locator('.nav-tree-site-title');
      await expect(siteTitle).toBeVisible();
      await expect(siteTitle).toHaveText('Site');
    });
    */

    // Now we are getting this from controlpanel
    // test('panel shows the active workspace title in the header', async ({
    //   page,
    // }) => {
    //   await login(page);
    //   const { workspacePath } = await createNavTreeWikiContent(page);
    //   await page.goto(workspacePath, { waitUntil: 'networkidle' });

    //   const siteTitle = page.locator('.nav-tree-site-title');
    //   await expect(siteTitle).toBeVisible();
    //   await expect(siteTitle).toHaveText('Nav Tree Test Workspace');
    // });

    /*
    test('navigation tree panel is visible on edit pages', async ({ page }) => {
      await login(page);
      await page.goto('/edit', { waitUntil: 'networkidle' });

      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).toBeVisible();
    });
    */

    test('navigation tree panel is visible on a WikiPage edit page', async ({
      page,
    }) => {
      await login(page);
      const { sectionPath } = await createNavTreeWikiContent(page);
      await page.goto(`${sectionPath}/edit`, { waitUntil: 'networkidle' });

      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).toBeVisible();
    });

    test('navigation tree panel is hidden on non-WikiPage/Workspace content', async ({
      page,
    }) => {
      await login(page);
      const idSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const documentId = `nav-tree-document-${idSuffix}`;
      await createContent(page, {
        contentType: 'Document',
        contentId: documentId,
        contentTitle: 'Nav Tree Plain Document',
        path: '',
        transition: 'publish',
      });

      await page.goto(`/${documentId}`, { waitUntil: 'networkidle' });

      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).not.toBeVisible();
    });
  });

  test.describe('tree navigation', () => {
    /*
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
    */

    test('root site item is visible and expanded by default', async ({
      page,
    }) => {
      await login(page);
      const { workspacePath } = await createNavTreeWikiContent(page);
      await page.goto(workspacePath, { waitUntil: 'networkidle' });

      const nav = page.locator('nav.navigation-tree');
      await expect(nav).toBeVisible();
      await expect(nav.getByRole('row').first()).toBeVisible();
    });

    /*
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
    */

    test('clicking a section chevron expands its children', async ({
      page,
    }) => {
      await login(page);
      const { workspacePath } = await createNavTreeWikiContent(page);

      await page.goto(workspacePath, { waitUntil: 'networkidle' });

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

    /*
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
    */

    test('clicking a tree item navigates to that URL', async ({ page }) => {
      await login(page);
      const { workspacePath, sectionPath } =
        await createNavTreeWikiContent(page);

      await page.goto(workspacePath, { waitUntil: 'networkidle' });

      const nav = page.locator('nav.navigation-tree');
      const sectionTitle = nav
        .getByRole('row', { name: 'Nav Tree Test Section' })
        .locator('.nav-tree-title');
      await expect(sectionTitle).toBeVisible();

      await sectionTitle.click();
      await expect(page).toHaveURL(new RegExp(sectionPath + '$'));
    });

    /*
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
    */

    test('current page item has is-current class', async ({ page }) => {
      await login(page);
      const { sectionPath } = await createNavTreeWikiContent(page);

      await page.goto(sectionPath, { waitUntil: 'networkidle' });

      const nav = page.locator('nav.navigation-tree');
      const sectionRow = nav.getByRole('row', {
        name: 'Nav Tree Test Section',
      });
      await expect(sectionRow).toHaveClass(/is-current/);
    });
  });

  test.describe('search', () => {
    /*
    test('search input is visible', async ({ page }) => {
      await login(page);
      await page.goto('/', { waitUntil: 'networkidle' });

      await expect(page.locator('.nav-tree-search-input')).toBeVisible();
    });
    */

    test('search input is visible', async ({ page }) => {
      await login(page);
      const { workspacePath } = await createNavTreeWikiContent(page);
      await page.goto(workspacePath, { waitUntil: 'networkidle' });

      await expect(page.locator('.nav-tree-search-input')).toBeVisible();
    });

    /*
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
    */

    test('typing in search shows flat search results', async ({ page }) => {
      await login(page);
      const { workspacePath } = await createNavTreeWikiContent(page);

      await page.goto(workspacePath, { waitUntil: 'networkidle' });

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

    /*
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
    */

    test('clearing search restores tree view', async ({ page }) => {
      await login(page);
      const { workspacePath } = await createNavTreeWikiContent(page);
      await page.goto(workspacePath, { waitUntil: 'networkidle' });

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
    /*
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
    */

    test('close button hides the panel', async ({ page }) => {
      await login(page);
      const { workspacePath } = await createNavTreeWikiContent(page);
      await page.goto(workspacePath, { waitUntil: 'networkidle' });

      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).toBeVisible();

      await page.locator('.nav-tree-close').click();

      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).not.toBeVisible();
      await expect(page.locator('.navigation-tree-panel')).toBeAttached();
    });

    /*
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
    */

    test('collapsed tab button reopens the panel', async ({ page }) => {
      await login(page);
      const { workspacePath } = await createNavTreeWikiContent(page);
      await page.goto(workspacePath, { waitUntil: 'networkidle' });

      await page.locator('.nav-tree-close').click();
      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).not.toBeVisible();
      await page.locator('.navigation-tree-collapsed-tab').click();
      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).toBeVisible();
    });

    /*
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
    */

    test('closed state persists across page reload', async ({ page }) => {
      await login(page);
      const { workspacePath } = await createNavTreeWikiContent(page);
      await page.goto(workspacePath, { waitUntil: 'networkidle' });

      await page.locator('.nav-tree-close').click();
      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).not.toBeVisible();

      await page.reload({ waitUntil: 'networkidle' });

      await expect(
        page.locator('.navigation-tree-panel.is-open'),
      ).not.toBeVisible();
    });

    /*
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
    */

    test('open state persists across page reload', async ({ page }) => {
      await login(page);
      const { workspacePath } = await createNavTreeWikiContent(page);
      await page.goto(workspacePath, { waitUntil: 'networkidle' });
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

  test.describe('workflow state', () => {
    test('state dot updates after a workflow transition in the toolbar', async ({
      page,
    }) => {
      await login(page);
      const { workspaceId, workspacePath } =
        await createNavTreeWikiContent(page);
      const idSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const pageId = `nav-tree-private-${idSuffix}`;
      await createContent(page, {
        contentType: 'WikiPage',
        contentId: pageId,
        contentTitle: 'Nav Tree Private Page',
        path: workspaceId,
      });

      await page.goto(`${workspacePath}/${pageId}`, {
        waitUntil: 'networkidle',
      });

      const stateDot = page
        .locator('nav.navigation-tree')
        .getByRole('row', { name: 'Nav Tree Private Page' })
        .locator('.nav-tree-state-dot');
      await expect(stateDot).toHaveAttribute('data-review-state', 'private');

      await page.locator('#toolbar button[aria-label="More"]').click();
      await page.locator('#toolbar .react-select__control').click();
      await page
        .locator('.react-select__option', {
          hasText: /^(Publish|Veröffentlichen)$/,
        })
        .click();

      await expect(stateDot).toHaveAttribute('data-review-state', 'published');
    });
  });

  test.describe('hidden content types', () => {
    test('images and files are not shown in the tree', async ({ page }) => {
      await login(page);
      const { workspaceId, workspacePath } =
        await createNavTreeWikiContent(page);
      const idSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const mediaPageId = `nav-tree-media-page-${idSuffix}`;

      await createContent(page, {
        contentType: 'WikiPage',
        contentId: mediaPageId,
        contentTitle: 'Nav Tree Media Page',
        path: workspaceId,
        transition: 'publish',
      });

      // One Image and one File in the workspace, and one of each inside
      // the media page (so it has no visible children).
      for (const path of [workspaceId, `${workspaceId}/${mediaPageId}`]) {
        await createContent(page, {
          contentType: 'Image',
          contentId: `nav-tree-image-${idSuffix}`,
          contentTitle: 'Nav Tree Image',
          path,
          bodyModifier: (body) => ({
            ...body,
            image: {
              data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              encoding: 'base64',
              filename: 'pixel.png',
              'content-type': 'image/png',
            },
          }),
        });
        await createContent(page, {
          contentType: 'File',
          contentId: `nav-tree-file-${idSuffix}`,
          contentTitle: 'Nav Tree File',
          path,
          bodyModifier: (body) => ({
            ...body,
            file: {
              data: 'aGVsbG8=',
              encoding: 'base64',
              filename: 'hello.txt',
              'content-type': 'text/plain',
            },
          }),
        });
      }

      await page.goto(workspacePath, { waitUntil: 'networkidle' });

      const nav = page.locator('nav.navigation-tree');
      const mediaPageRow = nav.getByRole('row', {
        name: 'Nav Tree Media Page',
      });
      await expect(mediaPageRow).toBeVisible();
      await expect(
        nav.getByRole('row', { name: 'Nav Tree Test Section' }),
      ).toBeVisible();

      await expect(
        nav.getByRole('row', { name: 'Nav Tree Image' }),
      ).toHaveCount(0);
      await expect(nav.getByRole('row', { name: 'Nav Tree File' })).toHaveCount(
        0,
      );
      // A page that only contains an image and a file has nothing to expand.
      await expect(mediaPageRow.locator('button[slot="chevron"]')).toBeHidden();
    });
  });

  test.describe('workspace switcher', () => {
    test('search filters workspaces and keeps the portal entry', async ({
      page,
    }) => {
      await login(page);
      const { workspacePath } = await createNavTreeWikiContent(page);
      await page.goto(workspacePath, { waitUntil: 'networkidle' });

      await page.locator('.navigation-tree-header').click();
      const menu = page.locator('.nav-tree-switcher-menu');
      const search = page.locator('.nav-tree-switcher-search input');
      await expect(search).toBeVisible();
      await expect(menu.locator('.nav-tree-switcher-section')).toHaveCount(2);

      await search.fill('nav tree test');
      await expect(
        menu.getByRole('menuitem', { name: 'Nav Tree Test Workspace' }).first(),
      ).toBeVisible();

      await search.fill('no-such-workspace-xyz');
      await expect(
        menu.getByRole('menuitem', {
          name: /No workspace found|Kein Workspace gefunden/,
        }),
      ).toBeVisible();
      // The portal entry stays visible while filtering.
      await expect(menu.getByRole('menuitem')).toHaveCount(2);
    });
  });
});
