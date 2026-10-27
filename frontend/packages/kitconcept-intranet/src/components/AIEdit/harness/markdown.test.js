// The tests check that script URLs are rejected
/* eslint-disable no-script-url */
import { describe, expect, it } from 'vitest';
import {
  fixSpanningEmphasis,
  isRoundTripSafe,
  isSafeUrl,
  markdownToSlate,
  slateToMarkdown,
  slateToPlaintext,
} from './markdown';

const p = (...children) => ({ type: 'p', children });
const t = (text) => ({ text });
const el = (type, ...children) => ({ type, children });

describe('slateToMarkdown', () => {
  it('keeps whitespace outside emphasis markers', () => {
    const value = [
      p({ type: 'strong', children: [{ text: 'Hinweis: ' }] }, { text: 'x' }),
    ];
    expect(slateToMarkdown(value)).toBe('**Hinweis:** x');
    expect(markdownToSlate(slateToMarkdown(value))).toEqual([
      p({ type: 'strong', children: [{ text: 'Hinweis:' }] }, { text: ' x' }),
    ]);
  });

  it('drops markers around whitespace only', () => {
    const value = [p({ text: 'a' }, { type: 'em', children: [{ text: ' ' }] })];
    expect(slateToMarkdown(value)).toBe('a ');
  });

  it('escapes & and < only before an entity or a tag', () => {
    // Each backslash risks an invalid JSON escape in the model's tool call
    expect(
      slateToMarkdown([p({ text: 'Summary & Objectives, a < b, Q&A' })]),
    ).toBe('Summary & Objectives, a < b, Q&A');
    expect(slateToMarkdown([p({ text: 'write &amp; or <b>' })])).toBe(
      'write \\&amp; or \\<b>',
    );
  });
});

describe('fixSpanningEmphasis', () => {
  it('moves a marker spanning paragraphs onto each paragraph', () => {
    expect(fixSpanningEmphasis('**One\n\nTwo**')).toBe('**One**\n\n**Two**');
  });

  it('leaves separately emphasized paragraphs alone', () => {
    expect(fixSpanningEmphasis('*Intro*\n\n*Outro*')).toBe(
      '*Intro*\n\n*Outro*',
    );
    const text = '**Note**\n\nSee **below**';
    expect(fixSpanningEmphasis(text)).toBe(text);
  });
});

describe('links', () => {
  it.each([
    'https://example.com',
    'http://example.com/a:b',
    'mailto:a@example.com',
    'tel:+49123',
    '/intranet/page',
    'page#a:b',
  ])('allows %s', (url) => expect(isSafeUrl(url)).toBe(true));

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'java\tscript:alert(1)',
    ' javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:x',
  ])('rejects %s', (url) => expect(isSafeUrl(url)).toBe(false));

  it('keeps only the text of unsafe links', () => {
    expect(markdownToSlate('[click](javascript:alert(1)) me')).toEqual([
      p({ text: 'click me' }),
    ]);
    expect(markdownToSlate('[site](https://example.com)')).toEqual([
      p({
        type: 'link',
        data: { url: 'https://example.com' },
        children: [{ text: 'site' }],
      }),
    ]);
  });
});

describe('markdownToSlate', () => {
  it('keeps the text of code blocks', () => {
    expect(
      markdownToSlate('Intro\n\n```\nnpm install\n```\n\n    indented'),
    ).toEqual([
      p({ text: 'Intro' }),
      p({ text: 'npm install' }),
      p({ text: 'indented' }),
    ]);
  });
});

describe('isRoundTripSafe', () => {
  const link = (data, text) => ({ type: 'link', data, children: [t(text)] });

  it.each([
    ['plain text', [p(t('Hello  world'))]],
    ['whitespace at the edges', [p(t(' Hello world '))]],
    ['line breaks', [p(t('line one \nline two'))]],
    [
      'escaped Markdown characters',
      [p(t('1. Preis: 500€ *Pflichtfeld* [1] a_b <tag> & x'))],
    ],
    [
      'ampersands and angle brackets',
      [p(t('Q&A & more, &amp; &#38; a < b <br/> <!-- x --> &copy'))],
    ],
    ['a heading with an ampersand', [el('h2', t('Summary & Objectives'))]],
    ['plain URLs and e-mail addresses', [p(t('https://x.org, a@x.org'))]],
    [
      'links with empty texts around (absolute URL)',
      [
        p(
          t(''),
          link({ url: 'http://localhost:8080/Plone/foo' }, 'foo'),
          t(''),
        ),
      ],
    ],
    [
      'whitespace inside emphasis',
      [p(el('strong', t('Hinweis: ')), t('Bitte'))],
    ],
    ['b and i', [p(el('b', t('bold')), t(' and '), el('i', t('italic')))]],
    ['strikethrough', [p(el('del', t('old')), t(' new'))]],
    ['nested emphasis', [p(el('strong', t('a '), el('em', t('b'))))]],
    ['a heading ending in #', [el('h2', t('Ticket #'))]],
    ['nested lists', [el('ol', el('li', t('a'), el('ul', el('li', t('x')))))]],
    ['quotes', [el('blockquote', t('quoted'))]],
    ['a trailing empty paragraph', [p(t('Text')), p(t(''))]],
    ['inline code', [p(t('Run '), el('code', t('a*b_c')), t(' now'))]],
    ['inline code with backticks', [p(el('code', t('a `b` c')))]],
    ['inline code starting with a backtick', [p(el('code', t('`x')))]],
    ['underline (a placeholder)', [p(t('a '), el('u', t('b')))]],
    [
      'link attributes (links are placeholders)',
      [p(link({ url: 'https://x.org', target: '_blank' }, 'x'))],
    ],
    [
      'internal link objects',
      [
        p(
          link(
            { link: { internal: { internal_link: [{ '@id': '/a' }] } } },
            'x',
          ),
        ),
      ],
    ],
  ])('accepts %s', (name, value) => {
    expect(isRoundTripSafe(value)).toBe(true);
  });

  it.each([
    [
      'emphasis Markdown cannot express (punctuation before a letter)',
      [p(el('strong', t('Hinweis:')), t('Bitte'))],
    ],
    ['marks on leaves', [p({ text: 'bold', bold: true })]],
    ['h1 (becomes h2)', [el('h1', t('Title'))]],
    ['tables', [el('table', el('tr', el('td', t('a'))))]],
  ])('rejects %s', (name, value) => {
    expect(isRoundTripSafe(value)).toBe(false);
  });
});

describe('link placeholders', () => {
  const link = {
    type: 'link',
    data: { url: 'http://localhost:8080/Plone/a', target: '_blank' },
  };
  const value = [p({ text: 'See ' }, { ...link, children: [{ text: 'A' }] })];

  it('writes links as numbered placeholders', () => {
    const links = {};
    expect(slateToMarkdown(value, links)).toBe('See [A](link:1)');
    expect(links).toEqual({ 1: link });
    // The same link keeps its number
    expect(slateToMarkdown(value, links)).toBe('See [A](link:1)');
  });

  it('restores the original link, also with a new text', () => {
    const links = { 1: link };
    expect(markdownToSlate('See [the A](link:1)', links)).toEqual([
      p({ text: 'See ' }, { ...link, children: [{ text: 'the A' }] }),
    ]);
  });

  it('keeps only the text of an unknown placeholder', () => {
    expect(markdownToSlate('See [A](link:7)', {})).toEqual([
      p({ text: 'See A' }),
    ]);
  });
});

describe('inline code', () => {
  it('keeps the code literal, without escapes', () => {
    expect(slateToMarkdown([p(el('code', t('a*b_c')))])).toBe('`a*b_c`');
  });

  it('uses a longer fence around backticks', () => {
    expect(slateToMarkdown([p(el('code', t('a `b` c')))])).toBe('``a `b` c``');
  });

  it('comes back as a code element', () => {
    expect(markdownToSlate('Run `x` now')).toEqual([
      p(t('Run '), el('code', t('x')), t(' now')),
    ]);
  });
});

describe('placeholders for other inline nodes', () => {
  const mention = { type: 'mention', data: { user: 'jane' } };

  it('writes any unknown inline element as a placeholder of its kind', () => {
    const links = {};
    const value = [p(t('Ask '), { ...mention, children: [t('Jane')] })];
    expect(slateToMarkdown(value, links)).toBe('Ask [Jane](mention:1)');
    expect(links).toEqual({ 1: mention });
  });

  it('restores the node only when number and kind match', () => {
    const links = { 1: mention };
    expect(markdownToSlate('Ask [J.](mention:1)', links)).toEqual([
      p(t('Ask '), { ...mention, children: [t('J.')] }),
    ]);
    // A link placeholder pointing at a mention keeps the text only
    expect(markdownToSlate('Ask [J.](link:1)', links)).toEqual([
      p(t('Ask J.')),
    ]);
  });

  it('does not take a new tel: link for a placeholder', () => {
    const links = { 123: { type: 'link', data: { url: '/a' } } };
    expect(markdownToSlate('[Call](tel:123)', links)).toEqual([
      p({ type: 'link', data: { url: 'tel:123' }, children: [t('Call')] }),
    ]);
  });
});

describe('slateToPlaintext', () => {
  it('builds the text like volto-slate: trimmed leaves, spaces, lines', () => {
    const value = [
      el('h2', t(' Title ')),
      p(
        t('See'),
        { type: 'link', data: { url: '/a' }, children: [t(' A ')] },
        t('now '),
      ),
      el('ul', el('li', t('one')), el('li', t('two'))),
    ];
    expect(slateToPlaintext(value)).toBe('Title\nSee A now\none two');
  });
});

describe('placeholder registry', () => {
  const linkTo = (url, label) => ({
    type: 'link',
    data: { url },
    children: [{ text: label }],
  });

  it('numbers nodes once and follows entries added elsewhere', () => {
    const links = {};
    expect(slateToMarkdown([p(linkTo('/a', 'A'))], links)).toBe('[A](link:1)');
    // An entry the registry got without numbering (e.g. restored state)
    links[5] = { type: 'link', data: { url: '/c' } };
    expect(slateToMarkdown([p(linkTo('/c', 'C'))], links)).toBe('[C](link:5)');
    expect(slateToMarkdown([p(linkTo('/b', 'B'))], links)).toBe('[B](link:6)');
    expect(slateToMarkdown([p(linkTo('/a', 'A'))], links)).toBe('[A](link:1)');
  });
});
