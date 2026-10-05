/**
 * volto-plate's acceptance fixtures (`fixtures/editor.ts`, `pages.ts`,
 * `native-blocks.ts`) work against the intranet: a page built from the
 * native block sections opens in the editor and in the view.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/667
 */
import { editable, getBlock, getValue, nodeText } from '../fixtures/editor';
import {
  createNativeBlocksPage,
  openInEditor,
  openInView,
} from '../fixtures/pages';
import { login } from './login';
import { expect, test } from './test';

test.describe.configure({ timeout: 30_000 });

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('a native blocks page opens in the editor and in the view', async ({
  page,
}) => {
  const path = await createNativeBlocksPage(page, ['table', 'headings']);

  const editorHandle = await openInEditor(page, path);
  const value = await getValue(page, editorHandle);
  expect(value.map((node) => node.type).slice(0, 3)).toEqual([
    'title',
    'table',
    'h2',
  ]);
  expect(nodeText(await getBlock(page, editorHandle, 2))).toBe('Heading two');
  await expect(
    editable(page).getByText('Cell one', { exact: true }),
  ).toBeVisible();

  const content = await openInView(page, path);
  await expect(content.locator('table')).toHaveCount(1);
  await expect(
    content.getByRole('heading', { name: 'Heading two' }),
  ).toBeVisible();
});
