import { login } from './login';
import { expect, test } from './test';
import { expectNoAccessibilityViolations } from './accessibility';

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
    await page.goto('/', { waitUntil: 'networkidle' });

    const navigationTree = page.locator('#navigation-tree .navigation-tree-wrapper');
    await expect(navigationTree).toBeVisible();

    await expectNoAccessibilityViolations(page, {
      include: [['#navigation-tree .navigation-tree-wrapper']],
      // Component scans should not fail on document-level concerns.
      disabledRules: ['document-title', 'heading-order'],
    });
  });
});
