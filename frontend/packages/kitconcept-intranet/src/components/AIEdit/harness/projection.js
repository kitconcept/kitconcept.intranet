/**
 * The page as the model sees it (spec §5 steps 1–2, §6, AI_WORKFLOW.md),
 * built from the live form data and the site profile. This is the `page`
 * and `block_types` of the request; the backend renders it into the prompt.
 *
 *     page: {
 *       fields: {title: '...', description: ''},
 *       blocks: [{
 *         id, ref: 'b5', type: 'gridBlock',
 *         fields: {...}, styling: {theme: 'default'},
 *         readonly: false, selected: false,
 *         required?: true,                 // cannot be deleted (Volto)
 *         locked?: {text: 'round_trip'},   // pre-flight failures
 *         description?: '...',             // types without content fields
 *         hidden?: true,                   // content not shown (a table)
 *         children?: [...],                // containers
 *       }],
 *     }
 *
 * Content fields come from the profile's allowlist; a missing one is ''
 * (shown as `""`), rich text is Markdown. Styling fields carry their
 * effective value. With `visibleFields` (the panel's, D53), fields and
 * settings taken from a block's schema show only where the schema shows
 * them for the block's data (a teaser's `title` only with `overwrite`). Pre-flight: a rich text that does not survive the
 * Markdown round trip is locked; the block's other fields stay editable.
 */
import { assignRefs } from './refs';
import { blockTypeOf, getPath, shownField, stylingOf } from './profile';
import { isRoundTripSafe, slateToMarkdown } from './markdown';

// Fields that commonly hold a block's visible text, for the description of
// blocks without content fields
const TEXT_FIELDS = ['plaintext', 'title', 'headline', 'description', 'alt'];
const DESCRIPTION_LENGTH = 300;

// Keys that are not a block's content: type, styling, container structure
const NOT_CONTENT = ['@type', 'styles', 'theme', 'blocks', 'blocks_layout'];

const hasValue = (value) =>
  Array.isArray(value)
    ? value.length > 0
    : value && typeof value === 'object'
      ? Object.keys(value).length > 0
      : value !== undefined &&
        value !== null &&
        value !== '' &&
        value !== false;

/**
 * Has the block content the projection does not show? A type without
 * content fields and without a description (a table): shown blank, the
 * model took it for empty and proposed deleting it.
 */
const hiddenContent = (block) =>
  Object.entries(block || {}).some(
    ([key, value]) => !NOT_CONTENT.includes(key) && hasValue(value),
  );

const describe = (block) =>
  (
    TEXT_FIELDS.map((field) => block?.[field]).find(
      (value) => typeof value === 'string' && value.trim(),
    ) || ''
  )
    .trim()
    .slice(0, DESCRIPTION_LENGTH);

const isContainer = (block) =>
  !!block?.blocks && Array.isArray(block?.blocks_layout?.items);

/** The content fields of a block, and the ones pre-flight locks. */
const contentFields = (block, entry, links, shows) => {
  const fields = {};
  const locked = {};
  Object.entries(entry?.fields || {}).forEach(([name, field]) => {
    if (!shows(name, field)) return;
    const raw = getPath(block, field.path);
    if (field.kind === 'richtext') {
      const value = Array.isArray(raw) ? raw : [];
      const markdown = slateToMarkdown(value, links);
      fields[name] = markdown;
      if (!isRoundTripSafe(value, links, markdown)) locked[name] = 'round_trip';
    } else {
      fields[name] = shownField(field, raw);
    }
  });
  return { fields, locked };
};

const projectBlock = (id, block, context) => {
  const type = block?.['@type'] || '';
  const entry = blockTypeOf(context.profile, type);
  const visible = context.visibleFields?.(type, block);
  const shows = (name, field) =>
    !(visible && field?.fromSchema && !visible.has(name));
  const { fields, locked } = contentFields(block, entry, context.links, shows);
  const styling = Object.fromEntries(
    Object.entries(stylingOf(context.profile, block)).filter(([name]) =>
      shows(name, entry?.styling?.[name]),
    ),
  );
  // Volto's locks: a read-only block shows its view only; a required one
  // (its own flag, else the site's `requiredBlocks`) cannot be deleted.
  // Event pages have one (eventMetadata, required and fixed).
  const editable =
    !block?.readOnly &&
    (Object.keys(fields).some((name) => !locked[name]) ||
      Object.keys(styling).length > 0);
  const required =
    block?.required === true ||
    (block?.required !== false &&
      !!context.profile.requiredBlocks?.includes(type));
  const projected = {
    id,
    type,
    fields,
    styling,
    readonly: !editable,
    selected: context.selected.has(id),
  };
  if (Object.keys(locked).length) projected.locked = locked;
  if (required) projected.required = true;
  if (!entry?.fields) projected.description = describe(block);
  if (
    !Object.keys(fields).length &&
    !projected.description &&
    !isContainer(block) &&
    hiddenContent(block)
  ) {
    projected.hidden = true;
  }
  if (isContainer(block)) projected.children = projectBlocks(block, context);
  return projected;
};

const projectBlocks = (container, context) =>
  (container?.blocks_layout?.items || [])
    .filter((id) => container.blocks?.[id])
    .map((id) => projectBlock(id, container.blocks[id], context));

/**
 * The page for the request. `links` is the conversation's placeholder
 * registry (extended here), `refs` its block refs, `selected` the ids of
 * the blocks selected in the editor. Returns the page and the extended
 * refs.
 */
export const projectPage = ({
  formData,
  profile,
  links = {},
  refs = {},
  selected = [],
  visibleFields,
}) => {
  const context = {
    profile,
    links,
    selected: new Set(selected),
    visibleFields,
  };
  const fields = Object.fromEntries(
    Object.keys(profile?.pageFields || {}).map((name) => [
      name,
      typeof formData?.[name] === 'string' ? formData[name] : '',
    ]),
  );
  const assigned = assignRefs(projectBlocks(formData, context), refs);
  return { page: { fields, blocks: assigned.blocks }, refs: assigned.refs };
};

const typesOf = (blocks, types = new Set()) => {
  blocks.forEach((block) => {
    types.add(block.type);
    if (block.children) typesOf(block.children, types);
  });
  return types;
};

/**
 * The block types the prompt describes (D32): every type on the page and
 * every insertable type, with its content fields, styling options and
 * whether it can be inserted. `required`: the fields a new block must
 * have (its text, a button's label, a video's URL); the prompt marks them,
 * every other field is optional (D54). Types the profile does not know are left out
 * (their blocks are described, read-only).
 */
export const blockTypesForRequest = (profile, page) => {
  const types = typesOf(page.blocks);
  Object.entries(profile?.blockTypes || {}).forEach(([type, entry]) => {
    if (entry.insertable) types.add(type);
  });
  return Object.fromEntries(
    [...types]
      .map((type) => [type, blockTypeOf(profile, type)])
      .filter(([, entry]) => entry && (entry.fields || entry.styling))
      .map(([type, entry]) => [
        type,
        {
          fields: Object.keys(entry.fields || {}),
          required: Object.entries(entry.fields || {})
            .filter(([, field]) => field.required || field.kind === 'richtext')
            .map(([name]) => name),
          styling: Object.fromEntries(
            Object.entries(entry.styling || {}).map(([name, field]) => [
              name,
              field.values,
            ]),
          ),
          insertable: !!entry.insertable,
        },
      ]),
  );
};

/**
 * Look-ups on a projected page: `byRef` and `byId` map to
 * `{block, parentId, ancestors}` (`parentId` null at the top level,
 * `ancestors` the ids of the containers around the block, outermost
 * first); `count` is the number of blocks, nested ones included.
 */
export const indexPage = (page) => {
  const byRef = new Map();
  const byId = new Map();
  const walk = (blocks, ancestors) =>
    blocks.forEach((block) => {
      const entry = {
        block,
        parentId: ancestors[ancestors.length - 1] ?? null,
        ancestors,
      };
      byRef.set(block.ref, entry);
      byId.set(block.id, entry);
      if (block.children) walk(block.children, [...ancestors, block.id]);
    });
  walk(page.blocks, []);
  return { byRef, byId, count: byId.size };
};
