// Copied unchanged from @kitconcept/volto-plate 1.0.0a29
// (frontend/acceptance/fixtures/pages.ts). Keep it in sync with volto-plate;
// intranet-specific helpers go into the wiki-*/table-* fixtures.

import { expect, type Page } from '@playwright/test';
import { getEditorHandle } from '@platejs/playwright';

import { createWikiPage } from '../tests/content';
import { waitForPlateEditorReady } from '../tests/plate';
import { editable } from './editor';
import { nativeBlockSections, type NativeBlockSection } from './native-blocks';

type CreatePageOptions = {
  /** Page title, also rendered by the title block. */
  title?: string;
  /** Extra Plate nodes appended after the requested sections. */
  extra?: Record<string, unknown>[];
  /** Start the value with the title block (default). */
  withTitle?: boolean;
};

/**
 * Creates one published wiki page whose somersault value contains the title
 * block (unless `withTitle` is false) followed by the requested fixture
 * sections, in order. Returns the page path.
 *
 * The backend is reset around every test, so each test creates exactly the
 * page it needs through the REST API instead of relying on a shared site.
 */
export async function createNativeBlocksPage(
  page: Page,
  sections: NativeBlockSection[],
  {
    title = 'Native blocks',
    extra = [],
    withTitle = true,
  }: CreatePageOptions = {},
) {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  const contentId = `native-blocks-${suffix}`;

  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle: title,
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            ...(withTitle
              ? [{ type: 'title', children: [{ text: title }] }]
              : []),
            ...sections.flatMap((section) => nativeBlockSections[section]),
            ...extra,
          ],
        },
      },
    }),
  });

  return contentPath;
}

/**
 * Opens the page in the editor and returns the editor handle, once Plate is
 * ready and the editor has run its initial focus (it moves the caret to the
 * start of the document, which would otherwise race with the test's own
 * selection).
 */
export async function openInEditor(page: Page, contentPath: string) {
  await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);
  const editorHandle = await getEditorHandle(page, editable(page));

  await expect
    .poll(() =>
      page.evaluate((editor) => editor.selection !== null, editorHandle),
    )
    .toBe(true);

  return editorHandle;
}

/** Opens the public view of the page. */
export async function openInView(page: Page, contentPath: string) {
  await page.goto(contentPath, { waitUntil: 'networkidle' });
  const content = page.locator('.typeset').first();
  await expect(content).toBeVisible();

  return content;
}
