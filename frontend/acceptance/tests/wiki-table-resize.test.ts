/**
 * Resize handle of wiki tables: dragging the right edge of a top-level table
 * stores a custom width (`tableWidth`, px) or, when the drag ends on one of
 * the four step widths, that step (`blockWidth`). While a custom width is
 * set the width menu has no step checked; choosing a step removes it. The
 * custom width shows in the editor, the view and the history diff, and
 * like the steps it never exceeds the room (a phone shows the text column).
 *
 * A table wider than the text column starts at the text column's left
 * edge and grows to the right (#826), so the handle moves only the right
 * edge. The tests run at 2600 × 1000: in the editor the sidebar and the
 * navigation tree leave a room (from the text column to the content area's
 * right edge minus 10px) of about 1275px, so Medium has its own width
 * there and the editor tests stay below the room.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/824
 */
import type { Locator, Page } from '@playwright/test';

import type { EditorNode } from '../fixtures/editor';
import { openInEditor, openInView } from '../fixtures/pages';
import {
  cellOf,
  chooseWidth,
  clickCell,
  clickToolbar,
  dragTableWidth,
  editorTable,
  resizeHandle,
  resizeHandleX,
  savePage,
  tableFrameOf,
  viewTable,
  widthTrigger,
} from '../fixtures/table';
import { editorHandleOf, getTables } from '../fixtures/table-editor';
import {
  createWikiPageWithValue,
  getWikiValue,
  patchContent,
  SOMERSAULT_KEY,
} from '../fixtures/wiki-pages';
import { login } from './login';
import { expect, test } from './test';

test.describe.configure({ timeout: 60_000 });

const paragraph = (text: string): EditorNode => ({
  type: 'p',
  children: [{ text }],
});

/** A table with a header row and two body rows of `cols` columns. */
const table = (cols: number, props: Record<string, unknown> = {}) => {
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
    children: [row('th', 0), row('td', 1), row('td', 2)],
    ...props,
  } as EditorNode;
};

async function openPage(page: Page, id: string, value: EditorNode[]) {
  const { contentPath } = await createWikiPageWithValue(page, {
    contentId: id,
    title: `Resize ${id}`,
    value,
  });
  await openInEditor(page, contentPath);
  return { contentPath };
}

/** Rounded width of the frame (inner container) of a table. */
const frameWidth = async (tableLocator: Locator) =>
  Math.round((await tableFrameOf(tableLocator).boundingBox())!.width);

/** How far the scroll container around a table scrolls. */
const overflowOf = (tableLocator: Locator) =>
  tableLocator
    .locator('xpath=ancestor::div[contains(@class, "overflow-x-auto")][1]')
    .evaluate((el) => el.scrollWidth - el.clientWidth);

/** Left edge of the text column: the frame of the paragraph `text` (editor). */
async function textColumnX(page: Page, text: string) {
  const box = await page
    .locator('[contenteditable="true"] .block-inner-container')
    .filter({ hasText: text })
    .last()
    .boundingBox();
  return Math.round(box!.x);
}

/** Checked state of the width menu's four steps; closes the menu again. */
async function checkedSteps(page: Page) {
  await widthTrigger(page).click();
  const items = page.getByRole('menuitemradio');
  await expect(items).toHaveCount(4);
  const checked = await items.evaluateAll((els) =>
    els.map((el) => el.getAttribute('aria-checked') === 'true'),
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  return checked;
}

/** `blockWidth` and `tableWidth` of the first top-level table. */
async function storedWidth(page: Page) {
  const [node] = await getTables(page);
  return { blockWidth: node?.blockWidth, tableWidth: node?.tableWidth };
}

test.describe('Wiki tables: resize handle', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 2600, height: 1000 });
    await login(page);
  });

  test('a drag to a free width stores it; the view and the editor show it', async ({
    page,
  }) => {
    const { contentPath } = await openPage(page, 'free', [
      paragraph('Text before the table.'),
      table(4),
    ]);
    const editor = editorTable(page, 0);
    await expect(resizeHandle(editor)).toHaveCount(1);
    await expect(resizeHandle(editor)).toHaveAttribute(
      'aria-label',
      'Resize table',
    );
    expect(await frameWidth(editor)).toBe(780);

    const pointerX = await dragTableWidth(page, editor, 960, {
      beforeRelease: async () => {
        // Live preview: the label and the frame follow the mouse.
        await expect(page.locator('.wiki-table-resize-label')).toHaveText(
          '960px',
        );
        await expect.poll(() => frameWidth(editor)).toBe(960);
      },
    });
    await expect(page.locator('.wiki-table-resize-label')).toHaveCount(0);
    // The handle stayed under the pointer, the frame's left edge stayed at
    // the text column (#826).
    expect(Math.abs((await resizeHandleX(editor)) - pointerX)).toBeLessThan(3);
    expect(Math.round((await tableFrameOf(editor).boundingBox())!.x)).toBe(
      await textColumnX(page, 'Text before the table.'),
    );
    await expect
      .poll(() => storedWidth(page))
      .toEqual({ blockWidth: 'default', tableWidth: 960 });
    expect(await frameWidth(editor)).toBe(960);

    // The menu: no step checked, the trigger names the width.
    await clickCell(page, editor, 1, 1);
    await expect(widthTrigger(page)).toHaveAccessibleName('Width: 960px');
    expect(await checkedSteps(page)).toEqual([false, false, false, false]);

    await savePage(page, contentPath);
    const stored = await getWikiValue(page, contentPath);
    expect(stored.find((node) => node.type === 'table')).toMatchObject({
      blockWidth: 'default',
      tableWidth: 960,
    });
    await expect.poll(() => frameWidth(viewTable(page, 0))).toBe(960);
    // The view has no handle.
    await expect(page.locator('.wiki-table-resize-handle')).toHaveCount(0);

    await openInEditor(page, contentPath);
    await expect.poll(() => frameWidth(editorTable(page, 0))).toBe(960);
    await clickCell(page, editorTable(page, 0), 1, 1);
    await expect(widthTrigger(page)).toHaveAccessibleName('Width: 960px');
  });

  test('a drag that ends on a step stores the step', async ({ page }) => {
    await openPage(page, 'snap', [paragraph('Intro'), table(4)]);
    const editor = editorTable(page, 0);

    // 4px short of Medium: snaps, the label names the step.
    await dragTableWidth(page, editor, 1036, {
      beforeRelease: async () => {
        await expect(page.locator('.wiki-table-resize-label')).toHaveText(
          'Medium',
        );
      },
    });
    await expect
      .poll(() => storedWidth(page))
      .toEqual({ blockWidth: 'medium', tableWidth: undefined });
    expect(await frameWidth(editor)).toBe(1040);
    await clickCell(page, editor, 1, 1);
    await expect(widthTrigger(page)).toHaveAccessibleName('Width: Medium');
    expect(await checkedSteps(page)).toEqual([false, true, false, false]);

    // Past the room: Full width.
    await dragTableWidth(page, editor, 2400);
    await expect
      .poll(() => storedWidth(page))
      .toEqual({ blockWidth: 'full', tableWidth: undefined });
  });

  test('choosing a step removes the custom width', async ({ page }) => {
    await openPage(page, 'step', [
      paragraph('Intro'),
      table(4, { blockWidth: 'medium', tableWidth: 960 }),
    ]);
    const editor = editorTable(page, 0);
    await expect.poll(() => frameWidth(editor)).toBe(960);
    await clickCell(page, editor, 1, 1);
    await expect(widthTrigger(page)).toHaveAccessibleName('Width: 960px');

    // The step the table had before is a choice like any other.
    await chooseWidth(page, 'Medium');
    await expect
      .poll(() => storedWidth(page))
      .toEqual({ blockWidth: 'medium', tableWidth: undefined });
    await expect.poll(() => frameWidth(editor)).toBe(1040);
    await expect(widthTrigger(page)).toHaveAccessibleName('Width: Medium');

    // Undo brings the custom width back in one step.
    await page.keyboard.press('ControlOrMeta+z');
    await expect
      .poll(() => storedWidth(page))
      .toEqual({ blockWidth: 'medium', tableWidth: 960 });

    await clickCell(page, editor, 1, 1);
    await chooseWidth(page, 'Wide');
    await expect
      .poll(() => storedWidth(page))
      .toEqual({ blockWidth: 'layout', tableWidth: undefined });
    // Wide is wider than the editor's room.
    await expect.poll(() => frameWidth(editor)).toBeGreaterThan(1040);
  });

  test('a narrower step from the menu fits the column widths, like a drag', async ({
    page,
  }) => {
    await openPage(page, 'step-columns', [
      paragraph('Intro'),
      table(4, { blockWidth: 'full', colSizes: [400, 400, 400, 400] }),
    ]);
    const editor = editorTable(page, 0);
    // 1600px of columns scroll in the Full width frame (about 1275px).
    await expect.poll(() => overflowOf(editor)).toBeGreaterThan(100);
    await clickCell(page, editor, 1, 1);
    await chooseWidth(page, 'Text width');
    await expect
      .poll(async () => (await getTables(page))[0]?.colSizes)
      .toEqual([195, 195, 195, 195]);
    await expect.poll(() => frameWidth(editor)).toBe(780);
    await expect.poll(() => overflowOf(editor)).toBe(0);
  });

  test('a table wider than the editor stays as it is on a tiny drag; a shrink stores a width', async ({
    page,
  }) => {
    await openPage(page, 'clamped', [
      paragraph('Intro'),
      table(4, { blockWidth: 'medium', tableWidth: 1400 }),
    ]);
    const editor = editorTable(page, 0);
    // The editor's room (sidebar and navigation tree open) is narrower than
    // 1400px: the frame is clamped to it.
    const room = await frameWidth(editor);
    expect(room).toBeLessThan(1400);
    const undos = async () =>
      page.evaluate(
        (handle) => (handle as any).history.undos.length as number,
        await editorHandleOf(page),
      );
    const before = await undos();

    // 4px to the right: still the room, nothing is written, and the label
    // says so: it shows the stored width, not "Full width".
    await dragTableWidth(page, editor, room + 4, {
      beforeRelease: async () => {
        await expect(page.locator('.wiki-table-resize-label')).toHaveText(
          '1400px',
        );
      },
    });
    expect(await storedWidth(page)).toEqual({
      blockWidth: 'medium',
      tableWidth: 1400,
    });
    expect(await undos()).toBe(before);
    expect(await frameWidth(editor)).toBe(room);

    // 200px to the left: a real shrink, stored as a custom width.
    await dragTableWidth(page, editor, room - 200);
    await expect
      .poll(async () => (await storedWidth(page)).tableWidth)
      .toBe(room - 200);
    expect(await undos()).toBe(before + 1);
  });

  test('column widths that fit are kept; a step afterwards does not scroll', async ({
    page,
  }) => {
    await openPage(page, 'columns-fit', [
      paragraph('Intro'),
      table(4, { colSizes: [0, 0, 0, 0] }),
    ]);
    const editor = editorTable(page, 0);
    await dragTableWidth(page, editor, 1036);
    await expect
      .poll(() => storedWidth(page))
      .toEqual({ blockWidth: 'medium', tableWidth: undefined });
    expect((await getTables(page))[0]?.colSizes).toEqual([0, 0, 0, 0]);

    await clickCell(page, editor, 1, 1);
    await chooseWidth(page, 'Text width');
    await expect.poll(() => frameWidth(editor)).toBe(780);
    await expect.poll(() => overflowOf(editor)).toBe(0);
  });

  test('column widths that no longer fit scale down with the table', async ({
    page,
  }) => {
    const { contentPath } = await openPage(page, 'columns', [
      paragraph('Intro'),
      table(3, { tableWidth: 960, colSizes: [240, 320, 400] }),
    ]);
    const editor = editorTable(page, 0);
    await expect.poll(() => frameWidth(editor)).toBe(960);
    await dragTableWidth(page, editor, 900);
    await expect
      .poll(async () => (await getTables(page))[0]?.colSizes)
      .toEqual([225, 300, 375]);
    expect((await storedWidth(page)).tableWidth).toBe(900);
    // The columns fill the frame; nothing scrolls.
    await expect.poll(() => overflowOf(editor)).toBe(0);

    await savePage(page, contentPath);
    const view = viewTable(page, 0);
    await expect.poll(() => frameWidth(view)).toBe(900);
    const widths = await view
      .locator('tr')
      .first()
      .locator('th')
      .evaluateAll((cells) =>
        cells.map((cell) => Math.round(cell.getBoundingClientRect().width)),
      );
    expect(widths).toEqual([225, 300, 375]);
  });

  test('on a phone a custom width takes the text column and scrolls inside its frame', async ({
    page,
  }) => {
    const { contentPath } = await createWikiPageWithValue(page, {
      contentId: 'phone',
      title: 'Resize phone',
      value: [
        paragraph('Text before the table.'),
        table(6, { tableWidth: 1180 }),
      ],
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await openInView(page, contentPath);
    const view = viewTable(page, 0);
    await expect(view).toBeVisible();
    const paragraphWidth = Math.round(
      (await page
        .locator('main [data-slate-type="p"] .block-inner-container')
        .filter({ hasText: 'Text before the table.' })
        .boundingBox())!.width,
    );
    expect(await frameWidth(view)).toBe(paragraphWidth);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    const scroller = view.locator(
      'xpath=ancestor::div[contains(@class, "overflow-x-auto")][1]',
    );
    expect(
      await scroller.evaluate((el) => el.scrollWidth - el.clientWidth),
    ).toBeGreaterThan(100);

    // In print the table shrinks to the page like the steps.
    await page.setViewportSize({ width: 1920, height: 1000 });
    await page.emulateMedia({ media: 'print' });
    await expect
      .poll(() => scroller.evaluate((el) => el.scrollWidth - el.clientWidth))
      .toBe(0);
  });

  test('the history diff names the custom width', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const value = [paragraph('Text before the table.'), table(4)];
    const { contentPath } = await createWikiPageWithValue(page, {
      contentId: 'diff',
      title: 'Resize diff',
      value: value.map((node) =>
        node.type === 'table' ? { ...node, blockWidth: 'medium' } : node,
      ),
    });
    const versions: Record<string, unknown>[] = [
      { blockWidth: 'medium', tableWidth: 1180 },
      { blockWidth: 'layout' },
    ];
    for (const props of versions) {
      await patchContent(page, contentPath, {
        blocks: {
          [SOMERSAULT_KEY]: {
            '@type': SOMERSAULT_KEY,
            value: [
              { type: 'title', children: [{ text: 'Resize diff' }] },
              ...value.map((node) =>
                node.type === 'table' ? { ...node, ...props } : node,
              ),
            ],
          },
        },
        changeNote: JSON.stringify(props),
      });
    }
    const changedTable = () =>
      page
        .locator('.plate-diff-unified .plate-diff-block-update')
        .filter({ has: page.locator('table') })
        .last();

    await page.goto(`${contentPath}/diff?one=0&two=1&view=unified`);
    await expect(changedTable().locator('.plate-diff-summary')).toHaveText(
      '· Width: Medium → 1180px',
    );
    // The diff renders the newer version's custom width.
    await expect(changedTable().locator('.block-table').last()).toHaveClass(
      /wiki-table-custom-width/,
    );
    await expect(changedTable().locator('.block-table').last()).toHaveAttribute(
      'style',
      /--wiki-table-width: 1180px/,
    );
    // The table starts at the text column in the diff too, inside the
    // change wrapper (its border and padding are compensated).
    const textColumnX = (await page
      .locator(
        '.plate-diff-unified [data-slate-type="p"] .block-inner-container',
      )
      .filter({ hasText: 'Text before the table.' })
      .boundingBox())!.x;
    const tableFrameX = (await changedTable()
      .locator('.block-table > .block-inner-container')
      .last()
      .boundingBox())!.x;
    expect(Math.abs(tableFrameX - textColumnX)).toBeLessThanOrEqual(0.5);

    await page.goto(`${contentPath}/diff?one=1&two=2&view=unified`);
    await expect(changedTable().locator('.plate-diff-summary')).toHaveText(
      '· Width: 1180px → Wide',
    );
    await expect(changedTable().locator('.block-table').last()).not.toHaveClass(
      /wiki-table-custom-width/,
    );
    expect(errors).toEqual([]);
  });

  test('one handle on the right edge; a table in a column keeps the column handle', async ({
    page,
  }) => {
    await openPage(page, 'nested', [
      paragraph('Intro'),
      table(3),
      table(3, { blockWidth: 'full' }),
      {
        type: 'column_group',
        children: [
          { type: 'column', width: '50%', children: [table(2)] },
          { type: 'column', width: '50%', children: [paragraph('Right')] },
        ],
      } as EditorNode,
    ]);
    const top = editorTable(page, 0);
    const full = editorTable(page, 1);
    const nested = editorTable(page, 2);
    await expect(nested).toBeVisible();
    await expect(resizeHandle(top)).toHaveCount(1);
    await expect(resizeHandle(full)).toHaveCount(1);
    await expect(resizeHandle(nested)).toHaveCount(0);
    await expect(page.locator('.wiki-table-resize-handle')).toHaveCount(2);

    // Plate's column resize handle on the right edge of a column: not in
    // the last column of a top-level table (the table handle is there),
    // still in a nested table.
    const columnHandle = (tableLocator: Locator, col: number) =>
      cellOf(tableLocator, 0, col).locator('> .group > [data-col]');
    await expect(columnHandle(top, 1)).toHaveCount(1);
    await expect(columnHandle(top, 2)).toHaveCount(0);
    await expect(columnHandle(full, 2)).toHaveCount(0);
    await expect(columnHandle(nested, 1)).toHaveCount(1);

    // The table handle is centred on the frame's right edge, also at Full
    // width, and adds no scroll width (#783).
    for (const tableLocator of [top, full]) {
      const frame = (await tableFrameOf(tableLocator).boundingBox())!;
      expect(
        Math.abs((await resizeHandleX(tableLocator)) - (frame.x + frame.width)),
      ).toBeLessThan(1);
      await expect.poll(() => overflowOf(tableLocator)).toBe(0);
    }
    // At Full width the table starts at the text column and ends 10px
    // before the content area's right edge (#826); the handle is inside the
    // content area, not clipped.
    const block = (await full
      .locator('xpath=ancestor::div[contains(@class, "block-table")][1]')
      .boundingBox())!;
    const fullFrame = (await tableFrameOf(full).boundingBox())!;
    expect(Math.round(fullFrame.x)).toBe(await textColumnX(page, 'Intro'));
    expect(
      Math.round(block.x + block.width - (fullFrame.x + fullFrame.width)),
    ).toBe(10);
    const handle = (await resizeHandle(full).boundingBox())!;
    expect(handle.x + handle.width).toBeLessThanOrEqual(block.x + block.width);
  });

  test('the last column still takes a column dropped on its right edge', async ({
    page,
  }) => {
    await openPage(page, 'drop-last', [paragraph('Intro'), table(3)]);
    const editor = editorTable(page, 0);
    await cellOf(editor, 0, 0).hover();
    const grip = cellOf(editor, 0, 0).getByRole('button', {
      name: 'Drag to move the column',
    });
    // Right half of the last column, clear of the table's resize handle.
    await grip.dragTo(cellOf(editor, 0, 2), {
      sourcePosition: { x: 3, y: 3 },
      targetPosition: {
        x: (await cellOf(editor, 0, 2).boundingBox())!.width - 20,
        y: 10,
      },
    });
    await expect
      .poll(async () => {
        const [node] = await getTables(page);
        return node?.children?.[0]?.children?.map(
          (cell) => cell.children?.[0]?.children?.[0]?.text,
        );
      })
      .toEqual(['0/1', '0/2', '0/0']);
  });

  test('a column border follows the pointer, also after the table was widened', async ({
    page,
  }) => {
    await openPage(page, 'column-border', [
      paragraph('Intro'),
      table(4),
      table(4, { colSizes: [150, 200, 250, 180] }),
    ]);
    const undos = async () =>
      page.evaluate(
        (handle) => (handle as any).history.undos.length as number,
        await editorHandleOf(page),
      );
    const columnWidths = (tableLocator: Locator) =>
      tableLocator
        .locator('tr')
        .first()
        .locator('> th')
        .evaluateAll((cells) =>
          cells.map((cell) => cell.getBoundingClientRect().width),
        );
    /** Drags the border right of column 0 by `by` px; checks the result. */
    const dragBorder = async (tableLocator: Locator, by: number) => {
      const before = await columnWidths(tableLocator);
      const count = await undos();
      const handle = cellOf(tableLocator, 1, 0).locator(
        '> .group > [data-col="0"]',
      );
      const box = (await handle.boundingBox())!;
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      // The handle listens to the mouse once it knows the drag started.
      await expect(handle).toHaveAttribute('data-resizing', 'true');
      await page.mouse.move(x + by, y, { steps: 8 });
      await page.mouse.up();
      // The border between columns 0 and 1 ends under the pointer.
      await expect
        .poll(async () =>
          Math.abs(
            (await cellOf(tableLocator, 0, 1).boundingBox())!.x - (x + by),
          ),
        )
        .toBeLessThanOrEqual(2);
      const after = await columnWidths(tableLocator);
      expect(Math.abs(after[0] - (before[0] + by))).toBeLessThanOrEqual(2);
      expect(Math.abs(after[1] - (before[1] - by))).toBeLessThanOrEqual(2);
      // The other columns keep their widths.
      expect(Math.abs(after[2] - before[2])).toBeLessThanOrEqual(1);
      expect(Math.abs(after[3] - before[3])).toBeLessThanOrEqual(1);
      // One undo step per drag.
      expect(await undos()).toBe(count + 1);
    };

    // Without stored column widths (Plate stores 0): before, the column
    // jumped by about 70px on the first pixel.
    await dragBorder(editorTable(page, 0), 40);

    // Column widths that add up to the table, then the table is widened:
    // the stored widths are kept and the layout stretches them.
    const widened = editorTable(page, 1);
    await dragTableWidth(page, widened, 960);
    await expect
      .poll(async () => (await storedWidth(page)).tableWidth)
      .toBeUndefined();
    await expect
      .poll(async () => (await getTables(page))[1]?.tableWidth)
      .toBe(960);
    await dragBorder(widened, 40);
  });

  test('no handle where the content area is narrower than the text column', async ({
    page,
  }) => {
    // 1440 × 1000 with the sidebar and the navigation tree open: the
    // editor's content area is narrower than the 780px text column, every
    // width is the content area there.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openPage(page, 'narrow', [
      paragraph('Intro'),
      table(4, { blockWidth: 'medium' }),
      table(4, { blockWidth: 'full', tableWidth: 1300 }),
    ]);
    const editor = editorTable(page, 0);
    await expect(editor).toBeVisible();
    expect(await frameWidth(editor)).toBeLessThan(780);
    await editor.hover();
    await expect(page.locator('.wiki-table-resize-handle')).toHaveCount(0);
    const tables = await getTables(page);
    expect(tables.map((node) => [node.blockWidth, node.tableWidth])).toEqual([
      ['medium', undefined],
      ['full', 1300],
    ]);

    // Without the table handle the last column keeps Plate's handle on its
    // right edge (a one-column table could not be resized otherwise).
    const lastColumnHandle = cellOf(editor, 1, 3).locator(
      '> .group > [data-col]',
    );
    await expect(lastColumnHandle).toHaveCount(1);

    // A wider window brings the handle back, and takes the last column's.
    await page.setViewportSize({ width: 2600, height: 1000 });
    await expect(resizeHandle(editor)).toHaveCount(1);
    await expect(lastColumnHandle).toHaveCount(0);
  });

  test('a click on a column border writes nothing', async ({ page }) => {
    await openPage(page, 'border-click', [paragraph('Intro'), table(3)]);
    const editor = editorTable(page, 0);
    const handleOf = await editorHandleOf(page);
    const undos = () =>
      page.evaluate(
        (handle) => (handle as any).history.undos.length as number,
        handleOf,
      );
    const before = await undos();
    const border = cellOf(editor, 1, 0).locator('> .group > [data-col="0"]');
    const box = (await border.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect(border).toHaveAttribute('data-resizing', 'true');
    await page.mouse.up();
    await expect(border).not.toHaveAttribute('data-resizing', 'true');
    expect((await getTables(page))[0]?.colSizes).toBeUndefined();
    expect(await undos()).toBe(before);
  });

  test('no table indent: no left-edge handle, a stored marginLeft is ignored', async ({
    page,
  }) => {
    const { contentPath } = await openPage(page, 'indent', [
      paragraph('Text before the table.'),
      table(3, { marginLeft: 56 }),
    ]);
    const editor = editorTable(page, 0);
    await expect(editor).toBeVisible();
    await expect(editor.locator('[data-resizer-left]')).toHaveCount(0);
    expect(
      Math.abs(
        (await cellOf(editor, 1, 0).boundingBox())!.x -
          (await textColumnX(page, 'Text before the table.')),
      ),
    ).toBeLessThanOrEqual(1);

    await openInView(page, contentPath);
    const view = viewTable(page, 0);
    const text = await page
      .locator('main [data-slate-type="p"] .block-inner-container')
      .filter({ hasText: 'Text before the table.' })
      .boundingBox();
    const first = await view.locator('th').first().boundingBox();
    expect(Math.abs(first!.x - text!.x)).toBeLessThanOrEqual(1);
  });

  test('the right border of a merged cell follows the pointer', async ({
    page,
  }) => {
    const merged = table(4, { colSizes: [200, 200, 200, 180] });
    const row = merged.children![1];
    row.children = [
      { ...row.children![0], colSpan: 2 },
      ...row.children!.slice(2),
    ];
    await openPage(page, 'merged-border', [paragraph('Intro'), merged]);
    const editor = editorTable(page, 0);
    const undos = async () =>
      page.evaluate(
        (handle) => (handle as any).history.undos.length as number,
        await editorHandleOf(page),
      );
    const before = await undos();
    // The merged cell spans columns 0 and 1; its right handle is column 1's.
    const cell = cellOf(editor, 1, 0);
    const handle = cell.locator('> .group > [data-col="1"]');
    await cell.hover();
    const box = (await handle.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await expect(handle).toHaveAttribute('data-resizing', 'true');
    await page.mouse.move(x + 20, y, { steps: 8 });
    await page.mouse.up();
    // The span's last column grows by 20, the next one gives them.
    await expect
      .poll(async () => (await getTables(page))[0]?.colSizes)
      .toEqual([200, 220, 180, 180]);
    const cellBox = (await cell.boundingBox())!;
    expect(Math.abs(cellBox.x + cellBox.width - (x + 20))).toBeLessThanOrEqual(
      2,
    );
    expect(await undos()).toBe(before + 1);
  });

  test('an inserted column takes the width of its neighbour; the widths fit the frame', async ({
    page,
  }) => {
    await openPage(page, 'insert-column', [
      paragraph('Intro'),
      table(4, { colSizes: [195, 195, 195, 195] }),
      table(3),
    ]);
    const fitted = editorTable(page, 0);
    await clickCell(page, fitted, 1, 1);
    await clickToolbar(page, 'insertColumnAfter');
    await expect(fitted.locator('tr').first().locator('th')).toHaveCount(5);
    await expect
      .poll(async () => (await getTables(page))[0]?.colSizes)
      .toEqual([156, 156, 156, 156, 156]);
    expect(await frameWidth(fitted)).toBe(780);
    await expect.poll(() => overflowOf(fitted)).toBe(0);
    // One undo step: the column and the widths.
    await page.keyboard.press('ControlOrMeta+z');
    await expect(fitted.locator('tr').first().locator('th')).toHaveCount(4);
    expect((await getTables(page))[0]?.colSizes).toEqual([195, 195, 195, 195]);

    // A table whose columns were never resized keeps no widths.
    const plain = editorTable(page, 1);
    await clickCell(page, plain, 1, 1);
    await clickToolbar(page, 'insertColumnAfter');
    await expect(plain.locator('tr').first().locator('th')).toHaveCount(4);
    expect((await getTables(page))[1]?.colSizes).toBeUndefined();
    await expect.poll(() => overflowOf(plain)).toBe(0);
  });

  test('a table with a comment in a cell keeps its width and starts at the text column', async ({
    page,
  }) => {
    // A comment (or suggestion) mark in a cell: volto-plate's
    // DiscussionSlot wraps the table's inner container.
    const commented = (props: Record<string, unknown>) => {
      const node = table(3, props);
      node.children![1].children![1].children = [
        {
          type: 'p',
          children: [{ text: 'noted', comment_abc123: true, comment: true }],
        },
      ];
      return node;
    };
    const { contentPath } = await openPage(page, 'commented', [
      paragraph('Text before the table.'),
      commented({ tableWidth: 960 }),
      commented({ blockWidth: 'medium' }),
    ]);
    const custom = editorTable(page, 0);
    const medium = editorTable(page, 1);
    await expect(medium).toBeVisible();
    const textX = await textColumnX(page, 'Text before the table.');
    for (const [tableLocator, width] of [
      [custom, 960],
      [medium, 1040],
    ] as const) {
      const frame = (await tableFrameOf(tableLocator).boundingBox())!;
      expect([Math.round(frame.x), Math.round(frame.width)]).toEqual([
        textX,
        width,
      ]);
    }
    // The drag preview and the stored width hold with the wrappers too.
    await dragTableWidth(page, custom, 1000, {
      beforeRelease: async () => {
        await expect.poll(() => frameWidth(custom)).toBe(1000);
      },
    });
    await expect
      .poll(async () => (await getTables(page))[0]?.tableWidth)
      .toBe(1000);

    await savePage(page, contentPath);
    const text = (await page
      .locator('main [data-slate-type="p"] .block-inner-container')
      .filter({ hasText: 'Text before the table.' })
      .boundingBox())!;
    for (const [index, width] of [
      [0, 1000],
      [1, 1040],
    ] as const) {
      const frame = (await tableFrameOf(viewTable(page, index)).boundingBox())!;
      expect([Math.round(frame.x), Math.round(frame.width)]).toEqual([
        Math.round(text.x),
        width,
      ]);
    }
  });

  test('a drag ends when the handle goes away (the window became narrow)', async ({
    page,
  }) => {
    await openPage(page, 'unmount', [paragraph('Intro'), table(4)]);
    const editor = editorTable(page, 0);
    const handle = resizeHandle(editor);
    await editor.hover();
    const box = (await handle.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + Math.min(box.height / 2, 40);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await expect(handle).toHaveAttribute('data-resizing', 'true');
    await page.mouse.move(x + 196, y, { steps: 8 });
    await expect.poll(() => frameWidth(editor)).toBe(976);
    // Narrower than the text column: the handle goes away mid-drag.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(handle).toHaveCount(0);
    await page.mouse.up();
    await page.setViewportSize({ width: 2600, height: 1000 });
    await expect(handle).toHaveCount(1);
    const block = editor.locator(
      'xpath=ancestor::div[contains(@class, "block-table")][1]',
    );
    await expect(block).not.toHaveClass(/wiki-table-custom-width/);
    await expect.poll(() => frameWidth(editor)).toBe(780);
    expect(await storedWidth(page)).toEqual({
      blockWidth: 'default',
      tableWidth: undefined,
    });
  });
});
