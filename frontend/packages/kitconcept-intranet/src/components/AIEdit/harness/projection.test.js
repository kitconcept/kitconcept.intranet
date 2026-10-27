import { describe, expect, it } from 'vitest';
import { blockTypesForRequest, projectPage } from './projection';
import {
  gridPage,
  intranetPage,
  lightThemePage,
  profile,
} from './__fixtures__/pages';

describe('projectPage', () => {
  it('shows content fields, effective styling and read-only blocks', () => {
    const { page, refs } = projectPage({
      formData: lightThemePage,
      profile,
      selected: ['fdde2974'],
    });
    expect(page.fields).toEqual({ title: 'page', description: '' });
    expect(page.blocks).toEqual([
      {
        id: '534ba6af',
        ref: 'b1',
        type: 'title',
        fields: {},
        styling: {},
        readonly: true,
        selected: false,
        description: '',
      },
      {
        id: '8f0a61d2',
        ref: 'b2',
        type: 'slate',
        fields: { text: 'Cras justo odio.' },
        // Unset: the default, not "(empty)"
        styling: { theme: 'default' },
        readonly: false,
        selected: false,
      },
      {
        id: 'fdde2974',
        ref: 'b3',
        type: 'slate',
        fields: { text: 'Donec id elit non mi.' },
        styling: { theme: 'grey' },
        readonly: false,
        selected: true,
      },
      {
        id: 'f297b80b',
        ref: 'b4',
        type: '__button',
        // Not in the data: shown empty, so the model sees it is missing
        fields: { title: '', href: '' },
        styling: { theme: 'default', align: 'right', blockWidth: 'narrow' },
        readonly: false,
        selected: false,
      },
    ]);
    expect(Object.values(refs)).toEqual(['b1', 'b2', 'b3', 'b4']);
  });

  it('writes links as placeholders and strips everything else', () => {
    const links = {};
    const { page } = projectPage({ formData: intranetPage, profile, links });
    const [, link, image, separator] = page.blocks;
    // The stored link text has a trailing space; it is kept
    expect(link.fields).toEqual({ text: '[Link internal ](link:1)' });
    expect(links).toEqual({
      1: { type: 'link', data: { url: '/block/button-block' } },
    });
    expect(image).toMatchObject({
      fields: {
        alt: '',
        title: 'Title Image',
        description: 'Lorem ipsum dolor sit amet.',
      },
      styling: { align: 'right', size: 's' },
    });
    // No scales, URL, credit or unlisted styles reach the model
    expect(JSON.stringify(page)).not.toMatch(
      /image_scales|@@images|credit|shortLine/,
    );
    // Styling only: editable for styling (D25)
    expect(separator).toMatchObject({
      fields: {},
      styling: { align: 'left' },
      readonly: false,
      description: '',
    });
  });

  it('locks text that fails the round trip, keeps the block editable', () => {
    const { page } = projectPage({ formData: intranetPage, profile });
    const table = page.blocks[4];
    expect(table.locked).toEqual({ text: 'round_trip' });
    // Its styling can still be changed
    expect(table.readonly).toBe(false);
  });

  it('nests container children with dotted refs', () => {
    const { page } = projectPage({ formData: gridPage, profile });
    const grid = page.blocks[1];
    expect(grid).toMatchObject({
      ref: 'b2',
      type: 'gridBlock',
      styling: { theme: 'default' },
    });
    expect(
      grid.children.map((child) => [child.ref, child.type, child.fields]),
    ).toEqual([
      ['b2.1', 'image', { alt: '', title: 'Team', description: '' }],
      ['b2.2', 'slate', { text: 'Contact us **today**.' }],
    ]);
  });

  it('keeps the refs of the conversation', () => {
    const first = projectPage({ formData: gridPage, profile });
    const moved = {
      ...gridPage,
      blocks_layout: { items: ['grid', 'h'] },
    };
    const second = projectPage({ formData: moved, profile, refs: first.refs });
    expect(second.page.blocks.map((block) => block.ref)).toEqual(['b2', 'b1']);
  });
});

describe('blockTypesForRequest', () => {
  it('describes the types on the page and every insertable type (D32)', () => {
    const { page } = projectPage({
      formData: { ...lightThemePage, blocks_layout: { items: ['f297b80b'] } },
      profile,
    });
    expect(blockTypesForRequest(profile, page)).toEqual({
      __button: {
        fields: ['title', 'href'],
        // Marked in the prompt; the others are optional (D54)
        required: ['title'],
        styling: {
          theme: ['default', 'grey'],
          align: ['left', 'center', 'right'],
          blockWidth: ['narrow', 'default'],
        },
        insertable: true,
      },
      // Not on the page, but insertable
      slate: {
        fields: ['text'],
        required: ['text'],
        styling: { theme: ['default', 'grey'] },
        insertable: true,
      },
    });
  });

  it('leaves out types the profile does not know', () => {
    const { page } = projectPage({
      formData: { ...lightThemePage, blocks_layout: { items: ['534ba6af'] } },
      profile,
    });
    // The title block is not in the profile; the insertable types are
    expect(Object.keys(blockTypesForRequest(profile, page))).toEqual([
      'slate',
      '__button',
    ]);
  });
});

describe('content the projection does not show', () => {
  it('marks a block with hidden content, never one that is only styled', () => {
    const { page } = projectPage({
      formData: {
        blocks: {
          title: { '@type': 'title' },
          table: {
            '@type': 'slateTable',
            theme: 'grey',
            table: { rows: [{ cells: [{ value: [{ text: 'Keynote' }] }] }] },
          },
          empty: { '@type': 'slateTable', table: {} },
          sep: { '@type': 'separator', styles: { 'align:noprefix': 'left' } },
        },
        blocks_layout: { items: ['title', 'table', 'empty', 'sep'] },
      },
      profile,
      links: {},
    });
    expect(page.blocks.map((b) => [b.type, !!b.hidden])).toEqual([
      ['title', false],
      ['slateTable', true],
      ['slateTable', false],
      ['separator', false],
    ]);
  });
});
