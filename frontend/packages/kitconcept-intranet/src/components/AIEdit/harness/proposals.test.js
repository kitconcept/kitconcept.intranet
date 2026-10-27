/**
 * The operations and safe defaults of D57 (moves, rows of inserts,
 * clearing, questions, notices, retries, the budget), through a whole
 * turn. The second tool architecture of D57 and its parity tests are
 * gone (D58, AI_EDIT_INTENT_TOOLSET.md).
 */
import { describe, expect, it } from 'vitest';
import { modelHistory, runTurn } from './index';
import { applyChanges } from './changes';
import { createValidator, proposeCall } from './operations';
import { projectPage } from './projection';
import { gridPage, lightThemePage, profile } from './__fixtures__/pages';

// Refs: b1 title, b2 slate, b3 slate (grey), b4 __button
const turn = (answers, more = {}) => {
  const requests = [];
  const send = async (request) => {
    requests.push(request);
    return answers.shift();
  };
  return runTurn({
    text: 'Improve the page and add a heading, then "Sign up" below',
    formData: lightThemePage,
    profile,
    language: 'en',
    send,
    ...more,
  }).then((result) => ({ ...result, requests }));
};

const answerOf = (operations, message = 'I propose this.') => ({
  message: '',
  tool_calls: [proposeCall('call_1', { message, operations })],
  finish_reason: 'tool_calls',
  usage: { prompt_tokens: 2000, completion_tokens: 100 },
});

describe('moves (D57)', () => {
  it('moves a block, keeping its content; checks the place', async () => {
    const { message } = await turn([
      answerOf([
        { op: 'move_block', block: 'b2', after: 'b4', reason: 'Order.' },
        { op: 'move_block', block: 'b3', after: 'b9', reason: 'Order.' },
        { op: 'move_block', block: 'b4', after: 'b3', reason: 'Order.' },
      ]),
      // The repair: the invalid move withdrawn
      answerOf([
        { op: 'move_block', block: 'b2', after: 'b4', reason: 'Order.' },
      ]),
    ]);
    expect(message.repaired).toBe(true);
    expect(message.changes).toHaveLength(1);
    expect(message.changes[0]).toMatchObject({
      kind: 'move',
      ref: 'b2',
      anchorRef: 'b4',
      category: 'structure',
      selected: true,
    });

    const { formData } = applyChanges(message.changes, lightThemePage, {
      baseFormData: lightThemePage,
      profile,
      newId: () => 'x',
    });
    expect(formData.blocks_layout.items).toEqual([
      '534ba6af',
      'fdde2974',
      'f297b80b',
      '8f0a61d2',
    ]);
    expect(formData.blocks['8f0a61d2']).toBe(lightThemePage.blocks['8f0a61d2']);
  });
});

describe('move checks (D57)', () => {
  it('needs an anchor in the same container; already there is no change', () => {
    const links = {};
    const { page } = projectPage({ formData: gridPage, profile, links });
    const result = createValidator({ page, profile, links })(
      [
        { op: 'move_block', block: 'b1', after: 'b9' },
        { op: 'move_block', block: 'b1', after: 'b2.1' },
        { op: 'move_block', block: 'b2.2', after: 'b2.1' },
        { op: 'move_block', block: 'b2.1', after: 'b2.2' },
      ].map((raw, index) => ({
        raw: { reason: 'Order.', ...raw },
        number: index + 1,
      })),
    );
    expect(
      result.invalid.map(({ errors }) => errors.map((e) => e.code)),
    ).toEqual([['unknown_block'], ['not_movable_here']]);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: 'unchanged', detail: 'b2.2 after b2.1' }),
    );
    expect(result.valid.map((op) => [op.ref, op.anchorRef])).toEqual([
      ['b2.1', 'b2.2'],
    ]);
  });
});

describe('splits in a container (a code review)', () => {
  it("counts a field's split once, whatever its replacements", () => {
    // A grid of at most 4 with 2 blocks: three replacements of one text
    // that splits it in two add one block, not three
    const links = {};
    const { page } = projectPage({ formData: gridPage, profile, links });
    const replace = (find, to) => ({
      op: 'replace_text',
      block: 'b2.2',
      find,
      replace: to,
      reason: 'x',
    });
    const result = createValidator({ page, profile, links })(
      [
        replace('Contact', 'Contact.\n\nWrite to'),
        replace('us', 'them'),
        replace('today', 'now'),
      ].map((raw, index) => ({ raw, number: index + 1 })),
    );
    expect(result.invalid).toEqual([]);
    expect(result.valid).toHaveLength(3);
    // The text does split: one block more
    expect(result.valid.at(-1).fields.text.elements).toBe(2);
  });
});

describe('clearing a field with null (D57)', () => {
  it('clears an optional field, never a required one or a text', async () => {
    const page = {
      ...lightThemePage,
      blocks: {
        ...lightThemePage.blocks,
        f297b80b: {
          ...lightThemePage.blocks.f297b80b,
          title: 'Go',
          href: [{ '@id': 'https://example.org' }],
        },
      },
    };
    const { message } = await turn(
      [
        answerOf([
          {
            op: 'edit_block',
            block: 'b4',
            fields: { href: null },
            reason: 'Asked.',
          },
          {
            op: 'edit_block',
            block: 'b4',
            fields: { title: null },
            reason: 'Asked.',
          },
          {
            op: 'edit_block',
            block: 'b2',
            fields: { text: null },
            reason: 'Asked.',
          },
        ]),
      ],
      { formData: page, text: 'Remove the target of this button' },
    );
    expect(message.changes.map((c) => [c.label, c.value, c.cleared])).toEqual([
      ['b4 href', '', true],
    ]);
    expect(message.dropped.flatMap((d) => d.codes)).toEqual([
      'not_clearable',
      'not_clearable',
    ]);
    const { formData } = applyChanges(message.changes, page, {
      baseFormData: page,
      profile,
      newId: () => 'x',
    });
    expect(formData.blocks.f297b80b.href).toEqual([]);
    // The history says null, as the model wrote it
    const history = modelHistory([
      { role: 'user', content: 'Remove it' },
      { ...message, applied: [] },
    ]);
    expect(
      JSON.parse(history[1].tool_calls[0].function.arguments).operations[0]
        .fields,
    ).toEqual({ href: null });
  });
});

describe('questions, notices and safe defaults (D57)', () => {
  it('asks for a required field the user did not give, no repair', async () => {
    const { message, requests } = await turn(
      [
        answerOf([
          {
            op: 'insert_block',
            after: 'b2',
            type: '__button',
            fields: { align: 'right' },
            reason: 'Asked.',
          },
        ]),
      ],
      { text: 'add a button below, align it to the right', selected: [] },
    );
    expect(requests).toHaveLength(1);
    expect(message.changes).toEqual([]);
    expect(message.notice).toEqual({
      kind: 'question',
      questions: [{ type: '__button', field: 'title' }],
    });
    expect(message.content).toBe(
      'What should the title of the new button block be?',
    );
  });

  it('explains in its own words when nothing could be used', async () => {
    const { message } = await turn([
      answerOf(
        [
          {
            op: 'insert_block',
            after: 'b2',
            type: 'image',
            fields: {},
            reason: 'Asked.',
          },
        ],
        'I propose inserting an image.',
      ),
    ]);
    expect(message.notice).toEqual({
      kind: 'dropped',
      codes: ['not_insertable'],
    });
    expect(message.content).toBe(
      'This block type cannot be added by the assistant: add it in the editor.',
    );
    expect(message.modelContent).toBe('I propose inserting an image.');
  });

  it('leaves out styling nobody asked for on new blocks', async () => {
    const { message } = await turn(
      [
        answerOf([
          {
            op: 'insert_block',
            after: 'b2',
            type: '__button',
            fields: { title: 'Go', align: 'left', theme: 'grey' },
            reason: 'Asked.',
          },
        ]),
      ],
      { text: 'add a button "Go" with a grey background' },
    );
    expect(Object.keys(message.changes[0].fields)).toEqual(['title', 'theme']);
    expect(message.warnings).toContainEqual(
      expect.objectContaining({
        code: 'style_not_requested',
        detail: 'new __button align',
      }),
    );
  });

  it('flags a block added at the end of the page', async () => {
    const { message } = await turn([
      answerOf([
        {
          op: 'insert_block',
          after: 'b4',
          type: 'slate',
          fields: { text: 'Bye.' },
          reason: 'Asked.',
        },
        {
          op: 'insert_block',
          after: 'b2',
          type: 'slate',
          fields: { text: 'Hi.' },
          reason: 'Asked.',
        },
      ]),
    ]);
    expect(message.changes.map((c) => c.flags.atEnd || false)).toEqual([
      true,
      false,
    ]);
  });

  it('starts risky edits unselected, to be confirmed', async () => {
    const { message } = await turn([
      answerOf([
        {
          op: 'edit_block',
          block: 'b2',
          fields: { text: 'One.\n\nTwo.' },
          reason: 'Split.',
        },
        {
          op: 'edit_block',
          block: 'b3',
          fields: { text: 'Donec id elit non mi, yes.' },
          reason: 'Longer.',
        },
      ]),
    ]);
    expect(
      message.changes.map((c) => [c.label, c.selected, !!c.confirm]),
    ).toEqual([
      ['b2 text', false, true],
      ['b3 text', true, false],
    ]);
  });
});

describe('retries and the budget (D57)', () => {
  it('asks again when the changes came as text instead of a call', async () => {
    const { message, requests } = await turn([
      {
        message:
          'I propose: {"op": "delete_block", "block": "b3", "reason": "x"}',
        tool_calls: [],
        finish_reason: 'stop',
      },
      answerOf([{ op: 'delete_block', block: 'b3', reason: 'Asked.' }]),
    ]);
    expect(requests).toHaveLength(2);
    expect(requests[1].messages.at(-1).content).toMatch(
      /wrote the changes as text instead of calling propose_changes/,
    );
    expect(message).toMatchObject({ retried: true, retryReason: 'text_call' });
    expect(message.changes).toHaveLength(1);
  });

  it('measures characters per token, and logs a repair it has no room for', async () => {
    // A context that fits the first request but not the repair
    const { message, requests } = await turn(
      [
        {
          ...answerOf([
            {
              op: 'edit_block',
              block: 'b2',
              fields: { theme: 'purple' },
              reason: 'x'.repeat(4000),
            },
          ]),
          usage: { prompt_tokens: 1000, completion_tokens: 100 },
        },
      ],
      {
        budget: {
          contextLength: 2600,
          reserveTokens: 0,
          fixedPromptChars: 500,
        },
      },
    );
    expect(requests).toHaveLength(1);
    expect(message.repairSkipped).toBe(true);
    expect(message.warnings).toContainEqual({ code: 'repair_too_long' });
    // Measured from the first call, for the next turns
    expect(message.charsPerToken).toBeGreaterThan(1);
  });
});

describe('after the D57 A/B run (D58)', () => {
  const button = (fields) => ({
    op: 'insert_block',
    after: 'b2',
    type: '__button',
    fields,
    reason: 'Asked.',
  });

  it('asks for a required field sent empty, without a repair', async () => {
    const { message, requests } = await turn(
      [answerOf([button({ title: ' ' })])],
      { text: 'add a button below this one' },
    );
    expect(requests).toHaveLength(1);
    expect(message.repaired).toBe(false);
    expect(message.notice).toEqual({
      kind: 'question',
      questions: [{ type: '__button', field: 'title' }],
    });
  });

  it('asks for a required value taken from the page, not the request', async () => {
    const copied = await turn([answerOf([button({ title: 'Cras justo' })])], {
      text: 'add a button below this one',
    });
    expect(copied.message.changes).toEqual([]);
    expect(copied.message.notice.kind).toBe('question');
    expect(copied.message.warnings).toContainEqual(
      expect.objectContaining({
        code: 'copied_value',
        detail: 'new __button title',
      }),
    );
    // Named in the request: the user gave it
    const given = await turn([answerOf([button({ title: 'Cras justo' })])], {
      text: 'add a button "Cras justo" below this one',
    });
    expect(given.message.changes[0].fields.title.value).toBe('Cras justo');
    // Part of a word on the page is no copy ("Odi" in "odio")
    const word = await turn([answerOf([button({ title: 'Odi' })])], {
      text: 'add a button below this one',
    });
    expect(word.message.changes).toHaveLength(1);
  });

  it('keeps the first answer when nothing of the repair can be used', async () => {
    const { message, requests } = await turn([
      answerOf([
        {
          op: 'edit_block',
          block: 'b2',
          fields: { text: 'Cras justo.' },
          reason: 'Shorter.',
        },
        {
          op: 'edit_block',
          block: 'b3',
          fields: { theme: 'purple' },
          reason: 'Asked.',
        },
      ]),
      answerOf(
        [
          {
            op: 'edit_block',
            block: 'b3',
            fields: { theme: 'violet' },
            reason: 'Asked.',
          },
        ],
        'Fixed.',
      ),
    ]);
    expect(requests).toHaveLength(2);
    expect(message.repaired).toBe(true);
    expect(message.changes.map((c) => c.label)).toEqual(['b2 text']);
    expect(message.warnings).toContainEqual({ code: 'repair_unusable' });
    expect(message.dropped.flatMap((d) => d.codes)).toEqual(['invalid_style']);
    // The words of the proposal that stands
    expect(message.content).toBe('I propose this.');
  });

  it('still withdraws everything with an empty repair proposal (D51)', async () => {
    const { message } = await turn([
      answerOf([
        {
          op: 'edit_block',
          block: 'b2',
          fields: { text: 'Cras justo.' },
          reason: 'Shorter.',
        },
        {
          op: 'edit_block',
          block: 'b3',
          fields: { theme: 'purple' },
          reason: 'Asked.',
        },
      ]),
      answerOf([], 'Withdrawn.'),
    ]);
    expect(message.changes).toEqual([]);
    expect(message.content).toBe('Withdrawn.');
  });

  it("asks again for a call written in the model's own tool format", async () => {
    const { message, requests } = await turn([
      {
        message:
          'I propose this.\n\n<tools>\n{"name": "edit_block", "arguments": {"ref": "b2"}}\n</tools>',
        tool_calls: [],
        finish_reason: 'stop',
      },
      answerOf([{ op: 'delete_block', block: 'b3', reason: 'Asked.' }]),
    ]);
    expect(requests).toHaveLength(2);
    expect(message.retryReason).toBe('text_call');
  });

  it('labels only styling as layout', async () => {
    const { message } = await turn([
      answerOf([
        {
          op: 'edit_block',
          block: 'b3',
          fields: { text: 'Donec id elit.', theme: 'default' },
          reason: 'Asked.',
          category: 'layout',
        },
      ]),
    ]);
    expect(message.changes.map((c) => [c.label, c.category])).toEqual([
      ['b3 text', 'other'],
      ['b3 theme', 'layout'],
    ]);
  });
});

describe('from the code review before publishing (D59)', () => {
  it('keeps the turn when an edit or insert has no usable fields', async () => {
    const { message, requests } = await turn([
      answerOf([
        { op: 'edit_block', block: 'b2', reason: 'Asked.' },
        {
          op: 'insert_block',
          after: 'b2',
          type: 'slate',
          fields: ['Hi.'],
          reason: 'Asked.',
        },
        {
          op: 'edit_block',
          block: 'b3',
          fields: { text: 'Donec id elit.' },
          reason: 'Asked.',
        },
      ]),
      // The repair: the valid one again, the others left out
      answerOf([
        {
          op: 'edit_block',
          block: 'b3',
          fields: { text: 'Donec id elit.' },
          reason: 'Asked.',
        },
      ]),
    ]);
    expect(requests).toHaveLength(2);
    expect(requests[1].messages.at(-1).content).toMatch(
      /invalid_fields|"fields" must be/,
    );
    expect(message.changes.map((c) => c.label)).toEqual(['b3 text']);
  });

  it('keeps the measured characters per token within what a prompt has', async () => {
    const measured = await turn([
      {
        ...answerOf([{ op: 'delete_block', block: 'b3', reason: 'Asked.' }]),
        // Far fewer tokens than the request's size allows
        usage: { prompt_tokens: 10, completion_tokens: 10 },
      },
    ]);
    expect(measured.message.charsPerToken).toBe(6);
    // A cut input measures nothing
    const cut = await turn([
      {
        ...answerOf([{ op: 'delete_block', block: 'b3', reason: 'Asked.' }]),
        usage: {
          prompt_tokens: 10,
          completion_tokens: 10,
          input_truncated: true,
        },
      },
    ]);
    expect(cut.message.charsPerToken).toBeUndefined();
  });

  it('writes the type of every inserted block into the history', async () => {
    const { message } = await turn([
      answerOf([
        {
          op: 'insert_block',
          after: 'b2',
          type: 'slate',
          fields: { text: 'Hi.' },
          reason: 'Asked.',
        },
      ]),
    ]);
    const history = modelHistory([
      { role: 'user', content: 'Add it' },
      { ...message, applied: [] },
    ]);
    expect(
      JSON.parse(history[1].tool_calls[0].function.arguments).operations[0],
    ).toMatchObject({ op: 'insert_block', type: 'slate', after: 'b2' });
  });
});

describe('text referring to a deleted block (D59)', () => {
  const h2 = (text) => [{ type: 'h2', children: [{ text }] }];
  const page = {
    title: 'page',
    blocks: {
      t: { '@type': 'title' },
      intro: {
        '@type': 'slate',
        value: [
          {
            type: 'p',
            children: [
              { text: 'Prices? See the ' },
              {
                type: 'link',
                data: { url: '#pricing' },
                children: [{ text: 'pricing' }],
              },
              { text: ' below.' },
            ],
          },
        ],
      },
      head: { '@type': 'slate', value: h2('Pricing') },
      body: {
        '@type': 'slate',
        value: [{ type: 'p', children: [{ text: 'Ten euros.' }] }],
      },
    },
    blocks_layout: { items: ['t', 'intro', 'head', 'body'] },
  };
  const deletes = [
    { op: 'delete_block', block: 'b3', reason: 'Asked.' },
    { op: 'delete_block', block: 'b4', reason: 'Asked.' },
  ];

  it('asks once for the text that links to a deleted heading', async () => {
    const { message, requests } = await turn(
      [
        answerOf(deletes),
        answerOf([
          ...deletes,
          {
            op: 'edit_block',
            block: 'b2',
            fields: { text: 'Prices are on request.' },
            reason: 'Its section is gone.',
          },
        ]),
      ],
      { formData: page, text: 'Remove the pricing section' },
    );
    expect(requests).toHaveLength(2);
    expect(requests[1].messages.at(-1).content).toMatch(
      /- b2 text: its link \(link:\d+\) points to b3, which you delete\./,
    );
    expect(message).toMatchObject({ repaired: false, referencesAsked: true });
    // Unselected like the deletes it belongs to
    expect(message.changes.find((c) => c.label === 'b2 text')).toMatchObject({
      selected: false,
      confirm: true,
      flags: { refersToDeleted: 'b3' },
    });
    expect(message.references).toEqual([]);
  });

  it('lists the reference when the answer leaves it', async () => {
    const { message } = await turn([answerOf(deletes), answerOf(deletes)], {
      formData: page,
      text: 'Remove the pricing section',
    });
    expect(message.references).toEqual([
      expect.objectContaining({
        label: 'b2 text',
        match: expect.stringMatching(/^\[pricing\]\(link:\d+\)$/),
      }),
    ]);
  });

  it('asks nothing when no text refers to what is deleted', async () => {
    const { requests } = await turn(
      [answerOf([{ op: 'delete_block', block: 'b4', reason: 'Asked.' }])],
      { formData: page, text: 'Remove the price' },
    );
    expect(requests).toHaveLength(1);
  });
});
