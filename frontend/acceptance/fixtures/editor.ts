// Copied unchanged from @kitconcept/volto-plate 1.0.0a29
// (frontend/acceptance/fixtures/editor.ts). Keep it in sync with volto-plate;
// intranet-specific helpers go into the wiki-*/table-* fixtures.

import { expect, type Page } from '@playwright/test';
import {
  clickAtPath,
  getEditorHandle,
  setSelection,
} from '@platejs/playwright';

export type EditorNode = {
  type?: string;
  text?: string;
  url?: string;
  indent?: number;
  listStyleType?: string;
  checked?: boolean;
  align?: string;
  children?: EditorNode[];
  [key: string]: unknown;
};

export type EditorHandle = Awaited<ReturnType<typeof getEditorHandle>>;

/** The wiki editor's editable (the public view has its own read-only one). */
export const editable = (page: Page) =>
  page.locator('.slate-editor[data-slate-editor]');

/** Returns a JSON copy of the editor's top-level node at `index`. */
export async function getBlock(
  page: Page,
  editorHandle: EditorHandle,
  index: number,
) {
  return (await page.evaluate(
    ([editor, i]) => JSON.parse(JSON.stringify(editor.children[i] ?? null)),
    [editorHandle, index] as const,
  )) as EditorNode | null;
}

/** Returns a JSON copy of the whole editor value. */
export async function getValue(page: Page, editorHandle: EditorHandle) {
  return (await page.evaluate(
    (editor) => JSON.parse(JSON.stringify(editor.children)),
    editorHandle,
  )) as EditorNode[];
}

/** Concatenated text of a node and its descendants. */
export const nodeText = (node: EditorNode | null | undefined): string =>
  !node
    ? ''
    : typeof node.text === 'string'
      ? node.text
      : (node.children ?? []).map(nodeText).join('');

/** Places the caret at the start of the top-level block at `index`. */
export async function focusBlockStart(
  page: Page,
  editorHandle: EditorHandle,
  index: number,
) {
  await clickAtPath(page, editorHandle, [index]);
  await setSelection(page, editorHandle, {
    anchor: { path: [index, 0], offset: 0 },
    focus: { path: [index, 0], offset: 0 },
  });
}

/** Selects the whole text of the top-level text block at `index`. */
export async function selectBlockText(
  page: Page,
  editorHandle: EditorHandle,
  index: number,
  text: string,
) {
  await setSelection(page, editorHandle, {
    anchor: { path: [index, 0], offset: 0 },
    focus: { path: [index, 0], offset: text.length },
  });
}

/** Opens the slash menu in the (empty) block at `index` and picks `label`. */
export async function insertWithSlashMenu(
  page: Page,
  editorHandle: EditorHandle,
  index: number,
  label: string,
) {
  await focusBlockStart(page, editorHandle, index);
  await page.keyboard.type('/');
  const option = page.getByRole('option', { name: label, exact: true });
  await expect(option).toBeVisible();
  await option.click();
}

/**
 * Pastes clipboard data through the editor's own `insertData`, the entry point
 * Slate's paste handler uses. Synthetic `ClipboardEvent`s don't expose
 * `clipboardData` to handlers, so this is the reliable way to exercise the
 * HTML, DOCX and markdown paste pipelines.
 */
export async function pasteData(
  page: Page,
  editorHandle: EditorHandle,
  data: Record<string, string>,
) {
  await page.evaluate(
    ([editor, entries]: [any, Record<string, string>]) => {
      const dataTransfer = new DataTransfer();
      for (const [format, value] of Object.entries(entries)) {
        dataTransfer.setData(format, value);
      }
      editor.tf.insertData(dataTransfer);
    },
    [editorHandle, data] as [any, Record<string, string>],
  );
}
