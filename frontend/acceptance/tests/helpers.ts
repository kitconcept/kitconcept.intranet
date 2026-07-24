import type { Page } from '@playwright/test';
import { getEditorHandle, setSelection } from '@platejs/playwright';

export async function selectParagraphText(
  page: Page,
  { start, end }: { start: number; end: number },
) {
  const editorHandle = await getEditorHandle(
    page,
    page.locator('.slate-editor[data-slate-editor]'),
  );

  await setSelection(page, editorHandle, {
    anchor: { path: [1, 0], offset: start },
    focus: { path: [1, 0], offset: end },
  });
}

export function withSomersaultBody(bodyText: string) {
  return (body: Record<string, unknown>) => {
    const title = typeof body.title === 'string' ? body.title : '';
    const existingBlocks =
      typeof body.blocks === 'object' && body.blocks !== null
        ? (body.blocks as Record<string, unknown>)
        : {};

    return {
      ...body,
      blocks: {
        ...existingBlocks,
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: title }] },
            { type: 'p', children: [{ text: bodyText }] },
          ],
        },
      },
    };
  };
}

export function withSomersaultLinkedBody({
  bodyText,
  href,
  linkText,
}: {
  bodyText: string;
  href: string;
  linkText: string;
}) {
  return (body: Record<string, unknown>) => {
    const title = typeof body.title === 'string' ? body.title : '';
    const suffix = bodyText.slice(linkText.length);
    const existingBlocks =
      typeof body.blocks === 'object' && body.blocks !== null
        ? (body.blocks as Record<string, unknown>)
        : {};

    return {
      ...body,
      blocks: {
        ...existingBlocks,
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: title }] },
            {
              type: 'p',
              children: [
                {
                  type: 'a',
                  url: href,
                  children: [{ text: linkText }],
                },
                { text: suffix },
              ],
            },
          ],
        },
      },
    };
  };
}
