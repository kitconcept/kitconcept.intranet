import { expect, test } from './test';
import { login } from './login';
import { createWikiPage } from './content';
import { waitForPlateEditorReady } from './plate';
import { getEditorHandle, getSelection, setSelection } from '@platejs/playwright';

function withSomersaultBody(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title : '';

  return {
    ...body,
    blocks: {
      __somersault__: {
        '@type': '__somersault__',
        value: [
          { type: 'title', children: [{ text: title }] },
          { type: 'p', children: [{ text: '' }] },
        ],
      },
    },
  };
}

async function openTitleSyncPage(
  page: Parameters<typeof test>[0]['page'],
  {
    contentId,
    contentTitle,
    wikiId = `wiki-${contentId}`,
  }: {
    contentId: string;
    contentTitle: string;
    wikiId?: string;
  },
) {
  await login(page);
  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle,
    wikiId,
    transition: 'publish',
    bodyModifier: withSomersaultBody,
  });

  await page.goto(`${contentPath}/edit`);
  await waitForPlateEditorReady(page);
}

async function openMetadataSidebar(page: Parameters<typeof test>[0]['page']) {
  await page.getByRole('button', { name: 'Wiki Page' }).click();
  await expect(
    page.getByRole('textbox', {
      name: 'Title',
      exact: true,
    }),
  ).toBeVisible();
}

test('Metadata title updates the plate title block', async ({ page }) => {
  await openTitleSyncPage(page, {
    contentId: 'title-sync-page-metadata',
    contentTitle: 'Original title',
  });

  const metadataTitleInput = page.getByRole('textbox', {
    name: 'Title',
    exact: true,
  });
  const editorTitle = page.locator('[data-slate-editor] h1').first();

  await expect(editorTitle).toHaveText('Original title');
  await openMetadataSidebar(page);
  await expect(metadataTitleInput).toHaveValue('Original title');

  await metadataTitleInput.fill('Metadata updated title');
  await editorTitle.click();
  await expect(editorTitle).toHaveText('Metadata updated title');
});

test('Plate editor autofocuses the title block on load', async ({ page }) => {
  await openTitleSyncPage(page, {
    contentId: 'title-sync-page-autofocus',
    contentTitle: 'Original title',
  });

  const editorHandle = await getEditorHandle(
    page,
    page.locator('.slate-editor[data-slate-editor]'),
  );
  const selection = await getSelection(page, editorHandle);

  expect(selection).toEqual({
    anchor: { offset: 0, path: [0, 0] },
    focus: { offset: 0, path: [0, 0] },
  });
});

test('Plate title block updates the metadata title', async ({ page }) => {
  await openTitleSyncPage(page, {
    contentId: 'title-sync-page-editor',
    contentTitle: 'Original title',
  });

  const metadataTitleInput = page.getByRole('textbox', {
    name: 'Title',
    exact: true,
  });
  const editorTitle = page.locator('[data-slate-editor] h1').first();

  await expect(editorTitle).toHaveText('Original title');
  await openMetadataSidebar(page);
  await expect(metadataTitleInput).toHaveValue('Original title');

  await editorTitle.fill('Editor updated title');
  await openMetadataSidebar(page);
  await metadataTitleInput.click();
  await expect(metadataTitleInput).toHaveValue('Editor updated title');
});

test('Title block selection does not show the floating toolbar', async ({
  page,
}) => {
  await openTitleSyncPage(page, {
    contentId: 'title-sync-page-no-toolbar',
    contentTitle: 'Original title',
  });

  const editorHandle = await getEditorHandle(
    page,
    page.locator('.slate-editor[data-slate-editor]'),
  );

  await setSelection(page, editorHandle, {
    anchor: { path: [0, 0], offset: 0 },
    focus: { path: [0, 0], offset: 'Original title'.length },
  });

  await expect(page.getByLabel('Editor toolbar')).toHaveCount(0);
});

test('Empty plate title block shows the translated placeholder', async ({
  page,
}) => {
  await openTitleSyncPage(page, {
    contentId: 'title-sync-page-placeholder',
    contentTitle: 'Original title',
  });

  const editorTitle = page.locator('[data-slate-editor] h1').first();

  await editorTitle.fill('');

  await expect
    .poll(async () => {
      return editorTitle
        .locator('.block-inner-container [aria-hidden="true"]')
        .first()
        .textContent();
    })
    .toBe('Type the title...');
});

test('Title placeholder is rendered inside the width-constrained inner container', async ({
  page,
}) => {
  await openTitleSyncPage(page, {
    contentId: 'title-sync-page-placeholder-style',
    contentTitle: 'Original title',
  });

  const editorTitle = page.locator('[data-slate-editor] h1').first();

  await editorTitle.fill('');

  await expect
    .poll(async () => {
      return editorTitle.evaluate((element) => {
        const innerContainer = element.querySelector('.block-inner-container');
        const placeholder = innerContainer?.querySelector(
          '[aria-hidden="true"]',
        ) as HTMLElement | null;

        return {
          className: element.className,
          innerContainerClassName: innerContainer?.className,
          innerContainerPosition: innerContainer
            ? window.getComputedStyle(innerContainer).position
            : null,
          placeholderText: placeholder?.textContent,
          placeholderParentClassName:
            placeholder?.parentElement?.className ?? null,
          placeholderPosition: placeholder
            ? window.getComputedStyle(placeholder).position
            : null,
        };
      });
    })
    .toEqual({
      className: expect.stringContaining('documentFirstHeading'),
      innerContainerClassName: expect.stringContaining('block-inner-container'),
      innerContainerPosition: 'relative',
      placeholderText: 'Type the title...',
      placeholderParentClassName: expect.stringContaining(
        'block-inner-container',
      ),
      placeholderPosition: 'absolute',
    });
});
