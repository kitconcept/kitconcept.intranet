/**
 * Shows a link whose target changed as one changed link.
 *
 * `computeDiff` (`@platejs/diff`) treats inline elements as single
 * characters of the surrounding text. A link whose URL changed therefore
 * comes back as the old link removed and the new link added, one after the
 * other, and the reader sees the same link text outlined twice without the
 * URLs. `mergeLinkChanges` turns such a pair into one link annotated as an
 * `update` whose `properties` / `newProperties` hold the changed attributes
 * (`url`, `target`, …). `DiffPlugin` renders the old and the new target
 * next to the link.
 *
 * Only links are merged: for a date or a mention the removed and the added
 * element show the old and the new value, which is what the reader wants.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/714
 */
import { computeDiff, type DiffOperation } from '@platejs/diff';
import type { Descendant, TElement, TText } from 'platejs';

type DiffElement = TElement & { diff?: boolean; diffOperation?: DiffOperation };

/** Element types that are links in the wiki editor. */
export const LINK_TYPES: ReadonlySet<string> = new Set(['a', 'link']);

/** Attributes that are not part of what a link *is*. */
const IGNORED_KEYS = new Set(['children', 'id', 'diff', 'diffOperation']);

const isText = (node: Descendant): node is TText => 'text' in node;

const isLink = (node: Descendant): node is DiffElement =>
  !isText(node) && LINK_TYPES.has((node as TElement).type);

const opType = (node: Descendant) => (node as DiffElement).diffOperation?.type;

const nodeText = (node: Descendant): string =>
  isText(node)
    ? node.text
    : ((node as TElement).children ?? []).map(nodeText).join('');

const isEmptyText = (node: Descendant | undefined) =>
  node !== undefined && isText(node) && node.text === '';

/** The removed and the added link are the same link in both versions. */
const sameLink = (removed: DiffElement, added: DiffElement) =>
  removed.type === added.type &&
  ((removed.id !== undefined && removed.id === added.id) ||
    nodeText(removed) === nodeText(added));

const changedProperties = (removed: DiffElement, added: DiffElement) => {
  const properties: Record<string, unknown> = {};
  const newProperties: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(removed), ...Object.keys(added)]);
  for (const key of keys) {
    if (IGNORED_KEYS.has(key)) continue;
    if (JSON.stringify(removed[key]) !== JSON.stringify(added[key])) {
      properties[key] = removed[key];
      newProperties[key] = added[key];
    }
  }
  return { properties, newProperties };
};

type Options = { isInline: (node: TElement) => boolean };

/**
 * The children of the merged link: unchanged when the text is the same,
 * otherwise the text diff of the old and the new link text.
 */
const mergedChildren = (
  removed: DiffElement,
  added: DiffElement,
  options: Options,
): Descendant[] => {
  if (nodeText(removed) === nodeText(added)) return added.children;
  const wrap = (children: Descendant[]) =>
    [{ type: 'p', children }] as TElement[];
  const [diffed] = computeDiff(wrap(removed.children), wrap(added.children), {
    isInline: (node) => options.isInline(node as TElement),
  });
  return (diffed as TElement).children;
};

/**
 * Returns the diff with each "link removed + same link added" pair replaced
 * by one link marked as changed. `nodes` is the result of `computeDiff` (or
 * the children of one of its elements).
 */
export const mergeLinkChanges = (
  nodes: Descendant[],
  options: Options,
): Descendant[] => {
  const result: Descendant[] = [];
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (isText(node)) {
      result.push(node);
      continue;
    }
    const element = node as DiffElement;
    if (isLink(element) && opType(element) === 'delete') {
      // The added link follows directly, or after an empty text leaf.
      const gap = isEmptyText(nodes[index + 1]) ? 1 : 0;
      const next = nodes[index + 1 + gap] as DiffElement | undefined;
      if (
        next !== undefined &&
        isLink(next) &&
        opType(next) === 'insert' &&
        sameLink(element, next)
      ) {
        const { properties, newProperties } = changedProperties(element, next);
        if (Object.keys(newProperties).length > 0) {
          result.push({
            ...next,
            children: mergedChildren(element, next, options),
            diff: true,
            diffOperation: { type: 'update', properties, newProperties },
          } as DiffElement);
          index += 1 + gap;
          continue;
        }
      }
    }
    const type = opType(element);
    result.push(
      type === 'insert' || type === 'delete'
        ? element
        : { ...element, children: mergeLinkChanges(element.children, options) },
    );
  }
  return result;
};
