/**
 * Wiki Pages stored before the `main` region: the page body in the legacy
 * `blocks.__somersault__` block. Since volto-plate 1.0.0-alpha.41 the editor
 * saves the body in `blocks.main` ("@type": "plate"), and the kitconcept.plate
 * 1.0.0a43 upgrade step moves existing pages there (plone/aurora#379). Pages
 * not migrated yet still show, the first save renames the region, and the
 * history diff compares a version before and one after the rename as the same
 * document.
 */
import { setSelection } from '@platejs/playwright';

import { getValue, nodeText } from '../fixtures/editor';
import { openInEditor, openInView } from '../fixtures/pages';
import { savePage } from '../fixtures/table';
import { expectSelectionIn } from '../fixtures/table-editor';
import {
  getContent,
  MAIN_REGION,
  PLATE_TYPE,
  SOMERSAULT_KEY,
} from '../fixtures/wiki-pages';
import { createWikiPage } from './content';
import { login } from './login';
import { expect, test } from './test';

test.describe.configure({ timeout: 30_000 });

const TITLE = 'Legacy page';
const TEXT = 'Stored before the main region.';

test.describe('Wiki Pages in the legacy __somersault__ shape', () => {
  let contentPath: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    ({ contentPath } = await createWikiPage(page, {
      contentId: 'legacy-region',
      contentTitle: TITLE,
      transition: 'publish',
      bodyModifier: (body) => ({
        ...body,
        blocks: {
          ...(body.blocks as Record<string, unknown>),
          [SOMERSAULT_KEY]: {
            '@type': SOMERSAULT_KEY,
            value: [
              { type: 'title', children: [{ text: TITLE }] },
              { type: 'p', children: [{ text: TEXT }] },
            ],
          },
        },
      }),
    }));
  });

  test('the view shows the page', async ({ page }) => {
    const content = await openInView(page, contentPath);
    await expect(content).toContainText(TEXT);
  });

  test('the first save stores the main region; view and diff follow', async ({
    page,
  }) => {
    const handle = await openInEditor(page, contentPath);
    const value = await getValue(page, handle);
    const index = value.findIndex((node) => nodeText(node) === TEXT);
    await setSelection(page, handle, {
      path: [index, 0],
      offset: TEXT.length,
    });
    await expectSelectionIn(page, [index]);
    await page.keyboard.type(' Edited.');
    await savePage(page, contentPath);

    const content = await getContent(page, contentPath);
    expect(content.blocks[SOMERSAULT_KEY]).toBeUndefined();
    expect(content.blocks[MAIN_REGION]['@type']).toBe(PLATE_TYPE);

    const view = await openInView(page, contentPath);
    await expect(view).toContainText(`${TEXT} Edited.`);

    // Version 0 has `__somersault__`, version 1 `main`: one document, with
    // only the typed text inserted.
    await page.goto(`${contentPath}/diff?one=0&two=1&view=unified`, {
      waitUntil: 'networkidle',
    });
    const diff = page.locator('.plate-diff-unified');
    await expect(diff).toBeVisible();
    await expect(diff.locator('ins', { hasText: 'Edited' })).toHaveCount(1);
    await expect(diff.locator('.plate-diff-block-delete')).toHaveCount(0);
    await expect(diff.locator('.plate-diff-block-insert')).toHaveCount(0);
  });
});
