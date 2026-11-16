import { describe, expect, it } from 'vitest';
import { computeDiff } from '@platejs/diff';
import type { Descendant, TElement, Value } from 'platejs';
import { expandDiffToWords } from './wholeWords';

const t = (text: string, format: Record<string, unknown> = {}) => ({
  ...format,
  text,
});
const del = (text: string, format: Record<string, unknown> = {}) => ({
  ...format,
  text,
  diff: true,
  diffOperation: { type: 'delete' },
});
const ins = (text: string, format: Record<string, unknown> = {}) => ({
  ...format,
  text,
  diff: true,
  diffOperation: { type: 'insert' },
});

/** Readable form of a diff: `[-removed-]`, `{+added+}`, `<a>…</a>`. */
const show = (nodes: Descendant[]): string =>
  nodes
    .map((node) => {
      if (!('text' in node)) {
        const element = node as TElement;
        return `<${element.type}>${show(element.children)}</${element.type}>`;
      }
      const type = (node as { diffOperation?: { type: string } }).diffOperation
        ?.type;
      if (type === 'delete') return `[-${node.text}-]`;
      if (type === 'insert') return `{+${node.text}+}`;
      if (type === 'update') return `[~${node.text}~]`;
      return node.text;
    })
    .join('');

const expand = (nodes: Descendant[]) => show(expandDiffToWords(nodes));

describe('expandDiffToWords', () => {
  it('marks the whole word when a part of it changed', () => {
    expect(
      expand([
        t('Der Projektplan '),
        del('lieg'),
        ins('steh'),
        t('t im Portal.'),
      ]),
    ).toBe('Der Projektplan [-liegt-]{+steht+} im Portal.');
  });

  it('keeps a hyphenated word together', () => {
    expect(
      expand([
        t('im '),
        del('Projektp'),
        ins('GreenCat-P'),
        t('ortal. Ansprechpartnerin'),
      ]),
    ).toBe('im [-Projektportal-]{+GreenCat-Portal+}. Ansprechpartnerin');
  });

  it('handles umlauts and ß', () => {
    expect(expand([t('Die Gr'), del('öß'), ins('oss'), t('e ist')])).toBe(
      'Die [-Größe-]{+Grosse+} ist',
    );
  });

  it('treats dates, times and decimal numbers as one word', () => {
    expect(expand([t('(bis 2'), del('5'), ins('6'), t('.09.)')])).toBe(
      '(bis [-25.09-]{+26.09+}.)',
    );
    expect(expand([t('um 10:'), del('3'), ins('4'), t('0 Uhr')])).toBe(
      'um [-10:30-]{+10:40+} Uhr',
    );
    expect(expand([t('Faktor 3,'), del('5'), ins('7'), t(', dann')])).toBe(
      'Faktor [-3,5-]{+3,7+}, dann',
    );
  });

  it('leaves punctuation at the edge of a word unmarked', () => {
    expect(expand([t('Treffen: '), del('1'), ins('8'), t('. Oktober')])).toBe(
      'Treffen: [-1-]{+8+}. Oktober',
    );
  });

  it('marks the word when text was only inserted into it', () => {
    expect(expand([t('Projekt'), ins('x'), t('portal')])).toBe(
      '[-Projektportal-]{+Projektxportal+}',
    );
    expect(expand([t('Portal'), ins('e'), t(' sind')])).toBe(
      '[-Portal-]{+Portale+} sind',
    );
  });

  it('marks the word when text was only removed from it', () => {
    expect(expand([t('Portal'), del('e'), t(' ist')])).toBe(
      '[-Portale-]{+Portal+} ist',
    );
  });

  it('marks joined and split words', () => {
    expect(expand([t('ab'), del(' '), t('cd')])).toBe('[-ab cd-]{+abcd+}');
    expect(expand([t('ab'), ins(' '), t('cd')])).toBe('[-abcd-]{+ab cd+}');
  });

  it('merges several changes inside one word', () => {
    expect(
      expand([
        t('a'),
        del('b'),
        ins('X'),
        t('c'),
        del('d'),
        ins('Y'),
        t('e f'),
      ]),
    ).toBe('[-abcde-]{+aXcYe+} f');
  });

  it('does not change marks that already cover whole words', () => {
    const paragraph = [t('liegt bei '), del('68'), ins('71'), t(' %, die')];
    expect(expandDiffToWords(paragraph)).toEqual(paragraph);
    const added = [t('im '), ins('neuen '), t('Portal')];
    expect(expandDiffToWords(added)).toEqual(added);
    const removed = [t('im '), del('alten '), t('Portal')];
    expect(expandDiffToWords(removed)).toEqual(removed);
  });

  it('returns unchanged text as it is', () => {
    const leaves = [t('Dieser Absatz '), t('bleibt', { bold: true }), t('.')];
    const result = expandDiffToWords(leaves);
    expect(result).toHaveLength(3);
    result.forEach((leaf, index) => expect(leaf).toBe(leaves[index]));
  });

  it('keeps the formatting of every part of the word', () => {
    expect(
      expandDiffToWords([
        t('Der '),
        t('Projekt', { bold: true }),
        del('plan'),
        ins('bericht'),
        t(' liegt'),
      ]),
    ).toEqual([
      t('Der '),
      del('Projekt', { bold: true }),
      del('plan'),
      ins('Projekt', { bold: true }),
      ins('bericht'),
      t(' liegt'),
    ]);
  });

  it('passes a leaf with changed formatting through', () => {
    const update = {
      text: 'Plan',
      bold: true,
      diff: true,
      diffOperation: {
        type: 'update',
        properties: {},
        newProperties: { bold: true },
      },
    };
    const result = expandDiffToWords([
      t('Der '),
      update,
      t(' '),
      del('lieg'),
      ins('steh'),
      t('t.'),
    ]);
    expect(show(result)).toBe('Der [~Plan~] [-liegt-]{+steht+}.');
    expect(result[1]).toEqual(update);
  });

  it('expands inside a link and stops at its edges', () => {
    const link = {
      type: 'a',
      url: 'https://example.org/portal',
      children: [del('Projektp'), ins('GreenCat-P'), t('ortal')],
    };
    const result = expandDiffToWords([t('im '), link, t('. Ende')]);
    expect(show(result)).toBe(
      'im <a>[-Projektportal-]{+GreenCat-Portal+}</a>. Ende',
    );
    expect((result[1] as TElement).url).toBe('https://example.org/portal');
  });

  it('does not touch added or removed elements', () => {
    const added = {
      type: 'p',
      diff: true,
      diffOperation: { type: 'insert' },
      children: [t('Neuer Absatz')],
    };
    const removed = {
      type: 'a',
      url: 'https://example.org',
      diff: true,
      diffOperation: { type: 'delete' },
      children: [t('Link')],
    };
    const result = expandDiffToWords([added, removed]);
    expect(result[0]).toBe(added);
    expect(result[1]).toBe(removed);
  });

  it('reaches text in nested elements such as table cells', () => {
    const table = {
      type: 'table',
      children: [
        {
          type: 'tr',
          children: [
            {
              type: 'td',
              children: [
                {
                  type: 'p',
                  children: [t('Bud'), del('get'), ins('jet'), t(' 2026')],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(show(expandDiffToWords([table]))).toBe(
      '<table><tr><td><p>[-Budget-]{+Budjet+} 2026</p></td></tr></table>',
    );
  });
});

describe('expandDiffToWords on the output of computeDiff', () => {
  const paragraph = (id: string, ...children: Descendant[]) =>
    ({ id, type: 'p', children }) as TElement;
  const diff = (before: Value, after: Value) =>
    show(
      expandDiffToWords(
        computeDiff(before, after, {
          isInline: (node) => (node as TElement).type === 'a',
        }),
      ),
    );

  it('marks whole words in a paragraph', () => {
    expect(
      diff(
        [paragraph('p1', t('Der Projektplan liegt im Projektportal.'))],
        [paragraph('p1', t('Der Projektplan steht im GreenCat-Portal.'))],
      ),
    ).toBe(
      '<p>Der Projektplan [-liegt-]{+steht+} im [-Projektportal-]{+GreenCat-Portal+}.</p>',
    );
  });

  it('marks a changed date as a whole', () => {
    expect(
      diff(
        [paragraph('p1', t('Abgabe bis 25.09.2026 im Labor.'))],
        [paragraph('p1', t('Abgabe bis 26.09.2026 im Labor.'))],
      ),
    ).toBe('<p>Abgabe bis [-25.09.2026-]{+26.09.2026+} im Labor.</p>');
  });

  it('leaves an unchanged document without marks', () => {
    const value = [paragraph('p1', t('Dieser Absatz bleibt unverändert.'))];
    expect(diff(value, value)).toBe('<p>Dieser Absatz bleibt unverändert.</p>');
  });
});
