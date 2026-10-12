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
import {
  cellOf,
  clickCell,
  clickToolbar,
  columnTexts,
  editorTable,
  filterFieldOf,
  savePage,
  selectCellText,
  sortButton,
  toolbarButton,
  viewTable,
} from '../fixtures/table';
import { createTablePage, TABLES } from '../fixtures/wiki-pages';
import { login } from './login';
import { expect, test } from './test';

test.describe.configure({ timeout: 45_000 });

const BUDGET = TABLES['projektbudget-2026'].budget;
const GESAMT = 6; // the footer row of the budget table
const BUDGET_COL = 2;

const OPEN_ITEMS = TABLES['teilnehmende-konsortialtreffen'].openItems;
const HOURS_COL = 3; // "Aufwand (h)": 6, 0,5, 12, 1, 3,5, 2, (empty), 8
const OPEN_ITEMS_ROWS = 9; // header + 8 body rows

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
    await expect(toolbarButton(page, 'sum')).toHaveAttribute(
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
    await expect(toolbarButton(page, 'sum')).toHaveCount(0);
    await clickToolbar(page, 'footerRow');
    await expect(table.locator('tr')).toHaveCount(OPEN_ITEMS_ROWS + 1);
    const footer = table.locator('tr').nth(OPEN_ITEMS_ROWS);
    await expect(footer).toHaveClass(/wiki-table-footer/);
    await expect(toolbarButton(page, 'sum')).toBeVisible();

    // Sum of the hours column (German decimals, empty cell skipped).
    await clickCell(page, table, OPEN_ITEMS_ROWS, HOURS_COL);
    await clickToolbar(page, 'sum');
    await expect(cellOf(table, OPEN_ITEMS_ROWS, HOURS_COL)).toHaveText('33,0');

    // Off: the footer row is removed; on again: a fresh empty one.
    await clickToolbar(page, 'footerRow');
    await expect(table.locator('tr')).toHaveCount(OPEN_ITEMS_ROWS);
    await clickCell(page, table, 1, HOURS_COL);
    await clickToolbar(page, 'footerRow');
    await expect(table.locator('tr')).toHaveCount(OPEN_ITEMS_ROWS + 1);
    await clickCell(page, table, OPEN_ITEMS_ROWS, HOURS_COL);
    await clickToolbar(page, 'sum');
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
});
