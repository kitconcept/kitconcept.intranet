import { getEditorHandle, setSelection } from '@platejs/playwright';

import { createWikiPage } from './content';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import { expect, test } from './test';

function withEmptySomersaultBody(body: Record<string, unknown>) {
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

test('Slash command inserts an image block that can resolve an existing image', async ({
  page,
}) => {
  await login(page);

  const { contentPath } = await createWikiPage(page, {
    contentId: 'slash-command-image-page',
    contentTitle: 'Slash command image page',
    wikiId: 'wiki-slash-command-image-page',
    transition: 'publish',
    bodyModifier: withEmptySomersaultBody,
  });

  await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);

  const editor = page.locator('.slate-editor[data-slate-editor]');
  const editorHandle = await getEditorHandle(page, editor);

  await setSelection(page, editorHandle, {
    anchor: { path: [1, 0], offset: 0 },
    focus: { path: [1, 0], offset: 0 },
  });

  await page.keyboard.type('/image');
  await expect(page.getByRole('option', { name: 'Image' })).toBeVisible();
  await page.keyboard.press('Enter');

  await expect(
    page.getByText('Browse the site, drop an image, or use a URL'),
  ).toBeVisible();

  await expect
    .poll(async () => {
      return editorHandle.evaluate((editor: any) => {
        const imageNode = editor.children.find(
          (node: Record<string, unknown>) => node?.['@type'] === 'plateimage',
        );

        return imageNode
          ? {
              blockWidth: imageNode.blockWidth,
              type: imageNode.type,
              blockType: imageNode['@type'],
            }
          : null;
      });
    })
    .toEqual({
      blockWidth: 'default',
      type: 'ploneBlock',
      blockType: 'plateimage',
    });
});
