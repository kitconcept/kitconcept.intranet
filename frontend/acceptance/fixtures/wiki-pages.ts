/**
 * Wiki Pages for the table and history-diff tests.
 *
 * The backend is reset around every test, so each test creates exactly the
 * page it needs through the REST API instead of relying on the demo pages of
 * the example content. The content comes from the same demo modules
 * (`wiki-tables.json`, `wiki-diff.json`, exported by
 * `backend/scripts/export_acceptance_fixtures.py`), so tests and demo match.
 */
import type { APIRequestContext, Page } from '@playwright/test';

import { createWikiPage } from '../tests/content';
import diffFixture from './wiki-diff.json';
import tableFixtures from './wiki-tables.json';

type Blocks = Record<string, unknown>;
type PlateNode = {
  type?: string;
  children?: PlateNode[];
  [key: string]: unknown;
};

export const SOMERSAULT_KEY = '__somersault__';

export type TablePageId =
  | 'projektbudget-2026'
  | 'teilnehmende-konsortialtreffen';

/** Tables on the demo pages, in page order (for `nth()` locators). */
export const TABLES = {
  'projektbudget-2026': { budget: 0, milestones: 1 },
  'teilnehmende-konsortialtreffen': {
    contacts: 0,
    attendance: 1,
    openItems: 2,
    agenda: 3,
  },
} as const;

function apiConfig() {
  const hostname = process.env.BACKEND_HOST || '127.0.0.1';
  const siteId = process.env.SITE_ID || 'plone';
  const apiURL = process.env.API_PATH || `http://${hostname}:55001/${siteId}`;
  const auth = Buffer.from('admin:secret', 'utf8').toString('base64');
  return { apiURL, authorization: `Basic ${auth}` };
}

function requestOf(requestOrPage: APIRequestContext | Page) {
  return 'request' in requestOrPage ? requestOrPage.request : requestOrPage;
}

/** PATCH a content object through the REST API (as admin). */
export async function patchContent(
  requestOrPage: APIRequestContext | Page,
  path: string,
  data: Record<string, unknown>,
) {
  const { apiURL, authorization } = apiConfig();
  const url = `${apiURL}${path}`;
  const response = await requestOf(requestOrPage).patch(url, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authorization,
    },
    data,
  });
  if (!response.ok()) {
    throw new Error(`PATCH ${url} returned ${response.status()}`);
  }
  return response;
}

/** GET a content object through the REST API (as admin). */
export async function getContent(
  requestOrPage: APIRequestContext | Page,
  path: string,
) {
  const { apiURL, authorization } = apiConfig();
  const response = await requestOf(requestOrPage).get(`${apiURL}${path}`, {
    headers: { Accept: 'application/json', Authorization: authorization },
  });
  if (!response.ok()) {
    throw new Error(`GET ${apiURL}${path} returned ${response.status()}`);
  }
  return response.json();
}

/** The Plate value stored in a Wiki Page's somersault block. */
export async function getWikiValue(
  requestOrPage: APIRequestContext | Page,
  path: string,
): Promise<PlateNode[]> {
  const content = await getContent(requestOrPage, path);
  return content.blocks[SOMERSAULT_KEY].value;
}

function withBlocks(blocks: Blocks, blocksLayout: Blocks) {
  return (body: Record<string, unknown>) => ({
    ...body,
    blocks,
    blocks_layout: blocksLayout,
  });
}

/** Creates one of the two table demo pages (published). */
export async function createTablePage(page: Page, id: TablePageId) {
  const fixture = tableFixtures.find((item) => item.id === id);
  if (!fixture) throw new Error(`No table fixture ${id}`);
  const { contentPath } = await createWikiPage(page, {
    contentId: fixture.id,
    contentTitle: fixture.title,
    transition: 'publish',
    bodyModifier: withBlocks(fixture.blocks, fixture.blocks_layout),
  });
  return { contentPath, title: fixture.title };
}

/**
 * Creates a Wiki Page holding `value` after the title (published).
 *
 * Unlike volto-plate's `createNativeBlocksPage` (`./pages`), the page keeps
 * the title block in `blocks` that `blocks_layout` lists, so it can be saved
 * in the editor: a page whose layout lists blocks that are missing crashes on
 * Save ("Cannot read properties of undefined (reading '@type')").
 */
export async function createWikiPageWithValue(
  page: Page,
  {
    contentId,
    title,
    value,
  }: { contentId: string; title: string; value: PlateNode[] },
) {
  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle: title,
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      blocks: {
        ...(body.blocks as Blocks),
        [SOMERSAULT_KEY]: {
          '@type': SOMERSAULT_KEY,
          value: [{ type: 'title', children: [{ text: title }] }, ...value],
        },
      },
    }),
  });
  return { contentPath };
}

/**
 * Creates the history-diff demo page "Jour fixe KW 38" and applies the three
 * demo edits with their change notes, so it has four versions (0-3).
 */
export async function createDiffPage(page: Page) {
  const { contentPath } = await createWikiPage(page, {
    contentId: diffFixture.id,
    contentTitle: diffFixture.title,
    transition: 'publish',
    bodyModifier: withBlocks(diffFixture.blocks, diffFixture.blocks_layout),
  });
  for (const edit of diffFixture.edits) {
    await patchContent(page, contentPath, {
      blocks: edit.blocks,
      changeNote: edit.changeNote,
    });
  }
  return {
    contentPath,
    title: diffFixture.title,
    notes: diffFixture.edits.map((edit) => edit.changeNote),
  };
}
