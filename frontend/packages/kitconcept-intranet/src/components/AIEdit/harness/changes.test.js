import { beforeEach, describe, expect, it } from 'vitest';
import { applyChanges, isMassDeletion, isStale, toChanges } from './changes';
import { validateOperations } from './operations';
import { projectPage } from './projection';
import { locate, removeBlock, replaceBlock } from './blocks';
import {
  gridPage,
  intranetPage,
  lightThemePage,
  profile,
} from './__fixtures__/pages';

// Refs: lightThemePage b1 title, b2 slate 8f0a61d2 (theme unset), b3 slate
// fdde2974 (grey), b4 __button f297b80b; gridPage b1 heading h, b2 grid
// with b2.1 image img and b2.2 slate txt; intranetPage b2 link text.
const setupFor =
  (request) =>
  (formData, ...raws) => {
    const links = {};
    const { page } = projectPage({ formData, profile, links });
    const { valid, invalid, warnings } = validateOperations(
      raws.map((raw, index) => ({
        raw: { reason: 'Why.', category: 'grammar', ...raw },
        number: index + 1,
      })),
      { page, profile, links, request },
    );
    expect(invalid).toEqual([]);
    const changed = toChanges(valid, { page });
    return {
      page,
      links,
      ...changed,
      warnings: [...warnings, ...changed.warnings],
    };
  };
const setup = setupFor('');

let counter;
const newId = () => {
  counter += 1;
  return `new${counter}`;
};
beforeEach(() => {
  counter = 0;
});

const apply = (changes, formData, links = {}, options = {}) =>
  applyChanges(changes, formData, {
    baseFormData: formData,
    profile,
    links,
    newId,
    ...options,
  });

const textOf = (block) => block.value[0].children[0].text;

describe('toChanges', () => {
  it('makes one change per field; styling is always layout (D35)', () => {
    const { changes } = setup(lightThemePage, {
      op: 'edit_block',
      block: 'b2',
      fields: { text: 'Cras odio.', theme: 'grey' },
    });
    expect(
      changes.map(({ key, field, before, value, category, selected }) => ({
        key,
        field,
        before,
        value,
        category,
        selected,
      })),
    ).toEqual([
      {
        key: 'block:8f0a61d2:text',
        field: 'text',
        before: 'Cras justo odio.',
        value: 'Cras odio.',
        category: 'grammar',
        selected: true,
      },
      {
        key: 'block:8f0a61d2:theme',
        field: 'theme',
        before: 'default',
        value: 'grey',
        category: 'layout',
        selected: true,
      },
    ]);
  });

  it('supersedes per field: only a field named twice (D27)', () => {
    const { changes, warnings } = setup(
      lightThemePage,
      { op: 'edit_block', block: 'b2', fields: { text: 'A.' } },
      { op: 'edit_block', block: 'b2', fields: { theme: 'grey' } },
      { op: 'edit_block', block: 'b2', fields: { text: 'B.' } },
    );
    expect(changes.map((c) => [c.field, c.value])).toEqual([
      ['theme', 'grey'],
      ['text', 'B.'],
    ]);
    expect(warnings).toEqual([
      { code: 'superseded', detail: 'b2 text', by: 'b2 text', number: 1 },
    ]);
  });

  it('lets a delete and changes inside its block conflict (D34)', () => {
    const editThenDelete = setup(
      gridPage,
      { op: 'edit_block', block: 'b2.2', fields: { text: 'x' } },
      { op: 'delete_block', block: 'b2' },
    );
    expect(editThenDelete.changes.map((c) => c.key)).toEqual(['block:grid']);
    const deleteThenInsert = setup(
      gridPage,
      { op: 'delete_block', block: 'b2' },
      { op: 'insert_block', type: 'slate', into: 'b2', fields: { text: 'x' } },
    );
    expect(deleteThenInsert.changes.map((c) => c.kind)).toEqual(['insert']);
    // Next to the grid is not inside it
    const sibling = setup(
      gridPage,
      { op: 'insert_block', type: 'slate', after: 'b2', fields: { text: 'x' } },
      { op: 'delete_block', block: 'b2' },
    );
    expect(sibling.changes.map((c) => c.kind)).toEqual(['insert', 'delete']);
  });

  it('flags what the review must point out, deletes unselected (D20)', () => {
    const { changes } = setup(
      gridPage,
      { op: 'delete_block', block: 'b2' },
      { op: 'edit_block', block: 'b1', fields: { text: '## About\n\nUs.' } },
    );
    expect(changes.map(({ selected, flags }) => ({ selected, flags }))).toEqual(
      [
        {
          selected: false,
          flags: { deletesNonText: true, deletesContainer: { blocks: 2 } },
        },
        // A split is risky: unselected, to be confirmed (D57)
        { selected: false, flags: { splitsInto: 2 } },
      ],
    );
    expect(changes.map((change) => change.confirm)).toEqual([true, true]);
    const child = setup(gridPage, { op: 'delete_block', block: 'b2.1' });
    expect(child.changes[0].flags).toEqual({
      deletesNonText: true,
      deletesContainerChild: true,
    });
    const link = setup(intranetPage, {
      op: 'edit_block',
      block: 'b2',
      fields: { text: 'No link.' },
    });
    expect(link.changes[0].flags).toEqual({ removesPlaceholders: ['link:1'] });
  });

  it('detects mass deletion, children included', () => {
    const grid = setup(gridPage, { op: 'delete_block', block: 'b2' });
    expect(isMassDeletion(grid.changes, grid.page)).toBe(true);
    const one = setup(intranetPage, { op: 'delete_block', block: 'b4' });
    expect(isMassDeletion(one.changes, one.page)).toBe(false);
  });
});

describe('applyChanges', () => {
  it('splits a text into blocks of its type, styled as after applying', () => {
    const { changes, links } = setup(lightThemePage, {
      op: 'edit_block',
      block: 'b2',
      fields: { text: '## Cras\n\nJusto odio.', theme: 'grey' },
    });
    // Text first in the list: styling is still applied first
    const { formData, created } = apply(
      [...changes].reverse(),
      lightThemePage,
      links,
    );
    expect(formData.blocks_layout.items).toEqual([
      '534ba6af',
      '8f0a61d2',
      'new1',
      'fdde2974',
      'f297b80b',
    ]);
    expect(formData.blocks['8f0a61d2']).toMatchObject({
      theme: 'grey',
      value: [{ type: 'h2', children: [{ text: 'Cras' }] }],
      plaintext: 'Cras',
    });
    expect(formData.blocks.new1).toEqual({
      '@type': 'slate',
      value: [{ type: 'p', children: [{ text: 'Justo odio.' }] }],
      plaintext: 'Justo odio.',
      theme: 'grey',
    });
    expect(created).toEqual({
      'block:8f0a61d2:text': { ids: ['new1'], anchor: 'split:8f0a61d2' },
    });
    // Untouched blocks keep their identity
    expect(formData.blocks.fdde2974).toBe(lightThemePage.blocks.fdde2974);
  });

  it('leaves the old styling when the theme change is not applied', () => {
    const { changes, links } = setup(lightThemePage, {
      op: 'edit_block',
      block: 'b2',
      fields: { text: 'A.\n\nB.', theme: 'grey' },
    });
    const textOnly = changes.filter((c) => c.field === 'text');
    const { formData } = apply(textOnly, lightThemePage, links);
    expect(formData.blocks['8f0a61d2'].theme).toBeUndefined();
    expect(formData.blocks.new1.theme).toBeUndefined();
  });

  it('writes a style where VLT stores it, keeping the other keys (D30)', () => {
    const { changes } = setup(lightThemePage, {
      op: 'edit_block',
      block: 'b4',
      fields: { align: 'left' },
    });
    const { formData } = apply(changes, lightThemePage);
    expect(formData.blocks.f297b80b.styles).toEqual({
      'align:noprefix': 'left',
      'blockWidth:noprefix': 'narrow',
    });
    expect(Object.keys(formData.blocks.f297b80b.styles)).toEqual([
      'align:noprefix',
      'blockWidth:noprefix',
    ]);
  });

  it('sets page fields and deletes blocks', () => {
    const { changes } = setup(
      lightThemePage,
      { op: 'set_page_field', field: 'description', value: 'About us.' },
      { op: 'delete_block', block: 'b3' },
    );
    const { formData } = apply(changes, lightThemePage);
    expect(formData.description).toBe('About us.');
    expect(formData.blocks.fdde2974).toBeUndefined();
    expect(formData.blocks_layout.items).not.toContain('fdde2974');
  });

  it('inserts into a container first, and inside containers', () => {
    const { changes } = setup(
      gridPage,
      {
        op: 'insert_block',
        type: 'slate',
        into: 'b2',
        fields: { text: 'First.' },
      },
      {
        op: 'insert_block',
        type: 'slate',
        after: 'b2.1',
        fields: { text: 'Second.' },
      },
    );
    const { formData } = apply(changes, gridPage);
    expect(formData.blocks.grid.blocks_layout.items).toEqual([
      'new1',
      'img',
      'new2',
      'txt',
    ]);
    expect(textOf(formData.blocks.grid.blocks.new1)).toBe('First.');
    // The page's own layout is untouched
    expect(formData.blocks_layout).toBe(gridPage.blocks_layout);
  });

  it('keeps the order of inserts at one place, after a split', () => {
    const { changes, links } = setup(
      lightThemePage,
      {
        op: 'insert_block',
        type: 'slate',
        after: 'b2',
        fields: { text: 'One.' },
      },
      {
        op: 'insert_block',
        type: 'slate',
        after: 'b2',
        fields: { text: 'Two.' },
      },
      { op: 'edit_block', block: 'b2', fields: { text: 'A.\n\nB.' } },
    );
    const { formData } = apply(changes, lightThemePage, links);
    const texts = formData.blocks_layout.items
      .slice(1, 5)
      .map((id) => textOf(formData.blocks[id]));
    // The split's second block stays with its block, the inserts follow
    expect(texts).toEqual(['A.', 'B.', 'One.', 'Two.']);
  });

  it('puts the inserts after a split when the split comes first', () => {
    const { changes, links } = setup(
      lightThemePage,
      { op: 'edit_block', block: 'b2', fields: { text: 'A.\n\nB.' } },
      {
        op: 'insert_block',
        type: 'slate',
        after: 'b2',
        fields: { text: 'One.' },
      },
    );
    const { formData } = apply(changes, lightThemePage, links);
    const texts = formData.blocks_layout.items
      .slice(1, 4)
      .map((id) => textOf(formData.blocks[id]));
    expect(texts).toEqual(['A.', 'B.', 'One.']);
  });

  it('places blocks where a removed anchor was', () => {
    const { changes } = setup(lightThemePage, {
      op: 'insert_block',
      type: 'slate',
      after: 'b3',
      fields: { text: 'New.' },
    });
    // The editor removed b3 meanwhile
    const edited = removeBlock(lightThemePage, [], 'fdde2974');
    const { formData } = applyChanges(changes, edited, {
      baseFormData: lightThemePage,
      profile,
      newId,
    });
    expect(formData.blocks_layout.items).toEqual([
      '534ba6af',
      '8f0a61d2',
      'new1',
      'f297b80b',
    ]);
  });

  it('goes where the container was when it is gone too', () => {
    const { changes } = setup(gridPage, {
      op: 'insert_block',
      type: 'slate',
      after: 'b2.2',
      fields: { text: 'New.' },
    });
    const edited = removeBlock(gridPage, [], 'grid');
    const { formData } = applyChanges(changes, edited, {
      baseFormData: gridPage,
      profile,
      newId,
    });
    expect(formData.blocks_layout.items).toEqual(['h', 'new1']);
  });
});

describe('isStale (D30)', () => {
  const editText = (data, id, text) => {
    const { block, path } = locate(data, id);
    return replaceBlock(data, path, id, {
      ...block,
      value: [{ type: 'p', children: [{ text }] }],
    });
  };

  it('looks only at the touched fields', () => {
    const { changes } = setup(lightThemePage, {
      op: 'edit_block',
      block: 'b2',
      fields: { text: 'New.', theme: 'grey' },
    });
    const edited = editText(lightThemePage, '8f0a61d2', 'Typo fixed.');
    const [text, theme] = changes;
    expect(isStale(text, edited, lightThemePage)).toBe(true);
    expect(isStale(theme, edited, lightThemePage)).toBe(false);
  });

  it('makes a delete stale on any change inside its block', () => {
    const { changes } = setup(gridPage, { op: 'delete_block', block: 'b2' });
    expect(isStale(changes[0], gridPage, gridPage)).toBe(false);
    expect(isStale(changes[0], editText(gridPage, 'txt', 'x'), gridPage)).toBe(
      true,
    );
  });

  it('makes an insert stale when its container is full', () => {
    const { changes } = setup(gridPage, {
      op: 'insert_block',
      type: 'slate',
      into: 'b2',
      fields: { text: 'x' },
    });
    const full = ['c', 'd'].reduce(
      (data, id) =>
        replaceBlock(data, [], 'grid', {
          ...data.blocks.grid,
          blocks: { ...data.blocks.grid.blocks, [id]: { '@type': 'slate' } },
          blocks_layout: {
            items: [...data.blocks.grid.blocks_layout.items, id],
          },
        }),
      gridPage,
    );
    expect(isStale(changes[0], gridPage, gridPage, { profile })).toBe(false);
    expect(isStale(changes[0], full, gridPage, { profile })).toBe(true);
    const { formData, skipped } = applyChanges(changes, full, {
      baseFormData: gridPage,
      profile,
      newId,
    });
    expect(skipped).toEqual(changes);
    expect(formData).toBe(full);
  });

  it('compares page fields with the form the proposal was made for', () => {
    const { changes } = setup(lightThemePage, {
      op: 'set_page_field',
      field: 'title',
      value: 'Our page',
    });
    expect(isStale(changes[0], lightThemePage, lightThemePage)).toBe(false);
    expect(
      isStale(
        changes[0],
        { ...lightThemePage, title: 'Edited' },
        lightThemePage,
      ),
    ).toBe(true);
  });
});

describe('isStale with Volto writing schema defaults', () => {
  // Selecting a block mounts its sidebar, which writes schema defaults
  const withDefaults = (data, id) => {
    const { block, path } = locate(data, id);
    return replaceBlock(data, path, id, { ...block, theme: 'default' });
  };

  it('does not make a styling change stale', () => {
    const { changes } = setup(lightThemePage, {
      op: 'edit_block',
      block: 'b2',
      fields: { theme: 'grey' },
    });
    const selected = withDefaults(lightThemePage, '8f0a61d2');
    expect(isStale(changes[0], selected, lightThemePage, { profile })).toBe(
      false,
    );
    const edited = replaceBlock(lightThemePage, [], '8f0a61d2', {
      ...lightThemePage.blocks['8f0a61d2'],
      theme: 'grey',
    });
    expect(isStale(changes[0], edited, lightThemePage, { profile })).toBe(true);
  });

  it('does not make a delete stale, a real edit does', () => {
    const { changes } = setup(lightThemePage, {
      op: 'delete_block',
      block: 'b2',
    });
    const selected = withDefaults(lightThemePage, '8f0a61d2');
    expect(isStale(changes[0], selected, lightThemePage, { profile })).toBe(
      false,
    );
    const { block } = locate(lightThemePage, '8f0a61d2');
    const edited = replaceBlock(lightThemePage, [], '8f0a61d2', {
      ...block,
      value: [{ type: 'p', children: [{ text: 'Changed.' }] }],
    });
    expect(isStale(changes[0], edited, lightThemePage, { profile })).toBe(true);
  });
});

describe('a split inside a container at apply time', () => {
  it('is stale when the container has no room left any more', () => {
    // The grid holds 2 of 4; a split into 3 adds 2: fits when proposed
    const { changes, links } = setup(gridPage, {
      op: 'edit_block',
      block: 'b2.2',
      fields: { text: 'a\n\nb\n\nc' },
    });
    expect(isStale(changes[0], gridPage, gridPage, { profile })).toBe(false);
    // The editor adds a column meanwhile
    const fuller = replaceBlock(gridPage, [], 'grid', {
      ...gridPage.blocks.grid,
      blocks: { ...gridPage.blocks.grid.blocks, c: { '@type': 'slate' } },
      blocks_layout: {
        items: [...gridPage.blocks.grid.blocks_layout.items, 'c'],
      },
    });
    expect(isStale(changes[0], fuller, gridPage, { profile })).toBe(true);
    const { skipped } = applyChanges(changes, fuller, {
      baseFormData: gridPage,
      profile,
      links,
      newId,
    });
    expect(skipped).toHaveLength(1);
  });
});

describe('replace_text changes (D41)', () => {
  const long = {
    ...lightThemePage,
    blocks: {
      ...lightThemePage.blocks,
      '8f0a61d2': {
        '@type': 'slate',
        value: [
          {
            type: 'p',
            children: [
              {
                text: 'The summit takes place on March 18, 2027 at the hall. Registration closes on March 11, so sign up soon.',
              },
            ],
          },
        ],
      },
    },
  };
  const replace = (find, to) => ({
    op: 'replace_text',
    block: 'b2',
    find,
    replace: to,
  });

  it('are one change per field with every replacement, applied as text', () => {
    const { changes, warnings, links } = setup(
      long,
      replace('March 18, 2027', 'April 9, 2027'),
      replace('March 11', 'April 2'),
    );
    expect(warnings).toEqual([]);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      key: 'block:8f0a61d2:text',
      kind: 'block_field',
      label: 'b2 text',
      replacements: [
        { find: 'March 18, 2027', replace: 'April 9, 2027' },
        { find: 'March 11', replace: 'April 2' },
      ],
    });
    expect(changes[0].flags).toEqual({});
    const { formData } = apply(changes, long, links);
    expect(formData.blocks['8f0a61d2'].value[0].children[0].text).toBe(
      'The summit takes place on April 9, 2027 at the hall. Registration closes on April 2, so sign up soon.',
    );
  });

  it('flag a rewrite that keeps little of a longer text', () => {
    // What the model sent in the first browser test: the change, not a text
    const { changes } = setup(long, {
      op: 'edit_block',
      block: 'b2',
      fields: { text: 'March 18, 2027 → April 9, 2027; March 11 → April 2' },
    });
    expect(changes[0].flags.replacesMostText).toBe(true);
    // The same with a replacement whose find is the whole text (D52)
    const whole = setup(
      long,
      replace(
        'The summit takes place on March 18, 2027 at the hall. Registration closes on March 11, so sign up soon.',
        'March 18, 2027 → April 9, 2027',
      ),
    );
    expect(whole.changes[0].flags.replacesMostText).toBe(true);
    const translated = setup(long, {
      op: 'edit_block',
      block: 'b2',
      category: 'translation',
      fields: { text: 'Der Gipfel findet am 18. März statt.' },
    });
    expect(translated.changes[0].flags).toEqual({});
    // Short texts are not flagged
    const short = setup(lightThemePage, {
      op: 'edit_block',
      block: 'b2',
      fields: { text: 'Hi.' },
    });
    expect(short.changes[0].flags).toEqual({});
  });
});

describe('review flags of the browser tests', () => {
  it('starts an alt text unselected, with a warning (D40)', () => {
    const { changes } = setup(gridPage, {
      op: 'edit_block',
      block: 'b2.1',
      fields: { alt: 'Our team at the office', title: 'Our team' },
    });
    expect(
      changes.map((c) => [c.field, c.selected, !!c.flags.writesAltText]),
    ).toEqual([
      ['alt', false, true],
      ['title', true, false],
    ]);
  });

  it('flags deleting a block whose content the model could not see', () => {
    const withTable = {
      ...lightThemePage,
      blocks: {
        ...lightThemePage.blocks,
        f297b80b: {
          '@type': 'slateTable',
          table: { rows: [{ cells: [{ value: [{ text: '09:00' }] }] }] },
        },
      },
    };
    const { changes } = setup(withTable, { op: 'delete_block', block: 'b4' });
    expect(changes[0].flags.deletesHidden).toBe(true);
    expect(changes[0].selected).toBe(false);
  });
});

describe('review fixes: blocks with several paragraphs', () => {
  it('keeps them together when a small edit changes one word', () => {
    const twoParagraphs = {
      ...lightThemePage,
      blocks: {
        ...lightThemePage.blocks,
        '8f0a61d2': {
          '@type': 'slate',
          value: [
            { type: 'p', children: [{ text: 'First paragrahp.' }] },
            { type: 'p', children: [{ text: 'Second paragraph.' }] },
          ],
        },
      },
    };
    const { changes, links } = setup(twoParagraphs, {
      op: 'replace_text',
      block: 'b2',
      find: 'paragrahp',
      replace: 'paragraph',
    });
    expect(changes[0].flags).toEqual({});
    const { formData } = apply(changes, twoParagraphs, links);
    expect(formData.blocks_layout.items).toEqual(
      lightThemePage.blocks_layout.items,
    );
    expect(
      formData.blocks['8f0a61d2'].value.map((node) => node.children[0].text),
    ).toEqual(['First paragraph.', 'Second paragraph.']);
  });
});

describe('button blocks', () => {
  const button = (fields) => ({
    op: 'insert_block',
    after: 'b2',
    type: '__button',
    fields,
  });

  it('inserts a button with label, link and alignment, stored as VLT does', () => {
    const { changes, links } = setupFor(
      'Add a button to https://example.com/register on the right',
    )(
      lightThemePage,
      button({
        title: 'Register',
        href: 'https://example.com/register',
        align: 'right',
      }),
    );
    const { formData } = apply(changes, lightThemePage, links);
    const id = formData.blocks_layout.items[2];
    expect(formData.blocks[id]).toEqual({
      '@type': '__button',
      title: 'Register',
      href: [{ '@id': 'https://example.com/register' }],
      styles: { 'align:noprefix': 'right' },
    });
  });

  it('shows and edits an existing link as its target', () => {
    const linked = {
      ...lightThemePage,
      blocks: {
        ...lightThemePage.blocks,
        f297b80b: {
          ...lightThemePage.blocks.f297b80b,
          title: 'Read more',
          href: [{ '@id': '/old', title: 'Old' }],
        },
      },
    };
    const { page, changes, links } = setupFor('Link the button to /new')(
      linked,
      {
        op: 'edit_block',
        block: 'b4',
        fields: { href: '/new' },
      },
    );
    expect(page.blocks[3].fields).toEqual({ title: 'Read more', href: '/old' });
    const { formData } = apply(changes, linked, links);
    expect(formData.blocks.f297b80b.href).toEqual([{ '@id': '/new' }]);
  });
});

describe('what the 8B model sent (D48)', () => {
  it('keeps a button whose link was not given, without the link', () => {
    const { changes, warnings } = setupFor(
      'add a button block below this paragraph, align it to the right',
    )(lightThemePage, {
      op: 'insert_block',
      after: 'b2',
      type: '__button',
      fields: { title: 'Register now', href: '/register', align: 'right' },
    });
    expect(changes[0].fields.href).toBeUndefined();
    expect(changes[0].flags.noLink).toBe(true);
    expect(warnings).toEqual([
      { code: 'link_not_given', detail: 'new __button href', number: 1 },
    ]);
  });
});

describe('a page field like a block field (D51)', () => {
  it('starts unselected and says which block it matches', () => {
    const { changes } = setup(
      lightThemePage,
      {
        op: 'insert_block',
        type: '__button',
        after: 'b2',
        fields: { title: 'Register now' },
      },
      { op: 'set_page_field', field: 'title', value: 'Register now' },
      { op: 'set_page_field', field: 'description', value: 'All about it.' },
    );
    expect(changes.map((c) => [c.label, c.selected, c.flags])).toEqual([
      ['new __button after b2', true, { noLink: true }],
      ['title', false, { sameAsBlock: 'new __button after b2' }],
      ['description', true, {}],
    ]);
  });
});
