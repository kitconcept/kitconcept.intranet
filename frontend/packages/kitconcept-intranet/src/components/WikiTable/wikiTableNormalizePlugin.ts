/**
 * Keep table rows well-formed: a row holds cells and nothing else.
 *
 * Pasted HTML can produce rows with a stray text child and no cell (a
 * Confluence table pasted from the browser did). Plate's table normalizer
 * leaves them alone; the static renderer then emits a text leaf inside
 * `<tr>`, the server and the client disagree on the markup and React drops
 * the server-rendered page ("Hydration failed").
 *
 * - `normalizeNode` fixes rows while editing (also right after a paste).
 * - `normalizeInitialValue` fixes the value when the editor loads, so pages
 *   saved with such rows are repaired with the next save.
 * - The read-only renderers (view, history diff) render `cleanTableRows()`
 *   of the stored value instead; they render the value they are given, not
 *   the editor's children.
 */
import type { TElement, Value } from 'platejs';
import { createSlatePlugin, ElementApi, KEYS } from 'platejs';

const cellTypes = new Set<string>([KEYS.td, KEYS.th]);
const isCell = (node: unknown) =>
  ElementApi.isElement(node) && cellTypes.has(node.type);

/** Return the value without stray row children and without empty rows. */
export function cleanTableRows(value: Value): Value {
  let changed = false;
  const clean = (node: TElement): TElement | null => {
    if (node.type === KEYS.tr) {
      const cells = node.children.filter(isCell);
      if (cells.length === node.children.length) return node;
      changed = true;
      return cells.length ? { ...node, children: cells } : null;
    }
    if (!Array.isArray(node.children)) return node;
    const children = node.children
      .map((child) => (ElementApi.isElement(child) ? clean(child) : child))
      .filter((child): child is TElement => child !== null);
    return children.length === node.children.length &&
      children.every((child, index) => child === node.children[index])
      ? node
      : { ...node, children };
  };
  const result = value
    .map((node) => (ElementApi.isElement(node) ? clean(node) : node))
    .filter((node) => node !== null) as Value;
  return changed ? result : value;
}

export const WikiTableNormalizePlugin = createSlatePlugin({
  key: 'wikiTableNormalize',
  // Plate 49 ignores the return value; the editor's children are replaced
  // (the caller's array may be frozen state and is never mutated).
  normalizeInitialValue: ({ editor, value }) => {
    const cleaned = cleanTableRows(value);
    if (cleaned !== value) editor.children = cleaned;
  },
}).overrideEditor(({ editor, tf: { normalizeNode } }) => ({
  transforms: {
    normalizeNode(entry, options) {
      const [node, path] = entry;
      if (ElementApi.isElement(node) && node.type === KEYS.tr) {
        const stray = node.children.findIndex((child) => !isCell(child));
        if (stray !== -1) {
          if (node.children.length === 1) {
            editor.tf.removeNodes({ at: path });
          } else {
            editor.tf.removeNodes({ at: [...path, stray] });
          }
          return;
        }
      }
      normalizeNode(entry, options);
    },
  },
}));
