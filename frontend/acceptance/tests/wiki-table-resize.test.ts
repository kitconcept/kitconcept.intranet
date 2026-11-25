/**
 * Width handles of wiki tables. The table's handle (the outer right edge)
 * stores a custom width (`tableWidth`, px) or, when the drag ends on one of
 * the four step widths, that step (`blockWidth`). While a custom width is
 * set the width menu has no step checked; choosing a step removes it. The
 * custom width shows in the editor, the view and the history diff.
 *
 * The width model of #836 (research ticket #828): a border between two
 * columns shares the width with its neighbour; the last column's edge (the
 * inner right edge) resizes that column; past the room the table grows by
 * speed zones; a custom width is the sum of the columns and may be wider
 * than the room, the table then scrolls into the area left of the text
 * column; a table can be centred.
 *
 * A table wider than the text column starts at the text column's left
 * edge and grows to the right (#826), so the handles move only the right
 * edge. The tests run at 2600 × 1000: in the editor the sidebar and the
 * navigation tree leave a room (from the text column to the content area's
 * right edge minus 32px) of about 1250px, so Medium has its own width
 * there and the editor tests stay below the room unless they go past it.
 *
 * Tickets: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/824
 *          https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/836
 */
import type { Locator, Page } from '@playwright/test';

import type { EditorNode } from '../fixtures/editor';
import { openInEditor, openInView } from '../fixtures/pages';
import {
  cellOf,
  chooseWidth,
  clickCell,
  clickToolbar,
  columnBorder,
  columnEdge,
  dragHandleBy,
  dragTableWidth,
  editorTable,
  resizeHandle,
  resizeHandleX,
  savePage,
  tableFrameOf,
  toolbarButton,
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

/** The space left and right of a table's frame in its block. */
async function marginsOf(tableLocator: Locator) {
  const block = (await tableLocator
    .locator(
      'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " block-table ")][1]',
    )
    .boundingBox())!;
  const frame = (await tableFrameOf(tableLocator).boundingBox())!;
  return [
    frame.x - block.x,
    block.x + block.width - frame.x - frame.width,
  ] as const;
}

/** How far the scroll container around a table is scrolled. */
const scrollLeftOf = (tableLocator: Locator) =>
  tableLocator
    .locator('xpath=ancestor::div[contains(@class, "overflow-x-auto")][1]')
    .evaluate((el) => el.scrollLeft);

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
    // All columns scaled with the table (#836); they add up to its width.
    expect((await getTables(page))[0]?.colSizes).toEqual([240, 240, 240, 240]);

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
          'Medium (1040px)',
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

    // Just short of the room, inside the frame: the room is Wide here
    // (Wide, 1440px, is wider than the editor's room), and as in the #828
    // mockup the narrower step is the one stored.
    const block = (await editor
      .locator(
        'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " block-table ")][1]',
      )
      .boundingBox())!;
    const frame = (await tableFrameOf(editor).boundingBox())!;
    const room = block.x + block.width - 32 - frame.x;
    await dragTableWidth(page, editor, room - 6, {
      beforeRelease: async () => {
        await expect(page.locator('.wiki-table-resize-label')).toHaveText(
          /^Wide \(\d+px\)$/,
        );
      },
    });
    await expect
      .poll(() => storedWidth(page))
      .toEqual({ blockWidth: 'layout', tableWidth: undefined });
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
    // 1600px of stored columns on Full width: scaled to the frame (#836),
    // nothing scrolls.
    await expect.poll(() => overflowOf(editor)).toBe(0);
    await clickCell(page, editor, 1, 1);
    await chooseWidth(page, 'Text width');
    await expect
      .poll(async () => (await getTables(page))[0]?.colSizes)
      .toEqual([195, 195, 195, 195]);
    await expect.poll(() => frameWidth(editor)).toBe(780);
    await expect.poll(() => overflowOf(editor)).toBe(0);
  });

  test('a table wider than the room starts in speed mode: a small move changes nothing, a pull inside shrinks it', async ({
    page,
  }) => {
    await openPage(page, 'overflowing', [
      paragraph('Intro'),
      table(3, { tableWidth: 1800, colSizes: [600, 600, 600] }),
    ]);
    const editor = editorTable(page, 0);
    await expect(editor).toBeVisible();
    // The custom width is not clamped to the room any more: it scrolls.
    await expect.poll(() => overflowOf(editor)).toBeGreaterThan(400);
    const undos = async () =>
      page.evaluate(
        (handle) => (handle as any).history.undos.length as number,
        await editorHandleOf(page),
      );
    const before = await undos();

    // 10px to the left of the handle: in the dead band of the speed zones,
    // the edge does not jump to the pointer, nothing is written.
    await dragHandleBy(page, resizeHandle(editor), -10);
    expect(await storedWidth(page)).toEqual({
      blockWidth: 'default',
      tableWidth: 1800,
    });
    expect(await undos()).toBe(before);

    // 100px inside the frame's edge, held: the table shrinks by itself.
    await dragHandleBy(page, resizeHandle(editor), -100, {
      beforeRelease: async () => {
        await expect
          .poll(async () =>
            Number.parseInt(
              (await page.locator('.wiki-table-resize-label').textContent()) ??
                '',
              10,
            ),
          )
          .toBeLessThan(1700);
        await expect(page.locator('.wiki-table-resize-label')).toHaveText(
          /‹‹$/,
        );
      },
    });
    await expect
      .poll(async () => (await storedWidth(page)).tableWidth)
      .toBeLessThan(1700);
    expect(await undos()).toBe(before + 1);
    // The columns scale with it and add up to the width.
    const [node] = await getTables(page);
    expect(
      (node.colSizes as number[]).reduce((sum, size) => sum + size, 0),
    ).toBe(node.tableWidth);
  });

  test('a table clamped to the room stays as it is on a tiny drag; a shrink stores a width', async ({
    page,
  }) => {
    await openPage(page, 'clamped', [
      paragraph('Intro'),
      table(4, { blockWidth: 'layout' }),
    ]);
    const editor = editorTable(page, 0);
    // Wide is wider than the editor's room: the table is clamped to it.
    const room = await frameWidth(editor);
    expect(room).toBeLessThan(1440);
    const undos = async () =>
      page.evaluate(
        (handle) => (handle as any).history.undos.length as number,
        await editorHandleOf(page),
      );
    const before = await undos();

    // 3px to the left snaps to the room: releasing stores nothing, and the
    // label says so (the table's step, not "Full width").
    await dragHandleBy(page, resizeHandle(editor), -3, {
      beforeRelease: async () => {
        await expect(page.locator('.wiki-table-resize-label')).toHaveText(
          /^Wide \(\d+px\)$/,
        );
      },
    });
    expect(await storedWidth(page)).toEqual({
      blockWidth: 'layout',
      tableWidth: undefined,
    });
    expect(await undos()).toBe(before);
    expect(await frameWidth(editor)).toBe(room);

    // 200px to the left: a real shrink, stored as a custom width.
    await dragHandleBy(page, resizeHandle(editor), -200);
    await expect
      .poll(async () => (await storedWidth(page)).tableWidth)
      .toBeGreaterThan(room - 205);
    expect((await storedWidth(page)).tableWidth).toBeLessThan(room - 195);
    expect(await undos()).toBe(before + 1);
  });

  test('a drag stores the columns as displayed; a step afterwards does not scroll', async ({
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
    // The drag stored the columns as displayed, scaled to the step (#836).
    expect((await getTables(page))[0]?.colSizes).toEqual([260, 260, 260, 260]);

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

  test('the history diff names the custom width and the alignment', async ({
    page,
  }) => {
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
      { blockWidth: 'layout', tableAlign: 'center' },
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
    // (The diff's room is narrower than 1180px: the table scrolls in a
    // frame that reaches into the area left of the text column, #836; the
    // table itself starts at the text column.)
    const tableX = (await changedTable().locator('table').last().boundingBox())!
      .x;
    expect(Math.abs(tableX - textColumnX)).toBeLessThanOrEqual(0.5);

    await page.goto(`${contentPath}/diff?one=1&two=2&view=unified`);
    await expect(changedTable().locator('.plate-diff-summary')).toHaveText(
      '· Width: 1180px → Wide',
    );
    await expect(changedTable().locator('.block-table').last()).not.toHaveClass(
      /wiki-table-custom-width/,
    );

    // The alignment (#836).
    await page.goto(`${contentPath}/diff?one=2&two=3&view=unified`);
    await expect(changedTable().locator('.plate-diff-summary')).toHaveText(
      '· Alignment: Left → Centred',
    );
    await expect(changedTable().locator('.block-table').last()).toHaveClass(
      /wiki-table-centered/,
    );
    // Centred in the diff, too.
    const [diffLeft, diffRight] = await marginsOf(
      changedTable().locator('table').last(),
    );
    expect(Math.abs(diffLeft - diffRight)).toBeLessThanOrEqual(2);
    expect(errors).toEqual([]);
  });

  test('two edges on the right; a table in a column keeps the column handle', async ({
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

    // The double edge (#836): the last column's edge ends at the frame's
    // right edge, the table's handle is 2 to 16px right of it (its bar at
    // 10px), also at Full width; they add no scroll width (#783).
    for (const tableLocator of [top, full]) {
      const frame = (await tableFrameOf(tableLocator).boundingBox())!;
      const right = frame.x + frame.width;
      const edge = (await columnEdge(tableLocator).boundingBox())!;
      expect(Math.abs(edge.x + edge.width - right)).toBeLessThan(1);
      expect(Math.round((await resizeHandleX(tableLocator)) - right)).toBe(9);
      // Its bar: 10px right of the frame's edge.
      const barX = await resizeHandle(tableLocator).evaluate(
        (el) =>
          el.getBoundingClientRect().left +
          Number.parseFloat(getComputedStyle(el, '::after').left),
      );
      expect(Math.round(barX - right)).toBe(10);
      await expect.poll(() => overflowOf(tableLocator)).toBe(0);
    }
    await expect(columnEdge(nested)).toHaveCount(0);
    // Hovered, the last column's edge highlights the row under the
    // pointer, like a border between two columns its cell.
    const row = (await cellOf(top, 1, 2).boundingBox())!;
    const edgeBox = (await columnEdge(top).boundingBox())!;
    await page.mouse.move(edgeBox.x + 4, row.y + row.height / 2);
    await expect
      .poll(() =>
        columnEdge(top).evaluate((el) => {
          const line = getComputedStyle(el, '::after');
          return [
            line.backgroundColor,
            Math.round(Number.parseFloat(line.height)),
          ];
        }),
      )
      .toEqual(['rgb(0, 126, 177)', Math.round(row.height)]);
    // Labelled for assistive technology (no hover labels).
    await expect(columnEdge(top)).toHaveAttribute(
      'aria-label',
      'Resize the last column',
    );
    await expect(columnEdge(top)).not.toHaveAttribute('data-label');
    await expect(resizeHandle(top)).not.toHaveAttribute('data-label');
    // At Full width the table starts at the text column and ends 32px
    // before the content area's right edge in the editor (#826, #836); the
    // handle is inside the content area, not clipped.
    const block = (await full
      .locator(
        'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " block-table ")][1]',
      )
      .boundingBox())!;
    const fullFrame = (await tableFrameOf(full).boundingBox())!;
    expect(Math.round(fullFrame.x)).toBe(await textColumnX(page, 'Intro'));
    expect(
      Math.round(block.x + block.width - (fullFrame.x + fullFrame.width)),
    ).toBe(32);
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
      'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " block-table ")][1]',
    );
    await expect(block).not.toHaveClass(/wiki-table-custom-width/);
    await expect.poll(() => frameWidth(editor)).toBe(780);
    expect(await storedWidth(page)).toEqual({
      blockWidth: 'default',
      tableWidth: undefined,
    });
  });

  test('a border between two columns shares their width; the table grows only once the neighbour is at its minimum', async ({
    page,
  }) => {
    await openPage(page, 'border-share', [paragraph('Intro'), table(3)]);
    const editor = editorTable(page, 0);
    await expect(editor).toBeVisible();
    const columns = async () => (await getTables(page))[0]?.colSizes;

    // 60px into the neighbour: the two share, the table stays a step.
    await dragHandleBy(page, columnBorder(editor, 0), 60, {
      beforeRelease: async () => {
        await expect(page.locator('.wiki-table-resize-label')).toHaveText(
          '320px | 200px',
        );
      },
    });
    await expect.poll(columns).toEqual([320, 200, 260]);
    expect(await storedWidth(page)).toEqual({
      blockWidth: 'default',
      tableWidth: undefined,
    });
    expect(await frameWidth(editor)).toBe(780);

    // 140px further: the neighbour stops at 120px, the table grows by 60px.
    await dragHandleBy(page, columnBorder(editor, 0), 140, {
      beforeRelease: async () => {
        await expect(page.locator('.wiki-table-resize-label')).toHaveText(
          '460px | 120px · Table 840px',
        );
      },
    });
    await expect.poll(columns).toEqual([460, 120, 260]);
    expect((await storedWidth(page)).tableWidth).toBe(840);
    await expect.poll(() => frameWidth(editor)).toBe(840);

    // Back: the neighbour takes the width, the table does not shrink.
    await dragHandleBy(page, columnBorder(editor, 0), -300);
    await expect.poll(columns).toEqual([160, 420, 260]);
    expect((await storedWidth(page)).tableWidth).toBe(840);

    // Past the dragged column's minimum the columns to its left give way.
    await dragHandleBy(page, columnBorder(editor, 1), -400);
    await expect.poll(columns).toEqual([120, 120, 600]);
    expect((await storedWidth(page)).tableWidth).toBe(840);
    await expect.poll(() => frameWidth(editor)).toBe(840);
  });

  test("the last column's edge resizes that column, the table follows, down to the text width", async ({
    page,
  }) => {
    await openPage(page, 'last-column', [
      paragraph('Intro'),
      table(3, { tableWidth: 960, colSizes: [300, 300, 360] }),
      table(3, { tableWidth: 1100, colSizes: [400, 400, 300] }),
    ]);
    const first = editorTable(page, 0);
    const second = editorTable(page, 1);
    await expect(second).toBeVisible();
    const tableAt = async (index: number) => {
      const node = (await getTables(page))[index];
      return {
        blockWidth: node?.blockWidth,
        tableWidth: node?.tableWidth,
        colSizes: node?.colSizes,
      };
    };

    // 50px wider: only the last column, the table follows.
    await dragHandleBy(page, columnEdge(first), 50, {
      beforeRelease: async () => {
        await expect(page.locator('.wiki-table-resize-label')).toHaveText(
          '410px · Table 1010px',
        );
      },
    });
    await expect
      .poll(() => tableAt(0))
      .toEqual({
        blockWidth: 'default',
        tableWidth: 1010,
        colSizes: [300, 300, 410],
      });
    await expect.poll(() => frameWidth(first)).toBe(1010);

    // Ending exactly on Medium stores the step, not 1040px.
    await dragHandleBy(page, columnEdge(first), 30);
    await expect
      .poll(() => tableAt(0))
      .toEqual({
        blockWidth: 'medium',
        tableWidth: undefined,
        colSizes: [300, 300, 440],
      });

    // Far to the left: the last column shrinks down to the text width.
    await dragHandleBy(page, columnEdge(first), -500);
    await expect
      .poll(() => tableAt(0))
      .toEqual({
        blockWidth: 'default',
        tableWidth: undefined,
        colSizes: [300, 300, 180],
      });

    // Past the last column's minimum the columns to its left give way.
    await dragHandleBy(page, columnEdge(second), -250);
    await expect
      .poll(() => tableAt(1))
      .toEqual({
        blockWidth: 'default',
        tableWidth: 850,
        colSizes: [400, 330, 120],
      });
  });

  test('held past the frame’s edge the table keeps growing by the speed zones and snaps back to the pointer inside', async ({
    page,
  }) => {
    await openPage(page, 'speed', [paragraph('Intro'), table(3)]);
    const editor = editorTable(page, 0);
    await expect(editor).toBeVisible();
    const block = (await editor
      .locator(
        'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " block-table ")][1]',
      )
      .boundingBox())!;
    // The frame's right edge at the room; the room from the text column.
    const roomEdge = Math.round(block.x + block.width - 32);
    const room = roomEdge - (await tableFrameOf(editor).boundingBox())!.x;
    const label = page.locator('.wiki-table-resize-label');
    const labelWidth = async () =>
      Number.parseInt(
        ((await label.textContent()) ?? '').replace(/^.*Table /, ''),
        10,
      );
    const handle = columnEdge(editor);
    await handle.hover();
    const box = (await handle.boundingBox())!;
    const y = Math.round(box.y + 20);
    await page.mouse.move(Math.round(box.x + 4), y);
    await page.mouse.down();
    await expect(handle).toHaveAttribute('data-resizing', 'true');
    // 40px past the room's edge, then held still: it keeps growing fast.
    await page.mouse.move(roomEdge + 40, y, { steps: 10 });
    // No zones are drawn; the label's arrows show the speed.
    await expect(label).toHaveText(/››$/);
    await expect(page.locator('.wiki-table-zones')).toHaveCount(0);
    await expect.poll(labelWidth).toBeGreaterThan(room + 200);
    // The frame scrolls to the growing edge; the page never scrolls
    // sideways.
    await expect.poll(() => scrollLeftOf(editor)).toBeGreaterThan(100);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    // 300px back inside: the edge snaps to the pointer.
    await page.mouse.move(roomEdge - 300, y, { steps: 4 });
    await expect.poll(labelWidth).toBeLessThan(room);
    await page.mouse.up();
    await expect(handle).not.toHaveAttribute('data-resizing', 'true');
    const stored = (await storedWidth(page)).tableWidth as number;
    expect(Math.abs(stored - (room - 300))).toBeLessThanOrEqual(6);
  });

  test('a table wider than the room scrolls into the area left of the text column, in the editor and the view', async ({
    page,
  }) => {
    const { contentPath } = await openPage(page, 'left-area', [
      paragraph('Text before the table.'),
      table(3, { tableWidth: 1800, colSizes: [600, 600, 600] }),
    ]);
    const editor = editorTable(page, 0);
    await expect(editor).toBeVisible();
    const textX = await textColumnX(page, 'Text before the table.');
    const blockOf = (tableLocator: Locator) =>
      tableLocator.locator(
        'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " block-table ")][1]',
      );
    const check = async (tableLocator: Locator, margin: number, x: number) => {
      const block = (await blockOf(tableLocator).boundingBox())!;
      const frame = (await tableFrameOf(tableLocator).boundingBox())!;
      // The frame reaches from the left margin to the right margin.
      expect(Math.round(frame.x - block.x)).toBe(margin);
      expect(Math.round(block.x + block.width - frame.x - frame.width)).toBe(
        margin,
      );
      // The table starts at the text column until it is scrolled.
      expect(
        Math.abs((await cellOf(tableLocator, 0, 0).boundingBox())!.x - x),
      ).toBeLessThanOrEqual(1);
      await tableLocator
        .locator('xpath=ancestor::div[contains(@class, "overflow-x-auto")][1]')
        .evaluate((el) => {
          el.scrollLeft = el.scrollWidth;
        });
      // Scrolled to its end, the table uses the area left of the text and
      // ends at the frame's right edge.
      await expect
        .poll(async () => (await cellOf(tableLocator, 0, 0).boundingBox())!.x)
        .toBeLessThan(x - 300);
      const tableBox = (await tableLocator.boundingBox())!;
      expect(
        Math.abs(tableBox.x + tableBox.width - (frame.x + frame.width)),
      ).toBeLessThanOrEqual(1);
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(0);
    };
    await check(editor, 32, textX);
    // Both right edges stay at the frame's right edge.
    const frame = (await tableFrameOf(editor).boundingBox())!;
    const edge = (await columnEdge(editor).boundingBox())!;
    expect(
      Math.abs(edge.x + edge.width - (frame.x + frame.width)),
    ).toBeLessThan(1);

    await savePage(page, contentPath);
    // The view at 1600px: its room is narrower than 1800px too.
    await page.setViewportSize({ width: 1600, height: 1000 });
    const view = viewTable(page, 0);
    await expect(view).toBeVisible();
    const viewTextX = (await page
      .locator('main [data-slate-type="p"] .block-inner-container')
      .filter({ hasText: 'Text before the table.' })
      .boundingBox())!.x;
    await check(view, 10, viewTextX);
  });

  test('a table can be centred: the editor and the view centre it', async ({
    page,
  }) => {
    const { contentPath } = await openPage(page, 'centred', [
      paragraph('Text before the table.'),
      table(3, { tableWidth: 1200, colSizes: [400, 400, 400] }),
      table(3, { tableWidth: 3000, colSizes: [1000, 1000, 1000] }),
    ]);
    const editor = editorTable(page, 0);
    await clickCell(page, editor, 1, 1);
    const toggle = toolbarButton(page, 'centerTable');
    // Radix's toggle group item: a radio, checked while pressed.
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await toggle.click();
    await expect
      .poll(async () => (await getTables(page))[0]?.tableAlign)
      .toBe('center');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    // The editor centres it too.
    await expect
      .poll(async () => {
        const [left, right] = await marginsOf(editor);
        return Math.abs(left - right);
      })
      .toBeLessThanOrEqual(2);
    // One undo step; pressed again it is centred again.
    await page.keyboard.press('ControlOrMeta+z');
    await expect
      .poll(async () => (await getTables(page))[0]?.tableAlign)
      .toBeUndefined();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await toggle.click();
    await expect
      .poll(async () => (await getTables(page))[0]?.tableAlign)
      .toBe('center');
    await clickCell(page, editorTable(page, 1), 1, 1);
    await toolbarButton(page, 'centerTable').click();
    await expect
      .poll(async () => (await getTables(page))[1]?.tableAlign)
      .toBe('center');
    await savePage(page, contentPath);

    const text = (await page
      .locator('main [data-slate-type="p"] .block-inner-container')
      .filter({ hasText: 'Text before the table.' })
      .boundingBox())!;
    const centre = text.x + text.width / 2;
    // 1200px wide, centred on the text column (= on the page).
    const centred = (await viewTable(page, 0).boundingBox())!;
    expect(
      Math.abs(centred.x + centred.width / 2 - centre),
    ).toBeLessThanOrEqual(1);
    expect(Math.round(centred.width)).toBe(1200);
    // Wider than the page: from the left margin, scrolling.
    const wide = viewTable(page, 1);
    const block = (await wide
      .locator(
        'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " block-table ")][1]',
      )
      .boundingBox())!;
    const wideFrame = (await tableFrameOf(wide).boundingBox())!;
    expect(Math.round(wideFrame.x - block.x)).toBe(10);
    expect(
      Math.round(block.x + block.width - wideFrame.x - wideFrame.width),
    ).toBe(10);
    await expect.poll(() => overflowOf(wide)).toBeGreaterThan(500);
  });

  test('a border held still inside the frame changes no width, also while the frame is scrolled', async ({
    page,
  }) => {
    await openPage(page, 'held-border', [
      paragraph('Intro'),
      table(3, { tableWidth: 1800, colSizes: [600, 600, 600] }),
    ]);
    const editor = editorTable(page, 0);
    await expect(editor).toBeVisible();
    const label = page.locator('.wiki-table-resize-label');
    const border = columnBorder(editor, 0);
    await border.hover();
    const box = (await border.boundingBox())!;
    const x = Math.round(box.x + box.width / 2);
    const y = Math.round(box.y + box.height / 2);
    const frame = (await tableFrameOf(editor).boundingBox())!;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await expect(border).toHaveAttribute('data-resizing', 'true');
    // 12px inside the frame's right edge, then held still. The border
    // follows the pointer (the neighbour gives what it has, the table
    // grows with the rest, as in the #828 mockup).
    const target = Math.round(frame.x + frame.width - 12);
    await page.mouse.move(target, y, { steps: 8 });
    const column = 600 + target - x;
    // The exact label, so it is read after the last mouse step was applied.
    await expect(label).toHaveText(
      `${column}px | 120px · Table ${column + 720}px`,
    );
    const shown = await label.textContent();
    const scrolled = await scrollLeftOf(editor);
    // About a second of the drag's frame loop.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          let frames = 0;
          const next = () =>
            ++frames >= 60 ? resolve() : requestAnimationFrame(next);
          requestAnimationFrame(next);
        }),
    );
    await expect(label).toHaveText(shown!);
    expect(await scrollLeftOf(editor)).toBe(scrolled);
    await page.mouse.up();
    await expect(border).not.toHaveAttribute('data-resizing', 'true');
    const [node] = await getTables(page);
    const sizes = node.colSizes as number[];
    expect(shown).toContain(`${sizes[0]}px | ${sizes[1]}px`);
    expect(node.tableWidth).toBe(column + 720);
    expect(sizes).toEqual([column, 120, 600]);
  });

  test('a deleted column takes its width off a custom width, down to the text width', async ({
    page,
  }) => {
    await openPage(page, 'delete-column', [
      paragraph('Intro'),
      table(3, { tableWidth: 1200, colSizes: [400, 400, 400] }),
    ]);
    const editor = editorTable(page, 0);
    const stored = async () => {
      const [node] = await getTables(page);
      return {
        blockWidth: node?.blockWidth,
        tableWidth: node?.tableWidth,
        colSizes: node?.colSizes,
      };
    };
    await clickCell(page, editor, 1, 1);
    await clickToolbar(page, 'deleteColumn');
    await expect(editor.locator('tr').first().locator('th')).toHaveCount(2);
    await expect.poll(stored).toEqual({
      blockWidth: 'default',
      tableWidth: 800,
      colSizes: [400, 400],
    });
    await expect.poll(() => frameWidth(editor)).toBe(800);
    // One undo step: the column and the width.
    await page.keyboard.press('ControlOrMeta+z');
    await expect(editor.locator('tr').first().locator('th')).toHaveCount(3);
    await expect.poll(stored).toEqual({
      blockWidth: 'default',
      tableWidth: 1200,
      colSizes: [400, 400, 400],
    });

    // Down to one column: below the text width, scaled up to it, stored
    // as the step.
    await clickCell(page, editor, 1, 1);
    await clickToolbar(page, 'deleteColumn');
    await expect(editor.locator('tr').first().locator('th')).toHaveCount(2);
    await clickCell(page, editor, 1, 1);
    await clickToolbar(page, 'deleteColumn');
    await expect(editor.locator('tr').first().locator('th')).toHaveCount(1);
    await expect.poll(stored).toEqual({
      blockWidth: 'default',
      tableWidth: undefined,
      colSizes: [780],
    });
    await expect.poll(() => frameWidth(editor)).toBe(780);
  });

  test('a deleted column takes its rendered width off a custom width without stored columns (#824 data)', async ({
    page,
  }) => {
    // Custom widths the handle of #824 stored without a column drag: no
    // column widths, or a 0 for a column never resized.
    await openPage(page, 'delete-column-824', [
      paragraph('Intro'),
      table(4, { blockWidth: 'default', tableWidth: 1200 }),
      table(4, {
        blockWidth: 'default',
        tableWidth: 1200,
        colSizes: [400, 0, 400, 400],
      }),
    ]);
    const stored = async (index: number) => {
      const node = (await getTables(page))[index];
      return { tableWidth: node?.tableWidth, colSizes: node?.colSizes };
    };
    const renderedColumns = (tableLocator: Locator) =>
      tableLocator
        .locator('tr')
        .first()
        .locator('> th')
        .evaluateAll((cells) =>
          cells.map((cell) => cell.getBoundingClientRect().width),
        );

    // No column widths: four equal columns of 1200, three are 900.
    const first = editorTable(page, 0);
    await clickCell(page, first, 1, 1);
    await clickToolbar(page, 'deleteColumn');
    await expect(first.locator('tr').first().locator('th')).toHaveCount(3);
    await expect
      .poll(() => stored(0))
      .toEqual({ tableWidth: 900, colSizes: [300, 300, 300] });
    await expect.poll(() => frameWidth(first)).toBe(900);
    // One undo step: the column, the widths and the width.
    await page.keyboard.press('ControlOrMeta+z');
    await expect(first.locator('tr').first().locator('th')).toHaveCount(4);
    await expect
      .poll(() => stored(0))
      .toEqual({ tableWidth: 1200, colSizes: undefined });

    // A column never resized (0): the columns as they are rendered, the
    // deleted one taken off.
    const second = editorTable(page, 1);
    const before = await renderedColumns(second);
    expect(before).toHaveLength(4);
    await clickCell(page, second, 1, 2);
    await clickToolbar(page, 'deleteColumn');
    await expect(second.locator('tr').first().locator('th')).toHaveCount(3);
    const expected = before[0] + before[1] + before[3];
    await expect
      .poll(async () =>
        Math.abs(((await stored(1)).tableWidth as number) - expected),
      )
      .toBeLessThanOrEqual(1);
    const { tableWidth, colSizes } = await stored(1);
    expect((colSizes as number[]).reduce((sum, size) => sum + size, 0)).toBe(
      tableWidth,
    );
    await expect
      .poll(async () => Math.abs((await frameWidth(second)) - expected))
      .toBeLessThanOrEqual(1);
    await page.keyboard.press('ControlOrMeta+z');
    await expect(second.locator('tr').first().locator('th')).toHaveCount(4);
    await expect
      .poll(() => stored(1))
      .toEqual({ tableWidth: 1200, colSizes: [400, 0, 400, 400] });
  });

  test('a border pulled back inside after the speed zones snaps under the pointer in the scrolled frame', async ({
    page,
  }) => {
    await openPage(page, 'border-snap-back', [paragraph('Intro'), table(3)]);
    const editor = editorTable(page, 0);
    await expect(editor).toBeVisible();
    const block = (await editor
      .locator(
        'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " block-table ")][1]',
      )
      .boundingBox())!;
    const roomEdge = Math.round(block.x + block.width - 32);
    const room = roomEdge - (await tableFrameOf(editor).boundingBox())!.x;
    const label = page.locator('.wiki-table-resize-label');
    const labelWidth = async () =>
      Number.parseInt(
        ((await label.textContent()) ?? '').replace(/^.*Table /, ''),
        10,
      );
    // The border's x on the screen: the left edge of the next column.
    const borderX = async () => (await cellOf(editor, 0, 1).boundingBox())!.x;
    const border = columnBorder(editor, 0);
    await border.hover();
    const box = (await border.boundingBox())!;
    const y = Math.round(box.y + box.height / 2);
    await page.mouse.move(Math.round(box.x + box.width / 2), y);
    await page.mouse.down();
    await expect(border).toHaveAttribute('data-resizing', 'true');
    // Past the room's edge: the speed zones grow the table, the frame
    // scrolls to keep the border in view.
    await page.mouse.move(roomEdge + 40, y, { steps: 10 });
    await expect.poll(labelWidth).toBeGreaterThan(room + 300);
    await expect.poll(() => scrollLeftOf(editor)).toBeGreaterThan(200);
    // 150px back inside: the border snaps under the pointer.
    await page.mouse.move(roomEdge - 150, y, { steps: 4 });
    await expect
      .poll(async () => Math.abs((await borderX()) - (roomEdge - 150)))
      .toBeLessThanOrEqual(3);
    // And follows it.
    await page.mouse.move(roomEdge - 200, y, { steps: 4 });
    await expect
      .poll(async () => Math.abs((await borderX()) - (roomEdge - 200)))
      .toBeLessThanOrEqual(3);
    await page.mouse.up();
    await expect(border).not.toHaveAttribute('data-resizing', 'true');
    // A border drag never shrinks the table: it keeps the grown width.
    const [node] = await getTables(page);
    expect(node.tableWidth as number).toBeGreaterThan(room + 300);
    expect(
      (node.colSizes as number[]).reduce((sum, size) => sum + size, 0),
    ).toBe(node.tableWidth);
    await expect
      .poll(async () => Math.abs((await borderX()) - (roomEdge - 200)))
      .toBeLessThanOrEqual(3);
  });
  test('at 1920 with the panels open, each right edge dragged slowly past the room and held grows the table, the column edge pulled inside shrinks it until it fits', async ({
    page,
  }) => {
    // As a person drags: a 1920 × 1080 window with the sidebar and the
    // navigation tree open (the room is about 913px), the pointer moved
    // in small steps until the table is at the room, 15px further into the
    // slow zone, then held still.
    await page.setViewportSize({ width: 1920, height: 1080 });
    await openPage(page, 'slow-past-edge', [
      paragraph('Intro'),
      table(3),
      paragraph('Between'),
      table(3),
      paragraph('Between'),
      table(3),
      paragraph('Between'),
      table(3, { tableWidth: 1800, colSizes: [600, 600, 600] }),
    ]);
    await expect(editorTable(page, 2)).toBeVisible();
    const label = page.locator('.wiki-table-resize-label');
    const labelWidth = async () => {
      const text = (await label.textContent()) ?? '';
      const match =
        text.match(/Table (\d+)px/) ??
        text.match(/\((\d+)px\)$/) ??
        text.match(/^(\d+)px/);
      return match ? Number(match[1]) : 0;
    };
    const growsPastTheRoom = async (
      index: number,
      handle: Locator,
      name: string,
    ) => {
      const editor = editorTable(page, index);
      const block = (await editor
        .locator(
          'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " block-table ")][1]',
        )
        .boundingBox())!;
      const roomEdge = Math.round(block.x + block.width - 32);
      const room = roomEdge - (await tableFrameOf(editor).boundingBox())!.x;
      await handle.hover();
      const box = (await handle.boundingBox())!;
      const y = Math.round(box.y + Math.min(box.height / 2, 20));
      let x = Math.round(box.x + box.width / 2);
      // Where the handle was grabbed, from the frame's right edge (0 for
      // the column edge and a border at the edge, about 17 for the
      // table's handle).
      const grabbed = Math.max(
        0,
        x -
          Math.round(
            (await tableFrameOf(editor).boundingBox())!.x +
              (await tableFrameOf(editor).boundingBox())!.width,
          ),
      );
      const slowly = async (to: number) => {
        while (x < to) {
          x = Math.min(x + 5, to);
          await page.mouse.move(x, y);
        }
      };
      await page.mouse.move(x, y);
      await page.mouse.down();
      await expect(handle).toHaveAttribute('data-resizing', 'true');
      await slowly(roomEdge + grabbed);
      // No step guides are drawn (snapping stays).
      await expect(page.locator('.wiki-table-guides')).toHaveCount(0);
      // The table is at the room now; no speed zones are drawn.
      await expect
        .poll(labelWidth, { message: name })
        .toBeGreaterThanOrEqual(Math.floor(room) - 1);
      await expect(page.locator('.wiki-table-zones')).toHaveCount(0);
      // 15px further: past the edge for the column edge and the border,
      // past where it was grabbed for the table's handle (the mockup
      // measures the handle's distance from there).
      await slowly(roomEdge + grabbed + 15);
      // Held still: the table keeps growing.
      await expect(label, name).toHaveText(/›$/);
      await expect
        .poll(labelWidth, { message: name })
        .toBeGreaterThan(room + 100);
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(0);
      await page.mouse.up();
      await expect(handle).not.toHaveAttribute('data-resizing', 'true');
      await expect
        .poll(
          async () =>
            ((await getTables(page))[index]?.tableWidth as number) ?? 0,
          { message: name },
        )
        .toBeGreaterThan(room + 100);
    };
    await growsPastTheRoom(0, columnEdge(editorTable(page, 0)), 'column edge');
    await growsPastTheRoom(
      1,
      resizeHandle(editorTable(page, 1)),
      'table handle',
    );
    // A border between two columns: its neighbour goes down to the
    // minimum, the table grows up to the room, then by the speed zones.
    await growsPastTheRoom(
      2,
      columnBorder(editorTable(page, 2), 0),
      'border with the neighbour at its minimum',
    );

    // An 1800px table, its column edge pulled 100px inside and held: the
    // table shrinks by the speed zones (‹‹), the edge stays at the frame's
    // edge; once the table fits the room, the edge jumps to the pointer
    // and follows it.
    const wide = editorTable(page, 3);
    const edge = columnEdge(wide);
    const frameOfWide = tableFrameOf(wide);
    const wideBlock = (await wide
      .locator(
        'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " block-table ")][1]',
      )
      .boundingBox())!;
    const roomEdge = Math.round(wideBlock.x + wideBlock.width - 32);
    await edge.scrollIntoViewIfNeeded();
    await edge.hover();
    const box = (await edge.boundingBox())!;
    const y = Math.round(box.y + Math.min(box.height / 2, 20));
    let x = Math.round(box.x + box.width / 2);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await expect(edge).toHaveAttribute('data-resizing', 'true');
    while (x > roomEdge - 100) {
      x = Math.max(x - 5, roomEdge - 100);
      await page.mouse.move(x, y);
    }
    await expect(label).toHaveText(/‹‹$/);
    const frameRight = async () => {
      const frame = (await frameOfWide.boundingBox())!;
      return frame.x + frame.width;
    };
    // Shrinking: the edge stays at the frame's edge (the room), not at
    // the pointer.
    expect(Math.abs((await frameRight()) - roomEdge)).toBeLessThanOrEqual(1);
    const shrinking = await labelWidth();
    expect(shrinking).toBeLessThan(1800);
    expect(shrinking).toBeGreaterThan(1000);
    // Fits: the edge is at the pointer, and positions from there.
    await expect
      .poll(async () => Math.abs((await frameRight()) - x))
      .toBeLessThanOrEqual(3);
    await expect(label).not.toHaveText(/[‹›·]$/);
    // 20px further in (the room, about 913px, less 120px stays above the
    // text width).
    x -= 20;
    await page.mouse.move(x, y, { steps: 4 });
    await expect
      .poll(async () => Math.abs((await frameRight()) - x))
      .toBeLessThanOrEqual(3);
    await page.mouse.up();
    await expect(edge).not.toHaveAttribute('data-resizing', 'true');
    await expect
      .poll(async () => Math.abs((await frameRight()) - x))
      .toBeLessThanOrEqual(3);
  });

  test('the arrow keys move a focused handle by 10px, as in the mockup', async ({
    page,
  }) => {
    await openPage(page, 'keyboard', [paragraph('Intro'), table(3)]);
    const editor = editorTable(page, 0);
    await expect(editor).toBeVisible();
    const stored = async () => {
      const [node] = await getTables(page);
      return { tableWidth: node?.tableWidth, colSizes: node?.colSizes };
    };
    // The table's handle: all columns scaled, a custom width.
    await resizeHandle(editor).focus();
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(stored)
      .toEqual({ tableWidth: 790, colSizes: [264, 263, 263] });
    // A border: its column 10px wider, the table follows.
    await columnBorder(editor, 0).focus();
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(stored)
      .toEqual({ tableWidth: 800, colSizes: [274, 263, 263] });
    // The last column's edge, narrower.
    await columnEdge(editor).focus();
    await page.keyboard.press('ArrowLeft');
    await expect
      .poll(stored)
      .toEqual({ tableWidth: 790, colSizes: [274, 263, 253] });
  });

  test('the alignment toggle takes a real click, after a cell click and after a width drag, and shows it is pressed', async ({
    page,
  }) => {
    await openPage(page, 'centre-click', [
      paragraph('Intro'),
      table(3),
      table(3, { tableAlign: 'center' }),
    ]);
    const background = (button: Locator) =>
      button.evaluate((el) => getComputedStyle(el).backgroundColor);
    /** Clicks the toggle with the mouse, then moves the mouse away. */
    const clickToggle = async () => {
      const toggle = toolbarButton(page, 'centerTable');
      const box = (await toggle.boundingBox())!;
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.move(box.x + box.width / 2, box.y + 200);
      return toggle;
    };
    const aligns = async () =>
      (await getTables(page)).map((node) => node.tableAlign ?? null);

    // After a plain cell click: on, pressed, and it looks pressed (not
    // like an idle button).
    await clickCell(page, editorTable(page, 0), 1, 1);
    // The Footer row toggle is off here: an idle toggle's background.
    const idle = await background(toolbarButton(page, 'footerRow'));
    let toggle = await clickToggle();
    await expect.poll(aligns).toEqual(['center', 'center']);
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => background(toggle)).not.toBe(idle);
    // Hovered, too, a pressed toggle looks different from an idle one
    // (Plate gave both the same light grey).
    await toggle.hover();
    const pressedHovered = await background(toggle);
    await toolbarButton(page, 'footerRow').hover();
    await expect
      .poll(() => background(toolbarButton(page, 'footerRow')))
      .not.toBe(idle);
    expect(await background(toolbarButton(page, 'footerRow'))).not.toBe(
      pressedHovered,
    );
    // The stored centred table: off.
    await clickCell(page, editorTable(page, 1), 1, 1);
    await expect(toolbarButton(page, 'centerTable')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    toggle = await clickToggle();
    await expect.poll(aligns).toEqual(['center', null]);
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect.poll(() => background(toggle)).toBe(idle);

    // After a width drag.
    await dragHandleBy(page, resizeHandle(editorTable(page, 1)), 60);
    await expect
      .poll(async () => (await getTables(page))[1]?.tableWidth)
      .toBeTruthy();
    await clickCell(page, editorTable(page, 1), 1, 1);
    toggle = await clickToggle();
    await expect.poll(aligns).toEqual(['center', 'center']);
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  test('at 1920 a centred table is centred in the editor, stays centred after a width drag, and scrolls from the left margin when wider than the page', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await openPage(page, 'centred-editor', [
      paragraph('Intro'),
      table(3),
      table(3, {
        tableWidth: 1800,
        colSizes: [600, 600, 600],
        tableAlign: 'center',
      }),
    ]);
    const first = editorTable(page, 0);
    await clickCell(page, first, 1, 1);
    await clickToolbar(page, 'centerTable');
    await expect
      .poll(async () => (await getTables(page))[0]?.tableAlign)
      .toBe('center');
    const centred = async (tableLocator: Locator) => {
      const [left, right] = await marginsOf(tableLocator);
      return Math.abs(left - right) <= 2;
    };
    await expect.poll(() => centred(first)).toBe(true);

    // The table's handle, 120px to the right: during the drag the frame
    // keeps its left edge and the edge follows the pointer; released, the
    // table is centred at its new width.
    const before = (await tableFrameOf(first).boundingBox())!;
    const handle = resizeHandle(first);
    await handle.hover();
    const box = (await handle.boundingBox())!;
    const x = Math.round(box.x + box.width / 2);
    const y = Math.round(box.y + 20);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 120, y, { steps: 8 });
    await expect(page.locator('.wiki-table-resize-label')).toHaveText(
      `${Math.round(before.width) + 120}px`,
    );
    const during = (await tableFrameOf(first).boundingBox())!;
    expect(Math.abs(during.x - before.x)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(during.x + during.width - (before.x + before.width + 120)),
    ).toBeLessThanOrEqual(2);
    await page.mouse.up();
    await expect
      .poll(async () => (await getTables(page))[0]?.tableWidth)
      .toBe(Math.round(before.width) + 120);
    await expect.poll(() => centred(first)).toBe(true);
    await expect
      .poll(async () =>
        Math.round((await tableFrameOf(first).boundingBox())!.width),
      )
      .toBe(Math.round(before.width) + 120);

    // An 1800px centred table is wider than the page: from the editor's
    // 32px left margin to the right one, scrolling.
    const wide = editorTable(page, 1);
    await expect.poll(() => marginsOf(wide)).toEqual([32, 32]);
    await expect.poll(() => overflowOf(wide)).toBeGreaterThan(500);
  });

  test('a drag follows only its own pointer: another pointer moving without a button or released does not end it', async ({
    page,
  }) => {
    await openPage(page, 'drag-pointer-id', [
      paragraph('Intro'),
      table(3, { tableWidth: 960, colSizes: [320, 320, 320] }),
    ]);
    const editor = editorTable(page, 0);
    const edge = columnEdge(editor);
    const label = page.locator('.wiki-table-resize-label');
    await editor.hover();
    await edge.hover();
    const box = (await edge.boundingBox())!;
    const x = Math.round(box.x + box.width / 2);
    const y = Math.round(box.y + Math.min(box.height / 2, 20));
    await page.mouse.move(x, y);
    await page.mouse.down();
    await expect(edge).toHaveAttribute('data-resizing', 'true');
    await page.mouse.move(x + 40, y, { steps: 4 });
    await expect(label).toHaveText('360px · Table 1000px');
    // A second finger or a pen during the drag: a move without a button,
    // a release, a cancel.
    await page.evaluate(
      ([clientX, clientY]) => {
        const init = {
          bubbles: true,
          clientX,
          clientY,
          isPrimary: false,
          pointerType: 'touch',
        };
        window.dispatchEvent(
          new PointerEvent('pointermove', {
            ...init,
            pointerId: 97,
            buttons: 0,
          }),
        );
        window.dispatchEvent(
          new PointerEvent('pointerup', { ...init, pointerId: 98 }),
        );
        window.dispatchEvent(
          new PointerEvent('pointercancel', { ...init, pointerId: 99 }),
        );
      },
      [x + 40, y],
    );
    await expect(edge).toHaveAttribute('data-resizing', 'true');
    // The drag still follows the mouse, and stores where it is released.
    await page.mouse.move(x + 100, y, { steps: 4 });
    await expect(label).toHaveText('420px · Table 1060px');
    await page.mouse.up();
    await expect(edge).not.toHaveAttribute('data-resizing', 'true');
    await expect
      .poll(async () => {
        const node = (await getTables(page))[0];
        return { tableWidth: node?.tableWidth, colSizes: node?.colSizes };
      })
      .toEqual({ tableWidth: 1060, colSizes: [320, 320, 420] });
  });

  test('a drag on a step clamped to the room starts as displayed: no frame renders the stored column widths', async ({
    page,
  }) => {
    // Wide, columns adding up to 1440, at 1920 with the sidebar and the
    // navigation tree open: the room (about 913px) clamps the table, its
    // columns are scaled to it.
    await page.setViewportSize({ width: 1920, height: 1000 });
    await openPage(page, 'drag-start-clamped', [
      paragraph('Intro'),
      table(4, { blockWidth: 'layout', colSizes: [360, 360, 360, 360] }),
    ]);
    const editor = editorTable(page, 0);
    await expect(editor).toBeVisible();
    const room = (await tableFrameOf(editor).boundingBox())!.width;
    expect(room).toBeLessThan(1400);
    await expect
      .poll(async () => (await editor.boundingBox())!.width)
      .toBeLessThanOrEqual(room + 1);
    // The table's width in each of the frames after the pointerdown.
    await editor.evaluate((tableElement) => {
      const widths: number[] = [];
      (window as any).dragStartWidths = widths;
      const record = () => {
        widths.push(tableElement.getBoundingClientRect().width);
        if (widths.length < 8) requestAnimationFrame(record);
      };
      window.addEventListener(
        'pointerdown',
        () => requestAnimationFrame(record),
        {
          capture: true,
          once: true,
        },
      );
    });
    const border = columnBorder(editor, 1);
    await border.hover();
    const box = (await border.boundingBox())!;
    await page.mouse.move(
      Math.round(box.x + box.width / 2),
      Math.round(box.y + Math.min(box.height / 2, 30)),
    );
    await page.mouse.down();
    await expect(border).toHaveAttribute('data-resizing', 'true');
    await expect
      .poll(() =>
        page.evaluate(() => (window as any).dragStartWidths.length as number),
      )
      .toBe(8);
    const widths = await page.evaluate(
      () => (window as any).dragStartWidths as number[],
    );
    expect(Math.max(...widths)).toBeLessThanOrEqual(room + 1);
    await page.mouse.up();
    await expect(border).not.toHaveAttribute('data-resizing', 'true');
    // A click stores nothing.
    expect((await getTables(page))[0]).toMatchObject({
      blockWidth: 'layout',
      colSizes: [360, 360, 360, 360],
    });
  });

  test('a table on a step renders the step within the room, its stored columns scaled in proportion', async ({
    page,
  }) => {
    // Wide, columns adding up to 1440 (as a drag that snapped to Wide on a
    // wide screen stores them).
    const { contentPath } = await createWikiPageWithValue(page, {
      contentId: 'step-columns-scaled',
      title: 'Step columns scaled',
      value: [
        paragraph('Text before the table.'),
        table(3, { blockWidth: 'layout', colSizes: [360, 480, 600] }),
      ],
    });
    const proportions = [360 / 1440, 480 / 1440, 600 / 1440];
    const check = async (tableLocator: Locator, margin: number) => {
      const block = (await tableLocator
        .locator(
          'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " block-table ")][1]',
        )
        .boundingBox())!;
      const frame = (await tableFrameOf(tableLocator).boundingBox())!;
      const room = block.x + block.width - margin - frame.x;
      const expected = Math.min(1440, Math.max(780, room), block.width);
      // The frame and the table are the step's width; nothing scrolls.
      await expect
        .poll(async () =>
          Math.abs(
            (await tableFrameOf(tableLocator).boundingBox())!.width - expected,
          ),
        )
        .toBeLessThanOrEqual(1);
      expect(
        Math.abs((await tableLocator.boundingBox())!.width - expected),
      ).toBeLessThanOrEqual(2);
      await expect.poll(() => overflowOf(tableLocator)).toBe(0);
      const widths = await tableLocator
        .locator('tr')
        .first()
        .locator('> th')
        .evaluateAll((cells) =>
          cells.map((cell) => cell.getBoundingClientRect().width),
        );
      const total = widths.reduce((sum, width) => sum + width, 0);
      widths.forEach((width, index) =>
        expect(Math.abs(width / total - proportions[index])).toBeLessThan(
          0.005,
        ),
      );
    };
    for (const width of [1920, 1300]) {
      await page.setViewportSize({ width, height: 1000 });
      await openInView(page, contentPath);
      const view = viewTable(page, 0);
      await expect(view).toBeVisible();
      await check(view, 10);
    }
    await page.setViewportSize({ width: 1920, height: 1000 });
    await openInEditor(page, contentPath);
    const editor = editorTable(page, 0);
    await expect(editor).toBeVisible();
    await check(editor, 32);
  });
});
