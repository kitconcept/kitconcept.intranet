/**
 * Changes: the unit of review (spec §7–§9, D35, AI_WORKFLOW.md). Valid
 * operations (operations.js) become one change per field, insert or
 * delete; each is selected, checked for staleness and applied on its own.
 *
 * - Superseding (D27, D34): per target and field. A later change of the
 *   same field replaces an earlier one; a `delete_block` conflicts with
 *   every change of its block and of the blocks inside it, whichever comes
 *   later wins. `replace_text` operations of one field (D41) are one
 *   change: each carries all replacements so far, so the last one stands
 *   for all of them (not reported as superseded).
 * - An image's alt text starts unselected and flagged (D40): the model
 *   cannot see the image, so a text it writes describing it is a guess;
 *   the editor may still want one ("set the alt to the speaker's name").
 * - A delete of a block whose content the model could not see (a table)
 *   is flagged: the model's reason ("it is empty") may be wrong.
 * - A rewrite that keeps little of a longer text is flagged
 *   (`replacesMostText`): a model describing the change ("March 18 →
 *   April 9") instead of writing the new text would wipe the block.
 *   Measured on the field's whole text, whether rewritten or replaced
 *   (a `replace_text` whose `find` is the whole text, D52).
 * - A rich text that loses bold, italic, a heading or a list is flagged
 *   (`dropsFormatting`, D52).
 * - Risky edits start unselected (D57): one that removes a link, loses
 *   formatting, splits a block or replaces most of a longer text. With
 *   deletes they are marked `confirm`: unselected so the editor confirms
 *   them, not because they are likely wrong (an alt text, a page field
 *   equal to a block field). The eval's "what lands" applies them.
 * - A new block at the end of the page is flagged (`atEnd`, D57): with
 *   no place named and nothing selected, that is where it goes.
 * - Moves (D57) are their own changes (`move`): the block keeps its
 *   content and identity; a delete of it supersedes them.
 * - Categories: styling fields are always `layout` (D35).
 * - Staleness (D30, D34): only the fields a change touches count; a delete
 *   is stale when anything in its block changed; an insert when there is
 *   no place left or its container is full.
 * - Apply: immutable, minimal (untouched blocks and keys keep identity and
 *   order). Styling changes go first, so blocks a text split creates take
 *   the block's styling after applying (D35). New blocks find their place
 *   where their anchor was when it is gone (spec §8).
 *
 * A change:
 *
 *     {key, kind: 'page_field' | 'block_field' | 'insert' | 'delete',
 *      number, label, reason, category, selected, flags, ...}
 */
import isEqual from 'lodash/isEqual';
import {
  blockTypeOf,
  getPath,
  setPath,
  shownStyling,
  storedField,
} from './profile';
import { indexPage } from './projection';
import { markdownToSlate, slateToPlaintext } from './markdown';
import {
  containerAt,
  insertBlocks,
  locate,
  removeBlock,
  replaceBlock,
} from './blocks';

// Share of the page's blocks a single answer may delete before the review
// warns (D20)
export const MASS_DELETION_SHARE = 0.25;

const subtreeSize = (block) =>
  1 +
  (block?.children || []).reduce((sum, child) => sum + subtreeSize(child), 0);

const flagsOf = (flags) =>
  Object.fromEntries(
    Object.entries(flags).filter(
      ([, value]) => value && (!Array.isArray(value) || value.length),
    ),
  );

// The field of an image's alternative text (Volto's image block, VLT)
const ALT_FIELD = 'alt';

// Below this many words a rewrite is not flagged; a text keeping less
// than this share of its words, at less than half its length, is
const MIN_FLAGGED_WORDS = 12;
const KEPT_SHARE = 0.3;

const wordsOf = (text) =>
  String(text || '')
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) || [];

/** Does `after` replace most of a longer `before`? */
export const replacesMostText = (before, after) => {
  const old = wordsOf(before);
  if (old.length < MIN_FLAGGED_WORDS) return false;
  const kept = new Set(wordsOf(after));
  const share = old.filter((word) => kept.has(word)).length / old.length;
  return (
    share < KEPT_SHARE &&
    String(after || '').length < String(before || '').length / 2
  );
};

/** The replacements of a `replace_text` change, for review and history. */
const replacementsOf = (op) => ({
  replacements: op.replacements,
  reason: [
    ...new Set(op.replacements.map((r) => r.reason).filter(Boolean)),
  ].join(' '),
});

/** The changes of one valid operation. */
const changesOf = (op, index, page) => {
  // `opCategory`: the operation's own category, for the history (a styling
  // change's category is always `layout`)
  const common = {
    number: op.number,
    reason: op.reason,
    opCategory: op.category,
    selected: true,
  };
  const replaced = op.op === 'replace_text' ? replacementsOf(op) : null;
  if (op.op === 'set_page_field' || (replaced && !op.id)) {
    const before = page?.fields?.[op.field];
    return [
      {
        ...common,
        ...replaced,
        key: `page:${op.field}`,
        kind: 'page_field',
        field: op.field,
        fieldKind: op.kind,
        value: op.value,
        ...(op.cleared ? { cleared: true } : {}),
        label: op.field,
        category: op.category,
        flags: flagsOf({
          replacesMostText:
            op.category !== 'translation' && replacesMostText(before, op.value),
        }),
      },
    ];
  }
  if (op.op === 'edit_block' || replaced) {
    const { block } = index.byId.get(op.id);
    return Object.entries(op.fields).map(([name, field]) => ({
      ...common,
      ...replaced,
      ...(name === ALT_FIELD ? { selected: false } : {}),
      key: `block:${op.id}:${name}`,
      kind: 'block_field',
      id: op.id,
      ref: op.ref,
      type: op.type,
      field: name,
      fieldKind: field.kind,
      path: field.path,
      value: field.value,
      // A true/false setting is stored as a boolean (D53)
      ...(field.boolean ? { boolean: true } : {}),
      // Set to null by the model: shown and stored empty (D57)
      ...(field.cleared ? { cleared: true } : {}),
      before:
        field.kind === 'styling' ? block.styling[name] : block.fields[name],
      label: `${op.ref} ${name}`,
      // `layout` is styling (D35) and nothing else: a removed link
      // labelled layout counted as an unrequested styling change (D58)
      category:
        field.kind === 'styling'
          ? 'layout'
          : op.category === 'layout'
            ? 'other'
            : op.category,
      flags: flagsOf({
        removesPlaceholders: field.removedPlaceholders,
        dropsFormatting: field.droppedFormatting,
        splitsInto: field.elements > 1 && field.elements,
        // Translations rewrite every word on purpose
        replacesMostText:
          field.kind !== 'styling' &&
          op.category !== 'translation' &&
          replacesMostText(block.fields[name], field.value),
        writesAltText: name === ALT_FIELD,
      }),
    }));
  }
  if (op.op === 'insert_block') {
    return [
      {
        ...common,
        key: `insert:${op.number}`,
        kind: 'insert',
        type: op.type,
        position: op.position,
        anchorId: op.anchorId,
        anchorRef: op.anchorRef,
        containerId: op.containerId,
        fields: op.fields,
        // How many blocks it creates (one per element of its text)
        blocks: op.elements,
        label: `new ${op.type} ${op.position} ${op.anchorRef}`,
        category: op.category,
        flags: flagsOf({
          splitsInto: op.elements > 1 && op.elements,
          // A button without its target (D48)
          noLink: op.noLink,
          // At the end of the page: where a new block goes when no
          // place is named and nothing is selected (D57)
          atEnd:
            op.position === 'after' &&
            !op.containerId &&
            page?.blocks?.at(-1)?.id === op.anchorId,
        }),
      },
    ];
  }
  if (op.op === 'move_block') {
    return [
      {
        ...common,
        key: `move:${op.id}`,
        kind: 'move',
        id: op.id,
        ref: op.ref,
        type: op.type,
        anchorId: op.anchorId,
        anchorRef: op.anchorRef,
        parentId: op.parentId,
        label: `${op.ref} (moved after ${op.anchorRef})`,
        category: op.category,
        flags: {},
      },
    ];
  }
  // delete_block
  const { block } = index.byId.get(op.id);
  const inside = subtreeSize(block) - 1;
  return [
    {
      ...common,
      key: `block:${op.id}`,
      kind: 'delete',
      id: op.id,
      ref: op.ref,
      type: op.type,
      label: op.ref,
      category: op.category,
      // Deletes start unselected (D20), for the editor to confirm
      selected: false,
      confirm: true,
      flags: flagsOf({
        deletesNonText: !('text' in block.fields),
        deletesHidden: !!block.hidden,
        deletesContainerChild: !!op.parentId,
        deletesContainer: block.children ? { blocks: inside } : false,
      }),
    },
  ];
};

/**
 * Review changes of valid operations, in order, superseded ones removed.
 * Returns `{changes, warnings}`; a `superseded` warning names the replaced
 * change (`detail`) and the one that replaced it (`by`).
 */
export const toChanges = (operations, { page }) => {
  const index = indexPage(page);
  const inSubtree = (rootId, id) =>
    id === rootId || !!index.byId.get(id)?.ancestors.includes(rootId);
  // The blocks a change acts on, for conflicts with deletes
  const touched = (change) => {
    if (change.kind === 'page_field') return [];
    if (change.kind !== 'insert') return [change.id];
    if (change.position === 'into') return [change.anchorId];
    return change.containerId ? [change.containerId] : [];
  };
  let changes = [];
  const warnings = [];
  const supersede = (replaces, by) => {
    changes = changes.filter((earlier) => {
      if (!replaces(earlier)) return true;
      warnings.push({
        code: 'superseded',
        detail: earlier.label,
        by: by.label,
        number: earlier.number,
      });
      return false;
    });
  };
  operations
    .flatMap((op) => changesOf(op, index, page))
    .forEach((change) => {
      // The field's replacements so far are in this change (D41)
      if (change.replacements) {
        changes = changes.filter(
          (earlier) => !(earlier.replacements && earlier.key === change.key),
        );
      }
      if (change.kind === 'delete') {
        supersede(
          (earlier) => touched(earlier).some((id) => inSubtree(change.id, id)),
          change,
        );
      } else {
        supersede(
          (earlier) =>
            (change.kind !== 'insert' && earlier.key === change.key) ||
            (earlier.kind === 'delete' &&
              touched(change).some((id) => inSubtree(earlier.id, id))),
          change,
        );
      }
      changes.push(change);
    });
  return { changes: withRiskSelection(withPageFieldCheck(changes)), warnings };
};

// Flags of edits that start unselected, to be confirmed (D57)
const RISK_FLAGS = [
  'removesPlaceholders',
  'dropsFormatting',
  'splitsInto',
  'replacesMostText',
];

/**
 * Risky edits start unselected (D57): easy to select when meant, while
 * applying one unseen can lose a link, formatting or most of a text.
 */
const withRiskSelection = (changes) =>
  changes.map((change) =>
    (change.kind === 'block_field' || change.kind === 'page_field') &&
    RISK_FLAGS.some((flag) => change.flags?.[flag])
      ? { ...change, selected: false, confirm: true }
      : change,
  );

/** The text values a block change sets (content fields, not styling). */
const blockValues = (change) => {
  if (change.kind === 'block_field' && change.fieldKind !== 'styling') {
    return [change.value];
  }
  if (change.kind === 'insert') {
    return Object.values(change.fields)
      .filter((field) => field.kind !== 'styling')
      .map((field) => field.value);
  }
  return [];
};

/**
 * A page field set to the same value as a block field of the same answer
 * is likely meant for the block (a browser test: the new button's title
 * also sent as the page's title). Flagged, and it starts unselected (D51).
 */
const withPageFieldCheck = (changes) => {
  const values = new Map();
  changes.forEach((change) =>
    blockValues(change).forEach((value) => {
      const key = String(value).trim();
      if (key && !values.has(key)) values.set(key, change.label);
    }),
  );
  return changes.map((change) => {
    const block =
      change.kind === 'page_field' && values.get(String(change.value).trim());
    return block
      ? {
          ...change,
          selected: false,
          flags: { ...change.flags, sameAsBlock: block },
        }
      : change;
  });
};

/**
 * Do the deletes of an answer cover a large share of the page (D20)?
 * Blocks inside deleted containers count.
 */
export const isMassDeletion = (changes, page) => {
  const index = indexPage(page);
  const deleted = changes
    .filter((change) => change.kind === 'delete')
    .reduce(
      (sum, change) => sum + subtreeSize(index.byId.get(change.id)?.block),
      0,
    );
  return index.count > 0 && deleted / index.count >= MASS_DELETION_SHARE;
};

// Placement of new blocks

/**
 * The blocks directly behind the anchor that earlier changes put there (a
 * split of the anchor, earlier inserts after it): new blocks go after
 * them, so inserts at one place keep their order.
 */
const groupOf = (created, anchor) =>
  new Set(
    Object.values(created)
      .filter((entry) => entry.anchor === anchor)
      .flatMap((entry) => entry.ids),
  );

const capacityOk = (data, path, adding, profile) => {
  if (!path.length) return true;
  const container = containerAt(data, path);
  const max = blockTypeOf(profile, container?.['@type'])?.container?.max;
  return !max || (container.blocks_layout?.items?.length || 0) + adding <= max;
};

/**
 * Where a block that is gone was: after its nearest earlier sibling that
 * still exists, else first in its container; when the container is gone
 * too, where the container was (spec §8). "Earlier" is taken from the
 * page the proposal was made for (`base`).
 */
const placeWhere = (goneId, data, base, created) => {
  const was = locate(base, goneId);
  if (!was) return null;
  const containerId = was.path[was.path.length - 1];
  const container = containerId ? locate(data, containerId) : null;
  if (containerId && !container) {
    return placeWhere(containerId, data, base, created);
  }
  const path = container ? [...container.path, containerId] : [];
  const items = containerAt(data, path)?.blocks_layout?.items || [];
  const sibling = was.container.blocks_layout.items
    .slice(0, was.index)
    .reverse()
    .find((id) => items.includes(id));
  if (sibling) return placeAfter(sibling, data, base, created);
  return { path, index: 0 };
};

function placeAfter(anchorId, data, base, created) {
  const found = locate(data, anchorId);
  if (!found) return placeWhere(anchorId, data, base, created);
  const items = found.container.blocks_layout.items;
  const group = new Set([
    ...groupOf(created, `split:${anchorId}`),
    ...groupOf(created, `after:${anchorId}`),
  ]);
  let index = found.index;
  while (group.has(items[index + 1])) index += 1;
  return { path: found.path, index: index + 1 };
}

const placeInto = (containerId, data, base, created) => {
  const found = locate(data, containerId);
  if (!found) return placeWhere(containerId, data, base, created);
  const path = [...found.path, containerId];
  const items = containerAt(data, path).blocks_layout?.items || [];
  const group = groupOf(created, `into:${containerId}`);
  let index = 0;
  while (group.has(items[index])) index += 1;
  return { path, index };
};

const placementOf = (change, data, base, created) =>
  change.position === 'into'
    ? placeInto(change.anchorId, data, base, created)
    : placeAfter(change.anchorId, data, base, created);

// Staleness

/**
 * A field's value as it shows: styling fields fall back to their default
 * when unset. Volto's block sidebar (`InlineForm`) writes schema defaults
 * into a block when it mounts, so selecting a block turns an unset
 * `theme` into `'default'` without anything visible changing.
 */
const shownValue = (block, field) =>
  shownStyling(field, getPath(block, field.path));

/**
 * What the model and the editor can see of a block and the blocks inside
 * it: the profile's content fields, effective styling, nesting. Data the
 * profile does not know (written defaults, internal keys) is left out.
 */
const visibleState = (block, profile) => {
  const entry = blockTypeOf(profile, block?.['@type']);
  const items = block?.blocks_layout?.items;
  return {
    type: block?.['@type'],
    fields: Object.fromEntries(
      Object.entries(entry?.fields || {}).map(([name, field]) => [
        name,
        getPath(block, field.path),
      ]),
    ),
    styling: Object.fromEntries(
      Object.entries(entry?.styling || {}).map(([name, field]) => [
        name,
        shownValue(block, field),
      ]),
    ),
    // Content without a profile entry still counts, as stored
    ...(entry ? {} : { data: block }),
    ...(Array.isArray(items)
      ? {
          children: items.map((id) => [
            id,
            visibleState(block.blocks?.[id], profile),
          ]),
        }
      : {}),
  };
};

/**
 * Is a change stale on `formData` (D30)? `baseFormData` is the form the
 * proposal was made for; `created` the blocks earlier applied changes
 * created; `profile` for effective values and container capacities.
 * Values are compared as they show, so written defaults don't count.
 */
export const isStale = (
  change,
  formData,
  baseFormData,
  { created = {}, profile } = {},
) => {
  if (change.kind === 'page_field') {
    return (
      (formData?.[change.field] ?? '') !== (baseFormData?.[change.field] ?? '')
    );
  }
  if (change.kind === 'insert') {
    const place = placementOf(change, formData, baseFormData, created);
    return (
      !place || !capacityOk(formData, place.path, change.blocks ?? 1, profile)
    );
  }
  const now = locate(formData, change.id);
  const then = locate(baseFormData, change.id);
  if (!now || !then) return true;
  if (change.kind === 'move') {
    // The block and its anchor still side by side in one container
    const anchor = locate(formData, change.anchorId);
    return !anchor || !isEqual(anchor.path, now.path);
  }
  if (change.kind === 'delete') {
    return !isEqual(
      visibleState(now.block, profile),
      visibleState(then.block, profile),
    );
  }
  // A split adds blocks to the container: it must still have room
  const extra = (change.flags?.splitsInto || 1) - 1;
  if (extra && !capacityOk(formData, now.path, extra, profile)) return true;
  const field =
    change.fieldKind === 'styling'
      ? blockTypeOf(profile, now.block['@type'])?.styling?.[change.field]
      : null;
  if (field) {
    return shownValue(now.block, field) !== shownValue(then.block, field);
  }
  return !isEqual(
    getPath(now.block, change.path),
    getPath(then.block, change.path),
  );
};

// Apply

/** A rich text value as stored: one element, with its `plaintext`. */
const withNodes = (block, path, nodes) => {
  const updated = setPath(block, path, nodes);
  return path === 'value'
    ? { ...updated, plaintext: slateToPlaintext(nodes) }
    : updated;
};

const withText = (block, path, node) => withNodes(block, path, [node]);

const copyStyling = (target, source, entry) =>
  Object.values(entry?.styling || {}).reduce((block, field) => {
    const value = getPath(source, field.path);
    return value === undefined ? block : setPath(block, field.path, value);
  }, target);

const applyField = (change, data, context) => {
  const found = locate(data, change.id);
  const { block, path } = found;
  if (change.fieldKind !== 'richtext') {
    return {
      data: replaceBlock(
        data,
        path,
        change.id,
        setPath(
          block,
          change.path,
          storedField(
            { kind: change.fieldKind, boolean: change.boolean },
            change.value,
          ),
        ),
      ),
    };
  }
  const nodes = markdownToSlate(change.value, context.links);
  // Not a split (a block that had several elements keeps them, D7): the
  // whole text stays in the block
  if (!change.flags?.splitsInto) {
    return {
      data: replaceBlock(
        data,
        path,
        change.id,
        withNodes(block, change.path, nodes),
      ),
    };
  }
  const [first, ...rest] = nodes;
  const updated = withText(block, change.path, first);
  let result = replaceBlock(data, path, change.id, updated);
  // A split: further elements become blocks of the same type after it,
  // with its styling as it is now (D7, D35)
  const entry = blockTypeOf(context.profile, block['@type']);
  const entries = rest.map((node) => [
    context.newId(),
    copyStyling(
      withText({ '@type': block['@type'] }, change.path, node),
      updated,
      entry,
    ),
  ]);
  result = insertBlocks(result, path, found.index + 1, entries);
  return {
    data: result,
    created: { ids: entries.map(([id]) => id), anchor: `split:${change.id}` },
  };
};

const applyInsert = (change, data, context, place) => {
  const entry = blockTypeOf(context.profile, change.type);
  const fields = Object.entries(change.fields);
  const rich = fields.find(([, field]) => field.kind === 'richtext');
  const nodes = rich ? markdownToSlate(rich[1].value, context.links) : [null];
  const entries = nodes.map((node, position) => {
    const block = fields.reduce(
      (result, [, field]) => {
        if (field.kind === 'richtext')
          return withText(result, field.path, node);
        // Plain fields go to the first block only, styling to all
        if (field.kind !== 'styling' && position > 0) return result;
        return setPath(result, field.path, storedField(field, field.value));
      },
      { ...(entry?.initial || { '@type': change.type }) },
    );
    return [context.newId(), block];
  });
  return {
    data: insertBlocks(data, place.path, place.index, entries),
    created: {
      ids: entries.map(([id]) => id),
      anchor: `${change.position}:${change.anchorId}`,
    },
  };
};

// Styling first (D35); moves before inserts, so a block inserted after a
// moved one follows it to its new place (D57)
const rank = (change) => {
  if (change.kind === 'block_field' && change.fieldKind === 'styling') {
    return 0;
  }
  return change.kind === 'move' ? 1 : 2;
};

/** A block to the place after its anchor, in their container (D57). */
const applyMove = (change, data) => {
  const found = locate(data, change.id);
  const removed = removeBlock(data, found.path, change.id);
  const anchor = locate(removed, change.anchorId);
  return insertBlocks(removed, anchor.path, anchor.index + 1, [
    [change.id, found.block],
  ]);
};

/**
 * Apply changes to `formData`, in order (styling first). Stale changes
 * are skipped and returned. Returns `{formData, created, skipped}`:
 * `created` maps each applying change's key to `{ids, anchor}` of the
 * blocks it created. `created` in the options holds those of earlier
 * reviews in the conversation; `newId` makes the ids of new blocks (the
 * panel passes Volto's `uuid`; the harness itself has no id generator).
 */
export const applyChanges = (
  changes,
  formData,
  { baseFormData, profile, links = {}, created: before = {}, newId },
) => {
  const context = { profile, links, newId };
  const created = {};
  const skipped = [];
  const data = [...changes]
    .sort((a, b) => rank(a) - rank(b))
    .reduce((current, change) => {
      const all = { ...before, ...created };
      if (isStale(change, current, baseFormData, { created: all, profile })) {
        skipped.push(change);
        return current;
      }
      let result;
      if (change.kind === 'page_field') {
        result = { data: { ...current, [change.field]: change.value } };
      } else if (change.kind === 'block_field') {
        result = applyField(change, current, context);
      } else if (change.kind === 'move') {
        result = { data: applyMove(change, current) };
      } else if (change.kind === 'insert') {
        result = applyInsert(
          change,
          current,
          context,
          placementOf(change, current, baseFormData, all),
        );
      } else {
        const found = locate(current, change.id);
        result = { data: removeBlock(current, found.path, change.id) };
      }
      if (result.created) created[change.key] = result.created;
      return result.data;
    }, formData);
  return { formData: data, created, skipped };
};
