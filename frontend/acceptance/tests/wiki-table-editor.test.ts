/**
 * Wiki tables in the editor: insert, header row, editing keys, delete, cell
 * toolbar, width and save (manual test plan of
 * https://github.com/kitconcept/kitconcept.intranet/pull/518, sections B, C,
 * E).
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/667
 */
import type { Page } from '@playwright/test';
import { setSelection } from '@platejs/playwright';

import {
  getValue,
  insertWithSlashMenu,
  nodeText,
  selectBlockText,
  type EditorNode,
} from '../fixtures/editor';
import { openInEditor, openInView } from '../fixtures/pages';
import {
  cellOf,
  cellToolbar,
  clickCell,
  clickToolbar,
  editorTable,
  savePage,
  viewTable,
} from '../fixtures/table';
import {
  caretInCell,
  editorHandleOf,
  expectSelectionIn,
  getTables,
  tableNodeTexts,
} from '../fixtures/table-editor';
import {
  createTablePage,
  createWikiPageWithValue,
  getWikiValue,
  TABLES,
} from '../fixtures/wiki-pages';
import { login } from './login';
import { expect, test } from './test';

test.describe.configure({ timeout: 30_000 });

const cell = (text: string, header = false): EditorNode => ({
  type: header ? 'th' : 'td',
  children: [{ type: 'p', children: [{ text }] }],
});

/** A 3 × 3 table with a header row, like the one the editor inserts. */
const smallTable = (): EditorNode => ({
  type: 'table',
  children: [
    {
      type: 'tr',
      children: [cell('H1', true), cell('H2', true), cell('H3', true)],
    },
    { type: 'tr', children: [cell('A1'), cell('A2'), cell('A3')] },
    { type: 'tr', children: [cell('B1'), cell('B2'), cell('B3')] },
  ],
});

const paragraph = (text: string): EditorNode => ({
  type: 'p',
  children: [{ text }],
});

async function openPage(page: Page, id: string, value: EditorNode[]) {
  const { contentPath } = await createWikiPageWithValue(page, {
    contentId: id,
    title: `Table ${id}`,
    value,
  });
  await openInEditor(page, contentPath);
  return contentPath;
}

const valueOf = async (page: Page) =>
  getValue(page, await editorHandleOf(page));

/** Top-level index of the first table in the editor value. */
async function tableIndex(page: Page) {
  return (await valueOf(page)).findIndex((node) => node.type === 'table');
}

/** Puts the caret at the end of the top-level text block at `index`. */
async function caretAtEndOfParagraph(page: Page, index: number) {
  const length = nodeText((await valueOf(page))[index]).length;
  await setSelection(page, await editorHandleOf(page), {
    path: [index, 0],
    offset: length,
  });
  await expectSelectionIn(page, [index]);
}

const headerTypes = (table: EditorNode) =>
  (table.children ?? []).map((row) => (row.children ?? []).map((c) => c.type));

test.describe('Wiki tables: insert (B)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('/table inserts a 3 × 3 table with a header row', async ({ page }) => {
    await openPage(page, 'slash-insert', [paragraph('Intro'), paragraph('')]);
    await insertWithSlashMenu(page, await editorHandleOf(page), 2, 'Table');

    const [table] = await getTables(page);
    expect(headerTypes(table)).toEqual([
      ['th', 'th', 'th'],
      ['td', 'td', 'td'],
      ['td', 'td', 'td'],
    ]);
    await expect(editorTable(page, 0)).toBeVisible();
  });

  test('the "Insert table" toolbar button inserts the same table', async ({
    page,
  }) => {
    await openPage(page, 'toolbar-insert', [paragraph('Some words here')]);
    await selectBlockText(page, await editorHandleOf(page), 1, 'Some');
    const button = page.getByLabel('Insert table', { exact: true }).first();
    await expect(button).toBeVisible();
    await button.click();

    const tables = await getTables(page);
    expect(tables).toHaveLength(1);
    expect(headerTypes(tables[0])).toEqual([
      ['th', 'th', 'th'],
      ['td', 'td', 'td'],
      ['td', 'td', 'td'],
    ]);
  });

  test('header row toggles; inserted rows are body rows, also before row 2', async ({
    page,
  }) => {
    await openPage(page, 'header-toggle', [smallTable()]);
    const table = editorTable(page, 0);

    await clickCell(page, table, 1, 0);
    await clickToolbar(page, 'headerRow');
    expect(headerTypes((await getTables(page))[0])[0]).toEqual([
      'td',
      'td',
      'td',
    ]);
    await clickToolbar(page, 'headerRow');
    expect(headerTypes((await getTables(page))[0])[0]).toEqual([
      'th',
      'th',
      'th',
    ]);

    // Insert before the first body row (the caret is still in it): a body
    // row, not a second header row. Then one after it.
    await clickToolbar(page, 'insertRowBefore');
    await clickToolbar(page, 'insertRowAfter');
    const types = headerTypes((await getTables(page))[0]);
    expect(types).toHaveLength(5);
    expect(types[0]).toEqual(['th', 'th', 'th']);
    for (const row of types.slice(1)) expect(row).toEqual(['td', 'td', 'td']);
  });

  test('only the table holding the selection shows its cell toolbar', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInEditor(page, contentPath);
    const table = editorTable(
      page,
      TABLES['teilnehmende-konsortialtreffen'].openItems,
    );

    // A multi-cell selection: one cell toolbar (with merge), not one per table.
    await clickCell(page, table, 1, 1);
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    await expect(cellToolbar(page)).toBeVisible();
    await expect(
      page.locator(
        '[data-radix-popper-content-wrapper]:has(button[aria-label="Merge cells"])',
      ),
    ).toHaveCount(1);
  });
});

test.describe('Wiki tables: editing (C)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Tab and Shift+Tab move between cells; Tab in the last cell adds a row, undo removes it', async ({
    page,
  }) => {
    await openPage(page, 'tab-keys', [smallTable()]);
    const index = await tableIndex(page);
    const texts = async () => tableNodeTexts((await getTables(page))[0]);

    await caretInCell(page, [index, 1, 0], 'end');
    await page.keyboard.press('Tab');
    await page.keyboard.type('x');
    expect((await texts())[1][1]).toBe('A2x');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.type('y');
    expect((await texts())[2][0]).toBe('B1y');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.type('z');
    expect((await texts())[1][2]).toBe('A3z');

    await caretInCell(page, [index, 2, 2], 'end');
    await page.keyboard.press('Tab');
    expect(await texts()).toHaveLength(4);
    await page.keyboard.press('ControlOrMeta+z');
    expect(await texts()).toHaveLength(3);
  });

  test('Backspace at the start and Delete at the end of a cell do not merge cells', async ({
    page,
  }) => {
    await openPage(page, 'delete-keys', [smallTable()]);
    const index = await tableIndex(page);
    const texts = async () => tableNodeTexts((await getTables(page))[0]);
    const before = await texts();

    await caretInCell(page, [index, 1, 1], 'start');
    await page.keyboard.press('Backspace');
    expect(await texts()).toEqual(before);

    await caretInCell(page, [index, 1, 1], 'end');
    await page.keyboard.press('Delete');
    expect(await texts()).toEqual(before);

    // Empty the cell, then Backspace again: the cell stays, its neighbour is
    // untouched.
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    const after = await texts();
    expect(after[1]).toEqual(['A1', '', 'A3']);
    expect(after.map((row) => row.length)).toEqual([3, 3, 3]);
  });

  test('Enter adds a paragraph inside the cell; arrows leave the table', async ({
    page,
  }) => {
    await openPage(page, 'enter-arrows', [
      paragraph('Before'),
      smallTable(),
      paragraph('After'),
    ]);
    const index = await tableIndex(page);

    await caretInCell(page, [index, 1, 0], 'end');
    await page.keyboard.press('Enter');
    await page.keyboard.type('second line');
    const cellNode = (await getTables(page))[0].children![1].children![0];
    expect(cellNode.children).toHaveLength(2);
    expect(nodeText(cellNode.children![1])).toBe('second line');

    await caretInCell(page, [index, 0, 0], 'start');
    await page.keyboard.press('ArrowUp');
    await expectSelectionIn(page, [index - 1]);

    await caretInCell(page, [index, 2, 0], 'end');
    await page.keyboard.press('ArrowDown');
    await expectSelectionIn(page, [index + 1]);
  });

  test('Tab outside a table still indents, Shift+Tab outdents', async ({
    page,
  }) => {
    await openPage(page, 'tab-indent', [paragraph('Indent me'), smallTable()]);
    await caretAtEndOfParagraph(page, 1);
    await page.keyboard.press('Tab');
    expect((await valueOf(page))[1].indent).toBe(1);
    await page.keyboard.press('Shift+Tab');
    expect((await valueOf(page))[1].indent ?? 0).toBe(0);
  });

  test('delete table via the toolbar; undo brings it back', async ({
    page,
  }) => {
    await openPage(page, 'delete-table', [paragraph('Keep'), smallTable()]);
    await clickCell(page, editorTable(page, 0), 1, 1);
    await clickToolbar(page, 'deleteTable');
    expect(await getTables(page)).toHaveLength(0);
    await page.keyboard.press('ControlOrMeta+z');
    expect(await getTables(page)).toHaveLength(1);
  });

  test('select all, Backspace and undo restore the content', async ({
    page,
  }) => {
    await openPage(page, 'select-all', [paragraph('Keep'), smallTable()]);
    const index = await tableIndex(page);
    const texts = async () =>
      (await getTables(page)).map((table) => tableNodeTexts(table));
    const before = await texts();

    await caretInCell(page, [index, 1, 1], 'end');
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    expect((await texts()).flat(2).join('')).toBe('');
    await page.keyboard.press('ControlOrMeta+z');
    expect(await texts()).toEqual(before);
  });
});

test.describe('Wiki tables: width, save, view (E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('a resized column keeps its width after save, in the view and the editor', async ({
    page,
  }) => {
    const contentPath = await openPage(page, 'resize', [
      { ...smallTable(), colSizes: [150, 150, 150] },
    ]);
    const table = editorTable(page, 0);
    const header = cellOf(table, 0, 0);
    const before = (await header.boundingBox())!.width;

    // Drag the right edge of the first header cell 120px to the right.
    await header.hover();
    const handle = header
      .locator('[data-resizer-right], .cursor-col-resize')
      .first();
    await expect(handle).toBeAttached();
    const box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, {
      steps: 8,
    });
    await page.mouse.up();

    const colSizes = (await getTables(page))[0].colSizes as number[];
    expect(colSizes[0]).toBeGreaterThan(before + 60);

    await savePage(page, contentPath);
    const stored = (await getWikiValue(page, contentPath)).find(
      (node) => node.type === 'table',
    )!;
    expect((stored.colSizes as number[])[0]).toBe(colSizes[0]);
    // The view scales the columns to the page width, proportionally.
    const viewCells = await Promise.all(
      [0, 1].map(
        async (col) =>
          (await cellOf(viewTable(page, 0), 0, col).boundingBox())!.width,
      ),
    );
    expect(viewCells[0] / viewCells[1]).toBeCloseTo(
      colSizes[0] / colSizes[1],
      1,
    );

    await openInEditor(page, contentPath);
    expect(((await getTables(page))[0].colSizes as number[])[0]).toBe(
      colSizes[0],
    );
  });

  test('a page with a very large table renders in the view without errors', async ({
    page,
  }) => {
    const rows = Array.from({ length: 190 }, (_, i) => ({
      type: 'tr',
      children: [cell(`KIP-${i}`), cell(`Proposal ${i}`), cell(`${i}.0`)],
    }));
    const large: EditorNode = {
      type: 'table',
      children: [
        {
          type: 'tr',
          children: [
            cell('KIP', true),
            cell('Title', true),
            cell('Release', true),
          ],
        },
        ...rows,
      ],
    };
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const { contentPath } = await createWikiPageWithValue(page, {
      contentId: 'large-table',
      title: 'Large table',
      value: [large],
    });
    await openInView(page, contentPath);
    await expect(viewTable(page, 0).locator('tr')).toHaveCount(191);
    expect(errors).toEqual([]);
  });
});
