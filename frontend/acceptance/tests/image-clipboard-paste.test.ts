import { getEditorHandle, setSelection } from '@platejs/playwright';

import { createContent, createWikiPage } from './content';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import { expect, test } from './test';

const CLIPBOARD_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnSUs8AAAAASUVORK5CYII=';

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

async function pasteClipboardImage(
  page: Parameters<typeof test>[0]['page'],
  editableSelector = '.slate-editor[data-slate-editor]',
) {
  await page.locator(editableSelector).evaluate(
    (element, { base64, mimeType, name }) => {
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const file = new File([bytes], name, { type: mimeType });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const event = new Event('paste', { bubbles: true, cancelable: true });

      Object.defineProperty(event, 'clipboardData', {
        configurable: true,
        value: dataTransfer,
      });

      element.dispatchEvent(event);
    },
    {
      base64: CLIPBOARD_IMAGE_BASE64,
      mimeType: 'image/png',
      name: 'clipboard-image.png',
    },
  );
}

async function pasteIntoFirstParagraph(
  page: Parameters<typeof test>[0]['page'],
) {
  const editor = page.locator('.slate-editor[data-slate-editor]');
  const editorHandle = await getEditorHandle(page, editor);

  await setSelection(page, editorHandle, {
    anchor: { path: [1, 0], offset: 0 },
    focus: { path: [1, 0], offset: 0 },
  });

  const uploadResponsePromise = page.waitForResponse((response) => {
    return (
      response.request().method() === 'POST' &&
      response.url().includes('/++api++/') &&
      response.request().postData()?.includes('"@type":"Image"') === true
    );
  });

  await pasteClipboardImage(page);

  const uploadResponse = await uploadResponsePromise;
  const uploadPayload = (await uploadResponse.json()) as {
    '@id'?: string;
    title?: string;
  };
  const uploadedPath = uploadPayload['@id']
    ? new URL(uploadPayload['@id'], 'http://localhost').pathname
    : undefined;

  await expect
    .poll(async () => {
      return editorHandle.evaluate((currentEditor: any) => {
        const imageNode = currentEditor.children.find(
          (node: Record<string, unknown>) => node?.['@type'] === 'plateimage',
        );

        return imageNode
          ? {
              alt: imageNode.alt,
              blockType: imageNode['@type'],
              type: imageNode.type,
              url: imageNode.url,
            }
          : null;
      });
    })
    .toEqual({
      alt: uploadPayload.title ?? 'clipboard-image.png',
      blockType: 'plateimage',
      type: 'ploneBlock',
      url: uploadedPath,
    });

  return uploadResponse;
}

test.setTimeout(30_000);

test('Clipboard image paste uploads to the content base URL in edit view', async ({
  page,
}) => {
  await login(page);

  const wikiId = 'wiki-clipboard-image-edit';
  const pageId = 'clipboard-image-edit-page';
  const { contentPath } = await createWikiPage(page, {
    contentId: pageId,
    contentTitle: 'Clipboard image edit page',
    wikiId,
    transition: 'publish',
    bodyModifier: withEmptySomersaultBody,
  });

  await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);

  const uploadResponse = await pasteIntoFirstParagraph(page);

  expect(uploadResponse.url()).toContain(`/++api++${contentPath}`);
  expect(uploadResponse.url()).not.toContain(`/${pageId}/edit`);
});

test('Clipboard image paste uploads to the parent folder in add view', async ({
  page,
}) => {
  await login(page);

  const workspaceId = 'clipboard-image-add-workspace';
  await createContent(page, {
    contentType: 'Workspace',
    contentId: workspaceId,
    contentTitle: 'Clipboard image add workspace',
    transition: 'publish',
  });

  await page.goto(`/${workspaceId}/add?type=WikiPage`, {
    waitUntil: 'networkidle',
  });
  await waitForPlateEditorReady(page);

  const uploadResponse = await pasteIntoFirstParagraph(page);

  expect(uploadResponse.url()).toContain(`/++api++/${workspaceId}`);
  expect(uploadResponse.url()).not.toContain('/add?type=WikiPage');
});
