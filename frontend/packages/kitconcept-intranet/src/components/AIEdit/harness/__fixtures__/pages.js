/**
 * Form data of real pages, for the harness tests (texts shortened). Shapes
 * as Volto stores them with volto-light-theme.
 */

const p = (text) => [{ type: 'p', children: [{ text }] }];

/** light-theme.kitconcept.io/page: slate blocks with themes, a button. */
export const lightThemePage = {
  title: 'page',
  description: '',
  blocks: {
    '534ba6af': { '@type': 'title' },
    '8f0a61d2': {
      '@type': 'slate',
      plaintext: 'Cras justo odio.',
      value: p('Cras justo odio.'),
    },
    fdde2974: {
      '@type': 'slate',
      plaintext: 'Donec id elit non mi.',
      styles: {},
      theme: 'grey',
      value: p('Donec id elit non mi.'),
    },
    f297b80b: {
      '@type': '__button',
      styles: { 'align:noprefix': 'right', 'blockWidth:noprefix': 'narrow' },
      theme: 'default',
    },
  },
  blocks_layout: { items: ['534ba6af', '8f0a61d2', 'fdde2974', 'f297b80b'] },
};

/** plone-intranet.kitconcept.dev: a link block, an image, a separator. */
export const intranetPage = {
  title: 'Page',
  description: 'All content types',
  blocks: {
    d3f1c443: { '@type': 'title' },
    '5fa67d96': {
      '@type': 'slate',
      plaintext: ' Link internal ',
      styles: {},
      value: [
        {
          type: 'p',
          children: [
            { text: '' },
            {
              type: 'link',
              data: { url: '/block/button-block' },
              children: [{ text: 'Link internal ' }],
            },
            { text: '' },
          ],
        },
      ],
    },
    '03cae937': {
      '@type': 'image',
      credit: {},
      description: 'Lorem ipsum dolor sit amet.',
      image_scales: { image: [{ download: '@@images/image-2400.jpeg' }] },
      styles: {
        'align:noprefix': 'right',
        'blockWidth:noprefix': 'narrow',
        'size:noprefix': 's',
      },
      title: 'Title Image',
      url: 'https://plone-intranet.kitconcept.dev/features/content-types/image',
    },
    '4ee2efb5': {
      '@type': 'separator',
      styles: {
        'align:noprefix': 'left',
        'blockWidth:noprefix': 'default',
        shortLine: false,
      },
    },
    table1: {
      '@type': 'slate',
      value: [
        {
          type: 'table',
          children: [{ type: 'tr', children: [{ text: 'cell' }] }],
        },
      ],
    },
  },
  blocks_layout: {
    items: ['d3f1c443', '5fa67d96', '03cae937', '4ee2efb5', 'table1'],
  },
};

/** A grid with an image and a text, after a heading. */
export const gridPage = {
  title: 'Our Servises',
  description: '',
  blocks: {
    h: {
      '@type': 'slate',
      value: [{ type: 'h2', children: [{ text: 'About' }] }],
    },
    grid: {
      '@type': 'gridBlock',
      blocks: {
        img: { '@type': 'image', title: 'Team' },
        txt: {
          '@type': 'slate',
          value: [
            {
              type: 'p',
              children: [
                { text: 'Contact us ' },
                { type: 'strong', children: [{ text: 'today' }] },
                { text: '.' },
              ],
            },
          ],
        },
      },
      blocks_layout: { items: ['img', 'txt'] },
    },
  },
  blocks_layout: { items: ['h', 'grid'] },
};

/** A profile as buildProfile makes it for these block types. */
export const profile = {
  version: 1,
  charsPerToken: 3,
  pageFields: { title: { kind: 'string' }, description: { kind: 'text' } },
  blockTypes: {
    slate: {
      fields: { text: { kind: 'richtext', path: 'value' } },
      styling: {
        theme: {
          path: 'theme',
          values: ['default', 'grey'],
          default: 'default',
        },
      },
      insertable: true,
      initial: { '@type': 'slate' },
    },
    __button: {
      fields: {
        title: { kind: 'string', path: 'title', required: true },
        href: { kind: 'link', path: 'href' },
      },
      insertable: true,
      initial: { '@type': '__button' },
      styling: {
        theme: {
          path: 'theme',
          values: ['default', 'grey'],
          default: 'default',
        },
        align: {
          path: 'styles.align:noprefix',
          values: ['left', 'center', 'right'],
          default: 'center',
        },
        blockWidth: {
          path: 'styles.blockWidth:noprefix',
          values: ['narrow', 'default'],
          default: 'default',
        },
      },
    },
    image: {
      fields: {
        alt: { kind: 'string', path: 'alt' },
        title: { kind: 'string', path: 'title' },
        description: { kind: 'text', path: 'description' },
      },
      styling: {
        align: {
          path: 'styles.align:noprefix',
          values: ['left', 'center', 'right'],
          default: 'center',
        },
        size: {
          path: 'styles.size:noprefix',
          values: ['s', 'm', 'l'],
          default: 'l',
        },
      },
    },
    separator: {
      styling: {
        align: {
          path: 'styles.align:noprefix',
          values: ['left', 'center', 'right'],
          default: 'center',
        },
      },
    },
    gridBlock: {
      styling: {
        theme: {
          path: 'theme',
          values: ['default', 'grey'],
          default: 'default',
        },
      },
      container: { allowed: ['image', 'listing', 'slate', 'teaser'], max: 4 },
    },
  },
};
