/**
 * Text that refers to a block the proposal deletes (D59): a link to the
 * deleted heading's anchor ("Check out the [parking info](link:3)
 * below"). The prompt asks for these references to be fixed (D52, D58);
 * in every eval run the model saw the reference and left it, citing the
 * request's scope. The harness knows link targets the model cannot see,
 * so it finds them and asks once, in the turn's one extra call.
 */

import { excerpt } from './leftovers';

// The anchor Volto gives a heading (volto-slate's TextBlockView: the
// github-slugger slug of its text, without diacritics; else the block id)
const slugOf = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');

// A heading's text as projected: `## Parking` -> `Parking`
const headingText = (text = '') => {
  const match = /^#{1,6}\s+(.+)$/.exec(String(text).split('\n')[0]);
  return match ? match[1].replace(/[*_`[\]]/g, '').trim() : null;
};

/** Every block of the projected page, nested ones included. */
const blocksIn = (blocks = []) =>
  blocks.flatMap((block) => [block, ...blocksIn(block.children)]);

/** The anchors a block can be linked to: its heading's slug, its id. */
const anchorsOf = (block) => {
  const heading = headingText(block.fields?.text);
  return [heading && slugOf(heading), block.id].filter(Boolean);
};

/**
 * The places that link to a block `operations` delete and that no
 * operation changes: `[{ref, field, placeholder, target, label, excerpt,
 * match}]` (the last three as the review lists places, leftovers.js).
 * `links` is the conversation's placeholder registry (number -> inline
 * node).
 */
export const danglingReferences = ({ operations, page, links = {} }) => {
  const all = blocksIn(page.blocks);
  const byRef = new Map(all.map((block) => [block.ref, block]));
  const deleted = operations
    .filter((op) => op.op === 'delete_block')
    .flatMap((op) => {
      const block = byRef.get(op.ref);
      return block ? blocksIn([block]) : [];
    });
  if (!deleted.length) return [];
  const gone = new Set(deleted.map((block) => block.ref));
  const targetOf = new Map(
    deleted.flatMap((block) =>
      anchorsOf(block).map((anchor) => [anchor, block.ref]),
    ),
  );
  const touched = new Set(
    operations
      .map((op) => `${op.ref}:${op.field || ''}`)
      .concat(
        operations.flatMap((op) =>
          Object.keys(op.fields || {}).map((field) => `${op.ref}:${field}`),
        ),
      ),
  );
  return all
    .filter((block) => !gone.has(block.ref))
    .flatMap((block) =>
      Object.entries(block.fields || {}).flatMap(([field, text]) =>
        typeof text === 'string' && !touched.has(`${block.ref}:${field}`)
          ? [...text.matchAll(/\[[^\]]*\]\(([a-z][\w-]*):(\d+)\)/gi)].flatMap(
              ({ 0: link, 1: kind, 2: number, index }) => {
                const url = links[number]?.data?.url;
                const anchor =
                  typeof url === 'string' && url.startsWith('#')
                    ? decodeURIComponent(url.slice(1))
                    : null;
                return anchor && targetOf.has(anchor)
                  ? [
                      {
                        ref: block.ref,
                        field,
                        placeholder: `${kind}:${number}`,
                        target: targetOf.get(anchor),
                        label: `${block.ref} ${field}`,
                        excerpt: excerpt(text, index, index + link.length),
                        match: link,
                      },
                    ]
                  : [];
              },
            )
          : [],
      ),
    );
};

/** The tool result that asks for them, as the repair's does (D51). */
export const referencesText = (references) =>
  [
    'Some text refers to a block your proposal deletes. Call propose_changes again with the complete proposal: every operation you still want, plus a change of each text below that removes or rewrites the reference, so that what is left reads as whole sentences. The page above does not include your proposed changes yet.',
    ...references.map(
      ({ ref, field, placeholder, target }) =>
        `- ${ref} ${field}: its link (${placeholder}) points to ${target}, which you delete.`,
    ),
  ].join('\n');
