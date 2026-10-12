/**
 * The CSV table block: a CSV file inside the intranet shown as a read-only
 * wiki table, with sorting and filtering, read again whenever the page is
 * shown.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/751
 */
import type { Page } from '@playwright/test';

import { CSV_FILE_TEXT, createCsvFile } from '../fixtures/csv-file';
import { insertWithSlashMenu } from '../fixtures/editor';
import { openInEditor, openInView } from '../fixtures/pages';
import {
  columnTexts,
  editorTable,
  filterFieldOf,
  savePage,
  sortButton,
  tableTexts,
  viewTable,
} from '../fixtures/table';
import { createWikiPageWithValue, patchContent } from '../fixtures/wiki-pages';
import { login } from './login';
import { expect, test } from './test';

test.describe.configure({ timeout: 30_000 });

/** `PLONE_BLOCK_TYPE` of `@plone/helpers`: a Volto block inside Plate. */
const PLONE_BLOCK_TYPE = 'ploneBlock';

const paragraph = (text: string) => ({ type: 'p', children: [{ text }] });

/**
 * A Wiki Page with a CSV table block pointing at `data.csv` next to it in
 * the page's workspace, and that file.
 */
async function createPageWithCsvBlock(page: Page, id: string) {
  const fileUrl = `/wiki-${id}/data.csv`;
  const { contentPath } = await createWikiPageWithValue(page, {
    contentId: id,
    title: `CSV ${id}`,
    value: [
      paragraph('Vor der Tabelle.'),
      {
        type: PLONE_BLOCK_TYPE,
        '@type': 'csvtable',
        url: fileUrl,
        children: [{ text: '' }],
      },
      paragraph('Nach der Tabelle.'),
    ],
  });
  await createCsvFile(page, {
    path: `/wiki-${id}`,
    fileId: 'data.csv',
    text: CSV_FILE_TEXT,
  });
  return { contentPath, fileUrl };
}

test.describe('Wiki tables: CSV table block', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('shows the file as a table that can be sorted and filtered', async ({
    page,
  }) => {
    const { contentPath } = await createPageWithCsvBlock(page, 'view');
    await openInView(page, contentPath);

    const table = viewTable(page, 0);
    await expect(table.locator('tr')).toHaveCount(8);
    const texts = await tableTexts(table);
    expect(texts[0]).toEqual(['Arbeitspaket', 'Budget', 'Verantwortlich']);
    expect(texts[1]).toEqual(['WP1 Koordination', '120000', 'Beck, Clara']);
    expect(texts[7]).toEqual(['WP7 Abschluss', '15000', 'Beck, Clara']);

    // Sort by budget: numbers, not strings.
    await sortButton(table, 1).click();
    expect(await columnTexts(table, 1)).toEqual([
      '15000',
      '30000',
      '45000',
      '80000',
      '95000',
      '120000',
      '250000',
    ]);

    // Filter: seven rows get the filter field.
    await filterFieldOf(table).fill('Miriam');
    await expect(table.locator('tr')).toHaveCount(3);
    expect(await columnTexts(table, 0)).toEqual([
      'WP5 Bericht',
      'WP2 Synthese',
    ]);
  });

  test('reads the file again when the page is shown', async ({ page }) => {
    const { contentPath, fileUrl } = await createPageWithCsvBlock(
      page,
      'reread',
    );
    await openInView(page, contentPath);
    await expect(viewTable(page, 0).locator('tr')).toHaveCount(8);

    await patchContent(page, fileUrl, {
      file: {
        data: Buffer.from('Name;Ort\nMiriam;Bonn\n', 'utf8').toString('base64'),
        encoding: 'base64',
        filename: 'data.csv',
        'content-type': 'text/csv',
      },
    });
    await openInView(page, contentPath);
    const table = viewTable(page, 0);
    await expect(table.locator('tr')).toHaveCount(2);
    expect(await tableTexts(table)).toEqual([
      ['Name', 'Ort'],
      ['Miriam', 'Bonn'],
    ]);
  });

  test('the slash menu inserts the block and the sidebar takes the file', async ({
    page,
  }) => {
    const { contentPath } = await createWikiPageWithValue(page, {
      contentId: 'insert',
      title: 'CSV insert',
      value: [paragraph('')],
    });
    await createCsvFile(page, {
      path: '/wiki-insert',
      fileId: 'data.csv',
      text: CSV_FILE_TEXT,
    });
    const editor = await openInEditor(page, contentPath);
    await insertWithSlashMenu(page, editor, 1, 'CSV table');
    await expect(
      page.getByText('Choose a CSV file in the sidebar.'),
    ).toBeVisible();

    await page.locator('#field-url').fill('/wiki-insert/data.csv');
    await expect(editorTable(page, 0).locator('tr')).toHaveCount(8);

    await savePage(page, contentPath);
    const table = viewTable(page, 0);
    await expect(table.locator('tr')).toHaveCount(8);
    expect((await tableTexts(table))[0]).toEqual([
      'Arbeitspaket',
      'Budget',
      'Verantwortlich',
    ]);
  });

  test('an address outside the intranet is refused', async ({ page }) => {
    const { contentPath } = await createWikiPageWithValue(page, {
      contentId: 'external',
      title: 'CSV external',
      value: [
        {
          type: PLONE_BLOCK_TYPE,
          '@type': 'csvtable',
          url: 'https://example.org/data.csv',
          children: [{ text: '' }],
        },
      ],
    });
    await openInView(page, contentPath);
    await expect(
      page.getByText('Only CSV files inside the intranet can be shown.'),
    ).toBeVisible();
    await expect(page.locator('main table')).toHaveCount(0);
  });
});
