import { describe, expect, it } from 'vitest';
import { modelHistory, operationsOf, toolResult, userMessage } from './history';

const refs = { a: 'b2', g: 'b5', col: 'b5.1' };

describe('userMessage', () => {
  it('heads the request with the refs of its selection', () => {
    expect(
      userMessage({ content: 'Shorten it', selected: ['col', 'a'] }, refs),
    ).toEqual({ role: 'user', content: 'Selected: b5.1, b2\n\nShorten it' });
  });

  it('says so when nothing is selected', () => {
    expect(userMessage({ content: 'Check the page' }, refs).content).toBe(
      'Selected: none\n\nCheck the page',
    );
    // A block without a ref is not named
    expect(
      userMessage({ content: 'Hi', selected: ['unknown'] }, refs).content,
    ).toBe('Selected: none\n\nHi');
  });
});

describe('modelHistory', () => {
  it('repeats every request with its own selection', () => {
    const history = modelHistory(
      [
        { role: 'user', content: 'Translate this block', selected: ['a'] },
        { role: 'assistant', content: 'Done.' },
        { role: 'user', content: 'Make this block grey', selected: ['g'] },
        { role: 'assistant', content: 'Done.' },
      ],
      refs,
    );
    expect(history.map((message) => message.content)).toEqual([
      'Selected: b2\n\nTranslate this block',
      'Done.',
      'Selected: b5\n\nMake this block grey',
      'Done.',
    ]);
  });
});

describe('operationsOf', () => {
  it('sends replacements back as replace_text, as the model wrote them', () => {
    expect(
      operationsOf([
        {
          kind: 'block_field',
          ref: 'b8',
          field: 'text',
          value: 'whole new text',
          replacements: [
            {
              find: 'March 18',
              replace: 'April 9',
              reason: 'New date.',
              category: 'outdated',
            },
          ],
        },
        {
          kind: 'page_field',
          field: 'description',
          value: 'x',
          replacements: [
            { find: 'a', replace: 'b', reason: 'R.', category: 'style' },
          ],
        },
      ]),
    ).toEqual([
      {
        op: 'replace_text',
        block: 'b8',
        field: 'text',
        find: 'March 18',
        replace: 'April 9',
        reason: 'New date.',
        category: 'outdated',
      },
      {
        op: 'replace_text',
        field: 'description',
        find: 'a',
        replace: 'b',
        reason: 'R.',
        category: 'style',
      },
    ]);
  });
});

describe('toolResult', () => {
  it('names what the search found apart, and dropped operations by what they were', () => {
    const own = {
      key: 'block:a:text',
      kind: 'block_field',
      label: 'b3 text',
      replacements: [{ find: 'x', replace: 'y', suggested: false }],
    };
    const found = {
      key: 'block:b:text',
      kind: 'block_field',
      label: 'b8 text',
      replacements: [{ find: 'x', replace: 'y', suggested: true }],
    };
    const openFound = { ...found, key: 'block:c:text', label: 'b26 text' };
    expect(
      toolResult({
        changes: [own, found, openFound],
        applied: ['block:a:text', 'block:b:text'],
        dropped: [
          { number: 3, label: 'insert_block b22', codes: ['not_insertable'] },
        ],
      }),
    ).toBe(
      'Applied: b3 text. Also applied, found on the page by the search (same change, not proposed by you): b8 text. Could not be used: insert_block b22 (not_insertable). The current page is the source of truth.',
    );
  });
});
