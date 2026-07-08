import type { Page } from '@playwright/test';
import { createWikiPage } from './content';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import { selectParagraphText, withSomersaultBody } from './helpers';
import { expect, test } from './test';

const BODY_TEXT = 'Hello toolbar text';

function toolbarButton(page: Page, lucideClass: string) {
  return page.locator(`button:has(.${lucideClass})`);
}

async function openToolbarTestPage(
  page: Page,
  {
    contentId,
    contentTitle,
    bodyText = BODY_TEXT,
  }: {
    contentId: string;
    contentTitle: string;
    bodyText?: string;
  },
) {
  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle,
    transition: 'publish',
    bodyModifier: withSomersaultBody(bodyText),
  });

  await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);
  return { contentPath };
}

async function savePage(page: Page, contentPath: string, contentTitle: string) {
  await page.locator('#toolbar-save').click();
  await page.waitForURL(contentPath, {
    waitUntil: 'load',
    timeout: 30_000,
  });
  await expect(page.getByRole('heading', { name: contentTitle })).toBeVisible();
}

test.describe('Plate toolbar — text marks', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('clicking the Bold button wraps selected text in <strong> and persists after save', async ({
    page,
  }) => {
    const { contentPath: boldPath } = await openToolbarTestPage(page, {
      contentId: 'toolbar-bold-test',
      contentTitle: 'Toolbar bold test',
    });

    await selectParagraphText(page, { start: 0, end: 5 });

    const boldBtn = toolbarButton(page, 'lucide-bold');
    await expect(boldBtn).toBeVisible();
    await boldBtn.click();

    const editorBoldText = page
      .locator('.slate-editor[data-slate-editor]')
      .locator('strong')
      .first();
    await expect(editorBoldText).toBeVisible();
    await expect(editorBoldText).toHaveText('Hello');

    // Save and verify bold appear on the view page
    await savePage(page, boldPath, 'Toolbar bold test');

    const viewBoldText = page
      .locator('strong')
      .filter({ hasText: 'Hello' })
      .first();
    await expect(viewBoldText).toBeVisible();
  });

  test('clicking the Italic button wraps selected text in <em> and persists after save', async ({
    page,
  }) => {
    const { contentPath: italicPath } = await openToolbarTestPage(page, {
      contentId: 'toolbar-italic-test',
      contentTitle: 'Toolbar italic test',
    });

    await selectParagraphText(page, { start: 0, end: 5 });

    const italicBtn = toolbarButton(page, 'lucide-italic');
    await expect(italicBtn).toBeVisible();
    await italicBtn.click();

    const editorItalicText = page
      .locator('.slate-editor[data-slate-editor]')
      .locator('em')
      .first();
    await expect(editorItalicText).toBeVisible();
    await expect(editorItalicText).toHaveText('Hello');

    // Save and verify italic appear on the view page
    await savePage(page, italicPath, 'Toolbar italic test');

    const viewItalicText = page
      .locator('em')
      .filter({ hasText: 'Hello' })
      .first();
    await expect(viewItalicText).toBeVisible();
  });

  test('clicking the Strikethrough button wraps selected text in <s> and persists after save', async ({
    page,
  }) => {
    const { contentPath: strikethroughPath } = await openToolbarTestPage(page, {
      contentId: 'toolbar-strikethrough-test',
      contentTitle: 'Toolbar strikethrough test',
    });

    await selectParagraphText(page, { start: 0, end: 5 });

    const strikethroughBtn = toolbarButton(page, 'lucide-strikethrough');
    await expect(strikethroughBtn).toBeVisible();
    await strikethroughBtn.click();

    const editorStrikethroughText = page
      .locator('.slate-editor[data-slate-editor]')
      .locator('s')
      .first();
    await expect(editorStrikethroughText).toBeVisible();
    await expect(editorStrikethroughText).toHaveText('Hello');

    // Save and verify strikethrough appear on the view page
    await savePage(page, strikethroughPath, 'Toolbar strikethrough test');

    const viewStrikethroughText = page
      .locator('s')
      .filter({ hasText: 'Hello' })
      .first();
    await expect(viewStrikethroughText).toBeVisible();
  });
});
