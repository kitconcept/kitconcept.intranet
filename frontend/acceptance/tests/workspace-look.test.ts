import { expect, test } from './test';
import { login } from './login';
import { createContent } from './content';

// The workspace look (variant D) is scoped to the body class the compact
// workspace header sets. Portal pages must keep the portal colours.

const WORKSPACE_CHROME = 'rgb(248, 248, 247)';
const WORKSPACE_FOREGROUND = 'rgb(55, 53, 47)';

test.describe('Workspace look', () => {
  test('workspace views get the workspace colours', async ({ page }) => {
    await login(page);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const workspaceId = `look-workspace-${suffix}`;
    const pageId = `look-wikipage-${suffix}`;

    await createContent(page, {
      contentType: 'Workspace',
      contentId: workspaceId,
      contentTitle: 'Look Workspace',
      path: '',
      transition: 'publish',
    });
    await createContent(page, {
      contentType: 'WikiPage',
      contentId: pageId,
      contentTitle: 'Look Wiki Page',
      path: workspaceId,
      transition: 'publish',
    });

    await page.goto(`/${workspaceId}/${pageId}`, { waitUntil: 'networkidle' });

    await expect(page.locator('body')).toHaveClass(
      /has-header-intranet-compact/,
    );

    const panel = page.locator('.navigation-tree-panel.is-open');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveCSS('background-color', WORKSPACE_CHROME);
    // No line between the navigation column and the content.
    await expect(panel).toHaveCSS('border-right-color', 'rgba(0, 0, 0, 0)');

    // The rail has the navigation tone and no shadow.
    const rail = page.locator('#toolbar .toolbar');
    await expect(rail).toHaveCSS('background-color', WORKSPACE_CHROME);
    await expect(rail).toHaveCSS('box-shadow', 'none');

    // The current page is marked by a grey background only.
    const current = page.locator('.react-aria-TreeItem.is-current');
    await expect(current).toHaveCSS('background-color', 'rgb(239, 239, 237)');
    await expect(current).toHaveCSS('border-left-color', 'rgba(0, 0, 0, 0)');

    // The top bar has no separator line.
    await expect(page.locator('.header-intranet-compact')).toHaveCSS(
      'border-bottom-color',
      'rgba(0, 0, 0, 0)',
    );

    // Warm near-black text instead of the portal black.
    await expect(
      page.getByRole('heading', { level: 1, name: 'Look Wiki Page' }),
    ).toHaveCSS('color', WORKSPACE_FOREGROUND);
  });

  test('portal views keep the portal colours', async ({ page }) => {
    await login(page);
    const pageId = `look-portal-${Date.now()}`;
    await createContent(page, {
      contentType: 'Document',
      contentId: pageId,
      contentTitle: 'Look Portal Page',
      path: '',
      transition: 'publish',
    });

    await page.goto(`/${pageId}`, { waitUntil: 'networkidle' });

    await expect(page.locator('#toolbar .toolbar')).toBeVisible();
    await expect(page.locator('body')).not.toHaveClass(
      /has-header-intranet-compact/,
    );
    await expect(page.locator('#toolbar .toolbar')).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );
  });
});
