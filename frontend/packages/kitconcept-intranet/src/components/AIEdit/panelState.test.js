import { describe, expect, it } from 'vitest';
import { createdBlocks, initialSelection, selectedBlocks } from './panelState';

const formData = {
  blocks: {
    t: { '@type': 'title' },
    a: { '@type': 'slate' },
    g: { '@type': 'gridBlock', blocks: { col: { '@type': 'slate' } } },
  },
  blocks_layout: { items: ['t', 'a', 'g'] },
};
const state = (ui, path = '/page/edit') => ({
  form: { global: formData, ui },
  router: { location: { pathname: path, search: '' } },
  content: { data: { '@type': 'Document' } },
});

describe('initialSelection', () => {
  it('follows Volto: none, the configured type, else the first block', () => {
    expect(initialSelection(formData, 'Document', null)).toBeNull();
    expect(
      initialSelection(formData, 'Document', { Document: 'gridBlock' }),
    ).toBe('g');
    expect(initialSelection(formData, 'Document', {})).toBe('t');
  });
});

describe('selectedBlocks', () => {
  it("ignores the form's own initial selection until it changes", () => {
    expect(selectedBlocks(state({ selected: 't' }), false, {})).toEqual([]);
    expect(selectedBlocks(state({ selected: 't' }), true, {})).toEqual(['t']);
    expect(selectedBlocks(state({ selected: 'a' }), false, {})).toEqual(['a']);
  });

  it('takes the clicked grid column, not the grid', () => {
    expect(
      selectedBlocks(state({ selected: 'g', gridSelected: 'col' }), true, {}),
    ).toEqual(['col']);
    // Left over from an earlier grid: the selected block counts
    expect(
      selectedBlocks(state({ selected: 'a', gridSelected: 'col' }), true, {}),
    ).toEqual(['a']);
  });

  it('adds the multi-selection', () => {
    expect(
      selectedBlocks(state({ selected: 'a', multiSelected: ['g'] }), true, {}),
    ).toEqual(['a', 'g']);
  });
});

describe('createdBlocks', () => {
  it('keeps the blocks of every answer, even with the same change keys', () => {
    const created = createdBlocks([
      { role: 'user' },
      { created: { 'insert:1': { ids: ['x'], anchor: 'after:a' } } },
      { role: 'user' },
      { created: { 'insert:1': { ids: ['y'], anchor: 'after:g' } } },
    ]);
    expect(Object.values(created)).toEqual([
      { ids: ['x'], anchor: 'after:a' },
      { ids: ['y'], anchor: 'after:g' },
    ]);
  });
});
