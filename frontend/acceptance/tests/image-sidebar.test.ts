import { expect, test } from './test';
import { login } from './login';
import { createWikiPage } from './content';
import { waitForPlateEditorReady } from './plate';
import { getEditorHandle, getNodeByPath } from '@platejs/playwright';

const PAGE_ID = 'image-sidebar-page';
const DATA_URI =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

test.setTimeout(30_000);

async function getInheritedBlockWidth(locator: {
  evaluate: (pageFunction: (element: Element) => string) => Promise<string>;
}) {
  return locator.evaluate((element) => {
    let current: HTMLElement | null = element as HTMLElement;

    while (current) {
      const value = getComputedStyle(current).getPropertyValue('--block-width');
      if (value.trim()) return value.trim();
      current = current.parentElement;
    }

    return '';
  });
}

async function getRootVariable(
  page: Parameters<typeof test>[0]['page'],
  name: string,
) {
  return page.evaluate((variableName) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
  }, name);
}

function withSomersaultImageBody(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title : '';

  return {
    ...body,
    blocks: {
      __somersault__: {
        '@type': '__somersault__',
        value: [
          { type: 'title', children: [{ text: title }] },
          { type: 'p', children: [{ text: 'Text before image' }] },
          {
            type: 'ploneBlock',
            url: DATA_URI,
            alt: 'Inline test image',
            '@type': 'plateimage',
            children: [{ text: '' }],
          },
          { type: 'p', children: [{ text: 'Text after image' }] },
        ],
      },
    },
  };
}

async function openImageSidebarPage(
  page: Parameters<typeof test>[0]['page'],
  {
    contentId = PAGE_ID,
    contentTitle = 'Image sidebar page',
    wikiId = `wiki-${contentId}`,
  }: {
    contentId?: string;
    contentTitle?: string;
    wikiId?: string;
  } = {},
) {
  await login(page);
  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle,
    wikiId,
    transition: 'publish',
    bodyModifier: withSomersaultImageBody,
  });

  await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);
}

async function openSelectedImageBlockSidebar(
  page: Parameters<typeof test>[0]['page'],
) {
  const editorHandle = await getEditorHandle(
    page,
    page.locator('.slate-editor[data-slate-editor]'),
  );

  const imageNodeHandle = await getNodeByPath(page, editorHandle, [2]);
  const imageNode = (await imageNodeHandle.jsonValue()) as Record<
    string,
    unknown
  >;

  expect(imageNode.type).toBe('ploneBlock');
  expect(imageNode['@type']).toBe('plateimage');

  const editorImage = page.locator(
    '.slate-editor img[alt="Inline test image"]',
  );
  const imageBlock = editorImage.locator(
    'xpath=ancestor::*[@data-slate-node="element"][1]',
  );
  const blockTab = page.locator('#sidebar .formtabs').getByRole('button', {
    name: 'Block',
    exact: true,
  });
  const altTextField = page.locator('#sidebar-properties').getByRole('textbox', {
    name: 'Alt text',
  });

  await expect(editorImage).toBeVisible();
  await expect(imageBlock).toBeVisible();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await editorImage.click({ force: true });
    await imageBlock.click({ force: true });
    await blockTab.click({ force: true });

    try {
      await expect(altTextField).toBeVisible({ timeout: 3000 });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }

  return {
    editorHandle,
    editorImage,
    imageBlock,
  };
}

test('Selecting a Volto-adapted Plate image shows the sidebar form', async ({
  page,
}) => {
  await openImageSidebarPage(page);
  await expect(page.locator('#sidebar-properties').getByLabel('Alt text')).toHaveCount(0);
  await openSelectedImageBlockSidebar(page);
  await expect(
    page.locator('#sidebar-properties').getByLabel('Alt text'),
  ).toHaveValue('Inline test image');
});

test('Changing Block width in the sidebar updates the rendered image width', async ({
  page,
}) => {
  await openImageSidebarPage(page, {
    contentId: 'image-sidebar-block-width-page',
    contentTitle: 'Image sidebar block width page',
  });

  const { editorHandle, imageBlock } = await openSelectedImageBlockSidebar(page);

  await expect(imageBlock).toBeVisible();
  const blockWidthField = page.getByRole('radiogroup', { name: 'Block width' });
  await expect(blockWidthField).toBeVisible();

  await blockWidthField
    .getByRole('radio', { name: 'Narrow' })
    .check({ force: true });

  const expectedWidth = await getRootVariable(page, '--narrow-container-width');

  await expect(imageBlock).toHaveAttribute(
    'style',
    /--block-width:\s*var\(--narrow-container-width\)/,
  );

  await expect
    .poll(async () => {
      const imageNodeHandle = await getNodeByPath(page, editorHandle, [2]);
      const imageNode = (await imageNodeHandle.jsonValue()) as Record<
        string,
        unknown
      >;

      return imageNode.blockWidth;
    })
    .toBe('narrow');

  await expect
    .poll(async () => getInheritedBlockWidth(imageBlock))
    .toBe(expectedWidth);
});
