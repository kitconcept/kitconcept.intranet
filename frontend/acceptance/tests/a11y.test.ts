import { login } from './login';
import { expect, test } from './test';
import { expectNoAccessibilityViolations } from './accessibility';
import { createContent } from './content';

test.describe('Accessibility @a11y', () => {
  test('homepage has no automatic accessibility violations', async ({
    page,
  }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' });

    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('banner')).toBeVisible();
    await expectNoAccessibilityViolations(page, {
      // The fixture homepage intentionally omits an h1, matching the
      // longstanding Cypress a11y baseline for this repo.
      disabledRules: ['page-has-heading-one'],
    });
  });

  test('navigation tree has no automatic accessibility violations', async ({
    page,
  }) => {
    await login(page);
    const idSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const workspaceId = `a11y-nav-tree-workspace-${idSuffix}`;

    await createContent(page, {
      contentType: 'Workspace',
      contentId: workspaceId,
      contentTitle: 'A11y Navigation Tree Workspace',
      path: '',
      transition: 'publish',
    });

    await page.goto(`/${workspaceId}`, { waitUntil: 'networkidle' });

    const navigationTree = page.locator(
      '#navigation-tree .navigation-tree-wrapper',
    );
    await expect(navigationTree).toBeVisible();

    await expectNoAccessibilityViolations(page, {
      include: [['#navigation-tree .navigation-tree-wrapper']],
      // Component scans should not fail on document-level concerns.
      disabledRules: ['document-title', 'heading-order'],
    });
  });
});
