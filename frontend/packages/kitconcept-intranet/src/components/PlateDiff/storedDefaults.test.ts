import { describe, expect, it } from 'vitest';
import type { TElement, Value } from 'platejs';
import { withStoredDefaults } from './storedDefaults';

const t = (text: string) => ({ text });
const el = (type: string, props: Record<string, unknown> = {}) =>
  ({ id: `${type}-1`, type, children: [t('x')], ...props }) as TElement;

describe('withStoredDefaults', () => {
  it('gives every top-level block without a width the default width', () => {
    const value: Value = [
      el('title'),
      el('p', { align: 'start' }),
      el('callout', { variant: 'info' }),
    ];
    const result = withStoredDefaults(value);
    expect(result.map((node) => (node as TElement).blockWidth)).toEqual([
      'default',
      'default',
      'default',
    ]);
    // nothing else changed
    expect((result[1] as TElement).align).toBe('start');
    expect((result[2] as TElement).variant).toBe('info');
  });

  it('keeps a stored width', () => {
    const value: Value = [
      el('p', { blockWidth: 'wide' }),
      el('img', { blockWidth: 'narrow' }),
    ];
    expect(withStoredDefaults(value)).toEqual(value);
  });

  it('uses the given width defaults, which may reset a width', () => {
    const value: Value = [el('p', { blockWidth: 'wide' }), el('img')];
    const result = withStoredDefaults(value, (blocks) => {
      for (const block of blocks) {
        block.blockWidth = block.type === 'img' ? 'narrow' : 'default';
      }
    });
    expect((result[0] as TElement).blockWidth).toBe('default');
    expect((result[1] as TElement).blockWidth).toBe('narrow');
    // the input is not changed
    expect((value[0] as TElement).blockWidth).toBe('wide');
  });

  it('drops a list start of 1 and keeps other list starts', () => {
    const item = (listStart: number) =>
      el('p', {
        blockWidth: 'default',
        indent: 1,
        listStyleType: 'decimal',
        listStart,
      });
    const [first, second] = withStoredDefaults([
      item(1),
      item(2),
    ]) as TElement[];
    expect('listStart' in first).toBe(false);
    expect(first.listStyleType).toBe('decimal');
    expect(second.listStart).toBe(2);
  });

  it('leaves text nodes and nested nodes alone', () => {
    const cellParagraph = el('p');
    const table = el('table', {
      children: [
        { type: 'tr', children: [{ type: 'td', children: [cellParagraph] }] },
      ],
    });
    const [result] = withStoredDefaults([table]) as TElement[];
    expect(result.blockWidth).toBe('default');
    const nested = ((result.children[0] as TElement).children[0] as TElement)
      .children[0] as TElement;
    expect(nested).toBe(cellParagraph);
    expect('blockWidth' in nested).toBe(false);
  });

  it('makes a page stored by code equal to its first editor save', () => {
    // Stored by code: no widths, a list start of 1 …
    const before: Value = [
      el('title'),
      el('p', { indent: 1, listStyleType: 'decimal', listStart: 1 }),
      el('p', { align: 'start' }),
    ];
    // … and the same page as the editor saves it.
    const after: Value = [
      el('title', { blockWidth: 'default' }),
      el('p', { blockWidth: 'default', indent: 1, listStyleType: 'decimal' }),
      el('p', { align: 'start', blockWidth: 'default' }),
    ];
    expect(withStoredDefaults(before)).toEqual(withStoredDefaults(after));
  });
});
