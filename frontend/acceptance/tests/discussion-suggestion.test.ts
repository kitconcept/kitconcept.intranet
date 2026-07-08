import type { Page } from '@playwright/test';
import { getEditorHandle, setSelection } from '@platejs/playwright';

import { createWikiPage } from './content';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import { expect, test } from './test';

function withSomersaultDiscussionFixture({
  bodyText,
  commentText,
}: {
  bodyText: string;
  commentText: string;
}) {
  return (body: Record<string, unknown>) => {
    const title = typeof body.title === 'string' ? body.title : '';

    return {
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: title }] },
            {
              type: 'p',
              children: [
                { text: 'Discuss', comment_discussion1: true, comment: true },
                { text: bodyText.slice('Discuss'.length) },
              ],
            },
          ],
          discussions: {
            discussion1: {
              id: 'discussion1',
              comments: [
                {
                  id: 'comment1',
                  contentRich: [
                    {
                      type: 'p',
                      children: [{ text: commentText }],
                    },
                  ],
                  createdAt: '2026-04-17T09:00:00+00:00',
                  discussionId: 'discussion1',
                  isEdited: false,
                  userId: 'admin',
                },
              ],
              createdAt: '2026-04-17T09:00:00+00:00',
              documentContent: 'Discuss',
              isResolved: false,
              userId: 'admin',
            },
          },
          users: {
            admin: {
              id: 'admin',
              fullname: 'Admin',
            },
          },
        },
      },
      blocks_layout: {
        items: ['__somersault__'],
      },
    };
  };
}

function withSomersaultSuggestionFixture({
  bodyText,
  originalText,
  replacementText,
  includeUsers = true,
}: {
  bodyText: string;
  originalText: string;
  replacementText: string;
  includeUsers?: boolean;
}) {
  const suggestionId = 'suggestion1';
  const suffix = bodyText.slice(originalText.length);

  return (body: Record<string, unknown>) => {
    const title = typeof body.title === 'string' ? body.title : '';

    return {
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: title }] },
            {
              type: 'p',
              children: [
                {
                  text: originalText,
                  suggestion: true,
                  [`suggestion_${suggestionId}`]: {
                    createdAt: 1760691600000,
                    id: suggestionId,
                    type: 'remove',
                    userId: 'admin',
                  },
                },
                {
                  text: replacementText,
                  suggestion: true,
                  [`suggestion_${suggestionId}`]: {
                    createdAt: 1760691600000,
                    id: suggestionId,
                    type: 'insert',
                    userId: 'admin',
                  },
                },
                { text: suffix },
              ],
            },
          ],
          discussions: {
            [suggestionId]: {
              id: suggestionId,
              comments: [],
              createdAt: '2026-04-17T09:00:00+00:00',
              isResolved: false,
              userId: 'admin',
            },
          },
          ...(includeUsers
            ? {
                users: {
                  admin: {
                    id: 'admin',
                    fullname: 'Admin',
                  },
                },
              }
            : {}),
        },
      },
      blocks_layout: {
        items: ['__somersault__'],
      },
    };
  };
}

async function openWikiPageEditor(
  page: Page,
  {
    contentId,
    contentTitle,
    bodyModifier,
    wikiId = `wiki-${contentId}`,
  }: {
    contentId: string;
    contentTitle: string;
    bodyModifier: (body: Record<string, unknown>) => Record<string, unknown>;
    wikiId?: string;
  },
) {
  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle,
    wikiId,
    transition: 'publish',
    bodyModifier,
  });

  await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);

  return { contentPath };
}

async function selectParagraphText(
  page: Page,
  textRange: { start: number; end: number },
) {
  const editable = page.locator('.slate-editor[data-slate-editor]');
  const editorHandle = await getEditorHandle(page, editable);

  await setSelection(page, editorHandle, {
    anchor: { path: [1, 0], offset: textRange.start },
    focus: { path: [1, 0], offset: textRange.end },
  });

  await expect(
    page.getByRole('toolbar', { name: 'Editor toolbar' }),
  ).toBeVisible();
}

async function enableSuggestionMode(page: Page) {
  const toolbar = page.getByRole('toolbar', { name: 'Editor toolbar' });
  const groups = toolbar.locator(':scope > div');
  const finalGroup = groups.nth(2);

  await finalGroup.locator('button').nth(1).click();
}

test.describe('Plate discussions and suggestions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('hydrates persisted discussions from the somersault block', async ({
    page,
  }) => {
    const commentText = 'Stored comment from acceptance test';
    await openWikiPageEditor(page, {
      contentId: 'discussion-hydration',
      contentTitle: 'Discussion hydration',
      bodyModifier: withSomersaultDiscussionFixture({
        bodyText: 'Discuss this paragraph',
        commentText,
      }),
    });

    await expect(page.getByRole('button', { name: '1' })).toBeVisible();
    await page.getByRole('button', { name: '1' }).click();
    await expect(page.getByText(commentText)).toBeVisible();
  });

  test('hydrates persisted suggestions in edit mode and renders them in view mode', async ({
    page,
  }) => {
    const { contentPath } = await openWikiPageEditor(page, {
      contentId: 'suggestion-hydration',
      contentTitle: 'Suggestion hydration',
      bodyModifier: withSomersaultSuggestionFixture({
        bodyText: 'Change this paragraph',
        originalText: 'Change',
        replacementText: 'Update',
      }),
    });

    await expect(page.getByRole('button', { name: '1' })).toBeVisible();
    await expect(
      page.locator('del', { hasText: 'Change' }).first(),
    ).toBeVisible();
    await expect(
      page.locator('ins', { hasText: 'Update' }).first(),
    ).toBeVisible();

    await page.getByRole('button', { name: '1' }).click();
    const suggestionDialog = page.getByRole('dialog');
    await expect(suggestionDialog.getByText('Replace:')).toBeVisible();
    await expect(
      suggestionDialog.getByText('Change', { exact: true }),
    ).toBeVisible();
    await expect(
      suggestionDialog.getByText('Update', { exact: true }),
    ).toBeVisible();

    await page.goto(contentPath, { waitUntil: 'networkidle' });
    await expect(
      page.locator('ins', { hasText: 'Update' }).first(),
    ).toBeVisible();
    await expect(
      page.locator('del', { hasText: 'Change' }).first(),
    ).toBeVisible();
  });

  test('creates suggestions from the toolbar flow', async ({ page }) => {
    await openWikiPageEditor(page, {
      contentId: 'suggestion-current-user',
      contentTitle: 'Suggestion current user',
      bodyModifier: withSomersaultSuggestionFixture({
        bodyText: 'Change this paragraph',
        originalText: '',
        replacementText: '',
      }),
    });

    await selectParagraphText(page, { start: 0, end: 6 });
    await enableSuggestionMode(page);
    await page.keyboard.type('Update');

    await expect(page.getByRole('button', { name: '1' })).toBeVisible();
    await expect(
      page.locator('del', { hasText: 'Change' }).first(),
    ).toBeVisible();
    await expect(
      page.locator('ins', { hasText: 'Update' }).first(),
    ).toBeVisible();

    await page.getByRole('button', { name: '1' }).click();
    const suggestionDialog = page.getByRole('dialog');
    await expect(
      suggestionDialog.getByText('admin', { exact: true }),
    ).toBeVisible();
    await expect(
      suggestionDialog.getByText('Change', { exact: true }),
    ).toBeVisible();
    await expect(
      suggestionDialog.getByText('Update', { exact: true }),
    ).toBeVisible();
  });
});
