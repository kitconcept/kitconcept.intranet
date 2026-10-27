/**
 * The review's diffs, without a store: Volto's DiffField renders rich text
 * through a new Redux store and the server renderer for every diff, which
 * floods the console (redux-localstorage-simple, useLayoutEffect) and is
 * slow. Here slate becomes HTML directly, both sides are diffed word by
 * word (Volto's `diffLib`), and marked up as DiffField does (`deletion`,
 * `addition`), so the review shows exactly the values that are applied.
 */
import escape from 'lodash/escape';

const TAGS = {
  p: 'p',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  strong: 'strong',
  b: 'strong',
  em: 'em',
  i: 'em',
  u: 'u',
  s: 's',
  del: 'del',
  code: 'code',
  sub: 'sub',
  sup: 'sup',
  ul: 'ul',
  ol: 'ol',
  li: 'li',
  blockquote: 'blockquote',
};

const node = (item) => {
  if (typeof item?.text === 'string') return escape(item.text);
  const inner = (item?.children || []).map(node).join('');
  if (item?.type === 'link') {
    // No href: a click in the review must not leave the form
    const url = item.data?.url || '';
    return `<a class="ai-edit-diff-link" title="${escape(url)}">${inner}</a>`;
  }
  const tag = TAGS[item?.type];
  // Other inline elements (mentions, footnotes, ...) show their text
  return tag ? `<${tag}>${inner}</${tag}>` : `<span>${inner}</span>`;
};

/** A slate value as HTML, for the diff only. */
export const slateToHtml = (value) =>
  (Array.isArray(value) ? value : []).map(node).join('');

/** HTML split into tags, words and whitespace. */
export const tokens = (html) =>
  (html || '').match(/<[^>]+>|[^<\s]+|\s+/g) || [];

const isTag = (token) => token.startsWith('<');

/**
 * Both sides of a diff (`diffLib.diffArrays` parts) as HTML: removed words
 * marked on the left, added ones on the right; a tag shows on the side it
 * belongs to, so both sides stay well-formed.
 */
export const sides = (parts) => {
  let left = '';
  let right = '';
  parts.forEach((part) =>
    (part.value || []).forEach((token) => {
      if (part.removed) {
        left += isTag(token) ? token : `<span class="deletion">${token}</span>`;
      } else if (part.added) {
        right += isTag(token)
          ? token
          : `<span class="addition">${token}</span>`;
      } else {
        left += token;
        right += token;
      }
    }),
  );
  return { left, right };
};
