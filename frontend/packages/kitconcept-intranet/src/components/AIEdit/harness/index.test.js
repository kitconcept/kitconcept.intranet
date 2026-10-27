import { describe, expect, it } from 'vitest';
import {
  EMPTY_ANSWER_NOTE,
  applyChanges,
  modelHistory,
  runTurn,
} from './index';
import { lightThemePage, profile } from './__fixtures__/pages';

// lightThemePage refs: b1 title, b2 slate 8f0a61d2 (theme unset),
// b3 slate fdde2974 (grey), b4 __button f297b80b

const call = (operations, id = 'call_1') => ({
  id,
  type: 'function',
  function: {
    name: 'propose_changes',
    arguments: JSON.stringify({ operations }),
  },
});
const answer = (operations, more = {}) => ({
  message: '',
  tool_calls: [call(operations)],
  finish_reason: 'tool_calls',
  ...more,
});
const op = (raw) => ({ reason: 'Why.', category: 'grammar', ...raw });

/** A `send` answering from a list, recording the requests. */
const fakeSend = (...responses) => {
  const requests = [];
  const send = async (request) => {
    requests.push(request);
    return responses.shift();
  };
  return { send, requests };
};

const turn = (send, more = {}) =>
  runTurn({
    text: 'Improve the page',
    formData: lightThemePage,
    profile,
    language: 'en',
    send,
    ...more,
  });

describe('runTurn', () => {
  it('sends the page, the block types and the request', async () => {
    const { send, requests } = fakeSend({
      message: 'Looks good.',
      tool_calls: [],
      finish_reason: 'stop',
    });
    const { message, refs } = await turn(send, { selected: ['fdde2974'] });
    const [request] = requests;
    expect(request.language).toBe('en');
    // The request is headed by its selection
    expect(request.messages).toEqual([
      { role: 'user', content: 'Selected: b3\n\nImprove the page' },
    ]);
    expect(request.page.blocks.map((b) => [b.ref, b.selected])).toEqual([
      ['b1', false],
      ['b2', false],
      ['b3', true],
      ['b4', false],
    ]);
    expect(Object.keys(request.block_types)).toEqual(['slate', '__button']);
    expect(request.repair).toBeUndefined();
    expect(refs.fdde2974).toBe('b3');
    expect(message).toMatchObject({ content: 'Looks good.', changes: [] });
  });

  it('turns a valid call into changes, without a repair', async () => {
    const { send, requests } = fakeSend(
      answer([
        op({ op: 'edit_block', block: 'b2', fields: { theme: 'grey' } }),
      ]),
    );
    const { message } = await turn(send);
    expect(requests).toHaveLength(1);
    expect(message.callId).toBe('call_1');
    expect(message.changes.map((c) => [c.key, c.category])).toEqual([
      ['block:8f0a61d2:theme', 'layout'],
    ]);
    expect(message.repaired).toBe(false);
  });

  it('repairs once: the corrected proposal replaces the first (D8, D51)', async () => {
    const title = op({
      op: 'set_page_field',
      field: 'title',
      value: 'Our page',
    });
    const { send, requests } = fakeSend(
      answer([
        title,
        op({ op: 'edit_block', block: 'b4', fields: { align: 'justify' } }),
      ]),
      answer([], {
        tool_calls: [
          call(
            [
              title,
              op({ op: 'edit_block', block: 'b4', fields: { align: 'left' } }),
            ],
            'call_2',
          ),
        ],
      }),
    );
    const { message } = await turn(send);
    const repair = requests[1];
    expect(repair.repair).toBe(true);
    expect(repair.messages.map((m) => m.role)).toEqual([
      'user',
      'assistant',
      'tool',
    ]);
    expect(repair.messages[2].content).toMatch(
      /Operation 2 \(edit_block b4\): "align" must be one of: left, center, right\./,
    );
    // The complete proposal is asked for; the repair's stands
    expect(repair.messages[2].content).toMatch(
      /the complete corrected proposal/,
    );
    expect(message.changes.map((c) => [c.label, c.value, c.number])).toEqual([
      ['title', 'Our page', 3],
      ['b4 align', 'left', 4],
    ]);
    expect(message).toMatchObject({ repaired: true, dropped: [] });
  });

  it('repairs a broken call too, sending it back as a readable one', async () => {
    const broken = {
      id: 'call_1',
      type: 'function',
      function: { name: 'propose_changes', arguments: '{"operations": [{"op"' },
    };
    const wrongTool = {
      id: 'call_2',
      type: 'function',
      function: { name: 'edit', arguments: '{}' },
    };
    const { send, requests } = fakeSend(
      {
        message: '',
        tool_calls: [broken, wrongTool],
        finish_reason: 'tool_calls',
      },
      answer(
        [op({ op: 'set_page_field', field: 'title', value: 'Our page' })],
        {
          tool_calls: [
            call(
              [op({ op: 'set_page_field', field: 'title', value: 'Our page' })],
              'call_3',
            ),
          ],
        },
      ),
    );
    const { message } = await turn(send);
    const repair = requests[1];
    // The backend keeps only well-formed calls: both go back as empty
    // propose_changes calls, each followed by its result
    expect(repair.messages[1].tool_calls).toEqual([
      {
        id: 'call_1',
        type: 'function',
        function: { name: 'propose_changes', arguments: '{}' },
      },
      {
        id: 'call_2',
        type: 'function',
        function: { name: 'propose_changes', arguments: '{}' },
      },
    ]);
    expect(repair.messages.slice(2).map((m) => m.tool_call_id)).toEqual([
      'call_1',
      'call_2',
    ]);
    expect(repair.messages[2].content).toMatch(/There is no tool "edit"/);
    expect(message.changes.map((c) => c.label)).toEqual(['title']);
  });

  it('lets the repair withdraw a mistake (D51)', async () => {
    // A browser test: the button's title also sent as the page's title,
    // which is valid; the repair left it out
    const insert = op({
      op: 'insert_block',
      type: '__button',
      after: 'b2',
      fields: { title: 'Register now', align: 'right' },
    });
    const { send } = fakeSend(
      answer([
        insert,
        op({ op: 'set_page_field', field: 'title', value: 'Register now' }),
        op({ op: 'set_page_field', field: 'align', value: 'right' }),
      ]),
      answer([insert]),
    );
    const { message } = await turn(send, {
      text: 'add a button block below this paragraph, align it to the right',
    });
    expect(message.changes.map((c) => c.label)).toEqual([
      'new __button after b2',
    ]);
    expect(message.dropped).toEqual([]);
  });

  it('keeps the type of an insert the repair corrects without it (D55)', async () => {
    // A browser test: the repair corrected the button and left out the
    // type (here: a wrong alignment)
    const { send, requests } = fakeSend(
      answer([
        op({
          op: 'insert_block',
          type: '__button',
          after: 'b2',
          fields: { title: 'Sign up', align: 'middle' },
        }),
      ]),
      answer([
        op({
          op: 'insert_block',
          after: 'b2',
          fields: { title: 'Sign up', align: 'right' },
        }),
      ]),
    );
    const { message } = await turn(send, {
      text: 'add a button "Sign up" below, align it to the right',
    });
    expect(requests[1].repair).toBe(true);
    expect(message.changes.map((c) => c.label)).toEqual([
      'new __button after b2',
    ]);
    expect(message.dropped).toEqual([]);
    expect(message.warnings).toContainEqual(
      expect.objectContaining({ code: 'type_kept' }),
    );
  });

  it('keeps the first proposal when the repair sends none', async () => {
    const { send } = fakeSend(
      answer([
        op({ op: 'delete_block', block: 'b3' }),
        op({ op: 'delete_block', block: 'b9' }),
      ]),
      { message: 'b9 does not exist.', tool_calls: [], finish_reason: 'stop' },
    );
    const { message } = await turn(send);
    expect(message.changes.map((c) => c.ref)).toEqual(['b3']);
    expect(message.dropped.map((d) => d.codes)).toEqual([['unknown_block']]);
  });

  it('drops what is still invalid after the repair, and says so', async () => {
    const bad = op({ op: 'delete_block', block: 'b9' });
    const { send } = fakeSend(answer([bad]), answer([bad]));
    const { message } = await turn(send);
    expect(message.changes).toEqual([]);
    expect(message.dropped).toEqual([
      {
        number: 2,
        label: 'delete_block b9',
        codes: ['unknown_block'],
        messages: ['Operation 2 (delete_block b9): There is no block b9.'],
      },
    ]);
  });

  it('does not repair an answer that was cut off', async () => {
    const { send, requests } = fakeSend(
      answer([op({ op: 'delete_block', block: 'b9' })], {
        finish_reason: 'length',
      }),
    );
    const { message } = await turn(send);
    expect(requests).toHaveLength(1);
    expect(message.truncated).toBe(true);
    expect(message.dropped).toHaveLength(1);
  });

  it('reports errors and empty answers', async () => {
    expect((await turn(fakeSend({ error_code: 'busy' }).send)).message).toEqual(
      {
        role: 'assistant',
        error: 'busy',
      },
    );
    // An empty answer is asked for once more, with a note (D47)
    const empty = { message: ' ', tool_calls: [], finish_reason: 'stop' };
    const twice = fakeSend(empty, empty);
    expect((await turn(twice.send)).message.error).toBe('empty_answer');
    expect(twice.requests).toHaveLength(2);
    expect(twice.requests[1].messages.at(-1).content).toBe(
      `Selected: none\n\nImprove the page\n\n${EMPTY_ANSWER_NOTE}`,
    );
    const recovered = await turn(
      fakeSend(empty, { message: 'Not possible.', tool_calls: [] }).send,
    );
    expect(recovered.message).toMatchObject({
      content: 'Not possible.',
      retried: true,
    });
    // Cut off: not asked again
    const cut = { ...empty, finish_reason: 'length' };
    const once = fakeSend(cut);
    expect((await turn(once.send)).message.error).toBe('truncated');
    expect(once.requests).toHaveLength(1);
  });

  it('refuses a page too long for the context, without a request', async () => {
    const { send, requests } = fakeSend();
    const { message } = await turn(send, {
      budget: {
        contextLength: 1000,
        reserveTokens: 800,
        fixedPromptChars: 500,
      },
    });
    expect(message.error).toBe('page_too_long');
    expect(requests).toEqual([]);
  });

  it('sends the compacted history with the applied changes and new refs', async () => {
    const first = fakeSend(
      answer([
        op({
          op: 'edit_block',
          block: 'b2',
          fields: { text: 'A.\n\nB.', theme: 'grey' },
        }),
        op({ op: 'delete_block', block: 'b4' }),
      ]),
    );
    const one = await turn(first.send);
    // The editor applies the text change only
    const textChange = one.message.changes.find((c) => c.field === 'text');
    const applied = applyChanges([textChange], lightThemePage, {
      baseFormData: lightThemePage,
      profile,
      newId: () => 'new1',
    });
    const conversation = [
      { role: 'user', content: 'Improve the page', selected: ['8f0a61d2'] },
      {
        ...one.message,
        applied: [textChange.key],
        created: applied.created,
      },
    ];
    const second = fakeSend({
      message: 'Ok.',
      tool_calls: [],
      finish_reason: 'stop',
    });
    await turn(second.send, {
      text: 'And now?',
      formData: applied.formData,
      selected: ['fdde2974'],
      conversation,
      refs: one.refs,
    });
    const [user, assistant, tool, current] = second.requests[0].messages;
    // Each request keeps the selection it was sent with: "this block" in
    // the current one is b3, not the b2 of the earlier one
    expect(user).toEqual({
      role: 'user',
      content: 'Selected: b2\n\nImprove the page',
    });
    expect(JSON.parse(assistant.tool_calls[0].function.arguments)).toEqual({
      operations: [
        {
          op: 'edit_block',
          block: 'b2',
          fields: { text: 'A.\n\nB.', theme: 'grey' },
          reason: 'Why.',
          category: 'grammar',
        },
        {
          op: 'delete_block',
          block: 'b4',
          reason: 'Why.',
          // Deletes are "structure" (D57)
          category: 'structure',
        },
      ],
    });
    // The new block got the next ref, b5, when the page was projected
    expect(tool.content).toBe(
      'Applied: b2 text (new blocks: b5). Not applied: b2 theme, deletion of b4. The current page is the source of truth.',
    );
    expect(current).toEqual({
      role: 'user',
      content: 'Selected: b3\n\nAnd now?',
    });
  });
});

describe('runTurn: leftovers of replacements (D42)', () => {
  const para = (text) => ({
    '@type': 'slate',
    value: [{ type: 'p', children: [{ text }] }],
  });
  const datePage = {
    title: 'Summit',
    blocks: {
      a: para('Thursday, March 18, 2027 · Hall'),
      b: para("Can't make it on the 18th? Recordings follow."),
      c: para('Parking is free on March 18 for attendees.'),
    },
    blocks_layout: { items: ['a', 'b', 'c'] },
  };
  const swap = (block, find, to) =>
    op({ op: 'replace_text', block, find, replace: to });

  it('adds the missed mentions as suggestions, without another call', async () => {
    const { send, requests } = fakeSend(
      answer([swap('b1', 'Thursday, March 18, 2027', 'Friday, April 9, 2027')]),
    );
    const { message } = await turn(send, {
      text: 'The date is now April 9. Update it everywhere.',
      formData: datePage,
    });
    expect(requests).toHaveLength(1);
    expect(
      message.changes.map((c) => [
        c.label,
        c.value,
        c.selected,
        c.replacements[0].suggested,
      ]),
    ).toEqual([
      ['b1 text', 'Friday, April 9, 2027 · Hall', true, false],
      // Selected like the model's changes, "the 18th" too
      ['b2 text', "Can't make it on the 9th? Recordings follow.", true, true],
      ['b3 text', 'Parking is free on April 9 for attendees.', true, true],
    ]);
    expect(message).toMatchObject({
      repaired: false,
      suggested: 2,
      leftovers: [],
    });
    // Dates that may depend on the change are not looked for (D57)
    expect(message.dependents).toBeUndefined();
  });

  it('repairs a replacement that brings the old date back', async () => {
    const { send, requests } = fakeSend(
      answer([
        swap('b1', 'Thursday, March 18, 2027', 'Friday, April 9, 2027'),
        swap('b3', 'on March 18', 'on 18.03.2027'),
      ]),
      // The complete corrected proposal (D51)
      answer([
        swap('b1', 'Thursday, March 18, 2027', 'Friday, April 9, 2027'),
        swap('b3', 'on March 18', 'on April 9'),
      ]),
    );
    const { message } = await turn(send, { formData: datePage });
    const repair = requests[1].messages.at(-1).content;
    expect(repair).toContain('brings back a value');
    expect(repair).toContain(
      'The page above does not include your proposed changes yet',
    );
    expect(message.changes.map((c) => c.value)).toEqual([
      'Friday, April 9, 2027 · Hall',
      'Parking is free on April 9 for attendees.',
      "Can't make it on the 9th? Recordings follow.",
    ]);
  });
});

describe('runTurn: what a repair cannot fix', () => {
  it('drops it without asking again, and tells the model in a repair', async () => {
    // An image insert (not insertable) and a field of another block type
    const image = op({
      op: 'insert_block',
      after: 'b2',
      type: 'image',
      fields: { alt: 'Spock' },
    });
    const alt = op({ op: 'edit_block', block: 'b2', fields: { alt: 'x' } });
    const only = fakeSend(answer([image, alt]));
    const { message } = await turn(only.send);
    expect(only.requests).toHaveLength(1);
    expect(message.dropped.map((d) => [d.label, d.codes])).toEqual([
      ['insert_block b2', ['not_insertable']],
      ['edit_block b2', ['field_elsewhere']],
    ]);

    // With a fixable failure, the repair says what was left out
    const mixed = fakeSend(
      answer([image, op({ op: 'delete_block', block: 'b9' })]),
      answer([op({ op: 'delete_block', block: 'b3' })]),
    );
    const repaired = await turn(mixed.send);
    const repair = mixed.requests[1].messages.at(-1).content;
    expect(repair).toContain('"block":"b9"');
    expect(repair).not.toContain('"type":"image"');
    expect(repair).toContain(
      'Left out, not possible on this page (do not send them again):',
    );
    expect(repaired.message.dropped.map((d) => d.codes)).toEqual([
      ['not_insertable'],
    ]);
  });
});

describe('runTurn: the Mr. Spock answer', () => {
  it('inserts the row, repairs the image once, and shows the tool message (D45, D46)', async () => {
    const call = (operations, message) => ({
      message: '',
      tool_calls: [
        {
          id: 'call_1',
          type: 'function',
          function: {
            name: 'propose_changes',
            arguments: JSON.stringify({ message, operations }),
          },
        },
      ],
      finish_reason: 'tool_calls',
    });
    const text = (after, value) =>
      op({ op: 'insert_block', type: 'slate', after, fields: { text: value } });
    const row = [text('b3', '### Mr. Spock'), text('b3.1', '*Attendee*')];
    const paragraph = text('b3.3', "Mr. Spock joins this year's summit.");
    const { send, requests } = fakeSend(
      call(
        [
          ...row,
          // The image, without a type
          op({
            op: 'insert_block',
            after: 'b3.2',
            fields: { alt: '(empty)', align: 'center' },
          }),
          paragraph,
        ],
        'I added Mr. Spock. Please give me his role and background.',
      ),
      // The complete corrected proposal; the image now names its type,
      // which cannot be inserted
      call(
        [
          ...row,
          op({
            op: 'insert_block',
            after: 'b3.2',
            type: 'image',
            fields: { title: 'Mr. Spock' },
          }),
          paragraph,
        ],
        'I added Mr. Spock. Please give me his role and background.',
      ),
    );
    const { message, refs } = await turn(send);
    // The chained refs resolve; the image without a type is asked for
    // again: the type is required
    expect(requests).toHaveLength(2);
    expect(requests[1].messages.at(-1).content).toContain(
      'insert_block needs "type": one of the types marked insertable in <types>.',
    );
    expect(message.changes.map((c) => [c.kind, c.anchorRef])).toEqual([
      ['insert', 'b3'],
      ['insert', 'b3'],
      ['insert', 'b3'],
    ]);
    expect(message.dropped.map((d) => d.codes)).toEqual([['not_insertable']]);
    expect(message).toMatchObject({
      content: 'I added Mr. Spock. Please give me his role and background.',
      contentFromTool: true,
    });
    // In the history, the message goes back into the call
    const [, assistant] = modelHistory(
      [{ role: 'user', content: 'Add Mr. Spock' }, message],
      refs,
    );
    expect(assistant.content).toBe('');
    expect(JSON.parse(assistant.tool_calls[0].function.arguments).message).toBe(
      'I added Mr. Spock. Please give me his role and background.',
    );
  });
});

describe("runTurn: the repair answer's message", () => {
  it('is used when the first answer could not be read', async () => {
    const { send } = fakeSend(
      {
        message: '',
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'propose_changes',
              arguments: '{"operations": [',
            },
          },
        ],
        finish_reason: 'tool_calls',
      },
      {
        message: '',
        tool_calls: [
          {
            id: 'call_2',
            type: 'function',
            function: {
              name: 'propose_changes',
              arguments: JSON.stringify({
                message: 'I fixed the typo in b2.',
                operations: [
                  op({
                    op: 'edit_block',
                    block: 'b2',
                    fields: { text: 'Fixed.' },
                  }),
                ],
              }),
            },
          },
        ],
        finish_reason: 'tool_calls',
      },
    );
    const { message } = await turn(send);
    expect(message).toMatchObject({
      content: 'I fixed the typo in b2.',
      contentFromTool: true,
      repaired: true,
    });
  });
});

describe('runTurn: a button sent without its type (qwen3:14b)', () => {
  it('is repaired, not dropped: the type is required', async () => {
    const button = (more = {}) =>
      op({
        op: 'insert_block',
        after: 'b2',
        fields: { title: 'Register now', href: 'link:1', align: 'right' },
        ...more,
      });
    const { send, requests } = fakeSend(
      answer([button()], { message: 'I have added a button.' }),
      answer([button({ type: '__button' })]),
    );
    const { message } = await turn(send, {
      text: 'add a button block below this paragraph, align it to the right',
    });
    expect(requests).toHaveLength(2);
    expect(message.changes).toHaveLength(1);
    expect(message.changes[0]).toMatchObject({
      kind: 'insert',
      type: '__button',
      // The placeholder is no link target, and none was given
      flags: { noLink: true },
    });
    expect(message.changes[0].fields).toMatchObject({
      title: { value: 'Register now' },
      align: { value: 'right' },
    });
  });
});
