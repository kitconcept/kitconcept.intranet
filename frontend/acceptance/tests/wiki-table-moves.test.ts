/**
 * Moving rows and columns in the editor: drag and drop (mouse and keyboard,
 * react-aria) and the move buttons of the cell toolbar (manual test plan of
 * https://github.com/kitconcept/kitconcept.intranet/pull/518, sections H, I,
 * J).
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/667
 */
import type { Locator, Page } from '@playwright/test';
import { setSelection } from '@platejs/playwright';
import type { EditorNode } from '../fixtures/editor';
import { openInEditor } from '../fixtures/pages';
import {
  cellOf,
  clickCell,
  clickToolbar,
  columnTexts,
  editorTable,
  savePage,
  toolbarButton,
  viewTable,
} from '../fixtures/table';
import {
  editorHandleOf,
  expectSelectionIn,
  getTables,
  tableNodeTexts,
} from '../fixtures/table-editor';
import { createWikiPageWithValue } from '../fixtures/wiki-pages';
import { login } from './login';
import { expect, test } from './test';

test.describe.configure({ timeout: 30_000 });

const cell = (text: string, header = false, props = {}): EditorNode => ({
  type: header ? 'th' : 'td',
  ...props,
  children: [{ type: 'p', children: [{ text }] }],
});

/** Name / Wert / Datum with three body rows, like the dnd test page. */
const namesTable = (merged = false): EditorNode => ({
  type: 'table',
  colSizes: [200, 150, 150],
  children: [
    {
      type: 'tr',
      children: [cell('Name', true), cell('Wert', true), cell('Datum', true)],
    },
    { type: 'tr', children: [cell('Alpha'), cell('30'), cell('01.02.2026')] },
    merged
      ? {
          type: 'tr',
          children: [cell('Beta', false, { colSpan: 2 }), cell('15.01.2026')],
        }
      : {
          type: 'tr',
          children: [cell('Beta'), cell('10'), cell('15.01.2026')],
        },
    { type: 'tr', children: [cell('Gamma'), cell('20'), cell('31.12.2025')] },
  ],
});

async function openTable(page: Page, id: string, merged = false) {
  const { contentPath } = await createWikiPageWithValue(page, {
    contentId: id,
    title: `Moves ${id}`,
    value: [namesTable(merged)],
  });
  await openInEditor(page, contentPath);
  return contentPath;
}

const names = async (page: Page) =>
  tableNodeTexts((await getTables(page))[0]).map((row) => row[0]);
const header = async (page: Page) =>
  tableNodeTexts((await getTables(page))[0])[0];

function rowHandle(table: Locator, row: number) {
  return table
    .locator('tr')
    .nth(row)
    .getByRole('button', { name: 'Drag to move the row' });
}

function columnHandle(table: Locator, col: number) {
  return cellOf(table, 0, col).getByRole('button', {
    name: 'Drag to move the column',
  });
}

test.describe('Wiki tables: drag rows (H)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('a row is dragged by its grip; the header row has none; undo restores', async ({
    page,
  }) => {
    await openTable(page, 'drag-row');
    const table = editorTable(page, 0);
    await expect(
      table.getByRole('button', { name: 'Drag to move the row' }),
    ).toHaveCount(3);

    // Gamma above Alpha: drop on the upper half of Alpha's row.
    const target = table.locator('tr').nth(1);
    await table.locator('tr').nth(3).hover();
    await rowHandle(table, 3).dragTo(target, {
      sourcePosition: { x: 3, y: 5 },
      targetPosition: { x: 60, y: 10 },
    });
    await expect
      .poll(() => names(page))
      .toEqual(['Name', 'Gamma', 'Alpha', 'Beta']);

    await page.keyboard.press('ControlOrMeta+z');
    await expect
      .poll(() => names(page))
      .toEqual(['Name', 'Alpha', 'Beta', 'Gamma']);
    // Redo through the editor: ⌘⇧Z works in a real browser, but the key press
    // does not reach Slate's redo in the headless test browser (not even for
    // plain text), while ⌘Z does.
    await page.evaluate((e) => (e as any).redo(), await editorHandleOf(page));
    await expect
      .poll(() => names(page))
      .toEqual(['Name', 'Gamma', 'Alpha', 'Beta']);
  });

  test('nothing drops above the header row', async ({ page }) => {
    await openTable(page, 'drag-row-header');
    const table = editorTable(page, 0);
    await table.locator('tr').nth(2).hover();
    await rowHandle(table, 2).dragTo(table.locator('tr').nth(0), {
      sourcePosition: { x: 3, y: 5 },
      targetPosition: { x: 60, y: 10 },
    });
    // A row dropped on the header row lands right below it.
    await expect
      .poll(() => names(page))
      .toEqual(['Name', 'Beta', 'Alpha', 'Gamma']);
  });

  test('keyboard: Enter on the grip, Tab to a target, Enter drops', async ({
    page,
  }) => {
    await openTable(page, 'drag-row-keyboard');
    const table = editorTable(page, 0);
    await table.locator('tr').nth(1).hover();
    await rowHandle(table, 1).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    // The drop is applied asynchronously (the drop handler reads the dragged
    // item first), so wait for the new order.
    await expect
      .poll(() => names(page))
      .not.toEqual(['Name', 'Alpha', 'Beta', 'Gamma']);
    const order = await names(page);
    expect(order[0]).toBe('Name');
    expect([...order].sort()).toEqual(['Alpha', 'Beta', 'Gamma', 'Name']);
  });

  test('other drags are left alone: text moves between cells, a file does not move rows', async ({
    page,
  }) => {
    await openTable(page, 'drag-other');
    const table = editorTable(page, 0);
    const handle = await editorHandleOf(page);

    // Drag the word "Alpha" into Beta's value cell. Slate handles the drop of
    // its own selection; the row drop targets must not take it as a row move.
    await setSelection(page, handle, {
      anchor: { path: [1, 1, 0, 0, 0], offset: 0 },
      focus: { path: [1, 1, 0, 0, 0], offset: 'Alpha'.length },
    });
    await expectSelectionIn(page, [1, 1, 0]);
    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
    await cellOf(table, 1, 0).dispatchEvent('dragstart', { dataTransfer });
    const target = cellOf(table, 2, 1);
    const box = (await target.boundingBox())!;
    await target.dispatchEvent('drop', {
      dataTransfer,
      clientX: box.x + box.width - 4,
      clientY: box.y + box.height / 2,
    });
    // The word left its cell and landed in Beta's value cell; no row moved.
    const texts = async () => tableNodeTexts((await getTables(page))[0]);
    await expect.poll(async () => (await texts())[1][0]).toBe('');
    await expect.poll(async () => (await texts())[2][1]).toContain('Alpha');
    expect((await texts()).map((row) => row[2])).toEqual([
      'Datum',
      '01.02.2026',
      '15.01.2026',
      '31.12.2025',
    ]);
    const afterTextDrop = await texts();

    // A file dropped on a row: no row moves, the table keeps its shape.
    const fileTransfer = await page.evaluateHandle(() => {
      const dt = new DataTransfer();
      dt.items.add(new File(['x'], 'notes.txt', { type: 'text/plain' }));
      return dt;
    });
    await table.locator('tr').nth(3).dispatchEvent('drop', {
      dataTransfer: fileTransfer,
    });
    await page.waitForTimeout(300);
    expect(await texts()).toEqual(afterTextDrop);
  });

  test('the moved order is saved and shown in the view', async ({ page }) => {
    const contentPath = await openTable(page, 'drag-row-save');
    const table = editorTable(page, 0);
    await table.locator('tr').nth(3).hover();
    await rowHandle(table, 3).dragTo(table.locator('tr').nth(1), {
      sourcePosition: { x: 3, y: 5 },
      targetPosition: { x: 60, y: 10 },
    });
    await savePage(page, contentPath);
    await expect(viewTable(page, 0).locator('tr')).toHaveCount(4);
    await expect
      .poll(() => columnTexts(viewTable(page, 0), 0))
      .toEqual(['Gamma', 'Alpha', 'Beta']);
  });
});

test.describe('Wiki tables: drag columns (I)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('a column moves in every row and its width moves along; undo restores', async ({
    page,
  }) => {
    await openTable(page, 'drag-column');
    const table = editorTable(page, 0);
    const target = cellOf(table, 0, 0);
    await cellOf(table, 0, 2).hover();
    await columnHandle(table, 2).dragTo(target, {
      sourcePosition: { x: 3, y: 3 },
      targetPosition: { x: 4, y: 10 },
    });
    await expect.poll(() => header(page)).toEqual(['Datum', 'Name', 'Wert']);
    await expect
      .poll(async () => tableNodeTexts((await getTables(page))[0])[1])
      .toEqual(['01.02.2026', 'Alpha', '30']);
    await expect
      .poll(async () => (await getTables(page))[0].colSizes)
      .toEqual([150, 200, 150]);

    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => header(page)).toEqual(['Name', 'Wert', 'Datum']);
    await expect
      .poll(async () => (await getTables(page))[0].colSizes)
      .toEqual([200, 150, 150]);
  });

  test('keyboard: Enter on the grip, Tab to a target, Enter drops', async ({
    page,
  }) => {
    await openTable(page, 'drag-column-keyboard');
    const table = editorTable(page, 0);
    await cellOf(table, 0, 0).hover();
    await columnHandle(table, 0).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect
      .poll(() => header(page))
      .not.toEqual(['Name', 'Wert', 'Datum']);
    const order = await header(page);
    expect([...order].sort()).toEqual(['Datum', 'Name', 'Wert']);
  });

  test('tables with merged cells have no column grips; rows still move', async ({
    page,
  }) => {
    await openTable(page, 'merged', true);
    const table = editorTable(page, 0);
    await expect(
      table.getByRole('button', { name: 'Drag to move the column' }),
    ).toHaveCount(0);

    await clickCell(page, table, 1, 1);
    await expect(toolbarButton(page, 'moveColumnLeft')).toBeDisabled();
    await expect(toolbarButton(page, 'moveColumnRight')).toBeDisabled();
    await clickToolbar(page, 'moveRowDown');
    await expect
      .poll(() => names(page))
      .toEqual(['Name', 'Beta', 'Alpha', 'Gamma']);
  });
});

test.describe('Wiki tables: move buttons (J)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('move row up / down; the caret moves along', async ({ page }) => {
    await openTable(page, 'move-rows');
    const table = editorTable(page, 0);

    await clickCell(page, table, 1, 0);
    await clickToolbar(page, 'moveRowDown');
    await expect
      .poll(() => names(page))
      .toEqual(['Name', 'Beta', 'Alpha', 'Gamma']);
    // The caret stayed in Alpha's row: moving again continues with it.
    await clickToolbar(page, 'moveRowDown');
    await expect
      .poll(() => names(page))
      .toEqual(['Name', 'Beta', 'Gamma', 'Alpha']);
    await clickToolbar(page, 'moveRowUp');
    await expect
      .poll(() => names(page))
      .toEqual(['Name', 'Beta', 'Alpha', 'Gamma']);
  });

  test('move buttons are disabled where the move is not possible', async ({
    page,
  }) => {
    await openTable(page, 'move-disabled');
    const table = editorTable(page, 0);

    await clickCell(page, table, 1, 0);
    await expect(toolbarButton(page, 'moveRowUp')).toBeDisabled();
    await expect(toolbarButton(page, 'moveRowDown')).toBeEnabled();
    await expect(toolbarButton(page, 'moveColumnLeft')).toBeDisabled();
    await expect(toolbarButton(page, 'moveColumnRight')).toBeEnabled();

    await clickCell(page, table, 3, 2);
    await expect(toolbarButton(page, 'moveRowDown')).toBeDisabled();
    await expect(toolbarButton(page, 'moveColumnRight')).toBeDisabled();

    await clickCell(page, table, 0, 1);
    await expect(toolbarButton(page, 'moveRowUp')).toBeDisabled();
    await expect(toolbarButton(page, 'moveRowDown')).toBeDisabled();
  });

  test('move column left / right with the widths', async ({ page }) => {
    await openTable(page, 'move-columns');
    const table = editorTable(page, 0);
    await clickCell(page, table, 1, 0);
    await clickToolbar(page, 'moveColumnRight');
    await expect.poll(() => header(page)).toEqual(['Wert', 'Name', 'Datum']);
    await expect
      .poll(async () => (await getTables(page))[0].colSizes)
      .toEqual([150, 200, 150]);
    await clickToolbar(page, 'moveColumnLeft');
    await expect.poll(() => header(page)).toEqual(['Name', 'Wert', 'Datum']);
  });
});
