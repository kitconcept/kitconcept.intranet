/**
 * Conversion between slate values and Markdown for the AI assistant (spec
 * §6, AI_WORKFLOW.md). Part of the harness: no React, no Volto registry.
 *
 * slate -> Markdown: a small serializer for what the model needs to see
 * (paragraphs, headings, lists, blockquotes, bold, italic, strikethrough,
 * inline code and links). Other block nodes are reduced to their text.
 *
 * Markdown -> slate: remark parses the Markdown into a syntax tree (mdast),
 * which is transformed into volto-slate nodes. The Markdown comes from the
 * model: link URLs are restricted to safe schemes.
 *
 * Inline nodes Markdown cannot express are written as numbered
 * placeholders, `[text](<kind>:N)`: links as `[text](link:3)`, any other
 * inline element (underline, a mention, a custom node) as `[text](u:4)`,
 * `[text](mention:5)`, ... The model sees and may change the text, never
 * the node: no URL, no target, no internal link objects. `links`, the
 * registry, maps the numbers to the original nodes (without children) and
 * restores them exactly on the way back; the panel keeps one registry for
 * the whole conversation, so a node keeps its number. (The name `links`
 * stays from when links were the only kind.)
 *
 * Only text that survives the round trip (`isRoundTripSafe`) is rewritten
 * by the assistant.
 */
import isEqual from 'lodash/isEqual';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { gfmStrikethrough } from 'micromark-extension-gfm-strikethrough';
import { gfmStrikethroughFromMarkdown } from 'mdast-util-gfm-strikethrough';

// slate -> Markdown

const INLINE_WRAPPERS = {
  strong: '**',
  b: '**',
  em: '*',
  i: '*',
  del: '~~',
};

const PLACEHOLDER_RE = /^([a-z][\w-]*):(\d+)$/i;

/** The placeholder kind of an inline element: links are `link`. */
const kindOf = (node) =>
  node.type === 'a' || node.type === 'link' ? 'link' : node.type;

// Registry -> {numbers: node key -> number, size, max}: a reverse index, so
// numbering a placeholder doesn't serialize the whole registry each time.
// Rebuilt when the registry changed elsewhere (e.g. a copy was extended).
const indexes = new WeakMap();

const indexOf = (links) => {
  const size = Object.keys(links).length;
  let index = indexes.get(links);
  if (!index || index.size !== size) {
    index = { numbers: new Map(), size, max: 0 };
    Object.entries(links).forEach(([number, node]) => {
      index.numbers.set(JSON.stringify(node), number);
      index.max = Math.max(index.max, Number(number));
    });
    indexes.set(links, index);
  }
  return index;
};

/** The number of a node in the registry; a new node gets the next one. */
const placeholderNumber = (links, node) => {
  const { children, ...rest } = node;
  const key = JSON.stringify(rest);
  const index = indexOf(links);
  const known = index.numbers.get(key);
  if (known) return known;
  index.max += 1;
  const next = String(index.max);
  links[next] = rest;
  index.numbers.set(key, next);
  index.size += 1;
  return next;
};

/**
 * Inline code: the text stays literal (no escapes inside a code span). The
 * fence is longer than any run of backticks in the text, and a space pads
 * text that starts or ends with a backtick, or with spaces on both sides
 * (CommonMark strips one space from each side).
 */
const codeSpan = (text) => {
  const longest = Math.max(
    0,
    ...(text.match(/`+/g) || []).map((m) => m.length),
  );
  const fence = '`'.repeat(longest + 1);
  const pad =
    /^`|`$/.test(text) || (/^ [\s\S]* $/.test(text) && text.trim()) ? ' ' : '';
  return `${fence}${pad}${text}${pad}${fence}`;
};

const isTextNode = (node) => typeof node?.text === 'string';

const isPlainCode = (node) =>
  node.type === 'code' && (node.children || []).every(isTextNode);

/**
 * Escape page text, so that e.g. `*Pflichtfeld*` or `[1]` stays text when
 * the Markdown is parsed back. Line breaks inside a paragraph become hard
 * breaks (`\` at the line end) so they survive as well.
 *
 * As few backslashes as possible: models copy them into the JSON arguments
 * of their tool call, where `\&` or `\*` is an invalid escape, and the LLM
 * server then drops the whole call (an empty answer). `&` and `<` are only
 * escaped where they would start an entity (`&amp;`) or a tag (`<b`).
 */
const escapeText = (text) =>
  text
    .replace(/([\\`*_[\]~]|&(?=#?[A-Za-z0-9]+;)|<(?=[A-Za-z/!?]))/g, '\\$1')
    .replace(/\n/g, '\\\n');

/**
 * Escape what would start a heading, quote or list at the beginning of a
 * line (`# 5 tickets`, `1. Preis: 500€`, `- 3 °C`).
 */
const escapeLineStart = (markdown) =>
  markdown
    .replace(/^(\s*)(\d+)([.)])(?=\s|$)/gm, '$1$2\\$3')
    .replace(/^(\s*)([#>+-])/gm, '$1\\$2');

/**
 * Wrap text in an emphasis marker. Leading and trailing whitespace (and hard
 * breaks) go outside the markers: `**Note: **` is no emphasis in Markdown,
 * `**Note:** ` is.
 */
const wrap = (text, marker) => {
  const [, lead, core, trail] = /^((?:\s|\\\n)*)([\s\S]*?)((?:\s|\\\n)*)$/.exec(
    text,
  );
  return core ? `${lead}${marker}${core}${marker}${trail}` : text;
};

const inlineToMarkdown = (nodes = [], links) =>
  nodes
    .map((node) => {
      if (typeof node.text === 'string') {
        let text = escapeText(node.text);
        // Marks stored on leaves (not used by default volto-slate, but cheap)
        if (node.bold) text = wrap(text, '**');
        if (node.italic) text = wrap(text, '*');
        return text;
      }
      if (isPlainCode(node)) {
        return codeSpan(node.children.map((child) => child.text).join(''));
      }
      const inner = inlineToMarkdown(node.children, links);
      const wrapper = INLINE_WRAPPERS[node.type];
      if (wrapper) return wrap(inner, wrapper);
      // Anything else inline: a placeholder that keeps the node
      return `[${inner}](${kindOf(node)}:${placeholderNumber(links, node)})`;
    })
    .join('');

/**
 * A nested list is indented by the width of its parent item's marker
 * (`- ` is 2 columns, `1. ` 3, `10. ` 4); less makes it a new list.
 */
const listToMarkdown = (node, indent, links) =>
  (node.children || [])
    .map((item, index) => {
      const marker = node.type === 'ol' ? `${index + 1}.` : '-';
      const nestedIndent = indent + ' '.repeat(marker.length + 1);
      const inline = (item.children || []).filter(
        (child) => child.type !== 'ul' && child.type !== 'ol',
      );
      const nested = (item.children || []).filter(
        (child) => child.type === 'ul' || child.type === 'ol',
      );
      return [
        `${indent}${marker} ${escapeLineStart(inlineToMarkdown(inline, links))}`,
        ...nested.map((list) => listToMarkdown(list, nestedIndent, links)),
      ].join('\n');
    })
    .join('\n');

const blockToMarkdown = (node, links) => {
  const heading = /^h([1-6])$/.exec(node.type || '');
  if (heading) {
    // A trailing `#` would be read as the optional closing sequence
    const text = inlineToMarkdown(node.children, links).replace(
      /(^|\s)(#+\s*)$/,
      '$1\\$2',
    );
    return `${'#'.repeat(Number(heading[1]))} ${text}`;
  }
  switch (node.type) {
    case 'ul':
    case 'ol':
      return listToMarkdown(node, '', links);
    case 'blockquote':
      return `> ${escapeLineStart(inlineToMarkdown(node.children, links))}`;
    case 'p':
      return escapeLineStart(inlineToMarkdown(node.children, links));
    default:
      // Tables, images, callouts, ...: the model only gets their text (the
      // round trip fails, so such text is never rewritten).
      return slateToPlaintext([node]);
  }
};

/**
 * `links`: the link registry (number -> link node), extended with the links
 * of `value`.
 */
export const slateToMarkdown = (value = [], links = {}) =>
  value
    .map((node) => blockToMarkdown(node, links))
    .filter((text) => text.trim())
    .join('\n\n');

// Markdown -> slate

const EMPHASIS_MARKERS = ['**', '__', '*', '_'];

/**
 * Models sometimes wrap a whole multi-paragraph text in one emphasis marker
 * (`**First paragraph\n\nLast paragraph**`). Emphasis cannot span blank
 * lines in Markdown, so the markers would end up as literal text. Move the
 * marker onto each paragraph instead (headings, lists and quotes are left
 * alone).
 *
 * Only when the marker occurs nowhere else: `*Intro*\n\n*Outro*` starts
 * and ends with a marker too, but is already valid.
 */
export const fixSpanningEmphasis = (markdown) => {
  const text = markdown.trim();
  const marker = EMPHASIS_MARKERS.find(
    (m) => text.startsWith(m) && text.endsWith(m) && text.length > 2 * m.length,
  );
  if (!marker || !/\n\s*\n/.test(text)) return markdown;
  const inner = text.slice(marker.length, -marker.length).trim();
  if (inner.includes(marker)) return markdown;
  return inner
    .split(/\n\s*\n/)
    .map((paragraph) => {
      const p = paragraph.trim();
      return !p || /^(#|>|[-*+]\s|\d+[.)]\s)/.test(p)
        ? p
        : `${marker}${p}${marker}`;
    })
    .join('\n\n');
};

/**
 * Only allow link URLs that cannot run code: http(s), mailto, tel and
 * relative URLs (no scheme). Anything else (`javascript:`, `data:`, ...)
 * is dropped and the link text kept.
 */
const SAFE_URL_RE = /^(https?:|mailto:|tel:|[^:]*$)/i;

export const isSafeUrl = (url = '') =>
  // Browsers ignore control characters and whitespace in the scheme
  // eslint-disable-next-line no-control-regex
  SAFE_URL_RE.test(url.replace(/[\u0000-\u0020]/g, '').split(/[/?#]/)[0]);

const ensureChildren = (children) =>
  children.length > 0 ? children : [{ text: '' }];

/**
 * volto-slate list items and quotes hold inline content directly: unwrap
 * the paragraphs remark creates and keep a line break between them.
 */
const unwrapParagraphs = (children) => {
  const result = [];
  let previousWasParagraph = false;
  children.forEach((child) => {
    if (child.type === 'p') {
      if (previousWasParagraph) result.push({ text: '\n' });
      result.push(...child.children);
      previousWasParagraph = true;
    } else {
      result.push(child);
      previousWasParagraph = false;
    }
  });
  return result;
};

/**
 * Transform an mdast node into volto-slate node(s). Unknown node types are
 * replaced by their transformed children.
 */
const transform = (node, links) => {
  const children = (node.children || [])
    .map((child) => transform(child, links))
    .flat()
    .filter(Boolean);

  switch (node.type) {
    case 'root':
      return children;
    case 'heading':
      // Text blocks have no h1 (same rule as pasting HTML): use h2
      return {
        type: `h${Math.min(Math.max(node.depth, 2), 6)}`,
        children: ensureChildren(children),
      };
    case 'paragraph':
      return { type: 'p', children: ensureChildren(children) };
    case 'blockquote':
      return {
        type: 'blockquote',
        children: ensureChildren(unwrapParagraphs(children)),
      };
    case 'list':
      return { type: node.ordered ? 'ol' : 'ul', children };
    case 'listItem':
      return {
        type: 'li',
        children: ensureChildren(unwrapParagraphs(children)),
      };
    case 'strong':
      return { type: 'strong', children: ensureChildren(children) };
    case 'emphasis':
      return { type: 'em', children: ensureChildren(children) };
    case 'delete':
      return { type: 'del', children: ensureChildren(children) };
    case 'link': {
      // A placeholder: the original node, when number and kind match (so a
      // new `tel:123` link is not mistaken for one); an unknown `link:N`
      // keeps the text
      const [, kind, number] = PLACEHOLDER_RE.exec(node.url || '') || [];
      const original = number && links[number];
      if (original && kindOf(original) === kind) {
        return { ...original, children: ensureChildren(children) };
      }
      if (kind === 'link') return children;
      // A new link written by the model
      return isSafeUrl(node.url)
        ? {
            type: 'link',
            data: { url: node.url },
            children: ensureChildren(children),
          }
        : children;
    }
    case 'inlineCode':
      return { type: 'code', children: [{ text: node.value || '' }] };
    case 'text':
    case 'html':
      return { text: node.value || '' };
    case 'code':
      // A code block (``` or indented) has its text in `value`, no
      // children: keep it as a paragraph of plain text
      return { type: 'p', children: [{ text: node.value || '' }] };
    case 'break':
      return { text: '\n' };
    case 'thematicBreak':
    case 'image':
      return null;
    default:
      return children;
  }
};

/**
 * Merge adjacent plain text nodes (as Slate's normalization would), so the
 * result equals the original value when nothing changed.
 */
const mergeTexts = (nodes) =>
  nodes.reduce((result, node) => {
    const previous = result[result.length - 1];
    const isPlain = (n) =>
      typeof n?.text === 'string' && Object.keys(n).length === 1;
    if (isPlain(node) && isPlain(previous)) {
      result[result.length - 1] = { text: previous.text + node.text };
    } else if (node.children) {
      result.push({ ...node, children: mergeTexts(node.children) });
    } else {
      result.push(node);
    }
    return result;
  }, []);

const isBlockElement = (node) =>
  node && /^(p|h[1-6]|ul|ol|blockquote)$/.test(node.type);

/**
 * CommonMark plus GFM strikethrough (`~~`), the only extension the slate ->
 * Markdown direction writes. Not all of GFM: its autolink literals would turn
 * every plain URL or e-mail address into a link on the way back.
 */
function remarkStrikethrough() {
  const data = this.data();
  (data.micromarkExtensions ||= []).push(gfmStrikethrough());
  (data.fromMarkdownExtensions ||= []).push(gfmStrikethroughFromMarkdown());
}

const processor = unified().use(remarkParse).use(remarkStrikethrough);

const parseTree = (markdown) =>
  processor.runSync(processor.parse(fixSpanningEmphasis(markdown)));

const urlsOf = (tree) => {
  const urls = [];
  const walk = (node) => {
    if (node.type === 'link') urls.push(node.url || '');
    (node.children || []).forEach(walk);
  };
  walk(tree);
  return urls;
};

/** `links`: the link registry the placeholders refer to. */
export const markdownToSlate = (markdown = '', links = {}) =>
  slateFromTree(parseTree(markdown), links);

/**
 * Markdown parsed once: its slate nodes and the URLs of its links
 * (placeholders included), for the checks of the model's text.
 */
export const parseMarkdown = (markdown = '', links = {}) => {
  const tree = parseTree(markdown);
  return { nodes: slateFromTree(tree, links), urls: urlsOf(tree) };
};

function slateFromTree(tree, links) {
  const nodes = [transform(tree, links)].flat().filter(Boolean);

  // Top level must be block elements: wrap loose inline/text nodes in a <p>
  const blocks = [];
  let inline = [];
  const flushInline = () => {
    if (inline.length) blocks.push({ type: 'p', children: inline });
    inline = [];
  };
  nodes.forEach((node) => {
    if (isBlockElement(node)) {
      flushInline();
      blocks.push(node);
    } else {
      inline.push(node);
    }
  });
  flushInline();
  return blocks.length
    ? mergeTexts(blocks)
    : [{ type: 'p', children: [{ text: '' }] }];
}

/** A node's text the way volto-slate's `serializeNodesToText` builds it. */
const concatenated = (node) =>
  isTextNode(node)
    ? node.text.trim()
    : (node.children || []).map(concatenated).join(' ');

/**
 * The `plaintext` Volto stores next to a slate value: the same result as
 * volto-slate's `serializeNodesToText` (which needs React), so assistant
 * edits and hand edits store the same text.
 */
export const slateToPlaintext = (value) =>
  (value || []).map(concatenated).join('\n');

// Round trip

// Element types the way back writes differently but that render the same
const EQUIVALENT_TYPES = { b: 'strong', i: 'em' };

// Elements the serializer wraps in emphasis markers
const EMPHASIS_TYPES = new Set(['strong', 'em', 'del', 'code']);

const isPlainText = (node) =>
  typeof node?.text === 'string' && Object.keys(node).length === 1;

const isList = (node) => node?.type === 'ul' || node?.type === 'ol';

/**
 * Whitespace at the edges of an emphasis goes outside its markers in
 * Markdown (`**Note:** x`, see `wrap`); move it out of the element here too.
 */
const hoistWhitespace = (nodes) =>
  nodes.flatMap((node) => {
    const children = node.children || [];
    if (!EMPHASIS_TYPES.has(node.type) || !children.length) return [node];
    const first = children[0];
    const last = children[children.length - 1];
    const lead = isPlainText(first) ? /^\s*/.exec(first.text)[0] : '';
    const trail = isPlainText(last) ? /\s*$/.exec(last.text)[0] : '';
    const inner = children.map((child, index) => {
      if (!isPlainText(child)) return child;
      let text = child.text;
      if (index === 0) text = text.slice(lead.length);
      if (index === children.length - 1 && text.length >= trail.length) {
        text = text.slice(0, text.length - trail.length);
      }
      return { text };
    });
    return [{ text: lead }, { ...node, children: inner }, { text: trail }];
  });

/**
 * Markdown drops whitespace at the start and end of a paragraph, heading,
 * quote or list item (and before a nested list): so does the comparison.
 */
const trimEdges = (nodes) =>
  nodes.map((node, index) => {
    if (!isPlainText(node)) return node;
    let text = node.text;
    if (index === 0 || isList(nodes[index - 1])) text = text.trimStart();
    if (index === nodes.length - 1 || isList(nodes[index + 1])) {
      text = text.trimEnd();
    }
    return { text };
  });

const isEmptyText = (node) => isPlainText(node) && node.text === '';

/**
 * What must survive the round trip. Differences that change nothing visible
 * are normalized away: empty text leaves (Slate puts them around links),
 * adjacent plain texts, `b`/`i` vs. `strong`/`em`, whitespace at the edges of
 * emphasis and blocks, empty paragraphs. Links come back exactly (see the
 * placeholders above).
 */
const normalize = (nodes = []) => {
  const normalized = mergeTexts(
    hoistWhitespace(
      nodes.map((node) =>
        typeof node.text === 'string'
          ? node
          : {
              ...node,
              type: EQUIVALENT_TYPES[node.type] || node.type,
              children: normalize(node.children),
            },
      ),
    ).filter((node) => !isEmptyText(node)),
  );
  return normalized
    .map((node) =>
      /^(p|h[1-6]|li|blockquote)$/.test(node.type)
        ? {
            ...node,
            children: trimEdges(node.children).filter((n) => !isEmptyText(n)),
          }
        : node,
    )
    .filter((node) => !(node.type === 'p' && !node.children.length));
};

/**
 * Can this slate value go through Markdown and back without losing or
 * changing anything? Only then may the assistant rewrite the block; otherwise
 * it is sent as read-only context. This compares the actual round trip, so
 * whatever the conversion cannot represent (tables, images, callouts, marks
 * on leaves, emphasis Markdown cannot express, ...) makes the block
 * read-only.
 */
export const isRoundTripSafe = (
  nodes = [],
  links = {},
  markdown = slateToMarkdown(nodes, links),
) => isEqual(normalize(markdownToSlate(markdown, links)), normalize(nodes));

// Checks on the model's Markdown (operations.js)

/**
 * The placeholder a link URL stands for (`link:3` -> `{kind, number}`), or
 * null. Whether it is known is up to the registry (`placeholderIn`).
 */
export const parsePlaceholder = (url = '') => {
  const [, kind, number] = PLACEHOLDER_RE.exec(url) || [];
  return kind ? { kind, number } : null;
};

/** The registry entry a URL is a placeholder for, kind checked, or null. */
export const placeholderIn = (url, links = {}) => {
  const placeholder = parsePlaceholder(url);
  const node = placeholder && links[placeholder.number];
  return node && kindOf(node) === placeholder.kind ? placeholder : null;
};

/** The URLs of all links in Markdown, in order (placeholders included). */
export const linkUrls = (markdown = '') => urlsOf(parseTree(markdown));

/** The placeholder kinds a registry holds (`link`, `mention`, ...). */
export const kindsIn = (links = {}) =>
  new Set(Object.values(links).map(kindOf));

/**
 * Do two parsed texts give the same content? Differences that render the
 * same (escaping, `*` vs `_`, whitespace at edges) don't count: a value
 * equal to the current one is not proposed (spec §7).
 */
export const sameNodes = (a = [], b = []) =>
  isEqual(normalize(a), normalize(b));
