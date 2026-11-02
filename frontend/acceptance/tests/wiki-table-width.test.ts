/**
 * Table width of wiki tables: the "Width" group of the cell toolbar sets
 * Text width (`default`), Wide (`layout`) or Full width (`full`) on the
 * table, a pasted table with many columns gets a wider step on its own, and
 * a table that fits shows no horizontal scrollbar in the editor (#783).
 *
 * The test viewport (1440 × 1000) has a content area of about 1060px in the
 * view, so "Wide" (at most 1280px) and "Full width" look the same there: the
 * stored `blockWidth` tells them apart.
 *
 * Tickets: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/823
 *          https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/783
 */
import type { Locator, Page } from '@playwright/test';
import { setSelection } from '@platejs/playwright';

import {
  getValue,
  insertWithSlashMenu,
  pasteData,
  type EditorNode,
} from '../fixtures/editor';
import { openInEditor, openInView } from '../fixtures/pages';
import {
  clickCell,
  clickToolbar,
  editorTable,
  savePage,
  toolbarButton,
  viewTable,
} from '../fixtures/table';
import { editorHandleOf, getTables } from '../fixtures/table-editor';
import {
  createTablePage,
  createWikiPageWithValue,
  getWikiValue,
  patchContent,
  SOMERSAULT_KEY,
  TABLES,
} from '../fixtures/wiki-pages';
import { login } from './login';
import { expect, test } from './test';

test.describe.configure({ timeout: 45_000 });

const paragraph = (text: string): EditorNode => ({
  type: 'p',
  children: [{ text }],
});

/** A table with a header row and `rows` body rows of `cols` columns. */
const table = (cols: number, rows = 2): EditorNode => {
  const cell = (type: string, text: string): EditorNode => ({
    type,
    children: [paragraph(text)],
  });
  const row = (type: string, r: number): EditorNode => ({
    type: 'tr',
    children: Array.from({ length: cols }, (_, c) => cell(type, `${r}/${c}`)),
  });
  return {
    type: 'table',
    children: [
      row('th', 0),
      ...Array.from({ length: rows }, (_, r) => row('td', r + 1)),
    ],
  };
};

async function openPage(page: Page, id: string, value: EditorNode[]) {
  const { contentPath } = await createWikiPageWithValue(page, {
    contentId: id,
    title: `Width ${id}`,
    value,
  });
  const editor = await openInEditor(page, contentPath);
  return { contentPath, editor };
}

/** `blockWidth` of the top-level tables in the editor. */
async function editorWidths(page: Page) {
  return (await getTables(page)).map((node) => node.blockWidth);
}

/** CSV text with `cols` columns (header and two rows). */
const csv = (cols: number) =>
  [0, 1, 2]
    .map((r) =>
      Array.from({ length: cols }, (_, c) =>
        r ? `${r}-${c}` : `Spalte ${c}`,
      ).join(';'),
    )
    .join('\n');

/** The scroll container around a table (Plate's `overflow-x-auto`). */
function scrollerOf(tableLocator: Locator) {
  return tableLocator.locator(
    'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " overflow-x-auto ")][1]',
  );
}

const overflowOf = (scroller: Locator) =>
  scroller.evaluate((el) => el.scrollWidth - el.clientWidth);

test.describe('Wiki tables: width', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('the toolbar sets Wide and Full width; the width is saved and shown', async ({
    page,
  }) => {
    const { contentPath } = await openPage(page, 'toolbar', [
      paragraph('Text before the table.'),
      table(8),
      paragraph('Text after the table.'),
    ]);
    const tableLocator = editorTable(page, 0);

    // A table without a width is in the reading column.
    await clickCell(page, tableLocator, 1, 1);
    await expect(toolbarButton(page, 'widthDefault')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(toolbarButton(page, 'widthLayout')).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(await editorWidths(page)).toEqual(['default']);

    await clickToolbar(page, 'widthLayout');
    await expect(toolbarButton(page, 'widthLayout')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect.poll(() => editorWidths(page)).toEqual(['layout']);
    // Wide is capped at 1280px (theme/components/_wikiTable.scss).
    await expect
      .poll(() =>
        page.evaluate(() => {
          const block = document.querySelector('.block.block-table');
          return block
            ? getComputedStyle(block)
                .getPropertyValue('--layout-container-width')
                .trim()
            : null;
        }),
      )
      .toContain('min(1280px');

    await clickToolbar(page, 'widthFull');
    await expect(toolbarButton(page, 'widthFull')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(toolbarButton(page, 'widthLayout')).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await expect.poll(() => editorWidths(page)).toEqual(['full']);
    // Only the table changed: the paragraphs in its cells and around it
    // keep their width.
    const value = await getTables(page);
    expect(value[0].children![1].children![1].children![0].blockWidth).not.toBe(
      'full',
    );

    await savePage(page, contentPath);
    const stored = await getWikiValue(page, contentPath);
    expect(stored.find((node) => node.type === 'table')?.blockWidth).toBe(
      'full',
    );
    expect(
      stored.filter((node) => node.type === 'p').map((node) => node.blockWidth),
    ).toEqual(['default', 'default']);

    // In the view the table's block is wider than the reading column. (The
    // table element itself is wider than 780px in any case: eight columns
    // of at least 120px, scrolling inside the block.)
    await openInView(page, contentPath);
    const view = viewTable(page, 0);
    const paragraphBox = await page
      .locator('main [data-slate-type="p"] .block-inner-container')
      .filter({ hasText: 'Text before the table.' })
      .boundingBox();
    const tableBox = await view
      .locator(
        'xpath=ancestor::div[contains(@class, "block-inner-container")][1]',
      )
      .boundingBox();
    expect(tableBox!.width).toBeGreaterThan(paragraphBox!.width + 100);

    // And back to the reading column.
    await openInEditor(page, contentPath);
    await clickCell(page, editorTable(page, 0), 1, 1);
    await expect(toolbarButton(page, 'widthFull')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await clickToolbar(page, 'widthDefault');
    await expect.poll(() => editorWidths(page)).toEqual(['default']);
    await savePage(page, contentPath);
    const box = await viewTable(page, 0)
      .locator(
        'xpath=ancestor::div[contains(@class, "block-inner-container")][1]',
      )
      .boundingBox();
    expect(Math.round(box!.width)).toBe(Math.round(paragraphBox!.width));
  });

  test('the six-column budget table of the demo page is wide', async ({
    page,
  }) => {
    const { contentPath } = await createTablePage(page, 'projektbudget-2026');
    await openInEditor(page, contentPath);
    await clickCell(
      page,
      editorTable(page, TABLES['projektbudget-2026'].budget),
      1,
      1,
    );
    await expect(toolbarButton(page, 'widthLayout')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    // The milestone table stays in the reading column.
    expect(await editorWidths(page)).toEqual(['layout', 'default']);
  });

  test('the history diff shows a table whose width changed', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const value = [paragraph('Text before the table.'), table(8)];
    const { contentPath } = await createWikiPageWithValue(page, {
      contentId: 'diff',
      title: 'Width diff',
      value,
    });
    const wide = value.map((node) =>
      node.type === 'table' ? { ...node, blockWidth: 'full' } : node,
    );
    await patchContent(page, contentPath, {
      blocks: {
        [SOMERSAULT_KEY]: {
          '@type': SOMERSAULT_KEY,
          value: [
            { type: 'title', children: [{ text: 'Width diff' }] },
            ...wide,
          ],
        },
      },
      changeNote: 'Full width',
    });
    for (const view of ['unified', 'split']) {
      await page.goto(`${contentPath}/diff?one=0&two=1&view=${view}`, {
        waitUntil: 'networkidle',
      });
      const diff = page.locator(`.plate-diff-${view}`);
      await expect(diff).toBeVisible();
      const changed = diff.locator('.plate-diff-block-update').filter({
        has: page.locator('table'),
      });
      await expect(changed.first()).toBeVisible();
      await expect(
        changed.last().locator('.block-table').first(),
      ).toHaveAttribute('style', /--block-width: 100%/);
    }
    expect(errors).toEqual([]);
  });

  test('pasted CSV with 7 columns is wide, with 3 columns it stays in the reading column', async ({
    page,
  }) => {
    const { editor } = await openPage(page, 'paste', [paragraph('')]);
    await setSelection(page, editor, { path: [1, 0], offset: 0 });
    await pasteData(page, editor, { 'text/plain': csv(7) });
    await expect.poll(() => editorWidths(page)).toEqual(['layout']);

    // A second paste into the empty paragraph below the table.
    const value = await page.evaluate(
      (handle) => (handle as any).children.length,
      await editorHandleOf(page),
    );
    await setSelection(page, editor, { path: [value - 1, 0], offset: 0 });
    await pasteData(page, editor, { 'text/plain': csv(3) });
    await expect.poll(() => editorWidths(page)).toEqual(['layout', 'default']);
  });

  test('pasted into a column the table keeps no width; a callout splits around a wide table', async ({
    page,
  }) => {
    const { editor } = await openPage(page, 'nested', [
      paragraph('Text before.'),
      {
        type: 'column_group',
        children: [
          { type: 'column', width: '50%', children: [paragraph('Left')] },
          { type: 'column', width: '50%', children: [paragraph('Right')] },
        ],
      } as EditorNode,
      {
        type: 'callout',
        variant: 'info',
        icon: '💡',
        children: [{ text: 'Note' }],
      } as EditorNode,
    ]);
    const handle = await editorHandleOf(page);

    // Into the left column (title, paragraph, column group, column, paragraph):
    // the table stays in the column, without a width.
    await setSelection(page, editor, { path: [2, 0, 0, 0], offset: 4 });
    await pasteData(page, editor, { 'text/plain': csv(7) });
    await expect
      .poll(async () => {
        const value = await getValue(page, handle);
        const column = value[2]?.children?.[0];
        const inColumn = (column?.children ?? []).find(
          (node) => node.type === 'table',
        );
        return inColumn ? { width: inColumn.blockWidth ?? null } : undefined;
      })
      .toEqual({ width: null });
    expect(await editorWidths(page)).toEqual([]);

    // The width buttons of a nested table are shown, but disabled.
    await clickCell(page, editorTable(page, 0), 0, 0);
    for (const label of ['Text width', 'Wide', 'Full width']) {
      await expect(
        page.getByRole('radio', { name: label, exact: true }),
      ).toBeDisabled();
    }

    // Into the callout: a callout holds text, not blocks, so the table lands
    // on the page between the two halves and is wide like any other paste.
    await setSelection(page, editor, { path: [3, 0], offset: 2 });
    await pasteData(page, editor, { 'text/plain': csv(7) });
    await expect.poll(() => editorWidths(page)).toEqual(['layout']);
    const types = (await getValue(page, handle)).map((node) => node.type);
    expect(types.slice(3, 6)).toEqual(['callout', 'table', 'callout']);
  });

  test('pasted HTML and markdown tables with 6 columns are wide, also after save', async ({
    page,
  }) => {
    const { contentPath, editor } = await openPage(page, 'paste-html', [
      paragraph(''),
    ]);
    const cells = (tag: string, r: number) =>
      Array.from({ length: 6 }, (_, c) => `<${tag}>${r}/${c}</${tag}>`).join(
        '',
      );
    await setSelection(page, editor, { path: [1, 0], offset: 0 });
    await pasteData(page, editor, {
      'text/html': `<meta charset="utf-8"><table><tbody><tr>${cells('th', 0)}</tr><tr>${cells('td', 1)}</tr></tbody></table>`,
      'text/plain': '0/0\t0/1',
    });
    await expect.poll(() => editorWidths(page)).toEqual(['layout']);

    const length = await page.evaluate(
      (handle) => (handle as any).children.length,
      await editorHandleOf(page),
    );
    await setSelection(page, editor, { path: [length - 1, 0], offset: 0 });
    const row = (r: number) =>
      `| ${Array.from({ length: 6 }, (_, c) => `${r}-${c}`).join(' | ')} |`;
    await pasteData(page, editor, {
      'text/plain': [row(0), `|${' --- |'.repeat(6)}`, row(1)].join('\n'),
    });
    await expect.poll(() => editorWidths(page)).toEqual(['layout', 'layout']);

    await savePage(page, contentPath);
    const stored = await getWikiValue(page, contentPath);
    expect(
      stored
        .filter((node) => node.type === 'table')
        .map((node) => node.blockWidth),
    ).toEqual(['layout', 'layout']);
  });

  test('a pasted table with 10 columns is full width; adding columns keeps the width', async ({
    page,
  }) => {
    const { editor } = await openPage(page, 'paste-full', [paragraph('')]);
    await setSelection(page, editor, { path: [1, 0], offset: 0 });
    await pasteData(page, editor, { 'text/plain': csv(10) });
    await expect.poll(() => editorWidths(page)).toEqual(['full']);

    // A 3 × 3 table from the slash menu stays in the reading column, also
    // when it grows to 6 columns.
    const length = await page.evaluate(
      (handle) => (handle as any).children.length,
      await editorHandleOf(page),
    );
    await insertWithSlashMenu(page, editor, length - 1, 'Table');
    await expect.poll(() => editorWidths(page)).toEqual(['full', 'default']);
    const inserted = editorTable(page, 1);
    await clickCell(page, inserted, 1, 2);
    for (let i = 0; i < 3; i++) {
      await clickToolbar(page, 'insertColumnAfter');
    }
    await expect(inserted.locator('tr').first().locator('th')).toHaveCount(6);
    expect(await editorWidths(page)).toEqual(['full', 'default']);
  });

  test('#783: a table that fits shows no horizontal scrollbar in the editor, a wider one scrolls', async ({
    page,
  }) => {
    await openPage(page, 'scrollbar', [paragraph('Intro'), paragraph('')]);
    await insertWithSlashMenu(page, await editorHandleOf(page), 2, 'Table');
    const inserted = editorTable(page, 0);
    await expect(inserted).toBeVisible();
    await expect.poll(() => overflowOf(scrollerOf(inserted))).toBe(0);

    // A 4-column table (Timo's screenshot) fits as well.
    await clickCell(page, inserted, 1, 2);
    await clickToolbar(page, 'insertColumnAfter');
    await expect(inserted.locator('tr').first().locator('th')).toHaveCount(4);
    await expect.poll(() => overflowOf(scrollerOf(inserted))).toBe(0);

    // An 8-column table is wider than the reading column and scrolls.
    const wide = await createWikiPageWithValue(page, {
      contentId: 'scrollbar-wide',
      title: 'Width scrollbar wide',
      value: [table(8)],
    });
    await openInEditor(page, wide.contentPath);
    await expect
      .poll(() => overflowOf(scrollerOf(editorTable(page, 0))))
      .toBeGreaterThan(100);
    // The view too.
    await openInView(page, wide.contentPath);
    await expect
      .poll(() => overflowOf(scrollerOf(viewTable(page, 0))))
      .toBeGreaterThan(100);
  });
});
