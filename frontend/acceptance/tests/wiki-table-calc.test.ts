/**
 * Footer row and column sums of wiki tables: the "Footer row" toggle adds an
 * empty footer row at the bottom (and removes it again), a footer cell can
 * show the sum of its column, the sum follows edits, and in the view the
 * footer row is neither sorted nor filtered.
 *
 * The budget demo page ships with its "Gesamt" row as footer with sums; the
 * open-items table of the participants page has no footer and gets one here.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/750
 */
import { openInEditor, openInView } from '../fixtures/pages';
import type { Page } from '@playwright/test';
import {
  CELLS,
  cellOf,
  chooseCalculation,
  clickCell,
  clickToolbar,
  columnTexts,
  editorTable,
  filterFieldOf,
  savePage,
  selectCellText,
  sortButton,
  tableTexts,
  toolbarButton,
  viewTable,
} from '../fixtures/table';
import { expectSelectionIn, selectionPath } from '../fixtures/table-editor';
import { createTablePage, TABLES } from '../fixtures/wiki-pages';
import { login } from './login';
import { expect, test } from './test';

test.describe.configure({ timeout: 45_000 });

const BUDGET = TABLES['projektbudget-2026'].budget;
const GESAMT = 6; // the footer row of the budget table
const BUDGET_COL = 2;

const OPEN_ITEMS = TABLES['teilnehmende-konsortialtreffen'].openItems;
const HOURS_COL = 3; // "Aufwand (h)": 6, 0,5, 12, 1, 3,5, 2, (empty), 8
const DUE_COL = 2; // "Fällig": German dates, one empty
const OPEN_ITEMS_ROWS = 9; // header + 8 body rows
const AGENDA = TABLES['teilnehmende-konsortialtreffen'].agenda;

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

/** The calculation menu's items, in order, with their checked state. */
async function menuItems(page: Page) {
  await clickToolbar(page, 'calculation');
  const items = page.getByRole('menuitemradio');
  await expect(items.first()).toBeVisible();
  const names = await items.allInnerTexts();
  const checked = await items.evaluateAll((els) =>
    els.map((el) => el.getAttribute('aria-checked') === 'true'),
  );
  await page.keyboard.press('Escape');
  return { names: names.map((n) => n.trim()), checked };
}

test.describe('Wiki tables: footer row and sums', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('the demo footer sums follow edits and are stored with the page', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(page, 'projektbudget-2026');
    await openInEditor(page, contentPath);
    const table = editorTable(page, BUDGET);

    // Shipped as footer with sum cells.
    await expect(table.locator('tr').nth(GESAMT)).toHaveClass(
      /wiki-table-footer/,
    );
    await clickCell(page, table, GESAMT, BUDGET_COL);
    // A pressed toolbar toggle is a Radix single toggle item (role radio).
    await expect(toolbarButton(page, 'calculation')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(cellOf(table, GESAMT, BUDGET_COL)).toHaveText('1.455.000 €');

    // Change a budget: the sum follows.
    await selectCellText(page, table, 1, BUDGET_COL);
    await page.keyboard.type('200.000 €');
    await expect(cellOf(table, 1, BUDGET_COL)).toHaveText('200.000 €');
    await expect(cellOf(table, GESAMT, BUDGET_COL)).toHaveText('1.475.000 €');

    // Stored with the page; sorted descending, the footer stays last.
    await savePage(page, contentPath);
    const view = viewTable(page, BUDGET);
    await expect(cellOf(view, GESAMT, BUDGET_COL)).toHaveText('1.475.000 €');
    await sortButton(view, BUDGET_COL).click();
    await sortButton(view, BUDGET_COL).click();
    const budgets = await columnTexts(view, BUDGET_COL);
    expect(budgets[0]).toBe('650.000 €');
    expect(budgets.at(-1)).toBe('1.475.000 €');
  });

  test('typing into a calculated cell restores the result and keeps the caret there', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(page, 'projektbudget-2026');
    await openInEditor(page, contentPath);
    const table = editorTable(page, BUDGET);
    await clickCell(page, table, GESAMT, BUDGET_COL);
    const cellPath = (await selectionPath(page))!.slice(0, 3);

    await page.keyboard.type('9');
    await expect(cellOf(table, GESAMT, BUDGET_COL)).toHaveText('1.455.000 €');
    // Replacing the cell's content moved the caret to the neighbouring cell
    // before; it stays in the calculated cell now.
    await expectSelectionIn(page, cellPath);
    await expect(cellOf(table, GESAMT, BUDGET_COL - 1)).toHaveText('');
  });

  test('the toggle adds and removes a footer row; a sum cell sums its column', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInEditor(page, contentPath);
    const table = editorTable(page, OPEN_ITEMS);
    await expect(table.locator('tr')).toHaveCount(OPEN_ITEMS_ROWS);

    // On: an empty footer row is added at the bottom and the caret is in it.
    await clickCell(page, table, 1, HOURS_COL);
    await expect(toolbarButton(page, 'calculation')).toHaveCount(0);
    await clickToolbar(page, 'footerRow');
    await expect(table.locator('tr')).toHaveCount(OPEN_ITEMS_ROWS + 1);
    const footer = table.locator('tr').nth(OPEN_ITEMS_ROWS);
    await expect(footer).toHaveClass(/wiki-table-footer/);
    await expect(toolbarButton(page, 'calculation')).toBeVisible();

    // Sum of the hours column (German decimals, empty cell skipped).
    await clickCell(page, table, OPEN_ITEMS_ROWS, HOURS_COL);
    await chooseCalculation(page, 'Sum');
    await expect(cellOf(table, OPEN_ITEMS_ROWS, HOURS_COL)).toHaveText('33,0');

    // Off: the footer row is removed; on again: a fresh empty one.
    await clickToolbar(page, 'footerRow');
    await expect(table.locator('tr')).toHaveCount(OPEN_ITEMS_ROWS);
    await clickCell(page, table, 1, HOURS_COL);
    await clickToolbar(page, 'footerRow');
    await expect(table.locator('tr')).toHaveCount(OPEN_ITEMS_ROWS + 1);
    await clickCell(page, table, OPEN_ITEMS_ROWS, HOURS_COL);
    await chooseCalculation(page, 'Sum');
    await clickCell(page, table, OPEN_ITEMS_ROWS, 0);
    await page.keyboard.type('Summe');
    await savePage(page, contentPath);

    // View: the footer is neither sorted nor filtered.
    await openInView(page, contentPath);
    const view = viewTable(page, OPEN_ITEMS);
    await expect(view.locator('tr')).toHaveCount(OPEN_ITEMS_ROWS + 1);
    await expect(view.locator('tr').nth(OPEN_ITEMS_ROWS)).toHaveClass(
      /wiki-table-footer/,
    );
    await sortButton(view, HOURS_COL).click();
    const hours = await columnTexts(view, HOURS_COL);
    expect(hours.slice(0, 3)).toEqual(['0,5', '1', '2']);
    expect(hours.at(-1)).toBe('33,0');
    await filterFieldOf(view).fill('Florian');
    expect(await columnTexts(view, 0)).toEqual([
      'Protokoll KW 38 freigeben',
      'Einladungen zum Workshop versenden',
      'Summe',
    ]);
  });

  test('average, minimum, maximum and count; none makes the cell editable', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInEditor(page, contentPath);
    const table = editorTable(page, OPEN_ITEMS);
    await clickCell(page, table, 1, HOURS_COL);
    await clickToolbar(page, 'footerRow');
    const cell = cellOf(table, OPEN_ITEMS_ROWS, HOURS_COL);
    await clickCell(page, table, OPEN_ITEMS_ROWS, HOURS_COL);

    await chooseCalculation(page, 'Average');
    await expect(cell).toHaveText('4,71');
    // Editor marks: computed cell (grey), not an empty result.
    await expect(cell).toHaveClass(/wiki-table-calc/);
    await expect(cell).not.toHaveClass(/wiki-table-calc-empty/);
    await chooseCalculation(page, 'Minimum');
    await expect(cell).toHaveText('0,5');
    await chooseCalculation(page, 'Maximum');
    await expect(cell).toHaveText('12');
    await chooseCalculation(page, 'Count');
    await expect(cell).toHaveText('7');

    // Count also works on a text column.
    await clickCell(page, table, OPEN_ITEMS_ROWS, 4);
    await chooseCalculation(page, 'Count');
    await expect(cellOf(table, OPEN_ITEMS_ROWS, 4)).toHaveText('8');

    // None: the text stays but is no longer computed, so it can be edited.
    await chooseCalculation(page, 'None');
    await page.keyboard.type('x');
    await expect(cellOf(table, OPEN_ITEMS_ROWS, 4)).toHaveText('8x');
    await expect(cellOf(table, OPEN_ITEMS_ROWS, 4)).not.toHaveClass(
      /wiki-table-calc/,
    );
  });

  test('dates for minimum and maximum; skipped cells are counted', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInEditor(page, contentPath);
    const table = editorTable(page, OPEN_ITEMS);
    await clickCell(page, table, 1, DUE_COL);
    await clickToolbar(page, 'footerRow');

    // "Fällig" holds German dates: the earliest and the latest.
    await clickCell(page, table, OPEN_ITEMS_ROWS, DUE_COL);
    await chooseCalculation(page, 'Minimum');
    await expect(cellOf(table, OPEN_ITEMS_ROWS, DUE_COL)).toHaveText(
      '02.10.2026',
    );
    await chooseCalculation(page, 'Maximum');
    await expect(cellOf(table, OPEN_ITEMS_ROWS, DUE_COL)).toHaveText(
      '30.11.2026',
    );

    // A cell that is not a number is skipped, and the result says so.
    await clickCell(page, table, OPEN_ITEMS_ROWS, HOURS_COL);
    await chooseCalculation(page, 'Sum');
    await expect(cellOf(table, OPEN_ITEMS_ROWS, HOURS_COL)).toHaveText('33,0');
    await selectCellText(page, table, 2, HOURS_COL);
    await page.keyboard.type('n/a');
    await expect(cellOf(table, OPEN_ITEMS_ROWS, HOURS_COL)).toHaveText(
      '32,5 (1 übersprungen)',
    );
  });

  test('average, maximum and count follow edits, inserted and deleted rows', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInEditor(page, contentPath);
    const table = editorTable(page, OPEN_ITEMS);
    await clickCell(page, table, 1, HOURS_COL);
    await clickToolbar(page, 'footerRow');
    const footer = (col: number) =>
      table.locator('tr.wiki-table-footer').locator(CELLS).nth(col);

    await clickCell(page, table, OPEN_ITEMS_ROWS, HOURS_COL);
    await chooseCalculation(page, 'Average');
    await clickCell(page, table, OPEN_ITEMS_ROWS, DUE_COL);
    await chooseCalculation(page, 'Maximum');
    await clickCell(page, table, OPEN_ITEMS_ROWS, 0);
    await chooseCalculation(page, 'Count');
    await expect(footer(HOURS_COL)).toHaveText('4,71'); // 33 / 7
    await expect(footer(DUE_COL)).toHaveText('30.11.2026');
    await expect(footer(0)).toHaveText('8');

    // Edit a value: 6 h becomes 20 h, (33 - 6 + 20) / 7.
    await selectCellText(page, table, 1, HOURS_COL);
    await page.keyboard.type('20');
    await expect(footer(HOURS_COL)).toHaveText('6,71');

    // Insert a row and fill it: (47 + 10) / 8, nine tasks, a later date.
    await clickToolbar(page, 'insertRowAfter');
    await clickCell(page, table, 2, HOURS_COL);
    await page.keyboard.type('10');
    await clickCell(page, table, 2, 0);
    await page.keyboard.type('Neu');
    await clickCell(page, table, 2, DUE_COL);
    await page.keyboard.type('31.12.2026');
    await expect(footer(HOURS_COL)).toHaveText('7,13');
    await expect(footer(0)).toHaveText('9');
    await expect(footer(DUE_COL)).toHaveText('31.12.2026');

    // Delete that row again.
    await clickToolbar(page, 'deleteRow');
    await expect(footer(HOURS_COL)).toHaveText('6,71');
    await expect(footer(0)).toHaveText('8');
    await expect(footer(DUE_COL)).toHaveText('30.11.2026');
  });

  test('in the view a filter recomputes the footer over the visible rows', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInEditor(page, contentPath);
    const table = editorTable(page, OPEN_ITEMS);
    await clickCell(page, table, 1, HOURS_COL);
    await clickToolbar(page, 'footerRow');
    await clickCell(page, table, OPEN_ITEMS_ROWS, HOURS_COL);
    await chooseCalculation(page, 'Sum');
    await clickCell(page, table, OPEN_ITEMS_ROWS, 0);
    await chooseCalculation(page, 'Count');
    await expect(cellOf(table, OPEN_ITEMS_ROWS, 0)).toHaveText('8');
    await savePage(page, contentPath);

    await openInView(page, contentPath);
    const view = viewTable(page, OPEN_ITEMS);
    // The marks of the editor do not exist in the view.
    await expect(view.locator('.wiki-table-calc')).toHaveCount(0);
    // By class: while a filter hides rows, the footer's row index changes.
    const footer = (col: number) =>
      view.locator('tr.wiki-table-footer').locator('> th, > td').nth(col);
    await expect(footer(HOURS_COL)).toHaveText('33,0');

    // Florian Meier: 0,5 h and 2 h.
    await filterFieldOf(view).fill('Florian');
    await expect(footer(HOURS_COL)).toHaveText('2,5');
    await expect(footer(0)).toHaveText('2');

    // Sorting alone keeps the stored results; clearing the filter restores them.
    await filterFieldOf(view).fill('');
    await sortButton(view, HOURS_COL).click();
    await expect(footer(HOURS_COL)).toHaveText('33,0');
    await expect(footer(0)).toHaveText('8');
  });

  test('the history diff shows a changed footer result as a text change', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(page, 'projektbudget-2026');
    await openInEditor(page, contentPath);
    const table = editorTable(page, BUDGET);
    await selectCellText(page, table, 1, BUDGET_COL);
    await page.keyboard.type('200.000 €');
    await expect(cellOf(table, GESAMT, BUDGET_COL)).toHaveText('1.475.000 €');
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await savePage(page, contentPath);

    await openDiff(page, contentPath, 0, 1, 'unified');
    const unified = page.locator('.plate-diff-unified');
    await expect(unified.locator('del', { hasText: '1.455.000' })).toHaveCount(
      1,
    );
    await expect(unified.locator('ins', { hasText: '1.475.000' })).toHaveCount(
      1,
    );
    await expect(unified.locator('del', { hasText: '180.000' })).toHaveCount(1);
    await expect(unified.locator('ins', { hasText: '200.000' })).toHaveCount(1);
    // The footer row keeps its styling in the diff, and nothing else changed.
    await expect(unified.locator('tr.wiki-table-footer')).toHaveCount(1);
    await expect(unified.locator('ins, del')).toHaveCount(4);

    await openDiff(page, contentPath, 0, 1, 'split');
    await expect(
      page.locator('.plate-diff-left del', { hasText: '1.455.000' }),
    ).toHaveCount(1);
    await expect(
      page.locator('.plate-diff-right ins', { hasText: '1.475.000' }),
    ).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('the calculation menu lists the six choices, in English and German', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(page, 'projektbudget-2026');
    await openInEditor(page, contentPath);
    const table = editorTable(page, BUDGET);

    // Shipped sum cell: Sum is selected.
    await clickCell(page, table, GESAMT, BUDGET_COL);
    expect(await menuItems(page)).toEqual({
      names: ['None', 'Sum', 'Average', 'Minimum', 'Maximum', 'Count'],
      checked: [false, true, false, false, false, false],
    });
    // A footer cell without a calculation: None is selected.
    await clickCell(page, table, GESAMT, 1);
    expect((await menuItems(page)).checked).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
    ]);

    // German labels.
    await page
      .context()
      .addCookies([
        { name: 'I18N_LANGUAGE', value: 'de', url: new URL(page.url()).origin },
      ]);
    await openInEditor(page, contentPath);
    await clickCell(page, table, GESAMT, BUDGET_COL);
    await expect(toolbarButton(page, 'footerRow')).toHaveCount(0);
    await expect(
      page
        .locator('[data-radix-popper-content-wrapper]')
        .last()
        .getByLabel('Fußzeile', { exact: true }),
    ).toBeVisible();
    await page
      .locator('[data-radix-popper-content-wrapper]')
      .last()
      .getByLabel('Berechnung', { exact: true })
      .click();
    const items = page.getByRole('menuitemradio');
    await expect(items.first()).toBeVisible();
    expect((await items.allInnerTexts()).map((n) => n.trim())).toEqual([
      'Keine',
      'Summe',
      'Durchschnitt',
      'Minimum',
      'Maximum',
      'Anzahl',
    ]);
    await page.keyboard.press('Escape');
  });

  test('edge cases: note gone again, text column, fresh footer, merged cells', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(
      page,
      'teilnehmende-konsortialtreffen',
    );
    await openInEditor(page, contentPath);
    const table = editorTable(page, OPEN_ITEMS);
    await clickCell(page, table, 1, HOURS_COL);
    await clickToolbar(page, 'footerRow');
    const footer = (col: number) =>
      table.locator('tr.wiki-table-footer').locator(CELLS).nth(col);

    // The skipped note disappears once the cell holds a number again.
    await clickCell(page, table, OPEN_ITEMS_ROWS, HOURS_COL);
    await chooseCalculation(page, 'Sum');
    await selectCellText(page, table, 2, HOURS_COL);
    await page.keyboard.type('n/a');
    await expect(footer(HOURS_COL)).toHaveText('32,5 (1 übersprungen)');
    await selectCellText(page, table, 2, HOURS_COL);
    await page.keyboard.type('0,5');
    await expect(footer(HOURS_COL)).toHaveText('33,0');

    // Sum on a text column: an empty cell, no error.
    await clickCell(page, table, OPEN_ITEMS_ROWS, 4);
    await chooseCalculation(page, 'Sum');
    await expect(footer(4)).toHaveText('');
    await expect(footer(4)).toHaveClass(/wiki-table-calc-empty/);

    // Off and on again: a fresh, empty footer row without calculations.
    await clickToolbar(page, 'footerRow');
    await expect(table.locator('tr.wiki-table-footer')).toHaveCount(0);
    await clickCell(page, table, 1, HOURS_COL);
    await clickToolbar(page, 'footerRow');
    expect((await tableTexts(table)).at(-1)).toEqual(['', '', '', '', '']);
    await clickCell(page, table, OPEN_ITEMS_ROWS, HOURS_COL);
    expect((await menuItems(page)).checked[0]).toBe(true);

    // A table with a merged cell takes a footer too; the view still offers
    // no sorting for it.
    const agenda = editorTable(page, AGENDA);
    const agendaRows = await agenda.locator('tr').count();
    await clickCell(page, agenda, 1, 0);
    await clickToolbar(page, 'footerRow');
    await clickCell(page, agenda, agendaRows, 0);
    await chooseCalculation(page, 'Count');
    const bodyTexts = (await tableTexts(agenda)).slice(1, -1);
    const filled = bodyTexts.filter((row) => row[0] !== '').length;
    await expect(
      agenda.locator('tr.wiki-table-footer').locator(CELLS).nth(0),
    ).toHaveText(String(filled));
    await savePage(page, contentPath);

    await openInView(page, contentPath);
    const view = viewTable(page, AGENDA);
    await expect(view.locator('tr').last()).toHaveClass(/wiki-table-footer/);
    await expect(view.locator('tr').last().locator('td').first()).toHaveText(
      String(filled),
    );
    await expect(view.locator('button.wiki-table-sort')).toHaveCount(0);
  });
});
