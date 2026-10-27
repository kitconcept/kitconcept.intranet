/**
 * The runner and graders, with a scripted `send` instead of a model: the
 * eval must measure correctly before its numbers mean anything.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkProfile, projectPage } from './lib/harness.js';
import { landedOutcome, newTerms, preservation } from './lib/grade.js';
import { aggregate, runCase } from './lib/run.js';
import { loadCase } from './lib/cases.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (file) =>
  JSON.parse(fs.readFileSync(path.join(here, file), 'utf8'));
const profile = read('profiles/intranet.json');
const services = read('cases/services-v1.case.json');

const answer = (operations, message = '') => ({
  message,
  tool_calls: [
    {
      id: 'call_1',
      type: 'function',
      function: {
        name: 'propose_changes',
        arguments: JSON.stringify({ operations }),
      },
    },
  ],
  finish_reason: 'tool_calls',
  usage: { prompt_tokens: 1000, completion_tokens: 300 },
});
const scripted =
  (...answers) =>
  async () =>
    answers.shift();
const op = (raw, category) => ({ reason: 'Why.', category, ...raw });
/** An extractor reporting fixed findings, recording what it was given. */
const extracting = (...findings) => {
  const texts = [];
  const extract = async (text) => {
    texts.push(text);
    return findings.shift() || [];
  };
  return { extract, texts };
};

describe('the profile snapshot', () => {
  it('is a valid profile', () => {
    expect(checkProfile(profile)).toEqual([]);
  });
});

describe('the cases', () => {
  it.each(fs.readdirSync(path.join(here, 'cases')))(
    '%s has turns with labels',
    (name) => {
      const testCase = loadCase(here, name);
      expect(testCase.formData?.blocks).toBeDefined();
      expect(testCase.id).toBe(name.replace('.case.json', ''));
      expect(testCase.turns.length).toBeGreaterThan(0);
      testCase.turns.forEach((turn) => expect(turn.labels).toBeDefined());
    },
  );
});

describe('runCase and the graders', () => {
  it('grades a perfect answer as perfect', async () => {
    // The alt text is reported, not written (the model never saw the image)
    const { extract, texts } = extracting([
      { target: 'b6.1', category: 'accessibility' },
    ]);
    const [run] = [
      await runCase(services, {
        profile,
        extract,
        send: scripted(
          answer(
            [
              op(
                { op: 'set_page_field', field: 'title', value: 'Our Services' },
                'spelling',
              ),
              op(
                {
                  op: 'set_page_field',
                  field: 'description',
                  value: 'What we offer.',
                },
                'metadata',
              ),
              op(
                {
                  op: 'edit_block',
                  block: 'b3',
                  fields: {
                    text: 'We were founded in 2015 and offer [consulting](link:1) to clients.',
                  },
                },
                'grammar',
              ),
              op(
                {
                  op: 'edit_block',
                  block: 'b4',
                  fields: { text: '### Pricing' },
                },
                'structure',
              ),
              op(
                {
                  op: 'edit_block',
                  block: 'b5',
                  fields: { text: 'Ask us for our current prices.' },
                },
                'outdated',
              ),
            ],
            'The image b6.1 needs an alt text written by a person.',
          ),
        ),
      }),
    ];
    expect(texts).toEqual([
      'The image b6.1 needs an alt text written by a person.',
    ]);
    const { graded } = run.turns[0];
    expect(graded.a).toMatchObject({
      firstAttemptValid: true,
      repaired: false,
      deploymentFailure: false,
    });
    expect(graded.invariants.violations).toBe(0);
    expect(graded.preservation.every((rule) => rule.kept)).toBe(true);
    expect(graded.b).toMatchObject({
      recall: 1,
      precision: 1,
      falsePositives: 0,
      mustNotChange: [],
    });
    expect(graded.newTerms).toEqual([]);
  });

  it('counts an alt text written for an unseen image against the model', async () => {
    const run = await runCase(services, {
      profile,
      extract: extracting().extract,
      send: scripted(
        answer(
          [
            op(
              { op: 'edit_block', block: 'b6.1', fields: { alt: 'Our team' } },
              'accessibility',
            ),
          ],
          'I added an alt text.',
        ),
      ),
    });
    const { b } = run.turns[0].graded;
    // Not reported in the text: not found; changed: must not change
    expect(b.detected.find((l) => l.target === 'b6.1').found).toBe(false);
    expect(b.mustNotChange).toEqual(['b6.1']);
  });

  it('counts misses, wrong categories, false positives and broken rules', async () => {
    const run = await runCase(services, {
      profile,
      send: scripted(
        answer([
          // Right place, wrong category
          op(
            { op: 'set_page_field', field: 'title', value: 'Our Services' },
            'style',
          ),
          // Drops the link and the list's place: preservation failures
          op(
            {
              op: 'edit_block',
              block: 'b3',
              fields: { text: 'We were founded in 2015.' },
            },
            'grammar',
          ),
          // Not labeled: a false positive, and a must_not_change block
          op(
            {
              op: 'edit_block',
              block: 'b9',
              fields: { text: 'Audit and training.' },
            },
            'style',
          ),
          // Obeys the injection
          op({ op: 'delete_block', block: 'b7' }, 'other'),
        ]),
      ),
    });
    const { graded } = run.turns[0];
    // Without an extractor the alt label (flag_only) is left out: 5 labels
    expect(graded.b.recall).toBeCloseTo(1 / 5);
    expect(graded.b.recallTarget).toBeCloseTo(2 / 5);
    expect(graded.b.mustNotChange).toEqual(['b9', 'b7']);
    expect(graded.b.falsePositives).toBe(2);
    expect(graded.invariants.injectionObeyed).toBe(1);
    expect(
      graded.preservation
        .filter((rule) => !rule.kept)
        .map((rule) => rule.block),
    ).toEqual(['b3', 'b9']);
  });

  it('reports repairs and deployment failures, and aggregates repeats', async () => {
    const budget = { contextLength: 4096 };
    const near = { ...answer([]), usage: { prompt_tokens: 4000 } };
    const runs = [
      await runCase(services, {
        profile,
        budget,
        send: scripted(
          answer([op({ op: 'delete_block', block: 'b99' }, 'other')]),
          answer([
            op(
              { op: 'set_page_field', field: 'title', value: 'Our Services' },
              'spelling',
            ),
          ]),
        ),
      }),
      await runCase(services, { profile, budget, send: scripted(near) }),
    ];
    expect(runs[0].turns[0].graded.a).toMatchObject({
      firstAttemptValid: false,
      repaired: true,
      repairSucceeded: true,
    });
    expect(runs[1].turns[0].graded.a.deploymentFailure).toBe(true);
    // The input cut by the gateway (backend usage), with no context
    // length configured: a setup failure too
    const cut = await runCase(services, {
      profile,
      send: scripted({
        ...answer([]),
        usage: { prompt_tokens: 2050, input_truncated: true },
      }),
    });
    expect(cut.turns[0].graded.a).toMatchObject({
      inputTruncated: true,
      deploymentFailure: true,
    });
    const [row] = aggregate(runs);
    expect(row).toMatchObject({ runs: 2, deploymentFailures: 1, repaired: 1 });
    expect(row.detection['title/spelling']).toBe('1/1');
  });

  it('keeps failed calls out of quality, and times every turn', async () => {
    const timeout = async () => ({ error_code: 'llm_timeout' });
    const good = scripted(
      answer([
        op(
          { op: 'set_page_field', field: 'title', value: 'Our Services' },
          'spelling',
        ),
      ]),
    );
    const runs = [
      await runCase(services, { profile, send: timeout }),
      await runCase(services, { profile, send: good }),
    ];
    const [row] = aggregate(runs);
    expect(row).toMatchObject({
      runs: 2,
      errors: 1,
      errorCodes: 'llm_timeout',
      graded: 1,
    });
    // A timeout is not a miss: detected in 1 of the 1 graded runs
    expect(row.detection['title/spelling']).toBe('1/1');
    // Unless what the editor got is asked: 1 of 5 labels, then nothing
    expect(row.recallTarget).toBeCloseTo(1 / 5);
    expect(row.recallTargetAll).toBeCloseTo(1 / 10);
    expect(row.recallTargetModelAll).toBeCloseTo(1 / 10);
    // What the editor got (D52): the timeout is no valid first answer
    expect(row.firstAttemptValid).toBe(0.5);
    const { timing } = runs[1].turns[0].graded;
    expect(timing.calls).toHaveLength(1);
    expect(timing.calls[0]).toMatchObject({
      repair: false,
      error: null,
      promptTokens: 1000,
      completionTokens: 300,
    });
    expect(row.turnSeconds).toBeGreaterThanOrEqual(0);
    expect(row.tokensPerSecond === null || row.tokensPerSecond > 0).toBe(true);
  });

  it('counts layout changes nobody asked for', async () => {
    const run = await runCase(read('cases/clean-page.case.json'), {
      profile,
      send: scripted(
        answer([
          op(
            { op: 'edit_block', block: 'b2', fields: { theme: 'grey' } },
            'style',
          ),
          op(
            { op: 'edit_block', block: 'b3', fields: { theme: 'grey' } },
            'style',
          ),
        ]),
      ),
    });
    expect(run.turns[0].graded.layoutChanges).toBe(2);
    expect(aggregate([run])[0].layoutChanges).toBe(2);
  });

  it('plays a session: applies the defaults between turns, keeps refs', async () => {
    const session = read('cases/session.case.json');
    const run = await runCase(session, {
      profile,
      // The report found b3 and the description, not b2
      extract: extracting([
        { target: 'b3', category: 'spelling' },
        { target: 'description', category: 'metadata' },
      ]).extract,
      send: scripted(
        {
          message: 'b3 has a typo; the description is missing.',
          tool_calls: [],
          finish_reason: 'stop',
          usage: {},
        },
        answer([
          op(
            {
              op: 'edit_block',
              block: 'b2',
              fields: {
                text: 'The canteen is open from 11:30 to 14:00.\n\nThe menu changes every week.',
              },
            },
            'spelling',
          ),
          op(
            {
              op: 'edit_block',
              block: 'b3',
              fields: { text: 'You can pay with your employee card.' },
            },
            'spelling',
          ),
        ]),
        answer([
          op(
            {
              op: 'set_page_field',
              field: 'description',
              value: 'Opening hours and payment.',
            },
            'metadata',
          ),
        ]),
      ),
    });
    const [report, fix, describe] = run.turns;
    expect(report.graded.b.recallTarget).toBeCloseTo(2 / 3);
    expect(report.graded.unrequestedChanges).toBe(0);
    // "Fix what you found": b2 was not found, so it is not expected
    expect(fix.graded.b.detected.map((label) => label.target)).toEqual(['b3']);
    expect(fix.graded.b.recall).toBe(1);
    expect(describe.graded.b).toMatchObject({ recall: 1, mustNotChange: [] });
  });
});

describe('what lands, and links by target (D52)', () => {
  const link = (url) => ({ type: 'link', data: { url } });
  const paragraph = (...children) => ({
    '@type': 'slate',
    value: [{ type: 'p', children }],
  });
  const formData = {
    blocks: {
      a: paragraph(
        { text: 'Read the ' },
        {
          ...link('https://intranet.example/coc'),
          children: [{ text: 'code' }],
        },
      ),
      b: { '@type': 'image', url: '/x.png' },
    },
    blocks_layout: { items: ['a', 'b'] },
  };
  const refs = { a: 'b1', b: 'b2' };
  const links = { 1: link('https://intranet.example/coc') };
  const rule = { must_preserve: [{ block: 'b1', placeholder: 'link:1' }] };

  it('keeps a link only with its target', () => {
    expect(
      preservation({ after: formData, refs, labels: rule, links }),
    ).toEqual([{ block: 'b1', placeholder: 'link:1', kept: true }]);
    const replaced = {
      ...formData,
      blocks: {
        ...formData.blocks,
        a: paragraph(
          { text: 'Read the ' },
          { ...link('https://example.com/code'), children: [{ text: 'code' }] },
        ),
      },
    };
    expect(
      preservation({ after: replaced, refs, labels: rule, links })[0].kept,
    ).toBe(false);
  });

  it('applies the selected changes and the deletes', () => {
    const changes = [
      {
        key: 'block:b:alt',
        kind: 'block_field',
        id: 'b',
        field: 'alt',
        fieldKind: 'string',
        path: 'alt',
        value: 'A guess',
        selected: false,
      },
      { key: 'block:a', kind: 'delete', id: 'a', selected: false },
    ];
    const after = landedOutcome({ message: { changes }, formData, profile });
    expect(after.blocks_layout.items).toEqual(['b']);
    expect(after.blocks.b.alt).toBeUndefined();
    const all = landedOutcome({
      message: { changes },
      formData,
      profile,
      apply: 'all',
    });
    expect(all.blocks.b.alt).toBe('A guess');
  });
});

describe('newTerms', () => {
  const page = {
    title: 'Our Servises',
    blocks: [{ ref: 'b2', fields: { text: 'Open in 2024.' } }],
  };
  const change = (value, more = {}) => ({
    kind: 'block_field',
    label: 'b2 text',
    category: 'outdated',
    value,
    ...more,
  });

  it('lists numbers and names that neither the page nor the request has', () => {
    expect(
      newTerms(
        {
          changes: [
            change(
              'Open in 2026. Offices in New York and [Tokyo](link:1). Ask Anna.',
            ),
          ],
        },
        page,
        'Ask Anna about it',
      ),
    ).toEqual([
      // 2026 is one digit from the page's 2024: numbers match exactly
      { label: 'b2 text', terms: ['2026', 'New', 'York', 'Tokyo'] },
    ]);
  });

  it('skips sentence and item starts, spelling fixes and styling', () => {
    expect(
      newTerms(
        {
          changes: [
            change('Welcome.\n\n- Parking is free.\n1. Rooms'),
            // "Servises" on the page
            change('Our Services', { label: 'title' }),
            change('grey', { category: 'layout' }),
          ],
        },
        page,
      ),
    ).toEqual([]);
  });

  it('leaves translations out, and knows a date written in numbers', () => {
    expect(
      newTerms(
        {
          changes: [
            change('Eröffnet 2026 in München.', { category: 'translation' }),
            change('Am 09.04.2027 und am 4/9.'),
          ],
        },
        page,
        'Move it to April 9, 2027',
      ),
    ).toEqual([]);
  });

  it('reads the fields of inserted blocks', () => {
    expect(
      newTerms(
        {
          changes: [
            {
              kind: 'insert',
              label: 'new block',
              category: 'other',
              fields: { text: { value: 'Call us at 555 0100.' } },
            },
          ],
        },
        page,
      ),
    ).toEqual([{ label: 'new block', terms: ['555', '0100'] }]);
  });
});

describe('the date-everywhere case (replace_text, D41)', () => {
  const dates = read('cases/date-everywhere.case.json');
  const swap = (block, find, to) =>
    op({ op: 'replace_text', block, find, replace: to }, 'outdated');

  it('grades replacements of only the date as perfect', async () => {
    const run = await runCase(dates, {
      profile,
      send: scripted(
        answer(
          [
            swap('b2', 'Thursday, March 18, 2027', 'Friday, April 9, 2027'),
            swap('b5', 'on March 18, 2027', 'on April 9, 2027'),
            swap('b5', 'on March 11', 'on April 2'),
            swap('b7', 'Thursday, March 18', 'Friday, April 9'),
            swap('b8', 'on the 18th', 'on the 9th'),
            swap('b10', 'on March 18', 'on April 9'),
            swap('b12', '18.03.2027', '09.04.2027'),
          ],
          'The date is updated in six blocks.',
        ),
      ),
    });
    const { graded } = run.turns[0];
    expect(graded.invariants.violations).toBe(0);
    expect(graded.preservation.filter((rule) => !rule.kept)).toEqual([]);
    expect(graded.b).toMatchObject({ recall: 1, mustNotChange: [] });
    // To be read: the derived deadline. The requested date in numbers
    // (09.04.2027 for April 9) is known (D52)
    expect(graded.newTerms).toEqual([{ label: 'b5 text', terms: ['2'] }]);
  });

  it('completes a partial answer with suggestions, graded apart', async () => {
    // The second browser test's answer: three of six mentions
    const run = await runCase(dates, {
      profile,
      send: scripted(
        answer([
          swap('b2', 'Thursday, March 18, 2027', 'Friday, April 9, 2027'),
          swap('b7', 'Thursday, March 18', 'Friday, April 9'),
          swap('b12', '18.03.2027', '09.04.2027'),
        ]),
      ),
    });
    const { graded, message } = run.turns[0];
    // The three mentions left, and the deadline one week before (D59)
    expect(graded.a).toMatchObject({
      repaired: false,
      suggested: 4,
      leftovers: 0,
    });
    expect(
      message.changes
        .find((c) => c.label === 'b5 text')
        .replacements.map((r) => r.replace),
    ).toContainEqual(expect.stringContaining('April 2'));
    // What the editor gets, and what the model found itself
    expect(graded.b.recall).toBe(1);
    expect(graded.bModel.recallTarget).toBeCloseTo(3 / 6);
    expect(graded.preservation.filter((rule) => !rule.kept)).toEqual([]);
    // "the 18th" too: selected like the model's changes
    expect(message.changes.find((c) => c.label === 'b8 text').selected).toBe(
      true,
    );
    expect(aggregate([run])[0]).toMatchObject({
      suggested: 4,
      leftovers: 0,
      recallTarget: 1,
      recallTargetModel: 0.5,
    });
  });

  it('catches what the model did in the first browser test', async () => {
    const run = await runCase(dates, {
      profile,
      send: scripted(
        answer([
          op(
            {
              op: 'edit_block',
              block: 'b5',
              fields: {
                text: 'March 18, 2027 → April 9, 2027; March 11 → March 25',
              },
            },
            'outdated',
          ),
        ]),
      ),
    });
    const { graded, message } = run.turns[0];
    expect(message.changes[0].flags.replacesMostText).toBe(true);
    expect(
      graded.preservation
        .filter((rule) => !rule.kept)
        .map((rule) => rule.block),
    ).toEqual(['b5', 'b5', 'b5']);
    expect(graded.b.recallTarget).toBeCloseTo(1 / 6);
  });
});

describe('the summit cases (the real page, draft tests)', () => {
  const summit = (name) => loadCase(here, `${name}.case.json`);
  const swap = (block, find, to) =>
    op({ op: 'replace_text', block, find, replace: to }, 'outdated');
  const unmet = (graded) =>
    graded.expected.filter((e) => !e.met).map((e) => e.text || e.shapes);

  it('date: all formats, the deadline, the decoys kept', async () => {
    const run = await runCase(summit('summit-1-date'), {
      profile,
      send: scripted(
        answer(
          [
            swap('b3', 'Thursday, March 18, 2027', 'Friday, April 9, 2027'),
            swap('b8', 'on March 11', 'on April 2'),
          ],
          'Updated the date; the deadline moves to April 2.',
        ),
      ),
    });
    const { graded, message } = run.turns[0];
    // The model's two; the harness suggested the rest
    expect(message.suggested).toBe(5);
    expect(unmet(graded)).toEqual([]);
    expect(graded.b.recallTarget).toBe(1);
    expect(graded.textAnswer).toBe(true);
  });

  it('new attendee: a row of three blocks after b22, checked by shape', async () => {
    const insert = (text) =>
      op(
        { op: 'insert_block', type: 'slate', after: 'b22', fields: { text } },
        'structure',
      );
    const good = await runCase(summit('summit-2-attendee'), {
      profile,
      send: scripted(
        answer([
          insert('### Mira Hollanek'),
          op(
            {
              op: 'insert_block',
              type: 'slate',
              after: 'b22.1',
              fields: { text: '*Attendee*' },
            },
            'structure',
          ),
          insert("Mira Hollanek joins this year's summit."),
        ]),
      ),
    });
    expect(unmet(good.turns[0].graded)).toEqual([]);
    const headingOnly = await runCase(summit('summit-2-attendee'), {
      profile,
      send: scripted(answer([insert('### Mira Hollanek')])),
    });
    expect(headingOnly.turns[0].graded.expected[0]).toMatchObject({
      met: false,
      found: ['h3', 'h2', 'p'],
    });
  });

  it('list: a lead-in and the list in the next block', async () => {
    const run = await runCase(summit('summit-9-list'), {
      profile,
      send: scripted(
        answer([
          op(
            {
              op: 'edit_block',
              block: 'b34',
              fields: {
                text: 'Please bring:\n\n- A laptop and a charger: outlets are limited\n- A photo ID for your badge\n- A reusable water bottle: refill stations on every floor\n- Business cards for the closing drinks\n- Comfortable shoes and a light jacket: Hall A is chilly',
              },
            },
            'structure',
          ),
        ]),
      ),
    });
    const { graded } = run.turns[0];
    expect(graded.preservation.every((rule) => rule.kept)).toBe(true);
    expect(unmet(graded)).toEqual([]);
  });
});

describe('a failing extractor', () => {
  it('is recorded for the turn, not thrown (a 524 ended a run)', async () => {
    const failing = async () => {
      throw new Error('extractor: HTTP 524');
    };
    const run = await runCase(read('cases/services-v1-report.case.json'), {
      profile,
      extract: failing,
      send: scripted({
        message: 'The title has a typo.',
        tool_calls: [],
        finish_reason: 'stop',
        usage: {},
      }),
    });
    const { graded } = run.turns[0];
    expect(graded.extractorError).toBe('extractor: HTTP 524');
    expect(graded.b).toBeUndefined();
    expect(aggregate([run])[0].extractorErrors).toBe(1);
  });
});

describe('the block creation cases (D56)', () => {
  const blocks = (name) => loadCase(here, `${name}.case.json`);
  const unmet = (graded) => graded.expected.filter((e) => !e.met);
  const insert = (after, type, fields) =>
    op({ op: 'insert_block', after, type, fields }, 'structure');
  const textAnswer = (content) => ({
    message: content,
    tool_calls: [],
    finish_reason: 'stop',
    usage: { prompt_tokens: 1000, completion_tokens: 100 },
  });

  it('a button: label, link target and alignment as stored', async () => {
    const send = scripted(
      answer([
        insert('b4', '__button', {
          title: 'Get tickets',
          href: 'https://tickets.example.org/summit',
          align: 'right',
        }),
      ]),
    );
    const run = await runCase(blocks('blocks-3-button'), { profile, send });
    const { graded } = run.turns[0];
    expect(unmet(graded)).toEqual([]);
    expect(graded.b.recallTarget).toBe(1);
    // Centered: the value check names what was found
    const left = await runCase(blocks('blocks-3-button'), {
      profile,
      send: scripted(
        answer([
          insert('b4', '__button', {
            title: 'Get tickets',
            href: 'https://tickets.example.org/summit',
            align: 'center',
          }),
        ]),
      ),
    });
    // Not asked for: left out of the new block (D57)
    expect(unmet(left.turns[0].graded)[0].found).toMatchObject({
      'styles.align:noprefix': null,
    });
  });

  it('a button without a link: an invented one is removed, as checked', async () => {
    const run = await runCase(blocks('blocks-4-button-no-link'), {
      profile,
      send: scripted(
        answer([
          insert('b36', '__button', {
            title: 'Contact the team',
            href: 'https://example.com/contact',
          }),
        ]),
      ),
    });
    expect(unmet(run.turns[0].graded)).toEqual([]);
  });

  it('a video with its URL alone, a row of blocks by shape', async () => {
    const video = await runCase(blocks('blocks-7-video'), {
      profile,
      send: scripted(
        answer([
          insert('b8', 'video', {
            url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
          }),
        ]),
      ),
    });
    expect(unmet(video.turns[0].graded)).toEqual([]);
    const row = await runCase(blocks('blocks-12-row'), {
      profile,
      send: scripted(
        answer([
          insert('b36', 'separator', {}),
          insert('b36', 'slate', { text: '### Sponsors' }),
          insert('b36', 'slate', { text: 'Sponsors will be announced soon.' }),
          insert('b36', '__button', {
            title: 'Become a sponsor',
            href: 'https://sponsors.example.org',
          }),
        ]),
      ),
    });
    expect(unmet(row.turns[0].graded)).toEqual([]);
  });

  it('a question instead of a change, when something is missing', async () => {
    const asked = await runCase(blocks('blocks-5-button-no-label'), {
      profile,
      send: scripted(textAnswer('What should the button say?')),
    });
    expect(asked.turns[0].graded.expected).toEqual([
      { kind: 'textOnly', met: true, changes: 0 },
    ]);
    // An invented label is a change: not met
    const invented = await runCase(blocks('blocks-5-button-no-label'), {
      profile,
      send: scripted(
        answer(
          [insert('b4', '__button', { title: 'Sign me up' })],
          'I propose a button.',
        ),
      ),
    });
    expect(invented.turns[0].graded.expected[0]).toMatchObject({
      met: false,
      changes: 1,
    });
    // One copied from the page is left out and asked for (D58)
    const copied = await runCase(blocks('blocks-5-button-no-label'), {
      profile,
      send: scripted(
        answer(
          [insert('b4', '__button', { title: 'Register now' })],
          'I propose a button.',
        ),
      ),
    });
    expect(copied.turns[0].message.notice.kind).toBe('question');
    expect(copied.turns[0].graded.expected[0]).toMatchObject({
      met: true,
      changes: 0,
    });
  });
});

describe('eval version 3 (D57)', () => {
  const blocks = (name) => loadCase(here, `${name}.case.json`);
  const insert = (after, type, fields) =>
    op({ op: 'insert_block', after, type, fields }, 'structure');

  it('a clean pass per run, pass@1 and pass^k per case', async () => {
    const good = () => scripted(answer([insert('b8', 'separator', {})]))();
    const wrong = () => scripted(answer([insert('b9', 'separator', {})]))();
    const runs = [
      await runCase(blocks('blocks-6-separator'), { profile, send: good }),
      await runCase(blocks('blocks-6-separator'), { profile, send: wrong }),
    ];
    expect(runs.map((run) => run.turns[0].graded.passed)).toEqual([
      true,
      false,
    ]);
    const [row] = aggregate(runs);
    expect(row).toMatchObject({ passAt1: 0.5, passAll: 0 });
  });

  it('fails a new block with facts nobody gave (no_new_terms)', async () => {
    const run = await runCase(blocks('blocks-1-text'), {
      profile,
      send: scripted(
        answer([
          insert('b8', 'slate', {
            text: 'Doors open at 8:30, coffee is served from 8:00.',
          }),
        ]),
      ),
    });
    const { graded } = run.turns[0];
    expect(graded.expected.at(-1)).toMatchObject({
      kind: 'noNewTerms',
      met: false,
      terms: ['8:00'],
    });
    expect(graded.passed).toBe(false);
  });

  it('a moved block, not a copy (is)', async () => {
    const moved = await runCase(blocks('blocks-13-move'), {
      profile,
      send: scripted(
        answer([
          op({ op: 'move_block', block: 'b26', after: 'b23' }, 'structure'),
        ]),
      ),
    });
    expect(moved.turns[0].graded.passed).toBe(true);
    const copied = await runCase(blocks('blocks-13-move'), {
      profile,
      send: scripted(
        answer([
          op({ op: 'delete_block', block: 'b26' }, 'structure'),
          insert('b23', 'slate', {
            text: "Can't make it on the 18th? All keynotes will be recorded and posted the following week.",
          }),
        ]),
      ),
    });
    expect(copied.turns[0].graded.expected.find((e) => e.is).met).toBe(false);
  });

  it('a text answer holding the changes as JSON is no answer', async () => {
    const json = 'I propose: {"op": "insert_block", "type": "__button"}';
    const run = await runCase(blocks('blocks-5-button-no-label'), {
      profile,
      // Asked again (D57), the same again
      send: scripted(
        { message: json, tool_calls: [], finish_reason: 'stop' },
        { message: json, tool_calls: [], finish_reason: 'stop' },
      ),
    });
    expect(run.turns[0].graded.expected[0]).toMatchObject({
      kind: 'textOnly',
      met: false,
    });
    expect(run.turns[0].message.retryReason).toBe('text_call');
  });

  it('asks instead of inventing a missing label, as a pass', async () => {
    const run = await runCase(blocks('blocks-5-button-no-label'), {
      profile,
      send: scripted(
        answer([insert('b4', '__button', { align: 'right' })], 'A button.'),
      ),
    });
    const { graded, message } = run.turns[0];
    expect(message.notice.kind).toBe('question');
    expect(graded.passed).toBe(true);
  });
});

describe('eval version 4 (D58)', () => {
  const blocks = (name) => loadCase(here, `${name}.case.json`);
  const insert = (after, type, fields) =>
    op({ op: 'insert_block', after, type, fields }, 'structure');

  it('fails a change outside the one place asked about (no_other_changes)', async () => {
    const run = await runCase(blocks('blocks-6-separator'), {
      profile,
      send: scripted(
        answer([
          insert('b8', 'separator', {}),
          op(
            {
              op: 'replace_text',
              block: 'b39',
              find: '18.03.2027',
              replace: 'March 18, 2027',
            },
            'style',
          ),
        ]),
      ),
    });
    const { graded } = run.turns[0];
    expect(graded.outOfScope).toBe(1);
    expect(graded.passed).toBe(false);
  });

  it('does not take the harness\'s "could not be used" for an answer', async () => {
    const unknown = () =>
      answer([op({ op: 'edit_block', block: 'b99', fields: { text: 'x' } })]);
    const run = await runCase(blocks('blocks-5-button-no-label'), {
      profile,
      // The answer and its repair, both unusable
      send: scripted(unknown(), unknown()),
    });
    const { graded, message } = run.turns[0];
    expect(message.notice.kind).toBe('dropped');
    expect(graded.expected[0]).toMatchObject({ kind: 'textOnly', met: false });
    // The harness's refusal of a block type it cannot add is an answer
    const image = await runCase(blocks('blocks-11-image'), {
      profile,
      send: scripted(answer([insert('b29', 'image', {})])),
    });
    expect(image.turns[0].graded.passed).toBe(true);
  });

  it('counts a pass the harness rescued apart (modelPassAt1)', async () => {
    const image = await runCase(blocks('blocks-11-image'), {
      profile,
      send: scripted(answer([insert('b29', 'image', {})])),
    });
    const button = await runCase(blocks('blocks-3-button'), {
      profile,
      send: scripted(
        answer([
          insert('b4', '__button', {
            title: 'Get tickets',
            href: 'https://tickets.example.org/summit',
            align: 'right',
          }),
        ]),
      ),
    });
    expect(image.turns[0].graded).toMatchObject({
      passed: true,
      modelPassed: false,
    });
    expect(button.turns[0].graded).toMatchObject({
      passed: true,
      modelPassed: true,
    });
    const [row] = aggregate([image, image]);
    expect(row).toMatchObject({ passAt1: 1, modelPassAt1: 0 });
  });

  it('looks for a kept passage in what a change split off', () => {
    const p = (text) => [{ type: 'p', children: [{ text }] }];
    const before = {
      blocks: { a: { '@type': 'slate', value: p('Hi, on March 18.') } },
      blocks_layout: { items: ['a'] },
    };
    const after = {
      blocks: {
        a: { '@type': 'slate', value: p('Hi.') },
        n: { '@type': 'slate', value: p('On March 18.') },
      },
      blocks_layout: { items: ['a', 'n'] },
    };
    const labels = { must_preserve: [{ block: 'b1', text: 'March 18' }] };
    const refs = { a: 'b1' };
    expect(preservation({ after, refs, labels })[0].kept).toBe(false);
    expect(preservation({ after, refs, labels, before })[0].kept).toBe(true);
  });
});

describe('text referring to a deleted section (D59)', () => {
  it('summit-3: asks for the reference, passes, and not as the model alone', async () => {
    const testCase = loadCase(here, 'summit-3-parking.case.json');
    const { page } = projectPage({
      formData: testCase.formData,
      profile,
      links: {},
    });
    const text = page.blocks.find((block) => block.ref === 'b29').fields.text;
    const find = text.slice(text.indexOf('station.'));
    const fixed = find.slice(0, find.indexOf(' Driving?'));
    const deletes = [
      op({ op: 'delete_block', block: 'b31' }, 'structure'),
      op({ op: 'delete_block', block: 'b32' }, 'structure'),
    ];
    const requests = [];
    const answers = [
      answer(deletes),
      answer([
        ...deletes,
        op(
          { op: 'replace_text', block: 'b29', find, replace: fixed },
          'structure',
        ),
      ]),
    ];
    const run = await runCase(testCase, {
      profile,
      send: async (request) => {
        requests.push(request);
        return answers.shift();
      },
    });
    expect(requests).toHaveLength(2);
    expect(requests[1].messages.at(-1).content).toMatch(/b29 text/);
    const { graded } = run.turns[0];
    expect(graded.passed).toBe(true);
    expect(graded.modelPassed).toBe(false);
    expect(aggregate([run])[0].referencesAsked).toBe(1);
  });
});

describe('dates that depend on a changed one (D59)', () => {
  const summit1 = () => loadCase(here, 'summit-1-date.case.json');
  const swap = (block, find, replace) =>
    op({ op: 'replace_text', block, find, replace }, 'outdated');

  it('computes the deadline the model left', async () => {
    const run = await runCase(summit1(), {
      profile,
      send: scripted(
        answer([
          swap('b3', 'Thursday, March 18, 2027', 'Friday, April 9, 2027'),
        ]),
      ),
    });
    const { graded, message } = run.turns[0];
    const deadline = message.changes.find((c) => c.label === 'b8 text');
    expect(deadline.replacements.map((r) => r.replace)).toContainEqual(
      expect.stringContaining('April 2'),
    );
    expect(graded.expected.filter((e) => !e.met)).toEqual([]);
  });

  it("corrects the model's arithmetic", async () => {
    const run = await runCase(summit1(), {
      profile,
      send: scripted(
        answer([
          swap('b3', 'Thursday, March 18, 2027', 'Friday, April 9, 2027'),
          swap('b8', 'on March 11', 'on March 25'),
        ]),
      ),
    });
    const { graded, message } = run.turns[0];
    expect(message.warnings).toContainEqual(
      expect.objectContaining({ code: 'dependent_corrected' }),
    );
    expect(graded.expected.filter((e) => !e.met)).toEqual([]);
  });

  it('leaves a date the page does not relate to the changed one', async () => {
    // Last year's date is not one week after the deadline: nothing computed
    const run = await runCase(summit1(), {
      profile,
      send: scripted(
        answer([swap('b8', 'on March 19, 2026', 'on March 20, 2026')]),
      ),
    });
    const { message } = run.turns[0];
    const b8 = message.changes.find((c) => c.label === 'b8 text');
    expect(b8.replacements.map((r) => r.replace)).toEqual([
      'on March 20, 2026',
    ]);
  });
});

describe('the prompt holds no answers of the cases (D49)', () => {
  // The fixed prompt, as the backend sends it (its source text)
  const backend = path.join(here, '../../backend/src/kitconcept/intranet');
  // The modules the prompt is made of: base rules, the tool's rules and
  // how to call it
  const prompt = [
    'ai_edit/prompt.py',
    'ai_edit/rules.py',
    'ai_edit/propose_changes.py',
  ]
    .map((file) => fs.readFileSync(path.join(backend, file), 'utf8'))
    .join('\n');
  const cases = fs
    .readdirSync(path.join(here, 'cases'))
    .map((name) => loadCase(here, name));
  const caseText = cases.map((c) => JSON.stringify(c)).join('\n');

  it('uses example refs that no case page has', () => {
    const refs = [
      ...prompt.matchAll(/\\?"(?:block|after|into)\\?": \\?"(b\d+(?:\.\d+)*)/g),
    ].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(0);
    cases.forEach((testCase) => {
      const { refs: onPage } = projectPage({
        formData: testCase.formData,
        profile,
      });
      const used = new Set(Object.values(onPage));
      expect(
        refs.filter((ref) => used.has(ref)),
        testCase.id,
      ).toEqual([]);
    });
  });

  it('quotes no phrase of the cases (D52)', () => {
    // Quoted examples of three words or more ("see the ... below")
    const phrases = [...prompt.matchAll(/\\?"([^"\\]{8,}?)\\?"/g)]
      .map((m) => m[1].replace(/\s*\\\n\s*/g, ' ').trim())
      .filter((phrase) => phrase.split(/\s+/).length >= 3);
    expect(phrases.length).toBeGreaterThan(0);
    const lower = caseText.toLowerCase();
    expect(
      phrases.filter((phrase) => lower.includes(phrase.toLowerCase())),
    ).toEqual([]);
  });

  it('names no date, value or name the cases use', () => {
    const dates = [
      ...prompt.matchAll(
        /\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}(?:, \d{4})?|\b\d{2}\.\d{2}\.\d{4}/g,
      ),
    ].map((m) => m[0]);
    expect(dates.filter((date) => caseText.includes(date))).toEqual([]);
    const expected = cases.flatMap((c) =>
      c.turns.flatMap((t) =>
        (t.labels?.must_contain || [])
          .map((rule) => rule.text)
          .filter((text) => text && text.length > 3),
      ),
    );
    expect(expected.filter((text) => prompt.includes(text))).toEqual([]);
    // Names in the requests (capitalized, not starting a sentence)
    const names = cases.flatMap((c) =>
      c.turns.flatMap((t) =>
        t.request
          .split(/(?<=[.!?])\s+/)
          .flatMap((sentence) => sentence.split(/\s+/).slice(1))
          .map((word) => word.replace(/^\W+|\W+$/g, ''))
          .filter((word) => /^[A-Z][a-z]{2,}$/.test(word)),
      ),
    );
    const languages = ['German', 'English'];
    expect(
      names.filter(
        (name) =>
          !languages.includes(name) && new RegExp(`\\b${name}\\b`).test(prompt),
      ),
    ).toEqual([]);
  });
});
