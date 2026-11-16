/**
 * Table helpers for the editor, on top of volto-plate's editor fixtures
 * (`./editor`): table nodes of the editor value, and caret / selection
 * helpers that wait for Slate's throttled selection instead of fixed waits.
 */
import { expect, type Page } from '@playwright/test';
import { getEditorHandle, setSelection } from '@platejs/playwright';

import { editable, getValue, nodeText, type EditorNode } from './editor';

/** The handle of the wiki editor on the page. */
export const editorHandleOf = (page: Page) =>
  getEditorHandle(page, editable(page));

/** The top-level table nodes of the editor value. */
export async function getTables(page: Page) {
  const value = await getValue(page, await editorHandleOf(page));
  return value.filter((node) => node.type === 'table');
}

/** Cell texts of a table node, row by row. */
export const tableNodeTexts = (table: EditorNode) =>
  (table.children ?? []).map((row) => (row.children ?? []).map(nodeText));

/** Slate's selection anchor path (null without a selection). */
export async function selectionPath(page: Page) {
  return page.evaluate(
    (editor) =>
      ((editor as any).selection?.anchor.path as number[] | undefined) ?? null,
    await editorHandleOf(page),
  );
}

/** Waits until Slate's selection is inside the node at `prefix`. */
export async function expectSelectionIn(page: Page, prefix: number[]) {
  await expect
    .poll(async () => (await selectionPath(page))?.slice(0, prefix.length))
    .toEqual(prefix);
}

/**
 * Puts the caret at the start or end of the first paragraph of a table cell.
 * `tableIndex` is the top-level index of the table in the editor value.
 */
export async function caretInCell(
  page: Page,
  [tableIndex, row, col]: [number, number, number],
  where: 'start' | 'end',
) {
  const handle = await editorHandleOf(page);
  const value = await getValue(page, handle);
  const text = nodeText(
    value[tableIndex].children![row].children![col].children![0],
  );
  await setSelection(page, handle, {
    path: [tableIndex, row, col, 0, 0],
    offset: where === 'start' ? 0 : text.length,
  });
  await expectSelectionIn(page, [tableIndex, row, col]);
}
