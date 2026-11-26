/**
 * The button of the Button block: dark on hover and on keyboard focus, but
 * back to its normal colours once the mouse leaves after a click, even though
 * the click left the focus on it.
 */
import type { Locator, Page } from '@playwright/test';

import { createContent } from './content';
import { login } from './login';
import { expect, test } from './test';

const CONTENT_ID = 'button-focus';

async function colours(button: Locator) {
  return button.evaluate((element) => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, color: style.color };
  });
}

async function moveMouseAway(page: Page) {
  await page.mouse.move(5, 5);
}

test.describe('Button block: pressed look', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await createContent(page, {
      contentType: 'Document',
      contentId: CONTENT_ID,
      contentTitle: 'Button focus',
      transition: 'publish',
      bodyModifier: (body) => ({
        ...body,
        blocks: {
          title: { '@type': 'title' },
          button: {
            '@type': '__button',
            title: 'Button Text',
            href: [{ '@id': `/${CONTENT_ID}`, title: 'Button focus' }],
          },
        },
        blocks_layout: { items: ['title', 'button'] },
      }),
    });
  });

  for (const mode of ['view', 'edit'] as const) {
    test(`a click doesn't leave it dark (${mode})`, async ({ page }) => {
      await page.goto(
        mode === 'edit' ? `/${CONTENT_ID}/edit` : `/${CONTENT_ID}`,
      );
      const button = page
        .locator('.block.__button')
        .locator('a, button')
        .filter({ hasText: 'Button Text' })
        .first();
      await expect(button).toBeVisible();
      await moveMouseAway(page);
      const normal = await colours(button);

      await button.hover();
      const hovered = await colours(button);
      expect(hovered).not.toEqual(normal);

      // Click without following the link.
      await button.evaluate((element) =>
        element.addEventListener('click', (event) => event.preventDefault(), {
          once: true,
        }),
      );
      await button.click();
      await moveMouseAway(page);
      await expect(button).toBeFocused();
      await expect.poll(() => colours(button)).toEqual(normal);
    });
  }

  test('keyboard focus shows it dark', async ({ page }) => {
    await page.goto(`/${CONTENT_ID}`);
    const button = page.locator('.block.__button a').first();
    await expect(button).toBeVisible();
    await moveMouseAway(page);
    const normal = await colours(button);

    await button.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    await expect.poll(() => colours(button)).not.toEqual(normal);
  });
});
