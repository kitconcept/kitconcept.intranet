/**
 * Applies what the editor applies when it loads a page, before a stored
 * value is diffed.
 *
 * The wiki editor writes a `blockWidth` on every top-level block (and resets
 * one it does not allow) and drops a `listStart` of 1. Content that was never
 * saved in the editor (created by code, imported, migrated, or last saved
 * before the editor did this) lacks these values, so the diff of its first
 * save in the editor would show "Width: not set → Standard" on every block,
 * and a paragraph edited in that same save as removed + added. Applying the
 * same defaults to both versions keeps only the real changes.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/714
 */
import type { TElement, Value } from 'platejs';

export const DEFAULT_BLOCK_WIDTH = 'default';

/**
 * Fills in the width of the given top-level blocks, in place. The diff view
 * passes the editor's own function (`applyBlockWidthDefaultsInValue` of the
 * block-width plugin), which knows the configured widths per block type.
 */
export type ApplyWidthDefaults = (blocks: TElement[]) => void;

const fallbackWidthDefaults: ApplyWidthDefaults = (blocks) => {
  for (const block of blocks) {
    if (block.blockWidth === undefined) block.blockWidth = DEFAULT_BLOCK_WIDTH;
  }
};

const isElement = (node: Value[number]): node is TElement => 'type' in node;

/** Returns `value` with the editor's defaults on every top-level block. */
export const withStoredDefaults = (
  value: Value,
  applyWidthDefaults: ApplyWidthDefaults = fallbackWidthDefaults,
): Value => {
  const copy = value.map((node) => (isElement(node) ? { ...node } : node));
  applyWidthDefaults(copy.filter(isElement));
  return copy.map((node) => {
    if (!isElement(node) || node.listStart !== 1) return node;
    const { listStart: _listStart, ...rest } = node;
    return rest as TElement;
  });
};
