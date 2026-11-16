import type { Page } from '@playwright/test';
import { expect, test } from './test';
import { login } from './login';
import { createContent } from './content';

const uniqueSuffix = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function gotoAddView(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'networkidle' });
  await expect(page.locator('#page-add')).toBeVisible();
}

test.describe('ContentInteractions in add view', () => {
  for (const contentType of ['Document', 'Event', 'News Item', 'Workspace']) {
    test(`is not rendered when adding a ${contentType}`, async ({ page }) => {
      await login(page);
      await gotoAddView(page, `/add?type=${encodeURIComponent(contentType)}`);

      await expect(page.locator('.content-engagement')).toHaveCount(0);
    });
  }

  test('is not rendered when adding a WikiPage inside a Workspace', async ({
    page,
  }) => {
    await login(page);
    const workspaceId = `content-interactions-add-workspace-${uniqueSuffix()}`;
    await createContent(page, {
      contentType: 'Workspace',
      contentId: workspaceId,
      contentTitle: 'Content interactions add workspace',
      transition: 'publish',
    });

    await gotoAddView(page, `/${workspaceId}/add?type=WikiPage`);

    await expect(page.locator('.content-engagement')).toHaveCount(0);
  });

  test('is rendered when adding a type that is not excluded', async ({
    page,
  }) => {
    await login(page);
    // Must be a blocks-enabled type: only the visual (blocks) add form
    // renders the belowContent slot, so e.g. Person would never show it.
    await gotoAddView(page, '/add?type=Location');

    await expect(page.locator('.content-engagement')).toHaveCount(1);
  });
});

test.describe('RelatedItems', () => {
  async function createWikiPageWithRelatedItem(page: Page) {
    const suffix = uniqueSuffix();
    const workspaceId = `related-items-workspace-${suffix}`;
    const targetId = `related-items-target-${suffix}`;
    const pageId = `related-items-page-${suffix}`;

    await createContent(page, {
      contentType: 'Workspace',
      contentId: workspaceId,
      contentTitle: 'Related items workspace',
      transition: 'publish',
    });
    await createContent(page, {
      contentType: 'WikiPage',
      contentId: targetId,
      contentTitle: 'Related items target',
      path: workspaceId,
      transition: 'publish',
    });
    await createContent(page, {
      contentType: 'WikiPage',
      contentId: pageId,
      contentTitle: 'Related items page',
      path: workspaceId,
      transition: 'publish',
      bodyModifier: (body) => ({
        ...body,
        relatedItems: [`/${workspaceId}/${targetId}`],
      }),
    });

    return `/${workspaceId}/${pageId}`;
  }

  test('are rendered at the default container width in view', async ({
    page,
  }) => {
    await login(page);
    const pagePath = await createWikiPageWithRelatedItem(page);
    await page.goto(pagePath, { waitUntil: 'networkidle' });

    const relatedItems = page.locator('.related-items');
    await expect(relatedItems).toBeVisible();
    await expect(relatedItems).toContainText('Related items target');
    await expect(relatedItems).toHaveCSS(
      'max-width',
      await relatedItems.evaluate((el) =>
        getComputedStyle(el)
          .getPropertyValue('--default-container-width')
          .trim(),
      ),
    );
  });

  // In the add view the form gets the parent's content, so its related
  // items must not leak into the new page.
  test("are not rendered from the parent's content in add view", async ({
    page,
  }) => {
    await login(page);
    const pagePath = await createWikiPageWithRelatedItem(page);

    await page.goto(pagePath, { waitUntil: 'networkidle' });
    await expect(page.locator('.related-items')).toContainText(
      'Related items target',
    );

    await gotoAddView(page, `${pagePath}/add?type=WikiPage`);
    await expect(page.locator('.related-items')).toHaveCount(0);
  });
});
