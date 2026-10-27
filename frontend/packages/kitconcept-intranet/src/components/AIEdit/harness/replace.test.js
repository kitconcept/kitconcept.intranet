import { describe, expect, it } from 'vitest';
import { applySpans, closest, locate, overlaps, repeatedEdge } from './replace';

describe('locate', () => {
  it('finds every exact occurrence', () => {
    expect(locate('March 18 and March 18', 'March 18')).toEqual({
      spans: [
        [0, 8],
        [13, 21],
      ],
      loose: false,
    });
  });

  it('falls back to a loose match: escapes, spaces, quotes, dashes', () => {
    const text = '1\\. Preis · Don’t  miss it – now';
    const { spans, loose } = locate(text, "1. Preis · Don't miss it - now");
    expect(loose).toBe(true);
    expect(spans).toEqual([[0, text.length]]);
    expect(locate('Hello', 'Bye')).toEqual({ spans: [], loose: true });
  });
});

describe('closest', () => {
  const text =
    'Registration closes one week before the event, on March 11, so sign up soon.';

  it('suggests the most similar passage', () => {
    expect(closest(text, 'on March 11 so')).toBe('on March 11, so');
    expect(closest(text, 'quantum flux capacitor')).toBeNull();
  });
});

describe('applySpans', () => {
  it('replaces back to front; overlaps are detected', () => {
    const spans = [
      { start: 0, end: 5, replace: 'Bye' },
      { start: 6, end: 11, replace: 'all' },
    ];
    expect(applySpans('Hello world', spans)).toBe('Bye all');
    expect(overlaps({ start: 4, end: 7 }, spans)).toBe(true);
    expect(overlaps({ start: 11, end: 12 }, spans)).toBe(false);
  });
});

describe('repeatedEdge', () => {
  const text = 'Hosted by Nimbus · Thursday, March 18, 2027 · Hall';
  const at = (find) => [text.indexOf(find), text.indexOf(find) + find.length];

  it('finds a replacement repeating the text next to the match', () => {
    // The second browser test: the year stays after the match
    expect(
      repeatedEdge(text, ...at('Thursday, March 18'), 'Friday, April 9, 2027'),
    ).toBe(', 2027');
    expect(repeatedEdge(text, ...at('Thursday'), 'Nimbus · Friday')).toBe(
      'Nimbus · ',
    );
  });

  it('ignores a repeated space or comma, and clean replacements', () => {
    expect(
      repeatedEdge(
        text,
        ...at('Thursday, March 18, 2027'),
        'Friday, April 9, 2027',
      ),
    ).toBeNull();
    expect(repeatedEdge('a, b', 1, 2, ', ')).toBeNull();
  });
});
