/**
 * Locators and actions for wiki tables, in the view and in the editor. Pages
 * are opened with volto-plate's `openInEditor` / `openInView` (`./pages`).
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { getEditorHandle } from '@platejs/playwright';

import { editable } from './editor';

/** Table `index` (page order) in the view. */
export function viewTable(page: Page, index: number) {
  return page.locator('main table').nth(index);
}

/** Table `index` (page order) in the editor. */
export function editorTable(page: Page, index: number) {
  return editable(page).locator('table').nth(index);
}

/**
 * Content cells of a row: the editor adds a gutter cell for the row drag
 * handle (`contenteditable="false"`), which is skipped.
 */
export const CELLS = ':scope > th, :scope > td:not([contenteditable="false"])';

/** Text of column `col` in the body rows (the header row is skipped). */
export async function columnTexts(table: Locator, col: number) {
  return table
    .locator('tr')
    .evaluateAll(
      (rows, [c, cells]) =>
        rows
          .slice(1)
          .map(
            (row) => row.querySelectorAll(cells)[c]?.textContent?.trim() ?? '',
          ),
      [col, CELLS] as const,
    );
}

/** Text of every cell, row by row (header row included). */
export async function tableTexts(table: Locator) {
  return table
    .locator('tr')
    .evaluateAll(
      (rows, cells) =>
        rows.map((row) =>
          Array.from(row.querySelectorAll(cells)).map(
            (cell) => cell.textContent?.trim() ?? '',
          ),
        ),
      CELLS,
    );
}

/** Cell `col` of row `row` (row 0 = header row), gutter cell skipped. */
export function cellOf(table: Locator, row: number, col: number) {
  return table
    .locator('tr')
    .nth(row)
    .locator('> th, > td:not([contenteditable="false"])')
    .nth(col);
}

/** The sort button in header cell `col` (view). */
export function sortButton(table: Locator, col: number) {
  return table.locator('th').nth(col).locator('button.wiki-table-sort');
}

/**
 * The filter field of `table` (view). The field sits above its table, inside
 * the same wrapper.
 */
export function filterFieldOf(table: Locator) {
  return filterAreaOf(table).getByRole('searchbox');
}

/** The clear button of the filter field of `table`. */
export function clearFilterButtonOf(table: Locator) {
  return filterAreaOf(table).getByRole('button', { name: 'Clear filter' });
}

/** The "x of y rows" count next to the filter field of `table`. */
export function filterCountOf(table: Locator) {
  return filterAreaOf(table).locator('.wiki-table-filter-count');
}

/**
 * The table's own block: the filter field and the table's scroll container
 * are siblings in it.
 */
function filterAreaOf(table: Locator) {
  return table.locator(
    'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " overflow-x-auto ")][1]/..',
  );
}

/** Whether `table` has a filter field at all. */
export async function hasFilterField(table: Locator) {
  return (await filterAreaOf(table).getByRole('searchbox').count()) > 0;
}

export async function savePage(page: Page, contentPath: string) {
  await page.locator('#toolbar-save').click();
  await page.waitForURL(contentPath, { waitUntil: 'load', timeout: 30_000 });
}

/**
 * Clicks into the text of a cell in the editor (row 0 = header row) and waits
 * until Slate's selection is in that cell (Slate applies DOM selection
 * changes with a short throttle).
 */
export async function clickCell(
  page: Page,
  table: Locator,
  row: number,
  col: number,
) {
  const cell = cellOf(table, row, col);
  await cell.scrollIntoViewIfNeeded();
  await cell
    .locator('[data-slate-string], [data-slate-zero-width]')
    .first()
    .click();
  // Typed loosely: Playwright's handle unboxing is too deep for the editor
  // type.
  const args: any[] = [
    await getEditorHandle(page, editable(page)),
    await cell.elementHandle(),
  ];
  await expect
    .poll(() =>
      page.evaluate(([editor, el]: any[]) => {
        const path = editor.api.findPath(editor.api.toSlateNode(el));
        const anchor = editor.selection?.anchor.path as number[] | undefined;
        return (
          !!path &&
          !!anchor &&
          path.every((value: number, i: number) => anchor[i] === value)
        );
      }, args),
    )
    .toBe(true);
  return cell;
}

/** The cell toolbar of the table holding the selection. */
export function cellToolbar(page: Page) {
  return page
    .locator('[data-radix-popper-content-wrapper]')
    .filter({ has: page.locator('button svg') })
    .last();
}

/**
 * Cell toolbar buttons are found by their accessible name: @plone/plate's
 * ToolbarButton uses its tooltip as `aria-label` (since 1.0.0-alpha.18).
 */
const TOOLBAR_LABELS = {
  background: 'Background color',
  merge: 'Merge cells',
  split: 'Split cell',
  borders: 'Cell borders',
  headerRow: 'Header row',
  deleteTable: 'Delete table',
  insertRowBefore: 'Insert row before',
  insertRowAfter: 'Insert row after',
  deleteRow: 'Delete row',
  moveRowUp: 'Move row up',
  moveRowDown: 'Move row down',
  insertColumnBefore: 'Insert column before',
  insertColumnAfter: 'Insert column after',
  deleteColumn: 'Delete column',
  moveColumnLeft: 'Move column left',
  moveColumnRight: 'Move column right',
} as const;

export type ToolbarAction = keyof typeof TOOLBAR_LABELS;

export function toolbarButton(page: Page, action: ToolbarAction) {
  return cellToolbar(page).getByLabel(TOOLBAR_LABELS[action], { exact: true });
}

export async function clickToolbar(page: Page, action: ToolbarAction) {
  const button = toolbarButton(page, action);
  await expect(button).toBeEnabled();
  await button.click();
}
