import type { Page } from '@playwright/test';
import { getEditorHandle } from '@platejs/playwright';

import { createContent, createWikiPage } from './content';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import {
  selectParagraphText,
  withSomersaultBody,
  withSomersaultLinkedBody,
} from './helpers';
import { expect, test } from './test';

async function openWikiPageEditor(
  page: Page,
  {
    contentId,
    contentTitle,
    wikiId = `wiki-${contentId}`,
    bodyText = 'Link this text',
  }: {
    contentId: string;
    contentTitle: string;
    wikiId?: string;
    bodyText?: string;
  },
) {
  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle,
    wikiId,
    transition: 'publish',
    bodyModifier: withSomersaultBody(bodyText),
  });

  await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);
}

async function openLinkToolbar(page: Page) {
  await page.keyboard.press('Control+k');
  await expect(
    page.getByPlaceholder('Paste link or search content'),
  ).toBeVisible();
}

async function expectEditorLink(
  page: Page,
  { href, text }: { href: string; text: string },
) {
  const link = page
    .locator('.slate-editor[data-slate-editor]')
    .getByRole('link', { name: text })
    .first();

  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', href);
}

function findFirstLinkNode(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== 'object') return null;

  const record = node as Record<string, unknown>;
  if (record.type === 'a') return record;

  const children = Array.isArray(record.children) ? record.children : [];
  for (const child of children) {
    const linkNode = findFirstLinkNode(child);
    if (linkNode) return linkNode;
  }

  return null;
}

test.describe('Plate link features', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('adds an external link from the floating link input', async ({
    page,
  }) => {
    await openWikiPageEditor(page, {
      contentId: 'link-source-external',
      contentTitle: 'Link source external',
    });

    await selectParagraphText(page, { start: 0, end: 9 });
    await openLinkToolbar(page);

    const input = page.getByPlaceholder('Paste link or search content');
    await input.fill('https://example.com/path');
    await input.press('Enter');

    await expectEditorLink(page, {
      href: 'https://example.com/path',
      text: 'Link this',
    });
  });

  test('searches content from plain text and inserts the selected result', async ({
    page,
  }) => {
    const { contentPath } = await createWikiPage(page, {
      contentId: 'link-target-search',
      contentTitle: 'LinkTargetSearch',
      transition: 'publish',
      bodyModifier: withSomersaultBody('Target body'),
    });

    await openWikiPageEditor(page, {
      contentId: 'link-source-search',
      contentTitle: 'Link source search',
    });

    await selectParagraphText(page, { start: 0, end: 9 });
    await openLinkToolbar(page);

    const input = page.getByPlaceholder('Paste link or search content');
    await input.fill('LinkTargetSearch');

    await page.getByRole('button', { name: 'LinkTargetSearch' }).click();

    await expectEditorLink(page, {
      href: contentPath,
      text: 'Link this',
    });
  });

  test('pressing enter selects the first search result', async ({ page }) => {
    const { contentPath } = await createWikiPage(page, {
      contentId: 'link-target-search-enter-first',
      contentTitle: 'LinkTargetSearchEnterFirst',
      transition: 'publish',
      bodyModifier: withSomersaultBody('Target body'),
    });

    await openWikiPageEditor(page, {
      contentId: 'link-source-search-enter',
      contentTitle: 'Link source search enter',
    });

    await selectParagraphText(page, { start: 0, end: 9 });
    await openLinkToolbar(page);

    const input = page.getByPlaceholder('Paste link or search content');
    await input.fill('LinkTargetSearchEnterFirst');
    await expect(
      page.getByRole('button', { name: 'LinkTargetSearchEnterFirst' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'LinkTargetSearchEnterFirst' }),
    ).toHaveAttribute('data-selected', 'true');

    await input.press('Enter');

    await expectEditorLink(page, {
      href: contentPath,
      text: 'Link this',
    });
  });

  test('allows multi-word search input in the floating link toolbar', async ({
    page,
  }) => {
    const { contentPath } = await createWikiPage(page, {
      contentId: 'link-target-search-multi',
      contentTitle: 'Link Target Search Phrase',
      transition: 'publish',
      bodyModifier: withSomersaultBody('Target body'),
    });

    await openWikiPageEditor(page, {
      contentId: 'link-source-search-multi',
      contentTitle: 'Link source search multi',
    });

    await selectParagraphText(page, { start: 0, end: 9 });
    await openLinkToolbar(page);

    const input = page.getByPlaceholder('Paste link or search content');
    await input.click();
    await page.keyboard.type('Link Target Search Phrase');
    await expect(input).toHaveValue('Link Target Search Phrase');

    await page
      .getByRole('button', { name: 'Link Target Search Phrase' })
      .click();

    await expectEditorLink(page, {
      href: contentPath,
      text: 'Link this',
    });
  });

  test('sets the link when selecting a target from the object browser', async ({
    page,
  }) => {
    const { contentPath } = await createWikiPage(page, {
      contentId: 'link-target-browser',
      contentTitle: 'LinkTargetBrowser',
      transition: 'publish',
      bodyModifier: withSomersaultBody('Target body'),
    });

    await openWikiPageEditor(page, {
      contentId: 'link-source-browser',
      contentTitle: 'Link source browser',
    });

    await selectParagraphText(page, { start: 0, end: 9 });
    await openLinkToolbar(page);

    await page.getByRole('button', { name: 'Browse content' }).click();
    const objectBrowser = page.locator('.object-browser');
    await expect(objectBrowser).toBeVisible();
    await expect(
      objectBrowser.getByRole('heading', { name: 'Choose Target' }),
    ).toBeVisible();

    await objectBrowser.getByRole('button', { name: 'Search SVG' }).click();
    const objectBrowserSearch =
      objectBrowser.getByPlaceholder('Search content');
    await objectBrowserSearch.fill('LinkTargetBrowser');

    await expect(objectBrowser.getByText('LinkTargetBrowser')).toBeVisible();
    await objectBrowser.getByText('LinkTargetBrowser').click();

    await expectEditorLink(page, {
      href: contentPath,
      text: 'Link this',
    });
  });

  test('browse starts in the current internal link context', async ({
    page,
  }) => {
    await createContent(page, {
      contentType: 'Document',
      contentId: 'source-document-browser-context',
      contentTitle: 'Source Document Browser Context',
      transition: 'publish',
      bodyModifier: withSomersaultBody('Source container body'),
    });
    const { contentPath: targetPath } = await createWikiPage(page, {
      contentId: 'root-target-browser-context',
      contentTitle: 'Target Page Browser Context',
      transition: 'publish',
      bodyModifier: withSomersaultBody('Target body'),
    });
    const { contentPath: sourcePath } = await createWikiPage(page, {
      contentId: 'source-page-browser-context',
      contentTitle: 'Source Page Browser Context',
      path: '/source-document-browser-context',
      transition: 'publish',
      bodyModifier: withSomersaultLinkedBody({
        bodyText: 'Link this text',
        href: targetPath,
        linkText: 'Link this',
      }),
    });

    await page.goto(`${sourcePath}/edit`, { waitUntil: 'networkidle' });
    await waitForPlateEditorReady(page);

    const insertedLink = page
      .locator('.slate-editor[data-slate-editor]')
      .getByRole('link', { name: 'Link this' })
      .first();
    await insertedLink.click();
    const browseButton = page.getByRole('button', {
      name: 'Browse',
      exact: true,
    });
    await expect(browseButton).toBeVisible();
    await browseButton.click();

    const objectBrowser = page.locator('.object-browser');
    await expect(objectBrowser).toBeVisible();
    await expect(
      objectBrowser.getByText('Target Page Browser Context'),
    ).toBeVisible();
    await expect(
      objectBrowser.getByText('Source Page Browser Context'),
    ).not.toBeVisible();
  });

  test('an internal absolute URL is flattened to an app path', async ({
    page,
  }) => {
    const { contentPath } = await createWikiPage(page, {
      contentId: 'link-target-existing',
      contentTitle: 'LinkTargetExisting',
      transition: 'publish',
      bodyModifier: withSomersaultBody('Target body'),
    });

    await openWikiPageEditor(page, {
      contentId: 'link-source-existing',
      contentTitle: 'Link source existing',
    });

    const internalAbsoluteUrl = new URL(contentPath, page.url()).toString();

    await selectParagraphText(page, { start: 0, end: 9 });
    await openLinkToolbar(page);

    const input = page.getByPlaceholder('Paste link or search content');
    await input.fill(internalAbsoluteUrl);
    await input.press('Enter');

    const editorHandle = await getEditorHandle(
      page,
      page.locator('.slate-editor[data-slate-editor]'),
    );
    const editorChildren = (await page.evaluate(
      (editor) => editor.children,
      editorHandle,
    )) as unknown[];
    const linkNode =
      editorChildren.map((node) => findFirstLinkNode(node)).find(Boolean) ?? {};

    expect(linkNode.type).toBe('a');
    expect(linkNode.url).toBe(contentPath);

    const insertedLink = page
      .locator('.slate-editor[data-slate-editor]')
      .getByRole('link', { name: 'Link this' })
      .first();
    await insertedLink.click();
    await expect(page.getByRole('button', { name: 'Edit link' })).toBeVisible();
    await page.getByRole('button', { name: 'Edit link' }).click();
    await expect(
      page.getByPlaceholder('Paste link or search content').filter({
        visible: true,
      }),
    ).toHaveValue(contentPath);
  });
});
