/**
 * Fields and settings taken from block schemas (D53): settings shown and
 * stored like styling (true/false as booleans), and the panel's check of
 * the fields a schema shows for a block's data.
 */
import { describe, expect, it } from 'vitest';
import { createValidator } from './operations';
import { projectPage } from './projection';
import { applyChanges, isStale, toChanges } from './changes';

// As buildProfile makes it from a teaser-like schema
const profile = {
  version: 1,
  charsPerToken: 3,
  pageFields: { title: { kind: 'string' } },
  blockTypes: {
    teaser: {
      fields: {
        title: { kind: 'string', path: 'title', fromSchema: true },
        description: { kind: 'text', path: 'description', fromSchema: true },
      },
      styling: {
        overwrite: {
          path: 'overwrite',
          values: ['false', 'true'],
          boolean: true,
          default: 'false',
          fromSchema: true,
        },
        openLinkInNewTab: {
          path: 'openLinkInNewTab',
          values: ['false', 'true'],
          boolean: true,
          default: 'false',
          fromSchema: true,
        },
      },
    },
    video: {
      fields: {
        url: { kind: 'url', path: 'url', fromSchema: true, required: true },
        title: { kind: 'string', path: 'title', fromSchema: true },
      },
      styling: {
        align: {
          path: 'align',
          values: ['left', 'center'],
          default: 'center',
          fromSchema: true,
        },
      },
      insertable: true,
      initial: { '@type': 'video' },
    },
    slate: {
      fields: { text: { kind: 'richtext', path: 'value' } },
      insertable: true,
      initial: { '@type': 'slate' },
    },
    separator: {
      styling: {
        align: { path: 'styles.align:noprefix', values: ['left', 'center'] },
      },
      insertable: true,
      initial: { '@type': 'separator' },
    },
  },
};

// The panel's check (buildProfile visibleFieldsOf): the teaser shows its
// title and description with `overwrite`, or with `openLinkInNewTab` in
// the two-ways variant
const visibleFor =
  (twoWays = false) =>
  (type, data) => {
    if (type !== 'teaser') return null;
    const shows = data.overwrite || (twoWays && data.openLinkInNewTab);
    return new Set([
      'overwrite',
      'openLinkInNewTab',
      ...(shows ? ['title', 'description'] : []),
    ]);
  };

const formData = {
  blocks: {
    t1: {
      '@type': 'teaser',
      href: [{ '@id': '/news', title: 'News' }],
      title: '',
    },
    p1: {
      '@type': 'slate',
      value: [{ type: 'p', children: [{ text: 'Hello.' }] }],
    },
  },
  blocks_layout: { items: ['t1', 'p1'] },
};

const run = (raws, { visibleFields = visibleFor(), request = '' } = {}) => {
  const links = {};
  const { page } = projectPage({ formData, profile, links, visibleFields });
  const result = createValidator({
    page,
    profile,
    links,
    request,
    formData,
    visibleFields,
  })(
    raws.map((raw, index) => ({
      raw: { reason: 'Why.', category: 'other', ...raw },
      number: index + 1,
    })),
  );
  return { ...result, page };
};

describe('schema fields and settings (D53)', () => {
  it('shows settings with their value, fields only where the schema does', () => {
    const { page } = run([]);
    expect(page.blocks[0]).toMatchObject({
      type: 'teaser',
      // Not used without `overwrite`: not shown
      fields: {},
      styling: { overwrite: 'false', openLinkInNewTab: 'false' },
    });
    // Without the panel's check (the eval), every field shows
    const links = {};
    const plain = projectPage({ formData, profile, links }).page;
    expect(plain.blocks[0].fields).toEqual({ title: '', description: '' });
  });

  it('switches on the one setting a field needs', () => {
    const { valid, invalid, warnings } = run([
      { op: 'edit_block', block: 'b1', fields: { title: 'Our news' } },
    ]);
    expect(invalid).toEqual([]);
    expect(valid[0].fields).toEqual({
      title: { kind: 'string', path: 'title', value: 'Our news' },
      overwrite: {
        kind: 'styling',
        path: 'overwrite',
        value: 'true',
        boolean: true,
      },
    });
    expect(warnings).toContainEqual({
      code: 'setting_added',
      detail: 'b1 overwrite for title',
      number: 1,
    });
  });

  it('asks for a repair when several settings would show it', () => {
    const { invalid } = run(
      [{ op: 'edit_block', block: 'b1', fields: { title: 'Our news' } }],
      { visibleFields: visibleFor(true) },
    );
    expect(invalid[0].errors[0]).toMatchObject({ code: 'hidden_field' });
    expect(invalid[0].errors[0].message).toContain(
      'set one of "overwrite", "openLinkInNewTab" to true',
    );
  });

  it('reads true/false written as JSON, stores booleans, compares as shown', () => {
    const { valid, page } = run([
      {
        op: 'edit_block',
        block: 'b1',
        fields: { overwrite: true, title: 'Our news' },
      },
    ]);
    const { changes } = toChanges(valid, { page });
    const overwrite = changes.find((change) => change.field === 'overwrite');
    expect(overwrite).toMatchObject({
      fieldKind: 'styling',
      value: 'true',
      boolean: true,
    });
    const { formData: after } = applyChanges(changes, formData, {
      baseFormData: formData,
      profile,
      newId: () => 'x',
    });
    expect(after.blocks.t1.overwrite).toBe(true);
    expect(after.blocks.t1.title).toBe('Our news');
    // The sidebar writing the default (false) changes nothing visible
    const selected = {
      ...formData,
      blocks: {
        ...formData.blocks,
        t1: { ...formData.blocks.t1, overwrite: false },
      },
    };
    expect(isStale(overwrite, selected, formData, { profile })).toBe(false);
  });

  it('inserts a block that needs no fields (a browser test: a separator)', () => {
    const insert = (more) => ({
      op: 'insert_block',
      after: 'b2',
      type: 'separator',
      ...more,
    });
    // No fields or empty fields
    [{}, { fields: {} }].forEach((more) => {
      const { valid, invalid } = run([insert(more)]);
      expect(invalid).toEqual([]);
      expect(valid[0]).toMatchObject({ type: 'separator', fields: {} });
    });
    // A text block still needs its text
    const { invalid } = run([
      { op: 'insert_block', after: 'b2', type: 'slate', fields: {} },
    ]);
    expect(invalid[0].errors[0].code).toBe('missing_field');
  });

  it('inserts a video with its URL alone (a browser test, D54)', () => {
    const request = 'now add a video block with https://video.example/talk';
    const { valid, invalid } = run(
      [
        {
          op: 'insert_block',
          after: 'b2',
          type: 'video',
          fields: { url: 'https://video.example/talk' },
        },
      ],
      { request },
    );
    expect(invalid).toEqual([]);
    expect(Object.keys(valid[0].fields)).toEqual(['url']);
    // Without its URL a video shows nothing: required by the profile
    const missing = run(
      [{ op: 'insert_block', after: 'b2', type: 'video', fields: {} }],
      { request },
    );
    expect(missing.invalid[0].errors[0]).toMatchObject({
      code: 'missing_field',
    });
  });

  it('inserts a type from the schema, its link target from the request', () => {
    const insert = (url) => ({
      op: 'insert_block',
      after: 'b2',
      type: 'video',
      fields: { url, align: 'left' },
    });
    const given = run([insert('https://video.example/talk')], {
      request: 'Add the video https://video.example/talk below',
    });
    expect(given.invalid).toEqual([]);
    expect(given.valid[0].fields.url.value).toBe('https://video.example/talk');
    // Not in the request: left out (D48); a video needs it (D54), so the
    // repair is asked for it
    const invented = run([insert('https://video.example/other')]);
    expect(invented.invalid[0].errors[0]).toMatchObject({
      code: 'missing_field',
    });
  });
});
