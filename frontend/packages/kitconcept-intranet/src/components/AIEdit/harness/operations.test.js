// The tests check that script URLs are rejected
/* eslint-disable no-script-url */
import { describe, expect, it } from 'vitest';
import {
  createValidator,
  operationsFromToolCalls,
  repairText,
  validateOperations,
} from './operations';
import { projectPage } from './projection';
import {
  gridPage,
  intranetPage,
  lightThemePage,
  profile,
} from './__fixtures__/pages';

// Refs: lightThemePage b1 title, b2 slate (theme unset), b3 slate (grey),
// b4 __button; intranetPage b1 title, b2 link text, b3 image, b4
// separator, b5 table (text locked); gridPage b1 heading, b2 grid with
// b2.1 image and b2.2 slate.
const validateFor = (request, formData, ...raws) => {
  const links = {};
  const { page } = projectPage({ formData, profile, links });
  return validateOperations(
    raws.map((raw, index) => ({ raw, number: index + 1 })),
    { page, profile, links, request },
  );
};
const validate = (formData, ...raws) => validateFor('', formData, ...raws);

const op = (raw) => ({ reason: 'Because.', category: 'grammar', ...raw });
const codes = (result) =>
  result.invalid.flatMap(({ errors }) => errors.map((e) => e.code));

describe('operationsFromToolCalls', () => {
  it('reads arguments as JSON strings or objects, numbering across calls', () => {
    const { operations, errors } = operationsFromToolCalls([
      {
        id: 'a',
        function: {
          name: 'propose_changes',
          arguments: '{"operations": [{"op": "delete_block", "block": "b2"}]}',
        },
      },
      {
        id: 'b',
        function: {
          name: 'propose_changes',
          arguments: { operations: [{ op: 'delete_block', block: 'b3' }] },
        },
      },
    ]);
    expect(errors).toEqual([]);
    expect(operations.map(({ number, callId }) => [number, callId])).toEqual([
      [1, 'a'],
      [2, 'b'],
    ]);
  });

  it('reports unknown tools and unreadable arguments', () => {
    const { operations, errors } = operationsFromToolCalls([
      { function: { name: 'search', arguments: '{}' } },
      { function: { name: 'propose_changes', arguments: '{"operations": ' } },
      { function: { name: 'propose_changes', arguments: { blocks: [] } } },
    ]);
    expect(operations).toEqual([]);
    expect(errors.map((e) => e.code)).toEqual([
      'unknown_tool',
      'invalid_call',
      'invalid_call',
    ]);
  });
});

describe('common checks', () => {
  it('needs a known op; an unknown category is "other" (D57)', () => {
    const result = validate(
      lightThemePage,
      { op: 'rename_block', block: 'b2' },
      {
        op: 'edit_block',
        block: 'b2',
        fields: { text: 'Hi.' },
        category: 'cleanup',
      },
      { op: 'delete_block', block: 'b3', category: 'grammar' },
    );
    expect(codes(result)).toEqual(['unknown_op']);
    expect(result.invalid[0].errors[0].message).toMatch(
      /^Operation 1 \(rename_block b2\): "op" must be one of: /,
    );
    // Labels only: unknown is "other", a delete is always "structure"
    expect(result.valid.map((o) => o.category)).toEqual(['other', 'structure']);
    expect(result.warnings).toContainEqual({
      code: 'category_unknown',
      detail: 'cleanup',
      number: 2,
    });
  });

  it('accepts a category in any case, and a missing reason', () => {
    const result = validate(lightThemePage, {
      op: 'delete_block',
      block: 'b2',
      category: ' Structure ',
    });
    expect(result.valid[0]).toMatchObject({
      category: 'structure',
      reason: '',
    });
  });
});

describe('set_page_field', () => {
  it('normalizes a page field change', () => {
    const result = validate(
      lightThemePage,
      op({ op: 'set_page_field', field: 'title', value: ' Our page ' }),
    );
    expect(result.valid).toEqual([
      {
        op: 'set_page_field',
        number: 1,
        callId: undefined,
        reason: 'Because.',
        category: 'grammar',
        field: 'title',
        kind: 'string',
        value: 'Our page',
      },
    ]);
  });

  it('rejects unknown fields, empty values and lines in a title', () => {
    const result = validate(
      lightThemePage,
      op({ op: 'set_page_field', field: 'subjects', value: 'x' }),
      op({ op: 'set_page_field', field: 'description', value: '  ' }),
      op({ op: 'set_page_field', field: 'title', value: 'A\nB' }),
    );
    expect(codes(result)).toEqual([
      'unknown_field',
      'empty_value',
      'multiline',
    ]);
    expect(result.invalid[0].errors[0].message).toMatch(
      /Its fields: title, description\.$/,
    );
  });

  it('drops an unchanged value with a warning', () => {
    const result = validate(
      lightThemePage,
      op({ op: 'set_page_field', field: 'title', value: 'page' }),
    );
    expect(result.valid).toEqual([]);
    expect(result.warnings).toEqual([
      { code: 'unchanged', detail: 'title', number: 1 },
    ]);
  });
});

describe('edit_block', () => {
  it('takes content and styling fields together (D35)', () => {
    const result = validate(
      lightThemePage,
      op({
        op: 'edit_block',
        block: 'b2',
        fields: { text: 'Cras odio.', theme: 'grey' },
      }),
    );
    expect(result.valid[0]).toMatchObject({
      op: 'edit_block',
      ref: 'b2',
      id: '8f0a61d2',
      type: 'slate',
      parentId: null,
      fields: {
        text: {
          kind: 'richtext',
          path: 'value',
          value: 'Cras odio.',
          elements: 1,
        },
        theme: { kind: 'styling', path: 'theme', value: 'grey' },
      },
    });
  });

  it('names the allowed styling values and fields', () => {
    const result = validate(
      lightThemePage,
      op({
        op: 'edit_block',
        block: 'b4',
        fields: { align: 'justify', url: '/x' },
      }),
    );
    expect(result.invalid[0].errors.map((e) => e.message)).toEqual([
      'Operation 1 (edit_block b4): "align" must be one of: left, center, right.',
      'Operation 1 (edit_block b4): This block has no field "url". Its fields: title, href, theme, align, blockWidth.',
    ]);
  });

  it('rejects read-only blocks and locked fields', () => {
    const result = validate(
      intranetPage,
      op({ op: 'edit_block', block: 'b1', fields: { text: 'x' } }),
      op({ op: 'edit_block', block: 'b5', fields: { text: 'x' } }),
      op({ op: 'edit_block', block: 'b9', fields: { text: 'x' } }),
    );
    expect(codes(result)).toEqual([
      'readonly_block',
      'locked_field',
      'unknown_block',
    ]);
  });

  it('allows styling on a block whose text is locked', () => {
    const result = validate(
      intranetPage,
      op({ op: 'edit_block', block: 'b5', fields: { theme: 'grey' } }),
    );
    expect(result.valid).toHaveLength(1);
  });

  it('drops unchanged fields: same content, default on an unset field', () => {
    const result = validate(
      lightThemePage,
      // b2's theme is unset: "default" is its effective value
      op({
        op: 'edit_block',
        block: 'b2',
        fields: { text: 'Cras justo odio.', theme: 'default' },
      }),
      op({
        op: 'edit_block',
        block: 'b3',
        fields: { text: '*Donec* id elit non mi.', theme: 'grey' },
      }),
    );
    expect(result.valid).toHaveLength(1);
    expect(Object.keys(result.valid[0].fields)).toEqual(['text']);
    expect(result.warnings).toEqual([
      { code: 'unchanged', detail: 'b2 text', number: 1 },
      { code: 'unchanged', detail: 'b2 theme', number: 1 },
      { code: 'unchanged', detail: 'b3 theme', number: 2 },
    ]);
  });

  it('counts the elements of a text that will be split (D7)', () => {
    const result = validate(
      lightThemePage,
      op({
        op: 'edit_block',
        block: 'b2',
        fields: { text: '## Title\n\nText.' },
      }),
    );
    expect(result.valid[0].fields.text.elements).toBe(2);
  });
});

describe('placeholders and links (D9)', () => {
  const edit = (text) =>
    op({ op: 'edit_block', block: 'b2', fields: { text } });

  it('keeps a placeholder of the block', () => {
    const result = validate(intranetPage, edit('See [our buttons](link:1).'));
    expect(result.valid[0].fields.text.removedPlaceholders).toBeUndefined();
  });

  it('allows removing one, and reports it for the diff', () => {
    const result = validate(intranetPage, edit('No link any more.'));
    expect(result.valid[0].fields.text.removedPlaceholders).toEqual(['link:1']);
  });

  it('rejects duplicated, unknown and foreign placeholders', () => {
    const result = validate(
      intranetPage,
      edit('[a](link:1) and [b](link:1)'),
      edit('See [x](link:9).'),
      op({ op: 'edit_block', block: 'b3', fields: { description: 'x' } }),
    );
    expect(codes(result)).toEqual([
      'duplicate_placeholder',
      'unknown_placeholder',
    ]);
    const foreign = validate(
      intranetPage,
      op({
        op: 'insert_block',
        type: 'slate',
        after: 'b3',
        fields: { text: 'Again [here](link:1).' },
      }),
    );
    expect(codes(foreign)).toEqual(['foreign_placeholder']);
  });

  it('accepts safe new links, rejects others', () => {
    expect(
      validateFor(
        'Link b to https://x.org and c to tel:123456',
        intranetPage,
        edit('[a](link:1), [b](https://x.org), [c](tel:123456)'),
      ).valid,
    ).toHaveLength(1);
    expect(
      codes(
        validate(intranetPage, edit('[a](link:1) [b](javascript:alert(1))')),
      ),
    ).toEqual(['unsafe_url']);
  });
});

describe('new link targets (D48, D52)', () => {
  const paragraph = (text) => ({
    blocks: {
      p: { '@type': 'slate', value: [{ type: 'p', children: [{ text }] }] },
    },
    blocks_layout: { items: ['p'] },
  });
  const page = paragraph(
    'Write to events@nimbus.example or call +1 (555) 555-0171.',
  );
  const write = (text) =>
    op({ op: 'edit_block', block: 'b1', fields: { text } });

  it('rejects a URL the user did not give', () => {
    expect(
      codes(
        validate(page, write('[Register now](https://example.com/register)')),
      ),
    ).toEqual(['invented_url']);
    expect(
      validateFor(
        'link it to https://example.com/register',
        page,
        write('[Register now](https://example.com/register)'),
      ).valid,
    ).toHaveLength(1);
  });

  it('accepts an e-mail address or phone number written on the page', () => {
    expect(
      validate(
        page,
        write(
          'Write to [us](mailto:events@nimbus.example) or [call](tel:+15555550171).',
        ),
      ).valid,
    ).toHaveLength(1);
    expect(
      codes(validate(page, write('[Mail](mailto:other@nimbus.example)'))),
    ).toEqual(['invented_url']);
  });
});

describe('insert_block', () => {
  it('inserts slate by default, after any block', () => {
    const result = validate(
      gridPage,
      op({
        op: 'insert_block',
        type: 'slate',
        after: 'b2.2',
        fields: { text: 'New.', theme: 'grey' },
      }),
    );
    expect(result.valid[0]).toMatchObject({
      position: 'after',
      anchorRef: 'b2.2',
      anchorId: 'txt',
      containerId: 'grid',
      type: 'slate',
      elements: 1,
    });
  });

  it('inserts into a container, not into other blocks', () => {
    const result = validate(
      gridPage,
      op({
        op: 'insert_block',
        type: 'slate',
        into: 'b2',
        fields: { text: 'First.' },
      }),
      op({
        op: 'insert_block',
        type: 'slate',
        into: 'b1',
        fields: { text: 'x' },
      }),
      op({
        op: 'insert_block',
        type: 'slate',
        after: 'b1',
        into: 'b2',
        fields: { text: 'x' },
      }),
    );
    expect(result.valid[0]).toMatchObject({
      position: 'into',
      containerId: 'grid',
    });
    expect(codes(result)).toEqual(['not_container', 'invalid_position']);
  });

  it('only creates insertable types and needs their text', () => {
    const result = validate(
      lightThemePage,
      op({
        op: 'insert_block',
        after: 'b2',
        type: 'image',
        fields: { alt: 'Go' },
      }),
      op({
        op: 'insert_block',
        type: 'slate',
        after: 'b2',
        fields: { theme: 'grey' },
      }),
    );
    expect(codes(result)).toEqual(['not_insertable', 'missing_field']);
    expect(result.invalid[0].errors[0].message).toMatch(
      /Types that can: slate, __button\.$/,
    );
  });

  it("respects a container's capacity, also across operations", () => {
    // The grid holds 2 of at most 4 blocks
    const three = op({
      op: 'insert_block',
      type: 'slate',
      into: 'b2',
      fields: { text: 'a\n\nb\n\nc' },
    });
    expect(codes(validate(gridPage, three))).toEqual(['container_full']);
    const result = validate(
      gridPage,
      op({
        op: 'insert_block',
        type: 'slate',
        into: 'b2',
        fields: { text: 'a' },
      }),
      op({
        op: 'insert_block',
        type: 'slate',
        after: 'b2.1',
        fields: { text: 'b' },
      }),
      op({
        op: 'insert_block',
        type: 'slate',
        after: 'b2.2',
        fields: { text: 'c' },
      }),
    );
    expect(result.valid).toHaveLength(2);
    expect(codes(result)).toEqual(['container_full']);
  });

  it('counts a split inside a container against its capacity', () => {
    // 2 blocks; splitting one into 3 adds 2: exactly the maximum of 4
    const edit = (text) =>
      op({ op: 'edit_block', block: 'b2.2', fields: { text } });
    expect(validate(gridPage, edit('a\n\nb\n\nc')).valid).toHaveLength(1);
    expect(codes(validate(gridPage, edit('a\n\nb\n\nc\n\nd')))).toEqual([
      'container_full',
    ]);
  });
});

describe('repairText', () => {
  it('lists the failed operations as sent, with their errors', () => {
    const raw = op({
      op: 'edit_block',
      block: 'b4',
      fields: { align: 'justify' },
    });
    const { invalid } = validate(lightThemePage, raw);
    expect(repairText(invalid)).toBe(
      [
        'Some operations could not be used. Call propose_changes again with the complete corrected proposal: every operation you still want, the ones below corrected. Operations you leave out are withdrawn. The page above does not include your proposed changes yet: it still shows the values you are changing.',
        `- ${JSON.stringify(raw)}`,
        '  Operation 1 (edit_block b4): "align" must be one of: left, center, right.',
      ].join('\n'),
    );
  });
});

describe('review fixes', () => {
  const page = (blocks, title = 'Page') => ({
    title,
    blocks: Object.fromEntries(blocks.map((block, i) => [`id${i}`, block])),
    blocks_layout: { items: blocks.map((_, i) => `id${i}`) },
  });
  const text = (...children) => ({
    '@type': 'slate',
    value: [{ type: 'p', children }],
  });
  const link = (label) => ({
    type: 'link',
    data: { url: '/contact' },
    children: [{ text: label }],
  });
  const edit = (value) =>
    op({ op: 'edit_block', block: 'b1', fields: { text: value } });

  it('allows a placeholder as often as the block has it (same link twice)', () => {
    const twice = page([
      text({ text: 'Call ' }, link('us'), { text: ' or ' }, link('write')),
    ]);
    // Both links have the same target: one placeholder, twice
    const kept = validate(twice, edit('Call [us](link:1) or [write](link:1).'));
    expect(kept.invalid).toEqual([]);
    const one = validate(twice, edit('Call [us](link:1).'));
    expect(one.valid[0].fields.text.removedPlaceholders).toEqual(['link:1']);
    const thrice = validate(twice, edit('[a](link:1) [b](link:1) [c](link:1)'));
    expect(codes(thrice)).toEqual(['duplicate_placeholder']);
  });

  it('reports an altered placeholder of any kind as unknown, not unsafe', () => {
    const mention = page([
      text(
        { text: 'Ask ' },
        {
          type: 'mention',
          data: { user: 'jane' },
          children: [{ text: 'Jane' }],
        },
      ),
    ]);
    const result = validate(mention, edit('Ask [Jane](mention:9).'));
    expect(codes(result)).toEqual(['unknown_placeholder']);
  });

  it('turns escaped tag names back, unless they are literal on the page', () => {
    const titled = page([text({ text: 'x' })], 'About <title> tags');
    // The prompt showed "&lt;title>"; the model copied it
    const result = validate(
      titled,
      op({
        op: 'set_page_field',
        field: 'title',
        value: 'All about &lt;title> tags',
      }),
    );
    expect(result.valid[0].value).toBe('All about <title> tags');
    const literal = page([text({ text: 'x' })], 'Write &lt;title> as is');
    const kept = validate(
      literal,
      op({
        op: 'set_page_field',
        field: 'title',
        value: 'Write &lt;title> like this',
      }),
    );
    expect(kept.valid[0].value).toBe('Write &lt;title> like this');
  });
});

describe('createValidator', () => {
  const setupGrid = () => {
    const links = {};
    const { page } = projectPage({ formData: gridPage, profile, links });
    return createValidator({ page, profile, links });
  };
  const insertInto = (number, text) => ({
    raw: op({
      op: 'insert_block',
      type: 'slate',
      into: 'b2',
      fields: { text },
    }),
    number,
  });

  it('adds container capacities up across the answers of a turn (D8)', () => {
    const validate = setupGrid();
    // The grid holds 2 of 4: two inserts fill it
    const first = validate([insertInto(1, 'a'), insertInto(2, 'b')]);
    expect(first.valid).toHaveLength(2);
    const repair = validate([insertInto(3, 'c')]);
    expect(repair.invalid[0].errors[0].code).toBe('container_full');
  });

  it('drops an operation sent again as a duplicate', () => {
    const validate = setupGrid();
    validate([insertInto(1, 'a')]);
    const again = validate([insertInto(2, 'a')]);
    expect(again.valid).toEqual([]);
    expect(again.warnings).toEqual([
      { code: 'duplicate', detail: 'insert_block b2', number: 2 },
    ]);
  });

  it("uses the backend's vocabulary: categories, operations, tags", () => {
    const links = {};
    const { page } = projectPage({ formData: gridPage, profile, links });
    const validate = createValidator({
      page,
      profile,
      links,
      vocabulary: {
        categories: ['fix'],
        // An operation this harness cannot apply does not count
        operations: ['delete_block', 'edit_block', 'set_page_field_v2'],
        structuralTags: ['frame'],
      },
    });
    const result = validate([
      {
        raw: {
          op: 'edit_block',
          block: 'b1',
          fields: { text: 'X' },
          category: 'grammar',
        },
        number: 1,
      },
      { raw: { op: 'delete_block', block: 'b2', category: 'fix' }, number: 2 },
      {
        raw: { op: 'set_page_field_v2', field: 'title', category: 'fix' },
        number: 3,
      },
      {
        raw: {
          op: 'set_page_field',
          field: 'title',
          value: 'x',
          category: 'fix',
        },
        number: 4,
      },
      {
        raw: {
          op: 'edit_block',
          block: 'b1',
          fields: { text: 'A &lt;frame> tag' },
          category: 'fix',
        },
        number: 5,
      },
    ]);
    // grammar is not in this vocabulary: "other"
    expect(
      result.invalid.map((i) => [i.operation.number, i.errors[0].code]),
    ).toEqual([
      [3, 'unknown_op'],
      [4, 'unknown_op'],
    ]);
    expect(result.valid.map((op) => [op.number, op.category])).toEqual([
      [1, 'other'],
      [2, 'structure'],
      [5, 'fix'],
    ]);
    expect(result.valid[2].fields.text.value).toBe('A <frame> tag');
  });

  it('ignores inherited keys as page fields', () => {
    const result = validate(
      lightThemePage,
      op({ op: 'set_page_field', field: 'constructor', value: 'x' }),
    );
    expect(codes(result)).toEqual(['unknown_field']);
  });
});

describe('text that parses to nothing', () => {
  it.each([
    ['a rule', '---'],
    ['an image', '![x](/y.png)'],
  ])('rejects %s, which would blank the block', (name, text) => {
    const result = validate(
      lightThemePage,
      op({ op: 'edit_block', block: 'b2', fields: { text } }),
      op({ op: 'insert_block', type: 'slate', after: 'b2', fields: { text } }),
    );
    expect(codes(result)).toEqual(['empty_value', 'empty_value']);
  });
});

describe('replace_text (D41)', () => {
  const para = (...children) => [{ type: 'p', children }];
  // b1 a date line, b2 a paragraph with a link, b3 an image
  const summit = {
    title: 'Horizon Summit 2027',
    description: 'One day, March 18.',
    blocks: {
      date: {
        '@type': 'slate',
        value: para({
          text: 'Hosted by Nimbus · Thursday, March 18, 2027 · Riverton',
        }),
      },
      about: {
        '@type': 'slate',
        value: para(
          { text: 'It takes place on March 18, 2027. Last year: March 19. ' },
          {
            type: 'link',
            data: { url: '/register' },
            children: [{ text: 'Register' }],
          },
          { text: ' by March 11. Don’t miss it.' },
        ),
      },
      img: { '@type': 'image', alt: 'Hall', title: 'Hall' },
    },
    blocks_layout: { items: ['date', 'about', 'img'] },
  };
  const setup = () => {
    const links = {};
    const { page } = projectPage({ formData: summit, profile, links });
    const validate = createValidator({ page, profile, links });
    let number = 0;
    return (...raws) =>
      validate(
        raws.map((raw) => {
          number += 1;
          return { raw: op({ category: 'outdated', ...raw }), number };
        }),
      );
  };
  const replace = (block, find, to, more = {}) => ({
    op: 'replace_text',
    block,
    find,
    replace: to,
    ...more,
  });

  it('replaces the words in the text field, keeping the rest', () => {
    const { valid, invalid } = setup()(
      replace('b1', 'Thursday, March 18', 'Friday, April 9'),
    );
    expect(invalid).toEqual([]);
    expect(valid[0]).toMatchObject({
      op: 'replace_text',
      ref: 'b1',
      field: 'text',
      fields: {
        text: {
          kind: 'richtext',
          value: 'Hosted by Nimbus · Friday, April 9, 2027 · Riverton',
        },
      },
      replacements: [
        { find: 'Thursday, March 18', replace: 'Friday, April 9', number: 1 },
      ],
    });
  });

  it('merges the replacements of a field, all on the original text', () => {
    const { valid } = setup()(
      replace('b2', 'on March 18, 2027', 'on April 9, 2027'),
      replace('b2', 'by March 11', 'by April 2', {
        reason: 'One week before.',
      }),
    );
    expect(valid[1].fields.text.value).toBe(
      'It takes place on April 9, 2027. Last year: March 19. [Register](link:1) by April 2. Don’t miss it.',
    );
    expect(valid[1].replacements.map((r) => r.reason)).toEqual([
      'Because.',
      'One week before.',
    ]);
  });

  it('matches loosely, and reports what it cannot find or tell apart', () => {
    const run = setup();
    const loose = run(replace('b2', "Don't miss it", 'See you there'));
    expect(loose.valid[0].replacements[0]).toMatchObject({
      find: 'Don’t miss it',
      loose: true,
    });
    const failed = run(
      replace('b2', 'by March 11 so', 'x'),
      replace('b1', 'March 18 2027', 'x'),
      replace('b2', 'March', 'April'),
    );
    expect(codes(failed)).toEqual(['not_found', 'not_found', 'ambiguous']);
    expect(failed.invalid[1].errors[0].message).toContain(
      'Closest: "March 18, 2027"',
    );
    expect(failed.invalid[2].errors[0].message).toContain('occurs 3 times');
  });

  it('rejects a replacement that repeats the text next to it', () => {
    // The second browser test: ", 2027" stayed after the match
    const result = setup()(
      replace('b1', 'Thursday, March 18', 'Friday, April 9, 2027'),
    );
    expect(codes(result)).toEqual(['repeats_text']);
    expect(result.invalid[0].errors[0].message).toContain(
      '"replace" repeats ", 2027", which is already next to "Thursday, March 18" in b1 text.',
    );
  });

  it('rejects overlaps; a replacement sent again is a duplicate', () => {
    const run = setup();
    run(replace('b1', 'March 18, 2027', 'April 9, 2027'));
    const again = run(
      replace('b1', 'March 18, 2027', 'April 9, 2027'),
      replace('b1', 'Thursday, March 18', 'Friday, April 9'),
    );
    expect(again.warnings).toEqual([
      { code: 'duplicate', detail: 'replace_text b1 text', number: 2 },
    ]);
    expect(codes(again)).toEqual(['overlap']);
  });

  it('does not mix with a rewrite of the same field, in either order', () => {
    const editFirst = setup()(
      { op: 'edit_block', block: 'b1', fields: { text: 'New.' } },
      replace('b1', 'March 18', 'April 9'),
    );
    expect(codes(editFirst)).toEqual(['conflict']);
    const replaceFirst = setup()(
      replace('b1', 'March 18', 'April 9'),
      {
        op: 'edit_block',
        block: 'b1',
        fields: { text: 'New.', theme: 'grey' },
      },
      { op: 'edit_block', block: 'b1', fields: { theme: 'grey' } },
    );
    expect(codes(replaceFirst)).toEqual(['conflict']);
    // Styling of the same block is another field
    expect(replaceFirst.valid.map((o) => o.number)).toEqual([1, 3]);
  });

  it('changes a page field without "block"', () => {
    const { valid } = setup()({
      op: 'replace_text',
      field: 'description',
      find: 'March 18',
      replace: 'April 9',
    });
    expect(valid[0]).toMatchObject({
      field: 'description',
      kind: 'text',
      value: 'One day, April 9.',
    });
  });

  it('checks the result like an edit: placeholders, fields, values', () => {
    const run = setup();
    const result = run(
      replace('b2', '(link:1)', '(link:2)'),
      replace('b1', 'Riverton', 'X', { field: 'theme' }),
      replace('b3', 'Hall', 'Main hall', { field: 'alt' }),
      { op: 'replace_text', block: 'b1', find: '', replace: 'x' },
      { op: 'replace_text', field: 'body', find: 'a', replace: 'b' },
    );
    expect(codes(result)).toEqual([
      'unknown_placeholder',
      'unknown_field',
      'invalid_find',
      'unknown_field',
    ]);
    expect(result.valid[0].fields.alt.value).toBe('Main hall');
  });
});

describe('Mr. Spock test fixes', () => {
  const insert = (after, fields, more = {}) =>
    op({ op: 'insert_block', type: 'slate', after, fields, ...more });

  it('reads a ref under a non-container as a row after it (D45)', () => {
    const result = validate(
      lightThemePage,
      insert('b2', { text: '### Mr. Spock' }),
      insert('b2.1', { text: '*Attendee*' }),
    );
    expect(result.invalid).toEqual([]);
    expect(result.valid.map((o) => o.anchorRef)).toEqual(['b2', 'b2']);
    expect(result.warnings).toEqual([
      { code: 'chained_ref', detail: 'b2.1 -> after b2', number: 2 },
    ]);
    // In a container, a missing child is still unknown, with the hint
    const grid = validate(gridPage, insert('b2.5', { text: 'x' }));
    expect(codes(grid)).toEqual(['unknown_block']);
    expect(grid.invalid[0].errors[0].message).toContain(
      'give each one the same "after"',
    );
  });

  it('rejects "(empty)" as a value and unclosed emphasis', () => {
    const result = validate(
      lightThemePage,
      insert('b2', { text: '*Workshop host' }),
      insert('b2', { text: '(empty)' }),
      op({ op: 'set_page_field', field: 'description', value: '(empty)' }),
      // The page's marker now, and the old one with words after it (D52)
      insert('b2', { text: '""' }),
      insert('b2', { text: '(empty) - Please provide a descriptive alt text' }),
    );
    expect(codes(result)).toEqual([
      'unclosed_marker',
      'empty_value',
      'empty_value',
      'empty_value',
      'empty_value',
    ]);
    // Closed, escaped or in code: fine
    expect(
      validate(
        lightThemePage,
        insert('b2', { text: '*Workshop host*' }),
        insert('b3', { text: 'Required \\* fields' }),
        insert('b4', { text: 'Use `a*b` here' }),
      ).invalid,
    ).toEqual([]);
  });

  it('notes the formatting a rewrite loses (D52)', () => {
    const formatted = {
      blocks: {
        p: {
          '@type': 'slate',
          value: [
            {
              type: 'p',
              children: [
                { text: 'Meet ' },
                { type: 'strong', children: [{ text: 'Ada' }] },
                { text: ' and ' },
                { type: 'em', children: [{ text: 'Marcus' }] },
              ],
            },
          ],
        },
      },
      blocks_layout: { items: ['p'] },
    };
    const edit = (text) =>
      validate(
        formatted,
        op({ op: 'edit_block', block: 'b1', fields: { text } }),
      ).valid[0].fields.text;
    expect(edit('Please meet **Ada** and Marcus.').droppedFormatting).toEqual([
      'italic',
    ]);
    expect(
      edit('Please meet **Ada** and *Marcus*.').droppedFormatting,
    ).toBeUndefined();
  });

  it('drops styling set to its default on new blocks', () => {
    const { valid } = validateFor(
      'make the second one grey',
      lightThemePage,
      insert('b2', { text: 'One', theme: 'default' }),
      insert('b3', { text: 'Two', theme: 'grey' }),
    );
    expect(valid.map((o) => Object.keys(o.fields))).toEqual([
      ['text'],
      ['text', 'theme'],
    ]);
  });
});

describe("Volto's block locks", () => {
  const locked = {
    title: 'Event',
    blocks: {
      meta: { '@type': 'slate', required: true, fixed: true, value: [] },
      view: {
        '@type': 'slate',
        readOnly: true,
        value: [{ type: 'p', children: [{ text: 'Fixed text.' }] }],
      },
      free: { '@type': 'separator', required: false },
    },
    blocks_layout: { items: ['meta', 'view', 'free'] },
  };

  it('keeps required blocks and read-only blocks as Volto does', () => {
    const result = validate(
      locked,
      op({ op: 'delete_block', block: 'b1' }),
      op({ op: 'edit_block', block: 'b2', fields: { text: 'New.' } }),
      op({ op: 'delete_block', block: 'b3' }),
    );
    expect(codes(result)).toEqual(['required_block', 'readonly_block']);
    expect(result.valid.map((o) => o.ref)).toEqual(['b3']);
  });

  it("takes the site's required types from the profile", () => {
    const links = {};
    const { page } = projectPage({
      formData: locked,
      profile: { ...profile, requiredBlocks: ['separator', 'slate'] },
      links,
    });
    // A block's own flag wins over the site's list
    expect(page.blocks.map((b) => !!b.required)).toEqual([true, true, false]);
  });
});

describe('button blocks: what they need', () => {
  const button = (fields) =>
    op({ op: 'insert_block', after: 'b2', type: '__button', fields });

  it('needs a label, takes only real link targets', () => {
    // Links as if the editor had typed them (else they are left out)
    const links = {};
    const { page } = projectPage({ formData: lightThemePage, profile, links });
    const result = createValidator({
      page,
      profile,
      links,
      request: 'Link to https://example.com, javascript:alert(1) or link:1',
    })(
      [
        button({ href: 'https://example.com' }),
        button({ title: 'Go', href: 'javascript:alert(1)' }),
        button({ title: 'Go', href: 'link:1' }),
        button({ title: 'Go' }),
      ].map((raw, index) => ({ raw, number: index + 1 })),
    );
    expect(codes(result)).toEqual([
      'missing_field',
      'unsafe_url',
      'unsafe_url',
    ]);
    // A button without a link is valid: the model asks for it
    expect(result.valid).toHaveLength(1);
  });
});

describe('reading what small models send (D48)', () => {
  it('moves misplaced keys, resolves type names, defaults the category', () => {
    // The 8B model's call: type and align in fields, the fields nested,
    // the category once for the call, "button" for __button
    const { operations } = operationsFromToolCalls([
      {
        id: 'c',
        function: {
          name: 'propose_changes',
          arguments: JSON.stringify({
            message: 'Added a button.',
            category: 'layout',
            operations: [
              {
                op: 'insert_block',
                after: 'b2',
                fields: {
                  align: 'right',
                  fields: { title: 'Register now' },
                  type: 'button',
                },
              },
            ],
          }),
        },
      },
    ]);
    expect(operations[0].raw).toEqual({
      op: 'insert_block',
      after: 'b2',
      type: 'button',
      fields: { align: 'right', title: 'Register now' },
      category: 'layout',
    });
    const links = {};
    const { page } = projectPage({ formData: lightThemePage, profile, links });
    const { valid, invalid } = createValidator({ page, profile, links })(
      operations,
    );
    expect(invalid).toEqual([]);
    // An insert is "structure", whatever the call said (D57)
    expect(valid[0]).toMatchObject({ type: '__button', category: 'structure' });
    // No category at all: "other", not a repair
    const bare = validate(lightThemePage, {
      op: 'edit_block',
      block: 'b2',
      fields: { text: 'Hi.' },
    });
    expect(bare.valid[0].category).toBe('other');
  });
});

describe('insert_block: the type is required', () => {
  it('asks for it, without listing the types', () => {
    const result = validate(lightThemePage, {
      ...op({ op: 'insert_block', after: 'b2', fields: { text: 'Hi.' } }),
    });
    expect(codes(result)).toEqual(['missing_type']);
    expect(result.invalid[0].errors[0].message).toBe(
      'Operation 1 (insert_block b2): insert_block needs "type": one of the types marked insertable in <types>.',
    );
  });
});
