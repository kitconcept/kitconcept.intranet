import { describe, expect, it } from 'vitest';
import { checkProfile, getPath, setPath, stylingOf } from './profile';
import { profile } from './__fixtures__/pages';

describe('paths', () => {
  it('reads dotted paths with :noprefix keys', () => {
    const block = { styles: { 'align:noprefix': 'right' } };
    expect(getPath(block, 'styles.align:noprefix')).toBe('right');
    expect(getPath({}, 'styles.align:noprefix')).toBeUndefined();
  });

  it('writes one style and keeps the other keys and their order (D30)', () => {
    const block = {
      '@type': 'image',
      styles: {
        'blockWidth:noprefix': 'narrow',
        'align:noprefix': 'left',
        x: 1,
      },
    };
    const updated = setPath(block, 'styles.align:noprefix', 'right');
    expect(Object.keys(updated.styles)).toEqual([
      'blockWidth:noprefix',
      'align:noprefix',
      'x',
    ]);
    expect(updated.styles['align:noprefix']).toBe('right');
    expect(block.styles['align:noprefix']).toBe('left');
  });

  it('creates missing objects on the way', () => {
    expect(
      setPath({ '@type': 'slate' }, 'styles.align:noprefix', 'left'),
    ).toEqual({
      '@type': 'slate',
      styles: { 'align:noprefix': 'left' },
    });
  });
});

describe('stylingOf', () => {
  it('gives the effective values: stored, else the default', () => {
    expect(
      stylingOf(profile, {
        '@type': '__button',
        styles: { 'align:noprefix': 'right' },
      }),
    ).toEqual({ theme: 'default', align: 'right', blockWidth: 'default' });
  });

  it('is empty for types without styling', () => {
    expect(stylingOf(profile, { '@type': 'title' })).toEqual({});
  });
});

describe('checkProfile', () => {
  it('accepts the fixture profile', () => {
    expect(checkProfile(profile)).toEqual([]);
  });

  it('reports unusable entries', () => {
    const broken = {
      ...profile,
      charsPerToken: 0,
      blockTypes: {
        slate: {
          fields: { text: { kind: 'html', path: 'value' } },
          styling: { theme: { path: 'theme', values: ['a'], default: 'b' } },
          insertable: true,
        },
      },
    };
    expect(checkProfile(broken)).toEqual([
      'charsPerToken must be a positive number',
      'slate.fields.text: unknown kind html',
      'slate.styling.theme: default b is not a value',
      'slate: insertable needs initial data of its type',
    ]);
  });
});
