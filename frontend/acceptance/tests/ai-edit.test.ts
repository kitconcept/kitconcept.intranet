import type { Page, Route } from '@playwright/test';

import { createContent } from './content';
import { login } from './login';
import { expect, test } from './test';

// The AI assistant in the edit form (AI_WORKFLOW.md, AI_EDIT_PLAN.md). The
// acceptance backend has a fake LLM endpoint configured (Makefile,
// Dockerfile.acceptance); `@ai-edit` itself is mocked in the browser, so no
// LLM is ever called.

test.setTimeout(30_000);

const API_URL =
  process.env.API_PATH ||
  `http://${process.env.BACKEND_HOST || '127.0.0.1'}:55001/${process.env.SITE_ID || 'plone'}`;
const AUTH = `Basic ${Buffer.from('admin:secret').toString('base64')}`;

const paragraph = (text: string) => ({
  '@type': 'slate',
  plaintext: text,
  value: [{ type: 'p', children: [{ text }] }],
});

// Refs as the harness assigns them: b1 title, b2 and b3 text
const withBlocks = (body: Record<string, unknown>) => ({
  ...body,
  blocks: {
    'ai-title': { '@type': 'title' },
    'ai-first': paragraph('We was founded in 2015.'),
    'ai-second': paragraph('Old text.'),
  },
  blocks_layout: { items: ['ai-title', 'ai-first', 'ai-second'] },
});

const toolCall = (operations: unknown[], id = 'call_1') => ({
  id,
  type: 'function',
  function: {
    name: 'propose_changes',
    arguments: JSON.stringify({ operations }),
  },
});

const answer = (operations: unknown[], id?: string) => ({
  message: 'Here are my proposals.',
  tool_calls: [toolCall(operations, id)],
  finish_reason: 'tool_calls',
  usage: {},
  error: null,
  error_code: null,
});

/** Mock `@ai-edit`: GET says available, POSTs answer from the list. */
async function mockAssistant(page: Page, answers: unknown[]) {
  const requests: Record<string, any>[] = [];
  await page.route('**/@ai-edit', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          available: true,
          error_code: null,
          context_length: null,
          reserve_tokens: 8000,
          fixed_prompt_chars: 5000,
        },
      });
      return;
    }
    requests.push(route.request().postDataJSON());
    await route.fulfill({ json: answers.shift() });
  });
  return requests;
}

async function openAssistant(page: Page) {
  // The registry toggle; the test's database is reset afterwards
  const response = await page.request.patch(
    `${API_URL}/@controlpanels/intranet-settings`,
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: AUTH,
      },
      data: { enable_ai_edit: true },
    },
  );
  expect(response.ok()).toBeTruthy();
  await createContent(page, {
    contentType: 'Document',
    contentId: 'ai-page',
    contentTitle: 'AI page',
    bodyModifier: withBlocks,
  });
  await login(page);
  await page.goto('/ai-page/edit', { waitUntil: 'networkidle' });
  await page
    .locator('#sidebar .ui.menu .item')
    .getByText('AI', { exact: true })
    .click();
  await expect(page.getByLabel('Ask about this page…')).toBeVisible();
}

async function ask(page: Page, text: string) {
  const input = page.getByLabel('Ask about this page…');
  await input.fill(text);
  await input.press('Enter');
}

test('proposes changes, reviews them and applies the selected ones', async ({
  page,
}) => {
  const requests = await mockAssistant(page, [
    answer([
      {
        op: 'edit_block',
        block: 'b2',
        fields: { text: 'We were founded in 2015.' },
        reason: 'Subject and verb agree.',
        category: 'grammar',
      },
      {
        op: 'delete_block',
        block: 'b3',
        reason: 'Obsolete.',
        category: 'outdated',
      },
    ]),
  ]);
  await openAssistant(page);
  await ask(page, 'Fix the grammar');

  await expect(page.getByText('2 changes proposed')).toBeVisible();

  // Selecting a block (to ask about it) keeps the AI tab open: Volto would
  // switch to the Block tab
  await page.locator('.blocks-form').getByText('Old text.').click();
  await expect(page.getByLabel('Ask about this page…')).toBeVisible();
  await expect(page.getByText('2 changes proposed')).toBeVisible();

  const [request] = requests;
  // The request carries its selection (D39): the form's own initial
  // selection does not count
  expect(request.messages.at(-1)).toEqual({
    role: 'user',
    content: 'Selected: none\n\nFix the grammar',
  });
  expect(
    request.page.blocks.map((block: { ref: string; type: string }) => [
      block.ref,
      block.type,
    ]),
  ).toEqual([
    ['b1', 'title'],
    ['b2', 'slate'],
    ['b3', 'slate'],
  ]);
  expect(request.page.blocks[1].fields.text).toBe('We was founded in 2015.');
  expect(request.block_types.slate.insertable).toBe(true);

  await page.getByRole('button', { name: 'Review changes' }).click();
  const modal = page.locator('.ai-edit-modal');
  const edit = modal.locator('.ai-edit-change', { hasText: 'Block b2: text' });
  const deletion = modal.locator('.ai-edit-change', {
    hasText: 'Delete block b3',
  });
  await expect(edit.getByText('Subject and verb agree.')).toBeVisible();
  await expect(edit.getByRole('checkbox')).toBeChecked();
  // Deletes start unselected (D20)
  await expect(deletion.getByRole('checkbox')).not.toBeChecked();
  // b3 was selected above: its sidebar wrote schema defaults into it
  // (theme), which must not make the delete stale (D30)
  await expect(deletion.getByRole('checkbox')).toBeEnabled();
  await expect(deletion.getByText(/can no longer be applied/)).toHaveCount(0);

  await modal.getByRole('button', { name: 'Apply selected' }).click();
  await expect(modal).toBeHidden();
  const editor = page.locator('.blocks-form');
  await expect(editor.getByText('We were founded in 2015.')).toBeVisible();
  await expect(editor.getByText('Old text.')).toBeVisible();
  await expect(page.getByText('Partially applied (1 of 2)')).toBeVisible();
});

test('asks the model once to repair invalid operations', async ({ page }) => {
  const requests = await mockAssistant(page, [
    answer([
      {
        op: 'edit_block',
        block: 'b9',
        fields: { text: 'Lost.' },
        reason: 'Typo.',
        category: 'spelling',
      },
    ]),
    answer(
      [
        {
          op: 'edit_block',
          block: 'b2',
          fields: { text: 'We were founded in 2015.' },
          reason: 'Typo.',
          category: 'spelling',
        },
      ],
      'call_2',
    ),
  ]);
  await openAssistant(page);
  await ask(page, 'Fix the typos');

  await expect(page.getByText('1 change proposed')).toBeVisible();
  expect(requests).toHaveLength(2);
  const repair = requests[1];
  expect(repair.repair).toBe(true);
  expect(repair.messages.at(-1).role).toBe('tool');
  expect(repair.messages.at(-1).content).toContain('There is no block b9.');
});
