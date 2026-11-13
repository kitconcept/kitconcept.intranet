/**
 * Wiki tables: the cell borders show in the view and in the editor.
 *
 * Since @plone/plate 1.0.0-alpha.26, a cell's borders are drawn by its
 * `::before` on the sides named by its `data-border-*` attributes (the
 * content styles of `@plone/plate/styles/content.css`); the intranet's table
 * shadows have to set them.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/832
 */
import type { Locator } from '@playwright/test';

import { openInEditor, openInView } from '../fixtures/pages';
import { editorTable, viewTable } from '../fixtures/table';
import { createWikiPageWithValue } from '../fixtures/wiki-pages';
import { login } from './login';
import { expect, test } from './test';

test.describe.configure({ timeout: 30_000 });

const BORDER = { size: 1, style: 'solid', color: '#000000' };
const NONE = { size: 0, style: 'none', color: '#000000' };

// Cells carry ids, as every cell saved by the editor does: the view's table
// finds a cell's row and column (for the outer top and left borders) by id.
const cell = (text: string, borders: Record<string, unknown>, type = 'td') => ({
  type,
  id: `cell-${text}`,
  borders,
  children: [{ type: 'p', children: [{ text }] }],
});

const ALL = { top: BORDER, right: BORDER, bottom: BORDER, left: BORDER };
const NO_BORDERS = { top: NONE, right: NONE, bottom: NONE, left: NONE };

/** A 2x2 table: the first row with all borders, the second with none. */
const TABLE = {
  type: 'table',
  id: 'table-borders',
  children: [
    {
      type: 'tr',
      id: 'row-1',
      children: [cell('H1', ALL, 'th'), cell('H2', ALL, 'th')],
    },
    {
      type: 'tr',
      id: 'row-2',
      children: [cell('A', NO_BORDERS), cell('B', NO_BORDERS)],
    },
  ],
};

/** Widths of the border that a cell's `::before` draws: top right bottom left. */
async function borderWidths(table: Locator, text: string) {
  const target = table
    .locator(':is(td, th):not([contenteditable="false"])')
    .filter({ hasText: text })
    .first();
  return target.evaluate((element) => {
    const style = getComputedStyle(element, '::before');
    return [
      style.borderTopWidth,
      style.borderRightWidth,
      style.borderBottomWidth,
      style.borderLeftWidth,
    ];
  });
}

test.describe('Wiki tables: cell borders', () => {
  let contentPath: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    ({ contentPath } = await createWikiPageWithValue(page, {
      contentId: 'borders',
      title: 'Borders',
      value: [TABLE, { type: 'p', children: [{ text: 'After.' }] }],
    }));
  });

  test('set borders show in the view, unset ones do not', async ({ page }) => {
    await openInView(page, contentPath);
    const table = viewTable(page, 0);

    // The first row draws all its sides: top on every cell (first row),
    // left on the first column only, right and bottom on every cell.
    await expect
      .poll(() => borderWidths(table, 'H1'))
      .toEqual(['1px', '1px', '1px', '1px']);
    await expect
      .poll(() => borderWidths(table, 'H2'))
      .toEqual(['1px', '1px', '1px', '0px']);
    await expect
      .poll(() => borderWidths(table, 'A'))
      .toEqual(['0px', '0px', '0px', '0px']);
  });

  test('set borders show in the editor, unset ones do not', async ({
    page,
  }) => {
    await openInEditor(page, contentPath);
    const table = editorTable(page, 0);

    await expect
      .poll(() => borderWidths(table, 'H1'))
      .toEqual(['1px', '1px', '1px', '1px']);
    await expect
      .poll(() => borderWidths(table, 'A'))
      .toEqual(['0px', '0px', '0px', '0px']);
  });
});
