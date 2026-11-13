/**
 * Table width of wiki tables: the "Width" menu of the cell toolbar sets
 * Text width (`default`), Medium (`medium`, 1040px), Wide (`layout`, 1440px)
 * or Full width (`full`) on the table, a table wider than the text starts
 * at the text column's left edge and keeps a 10px margin to the right edge
 * of the content area (#826), a pasted table with many
 * columns gets a wider step on its own, and a table that fits shows no
 * horizontal scrollbar in the editor (#783).
 *
 * The test viewport (1440 × 1000) has a content area of about 1060px in the
 * view and a room of (1060 + 780) / 2 - 10 = 910px from the text column's
 * left edge, so Medium, Wide and Full width look the same there: the stored
 * `blockWidth` tells them apart, and one test widens the window to 2600px
 * to measure the steps.
 *
 * Tickets: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/823
 *          https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/783
 *          https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/825
 *          https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/826
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
  cellOf,
  chooseWidth,
  clickCell,
  clickToolbar,
  editorTable,
  savePage,
  viewTable,
  widthTrigger,
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

/** Opens the width menu, reads its items and their checked state, closes it. */
async function widthMenu(page: Page) {
  await widthTrigger(page).click();
  const items = page.getByRole('menuitemradio');
  await expect(items.first()).toBeVisible();
  const names = (await items.allInnerTexts()).map((name) => name.trim());
  const checked = await items.evaluateAll((els) =>
    els.map((el) => el.getAttribute('aria-checked') === 'true'),
  );
  await page.keyboard.press('Escape');
  // The menu leaves with an animation; the next open must not see it.
  await expect(page.getByRole('menu')).toHaveCount(0);
  return { names, checked };
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

    // A table without a width is in the reading column; the menu lists
    // the four steps with Text width checked.
    await clickCell(page, tableLocator, 1, 1);
    expect(await widthMenu(page)).toEqual({
      names: ['Text width', 'Medium', 'Wide', 'Full width'],
      checked: [true, false, false, false],
    });
    expect(await editorWidths(page)).toEqual(['default']);
    await expect(widthTrigger(page)).toHaveAccessibleName('Width: Text width');

    await chooseWidth(page, 'Medium');
    await expect.poll(() => editorWidths(page)).toEqual(['medium']);
    await expect(widthTrigger(page)).toHaveAccessibleName('Width: Medium');
    expect((await widthMenu(page)).checked).toEqual([
      false,
      true,
      false,
      false,
    ]);

    await chooseWidth(page, 'Wide');
    await expect.poll(() => editorWidths(page)).toEqual(['layout']);
    expect((await widthMenu(page)).checked).toEqual([
      false,
      false,
      true,
      false,
    ]);

    await chooseWidth(page, 'Full width');
    await expect.poll(() => editorWidths(page)).toEqual(['full']);
    expect((await widthMenu(page)).checked).toEqual([
      false,
      false,
      false,
      true,
    ]);
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
    // of at least 120px, scrolling inside the block.) A Full width table
    // starts at the text column's left edge and keeps a 10px margin to the
    // right edge of the content area (#825, #826).
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
    const blockBox = await view
      .locator('xpath=ancestor::div[contains(@class, "block-table")][1]')
      .boundingBox();
    expect(tableBox!.width).toBeGreaterThan(paragraphBox!.width + 100);
    expect(Math.round(tableBox!.x)).toBe(Math.round(paragraphBox!.x));
    expect(
      Math.round(
        blockBox!.x + blockBox!.width - (tableBox!.x + tableBox!.width),
      ),
    ).toBe(10);

    // And back to the reading column.
    await openInEditor(page, contentPath);
    await clickCell(page, editorTable(page, 0), 1, 1);
    expect((await widthMenu(page)).checked).toEqual([
      false,
      false,
      false,
      true,
    ]);
    await chooseWidth(page, 'Text width');
    await expect.poll(() => editorWidths(page)).toEqual(['default']);
    await savePage(page, contentPath);
    const box = await viewTable(page, 0)
      .locator(
        'xpath=ancestor::div[contains(@class, "block-inner-container")][1]',
      )
      .boundingBox();
    expect(Math.round(box!.width)).toBe(Math.round(paragraphBox!.width));
  });

  test('the six-column budget table of the demo page is medium', async ({
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
    expect((await widthMenu(page)).checked).toEqual([
      false,
      true,
      false,
      false,
    ]);
    // The milestone table stays in the reading column.
    expect(await editorWidths(page)).toEqual(['medium', 'default']);
  });

  test('on a wide window the four steps are 780, 1040, 1440 and the room, all from the text column', async ({
    page,
  }) => {
    // From about 2500px Wide is narrower than the room (with the navigation
    // tree open).
    await page.setViewportSize({ width: 2600, height: 1000 });
    const value: EditorNode[] = [paragraph('Text before the table.')];
    for (const width of ['default', 'medium', 'layout', 'full']) {
      value.push({ ...table(8, 1), blockWidth: width });
    }
    // A one-column Full width table: the paragraph in its wide cell fills
    // the cell, the table's width rules stop at the table (#825).
    value.push({ ...table(1, 1), blockWidth: 'full' });
    const { contentPath } = await createWikiPageWithValue(page, {
      contentId: 'steps',
      title: 'Width steps',
      value,
    });
    await openInView(page, contentPath);
    const textColumn = await page
      .locator('main [data-slate-type="p"] .block-inner-container')
      .filter({ hasText: 'Text before the table.' })
      .boundingBox();
    const widths: number[] = [];
    const starts: number[] = [];
    for (let i = 0; i < 4; i++) {
      const box = await viewTable(page, i)
        .locator(
          'xpath=ancestor::div[contains(@class, "block-inner-container")][1]',
        )
        .boundingBox();
      widths.push(Math.round(box!.width));
      starts.push(Math.round(box!.x));
    }
    const contentArea = await viewTable(page, 3)
      .locator('xpath=ancestor::div[contains(@class, "block-table")][1]')
      .boundingBox();
    // The room: from the text column's left edge to the content area's
    // right edge, minus the 10px margin.
    const room = Math.round(
      contentArea!.x + contentArea!.width - textColumn!.x - 10,
    );
    expect(room).toBeGreaterThan(1460);
    expect(widths).toEqual([780, 1040, 1440, room]);
    // Every step starts at the text column (#826).
    expect(starts).toEqual(Array(4).fill(Math.round(textColumn!.x)));
    const wideCell = viewTable(page, 4).locator('td').first();
    const cellBox = await wideCell.boundingBox();
    const textBox = await wideCell
      .locator('.block-inner-container')
      .first()
      .boundingBox();
    expect(cellBox!.width).toBeGreaterThan(1400);
    // Cell padding is 0.65em on each side, nothing else.
    expect(textBox!.width).toBeGreaterThan(cellBox!.width - 30);
  });

  test('in the editor the first column starts at the text column (no stretched gutter)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1000 });
    await openPage(page, 'gutter', [
      paragraph('Text before the table.'),
      table(4),
      { ...table(4), blockWidth: 'full' },
      { ...table(3), blockWidth: 'full', colSizes: [150, 200, 0] },
    ]);
    const text = await page
      .locator('[contenteditable="true"] .block-inner-container')
      .filter({ hasText: 'Text before the table.' })
      .last()
      .boundingBox();
    for (const index of [0, 1, 2]) {
      const first = await cellOf(editorTable(page, index), 1, 0).boundingBox();
      expect(Math.abs(first!.x - text!.x)).toBeLessThanOrEqual(1);
      // The row grip sits left of the table, clear of the first cell.
      const row = editorTable(page, index).locator('tr').nth(1);
      await row.hover();
      const grip = await row
        .getByRole('button', { name: 'Drag to move the row' })
        .boundingBox();
      expect(grip!.x).toBeGreaterThanOrEqual(text!.x - 27);
      expect(grip!.x + grip!.width).toBeLessThanOrEqual(first!.x);
    }
  });

  test('the cell toolbar stays clear of the panels when they are toggled while it is open', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openPage(page, 'panels', [paragraph('Intro'), table(8)]);
    const toolbar = page.locator('.wiki-table-toolbar');
    // Volto's sidebar trigger ("Shrink sidebar" / "Expand sidebar").
    const sidebarToggle = page.locator('#sidebar button.trigger');
    const edges = () =>
      page.evaluate(() => {
        const box = (el: Element | null) => el?.getBoundingClientRect();
        const toolbar = box(document.querySelector('.wiki-table-toolbar'));
        const sidebar = box(
          document.querySelector('#sidebar .sidebar-container'),
        );
        const tree = box(document.querySelector('.navigation-tree-panel'));
        return {
          left: Math.round(toolbar?.left ?? -1),
          right: Math.round(toolbar?.right ?? -1),
          sidebarLeft: Math.round(sidebar?.left ?? window.innerWidth),
          treeRight: Math.round(tree?.right ?? 0),
          toolbarRight: Math.round(
            box(document.querySelector('#toolbar .toolbar'))?.right ?? 0,
          ),
        };
      });

    // Sidebar collapsed, toolbar opened: it ends before the collapsed tab.
    await sidebarToggle.click();
    await clickCell(page, editorTable(page, 0), 1, 1);
    await expect(toolbar).toBeVisible();
    await expect
      .poll(async () => {
        const e = await edges();
        return e.right <= e.sidebarLeft && e.left >= e.treeRight;
      })
      .toBe(true);

    // Sidebar expanded while the toolbar is open: it moves out of the way.
    await sidebarToggle.click();
    await expect
      .poll(async () => (await edges()).sidebarLeft)
      .toBeLessThan(1000);
    await expect
      .poll(async () => {
        const e = await edges();
        return e.right <= e.sidebarLeft && e.left >= e.treeRight;
      })
      .toBe(true);
    await expect(toolbar).toBeVisible();

    // Navigation tree collapsed, sidebar still open (the toolbar is wider
    // than the column, so it would spread to the left): the collapsed tab
    // and Volto's toolbar still count.
    await page.getByRole('button', { name: /Close navigation tree/ }).click();
    await expect.poll(async () => (await edges()).treeRight).toBeLessThan(200);
    await expect
      .poll(async () => {
        const e = await edges();
        return e.left >= Math.max(e.treeRight, e.toolbarRight);
      })
      .toBe(true);
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
    const withWidth = (width: string) =>
      value.map((node) =>
        node.type === 'table' ? { ...node, blockWidth: width } : node,
      );
    for (const width of ['medium', 'full']) {
      await patchContent(page, contentPath, {
        blocks: {
          [SOMERSAULT_KEY]: {
            '@type': SOMERSAULT_KEY,
            value: [
              { type: 'title', children: [{ text: 'Width diff' }] },
              ...withWidth(width),
            ],
          },
        },
        changeNote: width,
      });
    }
    // Version 1: Medium, a table-only step (class, no inline style); the
    // label names it.
    await page.goto(`${contentPath}/diff?one=0&two=1&view=unified`, {
      waitUntil: 'networkidle',
    });
    const medium = page
      .locator('.plate-diff-unified .plate-diff-block-update')
      .filter({
        has: page.locator('table'),
      });
    await expect(medium.last()).toContainText('Medium');
    await expect(medium.last().locator('.block-table').last()).toHaveClass(
      /slate-blockWidth-medium/,
    );
    // Version 2: Full width, one of the theme's steps (inline style).
    for (const view of ['unified', 'split']) {
      await page.goto(`${contentPath}/diff?one=1&two=2&view=${view}`, {
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

  test('pasted CSV with 7 columns is medium, with 8 wide, with 3 it stays in the reading column', async ({
    page,
  }) => {
    const { editor } = await openPage(page, 'paste', [paragraph('')]);
    await setSelection(page, editor, { path: [1, 0], offset: 0 });
    await pasteData(page, editor, { 'text/plain': csv(7) });
    await expect.poll(() => editorWidths(page)).toEqual(['medium']);

    // Further pastes into the empty paragraph below the last table.
    const lastParagraph = async () =>
      (await page.evaluate(
        (handle) => (handle as any).children.length,
        await editorHandleOf(page),
      )) - 1;
    await setSelection(page, editor, {
      path: [await lastParagraph(), 0],
      offset: 0,
    });
    await pasteData(page, editor, { 'text/plain': csv(8) });
    await expect.poll(() => editorWidths(page)).toEqual(['medium', 'layout']);
    await setSelection(page, editor, {
      path: [await lastParagraph(), 0],
      offset: 0,
    });
    await pasteData(page, editor, { 'text/plain': csv(3) });
    await expect
      .poll(() => editorWidths(page))
      .toEqual(['medium', 'layout', 'default']);
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

    // The width button of a nested table is shown, but disabled.
    await clickCell(page, editorTable(page, 0), 0, 0);
    await expect(page.getByRole('button', { name: /^Width: / })).toBeDisabled();

    // Into the callout: a callout holds text, not blocks, so the table lands
    // on the page between the two halves and gets its step like any other
    // paste.
    await setSelection(page, editor, { path: [3, 0], offset: 2 });
    await pasteData(page, editor, { 'text/plain': csv(7) });
    await expect.poll(() => editorWidths(page)).toEqual(['medium']);
    const types = (await getValue(page, handle)).map((node) => node.type);
    expect(types.slice(3, 6)).toEqual(['callout', 'table', 'callout']);
  });

  test('pasted HTML and markdown tables with 6 columns are medium, also after save', async ({
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
    await expect.poll(() => editorWidths(page)).toEqual(['medium']);

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
    await expect.poll(() => editorWidths(page)).toEqual(['medium', 'medium']);

    await savePage(page, contentPath);
    const stored = await getWikiValue(page, contentPath);
    expect(
      stored
        .filter((node) => node.type === 'table')
        .map((node) => node.blockWidth),
    ).toEqual(['medium', 'medium']);
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
