// Copied unchanged from @kitconcept/volto-plate 1.0.0a29
// (frontend/acceptance/fixtures/native-blocks.ts). Keep it in sync with volto-plate;
// intranet-specific helpers go into the wiki-*/table-* fixtures.

/**
 * Plate values for the native blocks exposed by volto-plate's wiki presets
 * (`wiki-editor` and `wiki-renderer`).
 *
 * Each section is a small, self-contained value. Tests compose only the
 * sections they need into a single page (see `pages.ts`), so no test depends
 * on a shared "kitchen sink" page and the backend reset between tests is not
 * an issue.
 */

type Node = Record<string, unknown>;

const p = (text: string, extra: Node = {}): Node => ({
  type: 'p',
  children: [{ text }],
  ...extra,
});

export const nativeBlockSections = {
  headings: [
    { type: 'h2', children: [{ text: 'Heading two' }] },
    p('Paragraph below the second level heading.'),
    { type: 'h3', children: [{ text: 'Heading three' }] },
    p('Paragraph below the third level heading.'),
    { type: 'h4', children: [{ text: 'Heading four' }] },
    p('Paragraph below the fourth level heading.'),
    { type: 'h5', children: [{ text: 'Heading five' }] },
    p('Paragraph below the fifth level heading.'),
    { type: 'h6', children: [{ text: 'Heading six' }] },
    p('Paragraph below the sixth level heading.'),
  ],

  marks: [
    {
      type: 'p',
      children: [
        { text: 'Text with ' },
        { text: 'bold', bold: true },
        { text: ', ' },
        { text: 'italic', italic: true },
        { text: ', ' },
        { text: 'strikethrough', strikethrough: true },
        { text: ', ' },
        { text: 'inline code', code: true },
        { text: ' and a ' },
        {
          type: 'a',
          url: 'https://plone.org',
          children: [{ text: 'link' }],
        },
        { text: '.' },
      ],
    },
  ],

  lists: [
    p('Bulleted first', { indent: 1, listStyleType: 'disc' }),
    p('Bulleted nested', { indent: 2, listStyleType: 'disc' }),
    p('Bulleted second', { indent: 1, listStyleType: 'disc', listStart: 2 }),
    p('Numbered first', { indent: 1, listStyleType: 'decimal' }),
    p('Numbered second', { indent: 1, listStyleType: 'decimal', listStart: 2 }),
    p('To-do pending', { indent: 1, listStyleType: 'todo', checked: false }),
    p('To-do done', {
      indent: 1,
      listStyleType: 'todo',
      checked: true,
      listStart: 2,
    }),
  ],

  blockquote: [
    {
      type: 'blockquote',
      children: [p('First quoted paragraph.'), p('Second quoted paragraph.')],
    },
  ],

  codeBlock: [
    {
      type: 'code_block',
      lang: 'javascript',
      children: [
        { type: 'code_line', children: [{ text: 'function greet(name) {' }] },
        {
          type: 'code_line',
          children: [{ text: '  return `Hello, ${name}!`;' }],
        },
        { type: 'code_line', children: [{ text: '}' }] },
      ],
    },
  ],

  table: [
    {
      type: 'table',
      children: [
        {
          type: 'tr',
          children: [
            { type: 'th', children: [p('Header one')] },
            { type: 'th', children: [p('Header two')] },
          ],
        },
        {
          type: 'tr',
          children: [
            { type: 'td', children: [p('Cell one')] },
            { type: 'td', children: [p('Cell two')] },
          ],
        },
      ],
    },
  ],

  callout: [
    {
      type: 'callout',
      variant: 'info',
      icon: '💡',
      children: [{ text: 'Callout with an important note.' }],
    },
  ],

  toggle: [
    { type: 'toggle', id: 'toggle-fixture', children: [{ text: 'Toggle' }] },
    p('Content inside the toggle.', { id: 'toggle-content', indent: 1 }),
  ],

  columns: [
    {
      type: 'column_group',
      children: [
        { type: 'column', width: '33%', children: [p('Column one')] },
        { type: 'column', width: '33%', children: [p('Column two')] },
        { type: 'column', width: '33%', children: [p('Column three')] },
      ],
    },
  ],

  toc: [
    { type: 'toc', children: [{ text: '' }] },
    { type: 'h2', children: [{ text: 'First section' }] },
    p('Content of the first section.'),
    { type: 'h3', children: [{ text: 'Nested section' }] },
    p('Content of the nested section.'),
  ],

  hr: [
    p('Before the separator.'),
    { type: 'hr', children: [{ text: '' }] },
    p('After the separator.'),
  ],

  date: [
    {
      type: 'p',
      children: [
        { text: 'Due on ' },
        { type: 'date', value: '2026-09-29', children: [{ text: '' }] },
        { text: '.' },
      ],
    },
  ],
} satisfies Record<string, Node[]>;

export type NativeBlockSection = keyof typeof nativeBlockSections;

export const ALL_NATIVE_BLOCK_SECTIONS = Object.keys(
  nativeBlockSections,
) as NativeBlockSection[];
