import { describe, expect, it } from 'vitest';
import { computeDiff } from '@platejs/diff';
import type { Descendant, TElement, Value } from 'platejs';
import { mergeLinkChanges } from './linkChanges';

const options = { isInline: (node: TElement) => node.type === 'a' };

const t = (text: string) => ({ text });
const link = (id: string, text: string, url: string, extra = {}) => ({
  id,
  type: 'a',
  url,
  target: '_blank',
  ...extra,
  children: [t(text)],
});
const del = <T extends object>(node: T) => ({
  ...node,
  diff: true,
  diffOperation: { type: 'delete' },
});
const ins = <T extends object>(node: T) => ({
  ...node,
  diff: true,
  diffOperation: { type: 'insert' },
});
const p = (...children: Descendant[]) =>
  ({ id: 'p1', type: 'p', children }) as TElement;

const op = (node: Descendant) =>
  (node as { diffOperation?: Record<string, unknown> }).diffOperation;

describe('mergeLinkChanges', () => {
  it('merges a removed and an added link with the same id into one change', () => {
    const result = mergeLinkChanges(
      [
        t('im '),
        del(link('l1', 'Portal', 'https://a')),
        ins(link('l1', 'Portal', 'https://b')),
        t('.'),
      ],
      options,
    );
    expect(result).toHaveLength(3);
    const merged = result[1] as TElement;
    expect(merged.type).toBe('a');
    expect(merged.url).toBe('https://b');
    expect(merged.children).toEqual([t('Portal')]);
    expect(op(merged)).toEqual({
      type: 'update',
      properties: { url: 'https://a' },
      newProperties: { url: 'https://b' },
    });
  });

  it('skips an empty text leaf between the two links', () => {
    const result = mergeLinkChanges(
      [
        t('im '),
        del(link('l1', 'Portal', 'https://a')),
        t(''),
        ins(link('l1', 'Portal', 'https://b')),
        t('.'),
      ],
      options,
    );
    expect(result.map((node) => ('text' in node ? node.text : 'a'))).toEqual([
      'im ',
      'a',
      '.',
    ]);
  });

  it('matches links without ids by their text', () => {
    const noId = (text: string, url: string) => ({
      type: 'a',
      url,
      children: [t(text)],
    });
    const result = mergeLinkChanges(
      [del(noId('Portal', 'https://a')), ins(noId('Portal', 'https://b'))],
      options,
    );
    expect(result).toHaveLength(1);
    expect(op(result[0])?.type).toBe('update');
  });

  it('diffs the link text when target and text changed together', () => {
    const [merged] = mergeLinkChanges(
      [
        del(link('l1', 'Projektportal', 'https://a')),
        ins(link('l1', 'GreenCat-Portal', 'https://b')),
      ],
      options,
    ) as TElement[];
    expect(op(merged)?.type).toBe('update');
    const marks = merged.children.map(
      (leaf) =>
        `${op(leaf)?.type ?? 'same'}:${(leaf as { text: string }).text}`,
    );
    expect(marks).toContain('delete:Projektp');
    expect(marks).toContain('insert:GreenCat-P');
    expect(marks).toContain('same:ortal');
  });

  it('reports every changed attribute', () => {
    const [merged] = mergeLinkChanges(
      [
        del(link('l1', 'Portal', 'https://a', { target: '_self' })),
        ins(link('l1', 'Portal', 'https://a', { target: '_blank' })),
      ],
      options,
    );
    expect(op(merged)).toEqual({
      type: 'update',
      properties: { target: '_self' },
      newProperties: { target: '_blank' },
    });
  });

  it('leaves a removed link and an added link that differ alone', () => {
    const nodes = [
      t('siehe '),
      del(link('l1', 'Portal', 'https://a')),
      ins(link('l2', 'Handbuch', 'https://b')),
    ];
    expect(mergeLinkChanges(nodes, options)).toEqual(nodes);
  });

  it('leaves a link that was removed in favour of plain text alone', () => {
    const nodes = [
      t('im '),
      del(link('l1', 'Portal', 'https://a')),
      ins(t('Portal')),
      t('.'),
    ];
    expect(mergeLinkChanges(nodes, options)).toEqual(nodes);
  });

  it('does not merge other inline elements such as dates', () => {
    const date = (value: string) => ({
      id: 'd1',
      type: 'date',
      value,
      children: [t('')],
    });
    const nodes = [t('am '), del(date('2026-10-01')), ins(date('2026-10-08'))];
    expect(mergeLinkChanges(nodes, options)).toEqual(nodes);
  });

  it('reaches links inside nested elements and keeps the rest', () => {
    const cell = {
      type: 'td',
      children: [
        p(
          t('Plan: '),
          del(link('l1', 'hier', 'https://a')),
          ins(link('l1', 'hier', 'https://b')),
        ),
      ],
    };
    const [result] = mergeLinkChanges(
      [{ type: 'table', children: [{ type: 'tr', children: [cell] }] }],
      options,
    ) as TElement[];
    const paragraph = ((result.children[0] as TElement).children[0] as TElement)
      .children[0] as TElement;
    expect(paragraph.children).toHaveLength(2);
    expect(op(paragraph.children[1])?.type).toBe('update');
  });

  it('merges what computeDiff produces for a changed link target', () => {
    const before = [p(t('im '), link('l1', 'Portal', 'https://a'), t('.'))];
    const after = [p(t('im '), link('l1', 'Portal', 'https://b'), t('.'))];
    const diff = computeDiff(before as Value, after as Value, {
      isInline: (node) => options.isInline(node as TElement),
    });
    const [paragraph] = mergeLinkChanges(diff, options) as TElement[];
    expect(paragraph.children).toHaveLength(3);
    expect(op(paragraph.children[1])).toEqual({
      type: 'update',
      properties: { url: 'https://a' },
      newProperties: { url: 'https://b' },
    });
  });
});
