/**
 * Search finds words that occur only in a table cell of a Wiki Page (manual
 * test plan of https://github.com/kitconcept/kitconcept.intranet/pull/518,
 * section G).
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/667
 */
import { createTablePage } from '../fixtures/wiki-pages';
import { login } from './login';
import { expect, test } from './test';

test.describe.configure({ timeout: 30_000 });

test.describe('Wiki tables: search (G)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('finds words from the page intro and from a table cell', async ({
    page,
  }) => {
    const { title } = await createTablePage(page, 'projektbudget-2026');

    // "Mittelverwendung" is only in the intro, "Katalysator-Screening" only in
    // a table cell.
    for (const word of ['Mittelverwendung', 'Katalysator-Screening']) {
      await page.goto(`/search?SearchableText=${encodeURIComponent(word)}`, {
        waitUntil: 'networkidle',
      });
      await expect(
        page.getByRole('link', { name: title }).first(),
      ).toBeVisible();
    }

    // Control: a word that is nowhere on the page does not find it.
    await page.goto('/search?SearchableText=Quantenschaum', {
      waitUntil: 'networkidle',
    });
    await expect(page.getByRole('link', { name: title })).toHaveCount(0);
  });
});
