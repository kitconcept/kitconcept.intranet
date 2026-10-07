/**
 * History diff of Wiki Pages with Plate's diff plugin (manual test plan of
 * https://github.com/kitconcept/kitconcept.intranet/pull/513 and step 20 of
 * https://github.com/kitconcept/kitconcept.intranet/pull/518). The page is the
 * "Jour fixe KW 38" demo page with its three demo edits (versions 0-3).
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/667
 */
import type { Page } from '@playwright/test';

import { createContent } from './content';
import { login } from './login';
import { expect, test } from './test';

test.describe.configure({ timeout: 30_000 });

/** A 1 × 1 pixel PNG. */
const PIXEL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnSUs8AAAAASUVORK5CYII=';
import { setSelection } from '@platejs/playwright';

import { getValue, nodeText } from '../fixtures/editor';
import { openInEditor } from '../fixtures/pages';
import { savePage } from '../fixtures/table';
import { expectSelectionIn } from '../fixtures/table-editor';
import {
  createDiffPage,
  createTablePage,
  createWikiPageWithValue,
  getContent,
  getWikiValue,
  patchContent,
  SOMERSAULT_KEY,
  TABLES,
} from '../fixtures/wiki-pages';

async function openDiff(
  page: Page,
  contentPath: string,
  one: number,
  two: number,
  view: 'split' | 'unified',
) {
  await page.goto(`${contentPath}/diff?one=${one}&two=${two}&view=${view}`, {
    waitUntil: 'networkidle',
  });
  await expect(page.locator(`.plate-diff-${view}`)).toBeVisible();
}

/**
 * Selects the first image block in the editor and opens its sidebar form
 * (the "Block" tab), as the image sidebar tests do.
 */
async function selectImageBlock(page: Page) {
  const image = page.locator('.slate-editor img:not(.placeholder)').first();
  const blockTab = page
    .locator('#sidebar .formtabs')
    .getByRole('button', { name: 'Block', exact: true });
  // The description field (the caption) has no accessible name.
  const field = page.locator(
    '#sidebar-properties .field-wrapper-description textarea, #sidebar-properties .field-wrapper-description input',
  );
  await expect(image).toBeVisible();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await image.click({ force: true });
    await blockTab.click({ force: true });
    try {
      await expect(field).toBeVisible({ timeout: 3000 });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  return field;
}

test.describe('Wiki Page history diff', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('1. the history lists four versions with their change notes', async ({
    page,
  }) => {
    const { contentPath, notes } = await createDiffPage(page);
    await page.goto(`${contentPath}/historyview`, { waitUntil: 'networkidle' });
    for (const note of notes) {
      await expect(page.getByText(note, { exact: true })).toBeVisible();
    }
    for (const version of ['0', '1', '2', '3']) {
      await expect(
        page.locator('table tr td:first-child', {
          hasText: new RegExp(`^${version}$`),
        }),
      ).toHaveCount(1);
    }
  });

  test('2. text changes, split view: only the changed words are marked', async ({
    page,
  }) => {
    const { contentPath } = await createDiffPage(page);
    await openDiff(page, contentPath, 0, 1, 'split');

    const left = page.locator('.plate-diff-left');
    const right = page.locator('.plate-diff-right');
    await expect(left.locator('del', { hasText: '68' })).toHaveCount(1);
    await expect(right.locator('ins', { hasText: '71' })).toHaveCount(1);
    await expect(left.locator('del', { hasText: 'läuft' })).toHaveCount(1);
    await expect(
      right.locator('ins', { hasText: 'ist abgeschlossen' }),
    ).toHaveCount(1);

    // The new "Beschluss" paragraph: added on the right, empty slot on the left.
    const added = right.locator('.plate-diff-block-insert', {
      hasText: 'Beschluss:',
    });
    await expect(added).toHaveCount(1);
    await expect(added.locator('.plate-diff-label')).toContainText('Added');
    await expect(page.getByText('Not in this version')).toHaveCount(1);

    // Unchanged paragraphs carry no marks.
    await expect(
      page.locator('ins, del').filter({ hasText: 'Teilnehmer' }),
    ).toHaveCount(0);
  });

  test('3. changed callout and new list item, unified view', async ({
    page,
  }) => {
    const { contentPath } = await createDiffPage(page);
    await openDiff(page, contentPath, 1, 2, 'unified');
    const diff = page.locator('.plate-diff-unified');

    // Text and variant changed in the same save: the callout shows once
    // removed ("bis Freitag") and once added ("bis Donnerstag"), each with
    // its label (a known limitation, see the test plan).
    const removed = diff.locator('.plate-diff-block-delete', {
      hasText: 'bis Freitag',
    });
    const added = diff.locator('.plate-diff-block-insert', {
      hasText: 'bis Donnerstag',
    });
    await expect(removed).toHaveCount(1);
    await expect(removed.locator('.plate-diff-label')).toContainText('Removed');
    await expect(added).toHaveCount(1);
    await expect(added.locator('.plate-diff-label')).toContainText('Added');

    const newItem = diff.locator('.plate-diff-block-insert', {
      hasText: 'Clara: Entwurf Zwischenbericht',
    });
    await expect(newItem).toHaveCount(1);
    await expect(newItem.locator('.plate-diff-label')).toContainText('Added');
  });

  test('4. settings only: no text marked, two "Changed" blocks with old → new', async ({
    page,
  }) => {
    const { contentPath } = await createDiffPage(page);
    await openDiff(page, contentPath, 2, 3, 'unified');
    const diff = page.locator('.plate-diff-unified');

    await expect(diff.locator('ins, del')).toHaveCount(0);
    const changed = diff.locator('.plate-diff-block-update');
    await expect(changed).toHaveCount(2);
    await expect(
      changed.filter({ hasText: 'Diskussion' }).locator('.plate-diff-label'),
    ).toContainText('Alignment: Left → Centred');
    await expect(
      changed
        .filter({ hasText: 'Nächstes Treffen' })
        .locator('.plate-diff-label'),
    ).toContainText('Width: Standard → Wide');
  });

  test('5. an edit made in the editor shows in the diff', async ({ page }) => {
    const { contentPath } = await createDiffPage(page);
    const handle = await openInEditor(page, contentPath);
    const value = await getValue(page, handle);
    // A paragraph whose settings stay as they are (the demo's "wide" width
    // of "Nächstes Treffen" is not an editor value and is reset on save).
    const index = value.findIndex((node) =>
      nodeText(node).startsWith('Die XPS-Messreihe'),
    );
    await setSelection(page, handle, {
      path: [index, 0],
      offset: nodeText(value[index]).length,
    });
    await expectSelectionIn(page, [index]);
    await page.keyboard.type(' Bitte pünktlich.');
    await savePage(page, contentPath);

    await openDiff(page, contentPath, 3, 4, 'unified');
    await expect(
      page.locator('.plate-diff-unified ins', { hasText: 'Bitte pünktlich' }),
    ).toHaveCount(1);
  });

  test('5b. an image with a caption and a width change made in the editor show in the diff', async ({
    page,
  }) => {
    const { contentPath } = await createDiffPage(page);
    const handle = await openInEditor(page, contentPath);
    const value = await getValue(page, handle);
    const index = value.findIndex((node) =>
      nodeText(node).startsWith('Die XPS-Messreihe'),
    );

    // A new paragraph after it, turned into an image with a caption.
    await setSelection(page, handle, {
      path: [index, 0],
      offset: nodeText(value[index]).length,
    });
    await expectSelectionIn(page, [index]);
    await page.keyboard.press('Enter');
    await expectSelectionIn(page, [index + 1]);
    await page.keyboard.type('/image');
    await expect(page.getByRole('option', { name: 'Image' })).toBeVisible();
    await page.keyboard.press('Enter');
    // Upload a 1 × 1 pixel PNG through the block's file input.
    const upload = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/++api++/') &&
        response.request().postData()?.includes('"@type":"Image"') === true,
    );
    await page.locator('.slate-editor input[type="file"]').setInputFiles({
      name: 'messaufbau.png',
      mimeType: 'image/png',
      buffer: Buffer.from(PIXEL_PNG_BASE64, 'base64'),
    });
    await upload;
    await expect
      .poll(async () => (await getValue(page, handle))[index + 1].url)
      .toContain('messaufbau');
    const caption = await selectImageBlock(page);
    await caption.fill('Messaufbau im Labor');
    await expect
      .poll(async () => (await getValue(page, handle))[index + 1].description)
      .toBe('Messaufbau im Labor');
    await savePage(page, contentPath);

    await openDiff(page, contentPath, 3, 4, 'unified');
    const added = page
      .locator('.plate-diff-unified .plate-diff-block-insert')
      .filter({ has: page.locator('img') });
    await expect(added).toHaveCount(1);
    await expect(added.locator('.plate-diff-label')).toContainText('Added');
    await expect(added).toContainText('Messaufbau im Labor');

    // Narrow width for the image, through the sidebar. (Paragraphs allow
    // only the default width in the wiki editor.)
    const handle2 = await openInEditor(page, contentPath);
    await selectImageBlock(page);
    await page
      .locator('#sidebar-properties')
      .locator('.field-wrapper-blockWidth')
      .getByRole('radio', { name: 'Narrow' })
      .click({ force: true });
    await expect
      .poll(async () => (await getValue(page, handle2))[index + 1].blockWidth)
      .toBe('narrow');
    await savePage(page, contentPath);

    await openDiff(page, contentPath, 4, 5, 'unified');
    const changed = page
      .locator('.plate-diff-unified .plate-diff-block-update')
      .filter({ has: page.locator('img') });
    await expect(changed).toHaveCount(1);
    await expect(changed.locator('.plate-diff-label')).toContainText(
      'Width: Standard → Narrow',
    );
  });

  // Whole-word marks:
  // https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/714
  test('5c. a changed word is marked as a whole, not only its changed characters', async ({
    page,
  }) => {
    const paragraph = (text: string) => ({
      id: 'p-plan',
      type: 'p',
      align: 'start',
      blockWidth: 'default',
      children: [{ text }],
    });
    const { contentPath } = await createWikiPageWithValue(page, {
      contentId: 'whole-words',
      title: 'Whole words',
      value: [
        paragraph(
          'Der Projektplan liegt im Projektportal, Abgabe bis 25.09.2026.',
        ),
      ],
    });
    const value = await getWikiValue(page, contentPath);
    value[value.length - 1] = paragraph(
      'Der Projektplan steht im GreenCat-Portal, Abgabe bis 26.09.2026.',
    );
    const content = await getContent(page, contentPath);
    await patchContent(page, contentPath, {
      blocks: {
        ...content.blocks,
        [SOMERSAULT_KEY]: { '@type': SOMERSAULT_KEY, value },
      },
      changeNote: 'Drei Wörter geändert',
    });

    // Character by character this would be "lieg"/"steh", "Projektp"/
    // "GreenCat-P" and "5"/"6".
    const removed = ['liegt', 'Projektportal', '25.09.2026'];
    const added = ['steht', 'GreenCat-Portal', '26.09.2026'];

    await openDiff(page, contentPath, 0, 1, 'split');
    await expect(page.locator('.plate-diff-left del')).toHaveText(removed);
    await expect(page.locator('.plate-diff-right ins')).toHaveText(added);

    await openDiff(page, contentPath, 0, 1, 'unified');
    const unified = page.locator('.plate-diff-unified');
    await expect(unified.locator('del')).toHaveText(removed);
    await expect(unified.locator('ins')).toHaveText(added);
    // Old word first, then the new one; the rest of the paragraph is unmarked.
    await expect(
      unified.locator('[data-slate-node="element"]', {
        hasText: 'Der Projektplan',
      }),
    ).toHaveText(
      'Der Projektplan liegtsteht im ProjektportalGreenCat-Portal, Abgabe bis 25.09.202626.09.2026.',
    );
  });

  test('6. metadata changes show as fields, the content is not repeated', async ({
    page,
  }) => {
    const { contentPath } = await createDiffPage(page);
    await patchContent(page, contentPath, {
      subjects: ['Protokoll', 'GreenCat'],
      changeNote: 'Schlagworte ergänzt',
    });
    await page.goto(`${contentPath}/diff?one=3&two=4&view=unified`, {
      waitUntil: 'networkidle',
    });
    const main = page.locator('main');
    await expect(main).toContainText('Tags');
    await expect(main).toContainText('Protokoll, GreenCat');
    await expect(page.locator('.plate-diff')).toHaveCount(0);
  });

  test('7. a normal page keeps the standard diff; unset dates read "not set"', async ({
    page,
  }) => {
    await createContent(page, {
      contentType: 'Document',
      contentId: 'normal-page',
      contentTitle: 'Normal page',
      transition: 'publish',
    });
    await patchContent(page, '/normal-page', {
      title: 'Normal page renamed',
      changeNote: 'Titel geändert',
    });
    await page.goto('/normal-page/diff?one=0&two=1&view=split', {
      waitUntil: 'networkidle',
    });
    await expect(page.locator('.plate-diff')).toHaveCount(0);
    const main = page.locator('main');
    await expect(main).toContainText('Title');
    await expect(main).toContainText('Normal page renamed');
    await expect(main).toContainText('not set');
    await expect(main).not.toContainText('1970');
  });

  test('42. a moved row shows in the diff, which has no sort buttons and no filter', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    const value = await getWikiValue(page, contentPath);
    // "Offene Punkte" (8 body rows: sort buttons and a filter in the view):
    // move its last row to the top.
    const table = structuredClone(
      value.filter((node) => node.type === 'table')[
        TABLES['teilnehmende-konsortialtreffen'].openItems
      ],
    ) as any;
    const tableIndex = value.indexOf(
      value.filter((node) => node.type === 'table')[
        TABLES['teilnehmende-konsortialtreffen'].openItems
      ],
    );
    table.children.splice(1, 0, table.children.pop());
    value[tableIndex] = table;
    const content = await getContent(page, contentPath);
    await patchContent(page, contentPath, {
      blocks: {
        ...content.blocks,
        [SOMERSAULT_KEY]: { '@type': SOMERSAULT_KEY, value },
      },
      changeNote: 'Zeile verschoben',
    });

    // The view has the controls, the diff does not.
    await page.goto(contentPath, { waitUntil: 'networkidle' });
    await expect(
      page.locator('main button.wiki-table-sort').first(),
    ).toBeVisible();
    await expect(page.locator('main .wiki-table-filter').first()).toBeVisible();

    for (const view of ['split', 'unified'] as const) {
      await openDiff(page, contentPath, 0, 1, view);
      const diff = page.locator(`.plate-diff-${view}`);
      await expect(diff.locator('table').first()).toBeVisible();
      await expect(diff.locator('button.wiki-table-sort')).toHaveCount(0);
      await expect(diff.locator('.wiki-table-filter')).toHaveCount(0);
      await expect(diff.locator('th button')).toHaveCount(0);
      // The moved row: removed at the old place, inserted at the new one.
      await expect(
        diff
          .locator('tr.plate-diff-node-delete', {
            hasText: 'Vereinbarung mit dem Industriepartner',
          })
          .first(),
      ).toBeAttached();
      await expect(
        diff
          .locator('tr.plate-diff-node-insert', {
            hasText: 'Vereinbarung mit dem Industriepartner',
          })
          .first(),
      ).toBeAttached();
    }
  });

  test('20. a table edit renders as a diff without broken table markup', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(page, 'projektbudget-2026');
    const value = await getWikiValue(page, contentPath);
    const tableIndex = value.findIndex((node) => node.type === 'table');
    const table = structuredClone(value[tableIndex]) as any;
    // Change a cell, remove WP4, add a row.
    table.children[1].children[5].children[0].children = [
      { text: 'verzögert' },
    ];
    const removed = table.children.splice(4, 1)[0];
    const added = structuredClone(removed);
    added.children[0].children[0].children = [{ text: 'WP6 Evaluation' }];
    table.children.splice(5, 0, added);
    value[tableIndex] = table;

    const content = await getContent(page, contentPath);
    await patchContent(page, contentPath, {
      blocks: {
        ...content.blocks,
        [SOMERSAULT_KEY]: { '@type': SOMERSAULT_KEY, value },
      },
      changeNote: 'Tabelle aktualisiert',
    });

    for (const view of ['split', 'unified'] as const) {
      await openDiff(page, contentPath, 0, 1, view);
      const diffTables = page.locator(`.plate-diff-${view} table`);
      await expect(diffTables.first()).toBeVisible();
      const newSide =
        view === 'split' ? '.plate-diff-right' : '.plate-diff-unified';
      await expect(
        page.locator(newSide).locator('ins', { hasText: 'verzögert' }).first(),
      ).toBeVisible();
      await expect(
        page.locator('tr.plate-diff-node-delete').first(),
      ).toBeAttached();
      await expect(
        page.locator('tr.plate-diff-node-insert').first(),
      ).toBeAttached();
      // Rows hold cells only: no diff wrapper element inside a table body.
      await expect(page.locator('tbody > div, tr > div')).toHaveCount(0);
    }
  });
});
