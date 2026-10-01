/**
 * Pasting tables into Wiki Pages: Confluence, web page, Excel, markdown
 * (manual test plan of https://github.com/kitconcept/kitconcept.intranet/pull/518,
 * section D). The paste goes through the editor's own `insertData`, as in
 * Aurora's paste tests.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/667
 */
import type { Page } from '@playwright/test';
import { setSelection } from '@platejs/playwright';

import {
  CONFLUENCE_TABLE_HTML,
  EXCEL_HTML,
  MARKDOWN_TABLE_TEXT,
  WEB_TABLE_HTML,
} from '../fixtures/table-clipboard';
import { pasteData, type EditorNode } from '../fixtures/editor';
import { openInEditor } from '../fixtures/pages';
import { savePage, viewTable } from '../fixtures/table';
import { getTables, tableNodeTexts } from '../fixtures/table-editor';
import { createWikiPageWithValue } from '../fixtures/wiki-pages';
import { login } from './login';
import { expect, test } from './test';

test.describe.configure({ timeout: 30_000 });

async function openEmptyPage(page: Page, id: string) {
  const { contentPath } = await createWikiPageWithValue(page, {
    contentId: id,
    title: `Paste ${id}`,
    value: [{ type: 'p', children: [{ text: '' }] }],
  });
  const editor = await openInEditor(page, contentPath);
  await setSelection(page, editor, { path: [1, 0], offset: 0 });
  return { contentPath, editor };
}

const cellTypes = (table: EditorNode) =>
  (table.children ?? []).map((row) => (row.children ?? []).map((c) => c.type));

const findNode = (
  node: EditorNode,
  predicate: (n: EditorNode) => boolean,
): EditorNode | undefined =>
  predicate(node)
    ? node
    : (node.children ?? []).reduce<EditorNode | undefined>(
        (found, child) => found ?? findNode(child, predicate),
        undefined,
      );

test.describe('Wiki tables: paste (D)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('a Confluence table keeps its header row, bold, links and lists', async ({
    page,
  }) => {
    const { contentPath, editor } = await openEmptyPage(page, 'confluence');
    await pasteData(page, editor, {
      'text/html': CONFLUENCE_TABLE_HTML,
      'text/plain': 'KIP\tTitle\tRelease',
    });

    const [table] = await getTables(page);
    expect(cellTypes(table)[0]).toEqual(['th', 'th', 'th']);
    expect(tableNodeTexts(table)[1][0]).toBe('KIP-1');
    expect(findNode(table, (n) => n.type === 'a')?.url).toBe(
      'https://cwiki.apache.org/confluence/display/KAFKA/KIP-1',
    );
    expect(
      findNode(table, (n) => n.bold === true && n.text === 'Remove'),
    ).toBeTruthy();
    const listCell = table.children![2].children![1];
    expect(
      findNode(
        listCell,
        (n) => typeof n.listStyleType === 'string' || n.type === 'ul',
      ),
    ).toBeTruthy();

    // Every row holds cells only, so the saved page renders (no hydration
    // failure from stray text in a row).
    for (const row of table.children ?? []) {
      for (const child of row.children ?? []) {
        expect(['td', 'th']).toContain(child.type);
      }
    }
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await savePage(page, contentPath);
    await expect(viewTable(page, 0).locator('tr')).toHaveCount(3);
    expect(errors).toEqual([]);
  });

  test('a table from a web page keeps its structure', async ({ page }) => {
    const { editor } = await openEmptyPage(page, 'web');
    await pasteData(page, editor, {
      'text/html': WEB_TABLE_HTML,
      'text/plain': '#\tBundesland\tFläche in km²',
    });
    const [table] = await getTables(page);
    expect(tableNodeTexts(table)).toEqual([
      ['#', 'Bundesland', 'Fläche in km²'],
      ['1', 'Bayern', '70.541,57'],
      ['2', 'Niedersachsen', '47.709,80'],
    ]);
    expect(cellTypes(table)[0]).toEqual(['th', 'th', 'th']);
  });

  test('an Excel range pastes as a plain table without a header row', async ({
    page,
  }) => {
    const { editor } = await openEmptyPage(page, 'excel');
    await pasteData(page, editor, {
      'text/html': EXCEL_HTML,
      'text/plain': 'Artikel\tMenge\nPipetten\t12\nHandschuhe\t200',
    });
    const [table] = await getTables(page);
    expect(tableNodeTexts(table)).toEqual([
      ['Artikel', 'Menge'],
      ['Pipetten', '12'],
      ['Handschuhe', '200'],
    ]);
    expect(cellTypes(table)[0]).toEqual(['td', 'td']);
  });

  test('a markdown table pasted as plain text becomes a table', async ({
    page,
  }) => {
    const { editor } = await openEmptyPage(page, 'markdown');
    await pasteData(page, editor, { 'text/plain': MARKDOWN_TABLE_TEXT });
    const [table] = await getTables(page);
    expect(tableNodeTexts(table)).toEqual([
      ['Spalte A', 'Spalte B'],
      ['eins', 'zwei'],
    ]);
    expect(
      findNode(table, (n) => n.bold === true && n.text === 'zwei'),
    ).toBeTruthy();
  });
});
