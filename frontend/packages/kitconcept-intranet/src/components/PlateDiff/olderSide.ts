/**
 * The older side of a node in the split history diff (work item 852).
 *
 * `computeDiff` returns a node that changed its properties (an `update`,
 * e.g. a table's column widths, width or alignment) with the newer
 * version's properties; the older values are only in its
 * `diffOperation.properties`, which the change label reads. Both sides of
 * the split view rendered that node, so the older side showed the newer
 * widths. `olderSide` gives every updated node, at any depth, its older
 * properties back: a property the older version did not have is removed,
 * one only the older version had is restored. Insertions and deletions
 * keep their marks (the left column shows them as before).
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/852
 */
import type { DiffOperation } from '@platejs/diff';
import type { Descendant, TElement } from 'platejs';

type UpdateOperation = DiffOperation & {
  properties?: Record<string, unknown>;
  newProperties?: Record<string, unknown>;
};

const withOlderProperties = <N extends Record<string, unknown>>(node: N): N => {
  const op = node.diffOperation as UpdateOperation | undefined;
  if (op?.type !== 'update') return node;
  const { properties = {}, newProperties = {} } = op;
  const older: Record<string, unknown> = { ...node };
  for (const key of Object.keys(newProperties)) {
    if (key in properties && properties[key] !== undefined) {
      older[key] = properties[key];
    } else {
      delete older[key];
    }
  }
  for (const key of Object.keys(properties)) {
    if (!(key in newProperties) && properties[key] !== undefined) {
      older[key] = properties[key];
    }
  }
  return older as N;
};

/** `node` as the older version had it (see above); `node` itself if unchanged. */
export function olderSide<N extends Descendant>(node: N): N {
  const own = withOlderProperties(node as unknown as Record<string, unknown>);
  if (!('children' in own) || !Array.isArray(own.children)) {
    return own as unknown as N;
  }
  const children = (own.children as Descendant[]).map((child) =>
    olderSide(child),
  );
  const changed = children.some(
    (child, index) => child !== (own.children as Descendant[])[index],
  );
  if (!changed && own === (node as unknown)) return node;
  return { ...(own as object), children } as unknown as N & TElement;
}
