import { describe, expect, it } from 'vitest';
import { sides, slateToHtml, tokens } from './diffHtml';

describe('slateToHtml', () => {
  it('renders blocks, marks, lists and escaped text', () => {
    expect(
      slateToHtml([
        { type: 'h2', children: [{ text: 'A & B' }] },
        {
          type: 'p',
          children: [
            { text: 'Say ' },
            { type: 'strong', children: [{ text: 'hi' }] },
            { text: ' <now>' },
          ],
        },
        {
          type: 'ul',
          children: [{ type: 'li', children: [{ text: 'One' }] }],
        },
      ]),
    ).toBe(
      '<h2>A &amp; B</h2><p>Say <strong>hi</strong> &lt;now&gt;</p><ul><li>One</li></ul>',
    );
  });

  it('renders links without a target, unknown elements as their text', () => {
    expect(
      slateToHtml([
        {
          type: 'p',
          children: [
            {
              type: 'link',
              data: { url: '/contact?a="b"' },
              children: [{ text: 'us' }],
            },
            { type: 'mention', children: [{ text: '@Ann' }] },
          ],
        },
      ]),
    ).toBe(
      '<p><a class="ai-edit-diff-link" title="/contact?a=&quot;b&quot;">us</a><span>@Ann</span></p>',
    );
    expect(slateToHtml(undefined)).toBe('');
  });
});

describe('tokens', () => {
  it('splits tags, words and whitespace', () => {
    expect(tokens('<p>Hello  world</p>')).toEqual([
      '<p>',
      'Hello',
      '  ',
      'world',
      '</p>',
    ]);
    expect(tokens('')).toEqual([]);
  });
});

describe('sides', () => {
  it('marks removed words left, added right, tags on their side', () => {
    // As diffLib.diffArrays returns them for <p>Old text</p> -> <h3>New text</h3>
    const parts = [
      { removed: true, value: ['<p>', 'Old'] },
      { added: true, value: ['<h3>', 'New'] },
      { value: [' ', 'text'] },
      { removed: true, value: ['</p>'] },
      { added: true, value: ['</h3>'] },
    ];
    expect(sides(parts)).toEqual({
      left: '<p><span class="deletion">Old</span> text</p>',
      right: '<h3><span class="addition">New</span> text</h3>',
    });
  });
});
