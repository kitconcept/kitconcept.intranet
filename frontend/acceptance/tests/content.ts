import type { APIRequestContext, Page } from '@playwright/test';

export type SevenApi = 'plone' | 'guillotina';

export type SevenRequestOptions = {
  apiURL?: string;
  api?: SevenApi;
  username?: string;
  password?: string;
};

export type CreateContentParams = {
  contentType: string;
  contentId: string;
  contentTitle: string;
  contentDescription?: string;
  path?: string;
  allow_discussion?: boolean;
  transition?: string;
  bodyModifier?: (body: Record<string, unknown>) => Record<string, unknown>;
};

export type CreateWikiPageParams = {
  contentId: string;
  contentTitle: string;
  wikiId?: string;
  wikiTitle?: string;
  path?: string;
  contentDescription?: string;
  allow_discussion?: boolean;
  transition?: string;
  bodyModifier?: (body: Record<string, unknown>) => Record<string, unknown>;
};

function getRequestContext(requestOrPage: APIRequestContext | Page) {
  if ('request' in requestOrPage) return requestOrPage.request;
  return requestOrPage;
}

function getDefaultApiConfig(options: SevenRequestOptions) {
  const hostname = process.env.BACKEND_HOST || '127.0.0.1';
  const siteId = process.env.SITE_ID || 'plone';

  const api =
    options.api || (process.env.API === 'guillotina' ? 'guillotina' : 'plone');

  const apiURL =
    options.apiURL ||
    (api === 'guillotina'
      ? `http://${hostname}:8081/db/web`
      : process.env.API_PATH || `http://${hostname}:55001/${siteId}`);

  const username =
    options.username || (api === 'guillotina' ? 'root' : 'admin');
  const password =
    options.password || (api === 'guillotina' ? 'root' : 'secret');

  return { api, apiURL, username, password };
}

function basicAuthHeader(username: string, password: string) {
  const token = Buffer.from(`${username}:${password}`, 'utf8').toString(
    'base64',
  );
  return `Basic ${token}`;
}

function normalizePath(value?: string) {
  if (!value) return '';
  return value.replace(/^\/+/, '').replace(/\/+$/, '');
}

export async function createContent(
  requestOrPage: APIRequestContext | Page,
  {
    contentType,
    contentId,
    contentTitle,
    contentDescription = '',
    path = '',
    allow_discussion = false,
    transition = '',
    bodyModifier = (body) => body,
  }: CreateContentParams,
  requestOptions: SevenRequestOptions = {},
) {
  const request = getRequestContext(requestOrPage);
  const { api, apiURL, username, password } =
    getDefaultApiConfig(requestOptions);

  const authHeader = basicAuthHeader(username, password);
  const normalizedPath = normalizePath(path);
  const containerUrl = `${apiURL}/${normalizedPath}`;

  const defaultBody: Record<string, unknown> = {
    '@type': contentType,
    id: contentId,
    title: contentTitle,
    description: contentDescription,
    allow_discussion,
  };

  let body: Record<string, unknown> = defaultBody;

  if (api === 'plone') {
    if (
      ['Document', 'News Item', 'Folder', 'CMSFolder', 'WikiPage'].includes(
        contentType,
      )
    ) {
      body = bodyModifier({
        ...defaultBody,
        blocks: {
          'd3f1c443-583f-4e8e-a682-3bf25752a300': { '@type': 'title' },
          '7624cf59-05d0-4055-8f55-5fd6597d84b0': { '@type': 'slate' },
        },
        blocks_layout: {
          items: [
            'd3f1c443-583f-4e8e-a682-3bf25752a300',
            '7624cf59-05d0-4055-8f55-5fd6597d84b0',
          ],
        },
      });
    } else {
      body = bodyModifier({
        '@type': contentType,
        id: contentId,
        title: contentTitle,
        allow_discussion,
      });
    }
  } else {
    body = bodyModifier(defaultBody);
  }

  const response = await request.post(containerUrl, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    data: body,
  });

  if (!response.ok()) {
    console.log(response.statusText());
    throw new Error(
      `Create content failed: POST ${containerUrl} returned ${response.status()} ${response.statusText()}`,
    );
  }

  if (transition) {
    const normalizedId = normalizePath(contentId);
    const url = `${apiURL}/${normalizedPath}/${normalizedId}/@workflow/${transition}`;

    const transitionResponse = await request.post(url, {
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
    });

    if (!transitionResponse.ok()) {
      throw new Error(
        `Workflow transition failed: POST ${url} returned ${transitionResponse.status()} ${transitionResponse.statusText()}`,
      );
    }
  }

  return response;
}

export async function createWikiPage(
  requestOrPage: APIRequestContext | Page,
  {
    contentId,
    contentTitle,
    wikiId = `wiki-${contentId}`,
    wikiTitle = 'Wiki',
    path = '',
    contentDescription = '',
    allow_discussion = false,
    transition = '',
    bodyModifier = (body) => body,
  }: CreateWikiPageParams,
  requestOptions: SevenRequestOptions = {},
) {
  const normalizedPath = normalizePath(path);
  const wikiPath = [normalizedPath, wikiId].filter(Boolean).join('/');

  await createContent(
    requestOrPage,
    {
      contentType: 'Workspace',
      contentId: wikiId,
      contentTitle: wikiTitle,
      path,
      transition: 'publish',
    },
    requestOptions,
  );

  const response = await createContent(
    requestOrPage,
    {
      contentType: 'WikiPage',
      contentId,
      contentTitle,
      contentDescription,
      path: wikiPath,
      allow_discussion,
      transition,
      bodyModifier,
    },
    requestOptions,
  );

  return {
    response,
    wikiId,
    wikiPath: `/${wikiPath}`,
    contentPath: `/${wikiPath}/${contentId}`,
  };
}
