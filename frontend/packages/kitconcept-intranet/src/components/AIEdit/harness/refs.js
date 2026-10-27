/**
 * Short refs for blocks (spec §6, D4, D21, AI_WORKFLOW.md): `b1`, `b2`, ...
 * at the top level, dotted inside containers (`b5.1`, `b5.1.2`).
 *
 * `refs` (block id -> ref) is the conversation's mapping. A block keeps its
 * ref for the whole conversation, also when it is moved, and a ref is never
 * reused: entries are never removed, and a new block gets one more than the
 * highest number ever assigned at its level. So the refs in earlier tool
 * calls and results always point at the same block, or at none.
 */
import escapeRegExp from 'lodash/escapeRegExp';

/** The next free ref below `parent` (a ref), or at the top level. */
const nextRef = (refs, parent) => {
  const pattern = parent
    ? new RegExp(`^${escapeRegExp(parent)}\\.(\\d+)$`)
    : /^b(\d+)$/;
  const numbers = Object.values(refs)
    .map((ref) => pattern.exec(ref)?.[1])
    .filter(Boolean)
    .map(Number);
  const number = Math.max(0, ...numbers) + 1;
  return parent ? `${parent}.${number}` : `b${number}`;
};

/**
 * Give every block (`{id, children?}`, nested) its ref, in page order.
 * Returns the blocks with `ref` and the extended mapping; `refs` itself is
 * not changed.
 */
export const assignRefs = (blocks, refs = {}) => {
  const updated = { ...refs };
  const walk = (list, parent) =>
    list.map((block) => {
      if (!updated[block.id]) updated[block.id] = nextRef(updated, parent);
      const ref = updated[block.id];
      return block.children
        ? { ...block, ref, children: walk(block.children, ref) }
        : { ...block, ref };
    });
  return { blocks: walk(blocks, null), refs: updated };
};
