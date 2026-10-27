/**
 * The model's operations (spec §7, §8, AI_WORKFLOW.md): read from its
 * `propose_changes` calls and validated against the projected page and the
 * site profile. Tool-call arguments are not decoded under the schema, so
 * invalid operations are expected: each failure has a code and a concrete
 * message, used for the one repair call (D8) and for warnings.
 *
 * Operations, each with `reason` and `category`:
 *
 *     {"op": "set_page_field",    "field": "description", "value": "..."}
 *     {"op": "edit_block",   "block": "b4", "fields": {"text": "...", "theme": "grey"}}
 *     {"op": "replace_text", "block": "b8", "field": "text", "find": "...", "replace": "..."}
 *     {"op": "insert_block", "after": "b4", "type": "slate", "fields": {"text": "..."}}  (type required)
 *     {"op": "insert_block", "into": "b5", "type": "slate", "fields": {"text": "..."}}
 *     {"op": "delete_block", "block": "b7"}
 *
 * A valid operation comes out normalized: refs resolved to ids, values
 * trimmed, each field with its kind (`richtext`, `string`, `text`,
 * `styling`) and path, unchanged fields dropped (`unchanged` warnings).
 *
 * Inserts in a row (D45): models number the blocks they insert in the
 * same answer like container children ("after": "b22.1" for the block
 * they insert after b22). Such a ref, under a block that is not a
 * container, means "after b22": inserts after one block keep their
 * order, so the result is the row they meant.
 *
 * `replace_text` (D41) changes exact words of one content field (a page
 * field without `block`): `find` must occur once in the field as the
 * model saw it (replace.js), all replacements of a field in a turn are
 * matched against its original text and must not overlap, and a field
 * is changed either by replacements or by `edit_block`/`set_page_field`, not
 * both. The operation comes out as the field's complete new value with
 * every replacement so far (`replacements`), checked like any edit.
 */
import { blockTypeOf, getPath, setPath, storedField } from './profile';
import { locate as locateBlock } from './blocks';
import { indexPage } from './projection';
import {
  isRoundTripSafe,
  isSafeUrl,
  kindsIn,
  parseMarkdown,
  parsePlaceholder,
  placeholderIn,
  sameNodes,
  slateToPlaintext,
} from './markdown';
import escapeRegExp from 'lodash/escapeRegExp';
import { changeOf, restoresOld } from './leftovers';
import { applySpans, closest, locate, overlaps, repeatedEdge } from './replace';

export const TOOL_NAME = 'propose_changes';

export const OPS = [
  'set_page_field',
  'edit_block',
  'replace_text',
  'insert_block',
  // Several new blocks in a row, expanded into inserts at one place
  // before validation (D57)
  'insert_blocks',
  'delete_block',
  'move_block',
];

// Operations whose category is always "structure" (D57): the model's
// label only decides the review's tag, and a wrong one dropped half of a
// new section in an eval run
const STRUCTURAL_OPS = ['insert_block', 'delete_block', 'move_block'];

export const CATEGORIES = [
  'spelling',
  'grammar',
  'style',
  'structure',
  'layout',
  'outdated',
  'accessibility',
  'metadata',
  'translation',
  'other',
];

const plainName = (name) => name.replace(/^_+/, '').toLowerCase();

/**
 * A block type as the model wrote it, resolved to the profile's name:
 * "button" or "Button" for `__button` (D48).
 */
const typeOf = (profile, name) => {
  if (profile.blockTypes?.[name]) return name;
  return (
    Object.keys(profile.blockTypes || {}).find(
      (type) => plainName(type) === plainName(name),
    ) || name
  );
};

// How the prompt shows an empty field (backend ai_edit/prompt.py EMPTY),
// and how it did before: models copy either back as a value, also with
// words after it ("(empty) - Please provide ...", D52)
const EMPTY_SHOWN = /^(?:""|''|\(empty\))/i;

/** Bold, italic, a heading or a list in parsed Markdown (D52). */
const formattingOf = (nodes = [], found = new Set()) => {
  nodes.forEach((node) => {
    if (['strong', 'b'].includes(node.type)) found.add('bold');
    if (['em', 'i'].includes(node.type)) found.add('italic');
    if (/^h[1-6]$/.test(node.type || '')) found.add('heading');
    if (['ul', 'ol'].includes(node.type)) found.add('list');
    if (node.children) formattingOf(node.children, found);
  });
  return found;
};

const PHONE = /\+?\d[\d\s()./-]{5,}\d/g;
const digitsOf = (text) => text.replace(/\D/g, '');

/**
 * Was a new link target given (D48, D52)? A URL must be in the request;
 * an e-mail address or a phone number may also be written on the page
 * (`text`: the page's text, lowercased), as `mailto:`/`tel:`. A
 * placeholder hides its target from the model: any other URL is
 * invented.
 */
const givenTarget = (url, { request, pageText }) => {
  const target = url.trim().toLowerCase();
  if (request.includes(target)) return true;
  const [, scheme, address] = target.match(/^(mailto|tel):(.+)$/) || [];
  if (!scheme) return false;
  if (scheme === 'mailto') {
    return request.includes(address) || pageText.includes(address);
  }
  const wanted = digitsOf(address);
  return (
    wanted.length > 5 &&
    [request, pageText].some((text) =>
      (text.match(PHONE) || []).some((phone) => digitsOf(phone) === wanted),
    )
  );
};

/** All text of the page as projected, lowercased (for `givenTarget`). */
const pageTextOf = (page) => {
  const parts = Object.values(page?.fields || {});
  const walk = (blocks = []) =>
    blocks.forEach((block) => {
      parts.push(...Object.values(block.fields || {}));
      walk(block.children);
    });
  walk(page?.blocks);
  return parts
    .filter((part) => typeof part === 'string')
    .join('\n')
    .toLowerCase();
};

/** Does `text` hold `words` as whole words ("go" is not in "good")? */
const hasWords = (text, words) =>
  new RegExp(`(?<![\\p{L}\\d])${escapeRegExp(words)}(?![\\p{L}\\d])`, 'u').test(
    text,
  );

// A ref under a block, as models number the blocks they insert (D45)
const CHAINED_REF = /^(b\d+(?:\.\d+)*)\.\d+$/;

/**
 * Styling fields of a new block set to their default: no change, and
 * styling only on request (D36); dropped before the check.
 */
const withoutDefaults = (fields, entry) =>
  fields && typeof fields === 'object' && !Array.isArray(fields)
    ? Object.fromEntries(
        Object.entries(fields).filter(
          ([name, value]) =>
            !(
              Object.hasOwn(entry?.styling || {}, name) &&
              String(value) === entry.styling[name].default
            ),
        ),
      )
    : fields;

const failure = (code, message, detail) => ({
  code,
  message,
  ...(detail ? { detail } : {}),
});

// Words too common to show that a setting was asked for
const COMMON_WORDS = new Set(['the', 'and', 'for', 'with', 'link', 'show']);

/**
 * Does the request ask for this styling value or setting (D57)? A value
 * as a word of the request ("align it to the right"); a true/false
 * setting switched on by at least half of the words of its name ("open
 * it in a new tab" for `openLinkInNewTab`).
 */
const askedFor = (name, value, setting, request) => {
  if (setting?.boolean) {
    const words = name
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => word.length > 2 && !COMMON_WORDS.has(word));
    const found = words.filter((word) =>
      new RegExp(`\\b${word}`).test(request),
    );
    return words.length > 0 && found.length * 2 >= words.length;
  }
  const values = value === 'grey' ? ['grey', 'gray'] : [String(value)];
  return values.some((v) =>
    new RegExp(`\\b${escapeRegExp(v.toLowerCase())}\\b`).test(request),
  );
};

// Fields holding a link target: from the request only (D48)
const LINK_KINDS = ['link', 'url'];

/**
 * Fields and settings of a block's schema that it does not show with the
 * proposed data (D53): a teaser's `title` without `overwrite`. `data` is
 * the block as stored (a new block: its initial data). One true/false
 * setting that shows them all is switched on with them (what the model
 * meant; a warning says so); otherwise an error the repair can fix.
 * Without the panel's `visibleFields` (the eval), nothing is checked.
 */
const withVisibleFields = (type, data, fields, entry, env, label) => {
  const { visibleFields } = env;
  if (!visibleFields) return { fields };
  const definition = (name) => entry?.fields?.[name] || entry?.styling?.[name];
  const stored = Object.entries(fields).reduce(
    (block, [, field]) =>
      field.kind === 'richtext'
        ? block
        : setPath(block, field.path, storedField(field, field.value)),
    data || {},
  );
  const visible = visibleFields(type, stored);
  if (!visible) return { fields };
  const hidden = Object.keys(fields).filter(
    (name) => definition(name)?.fromSchema && !visible.has(name),
  );
  if (!hidden.length) return { fields };
  const reveals = Object.entries(entry?.styling || {}).filter(
    ([name, setting]) => {
      if (!setting.fromSchema || !setting.boolean) return false;
      if (Object.hasOwn(fields, name)) return false;
      if (getPath(stored, setting.path) === true) return false;
      const shown = visibleFields(type, setPath(stored, setting.path, true));
      return !!shown && hidden.every((field) => shown.has(field));
    },
  );
  if (reveals.length === 1) {
    const [name, setting] = reveals[0];
    return {
      fields: {
        ...fields,
        [name]: {
          kind: 'styling',
          path: setting.path,
          value: 'true',
          boolean: true,
        },
      },
      added: name,
      hidden,
    };
  }
  const list = hidden.map((name) => `"${name}"`).join(', ');
  return {
    error: failure(
      'hidden_field',
      `${label}: ${list} ${hidden.length > 1 ? 'are' : 'is'} not used with this block's settings${
        reveals.length
          ? `; set one of ${reveals.map(([name]) => `"${name}"`).join(', ')} to true as well, or leave it out`
          : '; leave it out'
      }.`,
    ),
  };
};

// Failures a repair call cannot fix: what the model wants is not possible
// here (an image inserted, a read-only block or a locked field edited, a
// full container). They are dropped without asking again; a browser test's
// repair call spent its whole answer on one of them and returned nothing.
const NOT_REPAIRABLE = new Set([
  'not_insertable',
  'readonly_block',
  'locked_field',
  'container_full',
  'not_allowed_here',
  'field_elsewhere',
  'required_block',
  // The user did not give it: the harness asks (D57), never a repair
  // that invites the model to invent it (D55)
  'missing_field',
  // A required field or a text cannot be emptied (D57)
  'not_clearable',
]);

/** Can a repair call fix this failed operation? */
export const isRepairable = ({ errors }) =>
  errors.every((error) => !NOT_REPAIRABLE.has(error.code));

/** A `propose_changes` call, as the history and the repair repeat it. */
export const proposeCall = (id, args) => ({
  id,
  type: 'function',
  function: { name: TOOL_NAME, arguments: JSON.stringify(args) },
});

export const argumentsOf = (call) => {
  const raw = call?.function?.arguments;
  if (typeof raw !== 'string')
    return raw && typeof raw === 'object' ? raw : null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const isObject = (value) =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * An operation as the model meant it (D48): small models put keys in the
 * wrong place, consistently. `type` written inside `fields` belongs to
 * the insert; a `fields` object nested in `fields` is merged into it;
 * `category` and `reason` given once for the whole call apply to the
 * operations that have none.
 */
export const normalized = (raw, call) => {
  if (!isObject(raw)) return raw;
  let result = { ...raw };
  // The old name of the page-level operation (D51)
  if (result.op === 'set_field') result.op = 'set_page_field';
  if (isObject(result.fields)) {
    let fields = { ...result.fields };
    if (isObject(fields.fields)) {
      const { fields: inner, ...outer } = fields;
      fields = { ...outer, ...inner };
    }
    if (
      result.op === 'insert_block' &&
      typeof fields.type === 'string' &&
      !result.type
    ) {
      const { type, ...rest } = fields;
      result = { ...result, type };
      fields = rest;
    }
    result.fields = fields;
  }
  ['category', 'reason'].forEach((key) => {
    if (!result[key] && typeof call?.[key] === 'string') {
      result[key] = call[key];
    }
  });
  return result;
};

/**
 * The operations of the model's tool calls, numbered across calls (the
 * numbers name them in messages), the calls that could not be read, and
 * the calls' `message` for the user (D46).
 */
export const operationsFromToolCalls = (toolCalls = []) => {
  const operations = [];
  const errors = [];
  const messages = [];
  toolCalls.forEach((call) => {
    const name = call?.function?.name;
    if (name !== TOOL_NAME) {
      errors.push(
        failure(
          'unknown_tool',
          `There is no tool "${name}"; use ${TOOL_NAME}.`,
        ),
      );
      return;
    }
    const args = argumentsOf(call);
    if (typeof args?.message === 'string' && args.message.trim()) {
      messages.push(args.message.trim());
    }
    const list = args?.operations;
    if (!Array.isArray(list)) {
      errors.push(
        failure(
          'invalid_call',
          `${TOOL_NAME} takes {"operations": [...]}, a list of operations.`,
        ),
      );
      return;
    }
    list.flatMap(expandList).forEach((raw) =>
      operations.push({
        raw: normalized(raw, args),
        number: operations.length + 1,
        callId: call.id,
      }),
    );
  });
  return { operations, errors, messages };
};

/**
 * Several new blocks in a row (`insert_blocks`, D57) as inserts at one
 * place, which keep their order: the model need not guess the refs of
 * blocks that do not exist yet (an eval run anchored a row on the page's
 * real b37, b38, b39). A malformed list is left to the validator.
 */
export const expandList = (raw) => {
  if (raw?.op !== 'insert_blocks' || !Array.isArray(raw.blocks)) return [raw];
  if (!raw.blocks.length) return [raw];
  const { blocks, ...place } = raw;
  return blocks.map((item) => ({
    ...place,
    op: 'insert_block',
    ...(isObject(item) ? item : {}),
    // The place is the list's
    ...(place.after !== undefined ? { after: place.after } : {}),
    ...(place.into !== undefined ? { into: place.into } : {}),
    reason: (isObject(item) && item.reason) || place.reason,
    category: (isObject(item) && item.category) || place.category,
  }));
};

/** The placeholders (`link:3`) among link URLs that the registry knows. */
const placeholdersIn = (urls, links) =>
  urls
    .map((url) => placeholderIn(url, links))
    .filter(Boolean)
    .map(({ kind, number }) => `${kind}:${number}`);

const countOf = (keys) =>
  keys.reduce(
    (counts, key) => counts.set(key, (counts.get(key) || 0) + 1),
    new Map(),
  );

/**
 * Check one value for a content field. `current` is the field's value now
 * ('' for a new block): its placeholders are the only ones the value may
 * use, each at most as often as it appears there (D9; a link to the same
 * target twice is one placeholder twice). `env` holds the registry
 * (`links`), its placeholder `kinds`, and `unescape`, which reverts the
 * prompt's escaping of tag names the model copied back.
 */
const checkContent = (name, kind, value, current, env) => {
  const { links, kinds, unescape } = env;
  if (typeof value !== 'string') {
    return { error: failure('invalid_value', `"${name}" must be a text.`) };
  }
  const text = unescape(value.trim(), current);
  if (!text) {
    return {
      error: failure(
        'empty_value',
        `"${name}" is empty. Leave out fields you don't change; clearing a field is not possible.`,
      ),
    };
  }
  // The page's way of showing an empty field, copied as a value
  const shownEmpty = text.match(EMPTY_SHOWN);
  if (shownEmpty) {
    return {
      error: failure(
        'empty_value',
        `"${name}" starts with ${shownEmpty[0]}, which is how the page shows an empty field. Write the value, or leave the field out.`,
      ),
    };
  }
  if (['string', 'link', 'url'].includes(kind) && /\n/.test(text)) {
    return {
      error: failure('multiline', `"${name}" must be a single line.`),
    };
  }
  // A link target: a full URL or a path of the site, never a placeholder
  if (
    LINK_KINDS.includes(kind) &&
    (!isSafeUrl(text) || /^[a-z][\w-]*:\d+$/i.test(text))
  ) {
    return {
      error: failure(
        'unsafe_url',
        `"${name}" must be a full https URL or a path of this site (/contact), as the user gave it.`,
      ),
    };
  }
  if (kind !== 'richtext') {
    return { text, unchanged: text === current.trim() };
  }
  // Each text parsed once: nodes and link URLs (a copy of the registry:
  // a new link must not be numbered here)
  const { nodes, urls } = parseMarkdown(text, { ...links });
  const before = parseMarkdown(current, { ...links });
  // An emphasis marker left open ("*Workshop host") is stored as a
  // literal asterisk; escaped ones (\*) are meant. Not checked next to
  // inline code, where asterisks are literal.
  const literalStars = (slateToPlaintext(nodes).match(/\*/g) || []).length;
  const escapedStars = (text.match(/\\\*/g) || []).length;
  if (!text.includes('`') && literalStars > escapedStars) {
    return {
      error: failure(
        'unclosed_marker',
        `"${name}" has an unclosed * or ** marker. Close bold and italic within the paragraph, or write \\* for an asterisk.`,
      ),
    };
  }
  // Markdown that parses to nothing (`---`, an image) would blank the block
  if (!slateToPlaintext(nodes).trim()) {
    return {
      error: failure(
        'empty_value',
        `"${name}" has no text (a rule or an image alone are not stored). Write the text, or leave the field out.`,
      ),
    };
  }
  const allowed = countOf(placeholdersIn(before.urls, links));
  const used = new Map();
  for (const url of urls) {
    const known = placeholderIn(url, links);
    if (known) {
      const key = `${known.kind}:${known.number}`;
      if (!allowed.has(key)) {
        return {
          error: failure(
            'foreign_placeholder',
            `"${name}" uses ${key}, which belongs to another block. Keep each placeholder in its own block.`,
          ),
        };
      }
      used.set(key, (used.get(key) || 0) + 1);
      if (used.get(key) > allowed.get(key)) {
        return {
          error: failure(
            'duplicate_placeholder',
            `"${name}" uses ${key} more often than the block does (${allowed.get(key)}). Don't repeat placeholders.`,
          ),
        };
      }
    } else if (kinds.has(parsePlaceholder(url)?.kind)) {
      return {
        error: failure(
          'unknown_placeholder',
          `"${name}" uses ${url}, which does not exist. Keep the placeholders exactly as they are on the page.`,
        ),
      };
    } else if (!isSafeUrl(url)) {
      return {
        error: failure(
          'unsafe_url',
          `"${name}" links to ${url}. New links may only use https, http, mailto, tel or a relative URL.`,
        ),
      };
    } else if (!givenTarget(url, env)) {
      // Invented, or put in place of a placeholder whose target the
      // model cannot see (D52)
      return {
        error: failure(
          'invented_url',
          `"${name}" links to ${url}, which the user did not give. Keep each [text](link:N) placeholder as it is; a new link needs a URL from the user.`,
        ),
      };
    }
  }
  if (!isRoundTripSafe(nodes, { ...links })) {
    return {
      error: failure(
        'round_trip',
        `"${name}" cannot be stored as written. Use plain Markdown: emphasis that opens and closes in the same paragraph, ## for headings, - or 1. for lists.`,
      ),
    };
  }
  return {
    text,
    // Elements that become blocks (D7): a block that already has several
    // (pasted paragraphs) keeps them all; only a one-element block is
    // split, else any small edit would cut it apart
    elements: before.nodes.length > 1 ? 1 : nodes.length,
    removedPlaceholders: [...allowed].flatMap(([key, count]) =>
      Array(Math.max(0, count - (used.get(key) || 0))).fill(key),
    ),
    // Formatting the text had and lost (D52): a warning in the review
    droppedFormatting: [...formattingOf(before.nodes)].filter(
      (format) => !formattingOf(nodes).has(format),
    ),
    unchanged: sameNodes(nodes, before.nodes),
  };
};

const checkStyling = (name, field, value) => {
  // A setting written as JSON true/false or a number (D53)
  const text =
    typeof value === 'string'
      ? value.trim()
      : typeof value === 'boolean' || typeof value === 'number'
        ? String(value)
        : value;
  if (!field.values.includes(text)) {
    return {
      error: failure(
        'invalid_style',
        `"${name}" must be one of: ${field.values.join(', ')}.`,
      ),
    };
  }
  return { text };
};

/**
 * Check the `fields` of an edit or insert against what the block type
 * offers. `current` holds the current values (content and effective
 * styling; empty for a new block), `locked` the fields pre-flight locked.
 */
const checkFields = (raw, entry, current, locked, env, insert = null) => {
  // A new block may need no fields (a separator; its styling set to the
  // defaults is dropped before): what it needs is checked by the caller
  // (its text, required fields). A browser test's repair message asked
  // for "at least one field", and the model added `theme: default`
  if (
    insert &&
    (raw === undefined ||
      raw === null ||
      (typeof raw === 'object' &&
        !Array.isArray(raw) &&
        !Object.keys(raw).length))
  ) {
    return { fields: {}, unchanged: [], errors: [], removed: [] };
  }
  if (
    !raw ||
    typeof raw !== 'object' ||
    Array.isArray(raw) ||
    !Object.keys(raw).length
  ) {
    // The whole shape: callers read every part (a code review: an
    // edit_block without fields threw and lost the whole turn)
    return {
      fields: {},
      unchanged: [],
      removed: [],
      errors: [
        failure(
          'invalid_fields',
          '"fields" must be an object with at least one field.',
        ),
      ],
    };
  }
  const content = entry?.fields || {};
  const styling = entry?.styling || {};
  const offered = [...Object.keys(content), ...Object.keys(styling)];
  const fields = {};
  const unchanged = [];
  const errors = [];
  const removed = [];
  Object.entries(raw).forEach(([name, value]) => {
    let result;
    // A new block: an empty value is a field the user did not give
    // (D58). A required one is then asked for (missing_field), not
    // repaired: asked to fill a video's empty URL, every repair of an
    // eval case invented one
    if (insert && typeof value === 'string' && !value.trim()) return;
    if (Object.hasOwn(content, name)) {
      if (locked?.[name]) {
        errors.push(
          failure(
            'locked_field',
            `"${name}" of this block cannot be changed by the assistant (its content cannot be represented).`,
          ),
        );
        return;
      }
      const { kind, path, required } = content[name];
      // `null` clears an optional field (D57: "remove the button's
      // link"); a new block has nothing to clear
      if (value === null) {
        if (insert) return;
        if (required || kind === 'richtext') {
          errors.push(
            failure(
              'not_clearable',
              required
                ? `"${name}" is required and cannot be cleared.`
                : `"${name}" cannot be cleared: write its new text, or delete the block.`,
            ),
          );
          return;
        }
        if (!(current.fields?.[name] ?? '')) {
          unchanged.push(name);
          return;
        }
        fields[name] = { kind, path, value: '', cleared: true };
        return;
      }
      // A link target the user did not give is invented (D48), however
      // it is written (a path, a placeholder): left out, the block is
      // kept, the review says the link is missing
      const now = current.fields?.[name] ?? '';
      if (
        LINK_KINDS.includes(kind) &&
        typeof value === 'string' &&
        value.trim() &&
        value.trim() !== now &&
        !env.request.includes(value.trim().toLowerCase())
      ) {
        removed.push(name);
        return;
      }
      result = checkContent(
        name,
        kind,
        value,
        current.fields?.[name] ?? '',
        env,
      );
      if (result.text !== undefined) {
        fields[name] = {
          kind,
          path,
          value: result.text,
          ...(result.elements ? { elements: result.elements } : {}),
          ...(result.removedPlaceholders?.length
            ? { removedPlaceholders: result.removedPlaceholders }
            : {}),
          ...(result.droppedFormatting?.length
            ? { droppedFormatting: result.droppedFormatting }
            : {}),
        };
      }
    } else if (Object.hasOwn(styling, name)) {
      result = checkStyling(name, styling[name], value);
      if (result.text !== undefined) {
        result.unchanged = result.text === current.styling?.[name];
        fields[name] = {
          kind: 'styling',
          path: styling[name].path,
          value: result.text,
          ...(styling[name].boolean ? { boolean: true } : {}),
        };
      }
    } else if (insert) {
      // A new block: the model may have meant another type. Repairable;
      // the types are in <types> (a list here would not scale)
      errors.push(
        failure(
          'unknown_field',
          `A new ${insert} block has no field "${name}"; its fields: ${offered.join(', ') || 'none'}.`,
        ),
      );
      return;
    } else {
      // A field of other block types (alt on a text block) is a wish this
      // block cannot fulfil; another name is likely a typo to repair
      errors.push(
        failure(
          env.fieldNames.has(name) ? 'field_elsewhere' : 'unknown_field',
          `This block has no field "${name}". Its fields: ${offered.join(', ') || 'none'}.`,
        ),
      );
      return;
    }
    if (result.error) errors.push(result.error);
    else if (result.unchanged) {
      unchanged.push(name);
      delete fields[name];
    }
  });
  return { fields, unchanged, errors, removed };
};

// The key of a content field across operations: a block's or the page's
const fieldKey = (id, field) => `${id ?? 'page'}:${field}`;

const conflict = (label, other) =>
  failure(
    'conflict',
    `${label} is already changed by ${other} in this answer. Change a field either with replace_text or by rewriting it, not both.`,
  );

export const describeOperation = (raw) => {
  const target = raw?.block || raw?.after || raw?.into || raw?.field || '';
  return `${raw?.op || 'operation'}${target ? ` ${target}` : ''}`;
};

/** The rules of the container a block goes into, if it is one. */
const containerOf = (containerId, index, profile) => {
  if (!containerId) return null;
  const container = index.byId.get(containerId)?.block;
  return {
    id: containerId,
    rules: blockTypeOf(profile, container?.type)?.container || {},
    count: container?.children?.length || 0,
  };
};

const checkContainer = (container, type, adding, added) => {
  if (!container) return null;
  const { allowed, max } = container.rules;
  if (allowed && !allowed.includes(type)) {
    return failure(
      'not_allowed_here',
      `A ${type} block cannot go into this container. Allowed: ${allowed.join(', ')}.`,
    );
  }
  const total = container.count + (added.get(container.id) || 0) + adding;
  if (max && total > max) {
    return failure(
      'container_full',
      `This container holds at most ${max} blocks; it would get ${total}.`,
    );
  }
  return null;
};

/**
 * `move_block` (D57): a block to the place after another block of the
 * same container (the page or its container); its content is not written
 * again, so it cannot change. Deleting and inserting it again would make
 * the model regenerate the whole block. Required blocks stay in place.
 */
const validateMove = (raw, common, target, context, errors, warnings) => {
  const { index, page } = context;
  const { block } = target;
  const anchorRef = String(raw.after || '').trim();
  const anchor = index.byRef.get(anchorRef);
  if (!anchor) {
    errors.push(
      failure(
        'unknown_block',
        `There is no block ${anchorRef} to move ${block.ref} after.`,
      ),
    );
    return { errors, warnings };
  }
  if (block.required) {
    errors.push(
      failure(
        'required_block',
        `${block.ref} (${block.type}) is required on this page and cannot be moved.`,
      ),
    );
  }
  if (anchor.block.id === block.id || anchor.ancestors.includes(block.id)) {
    errors.push(
      failure(
        'invalid_move',
        `${block.ref} cannot be moved after itself or a block inside it.`,
      ),
    );
  } else if (anchor.parentId !== target.parentId) {
    errors.push(
      failure(
        'not_movable_here',
        `${block.ref} moves among the blocks of ${target.parentId ? 'its container' : 'the page'} only; ${anchorRef} is not one of them.`,
      ),
    );
  }
  if (errors.length) return { errors, warnings };
  const siblings = target.parentId
    ? index.byId.get(target.parentId).block.children
    : page.blocks;
  const at = siblings.findIndex((sibling) => sibling.id === block.id);
  if (siblings[at - 1]?.id === anchor.block.id) {
    warnings.push({
      code: 'unchanged',
      detail: `${block.ref} after ${anchorRef}`,
      number: common.number,
    });
    return { errors, warnings };
  }
  return {
    op: {
      ...common,
      ref: block.ref,
      id: block.id,
      type: block.type,
      parentId: target.parentId,
      anchorRef,
      anchorId: anchor.block.id,
    },
    errors,
    warnings,
  };
};

const validateOne = (operation, context) => {
  const { raw, number } = operation;
  const { index, page, profile, added, categories, ops, env } = context;
  const errors = [];
  const warnings = [];
  if (!raw || typeof raw !== 'object' || !ops.includes(raw.op)) {
    return {
      errors: [
        failure('unknown_op', `"op" must be one of: ${ops.join(', ')}.`),
      ],
      warnings,
    };
  }
  // The category only labels the review row (D48, D57): missing or
  // unknown is "other" (a warning, never an error); inserts, deletes and
  // moves are "structure" whatever the model wrote
  const written = String(raw.category || '')
    .trim()
    .toLowerCase();
  let category = categories.includes(written) ? written : 'other';
  if (written && !categories.includes(written)) {
    warnings.push({ code: 'category_unknown', detail: written, number });
  }
  if (STRUCTURAL_OPS.includes(raw.op)) category = 'structure';
  if (raw.op === 'insert_blocks') {
    errors.push(
      failure(
        'invalid_blocks',
        '"blocks" must be a list of new blocks, each {"type": ..., "fields": {...}}.',
      ),
    );
    return { errors, warnings };
  }
  const common = {
    op: raw.op,
    number,
    callId: operation.callId,
    reason: typeof raw.reason === 'string' ? raw.reason.trim() : '',
    category,
    // A replacement the harness suggests (leftovers.js, D42)
    ...(operation.source ? { source: operation.source } : {}),
  };

  if (raw.op === 'set_page_field') {
    const field = String(raw.field || '').trim();
    // Own keys only: `constructor` must not pass as a field
    const definition = Object.hasOwn(profile.pageFields || {}, field)
      ? profile.pageFields[field]
      : undefined;
    if (!definition) {
      errors.push(
        failure(
          'unknown_field',
          `The page has no field "${field}". Its fields: ${Object.keys(profile.pageFields || {}).join(', ')}.`,
        ),
      );
      return { errors, warnings };
    }
    if (context.replaced.has(fieldKey(null, field))) {
      errors.push(conflict(field, 'replace_text'));
      return { errors, warnings };
    }
    // `null` clears a page field (D57), not the title
    if (raw.value === null) {
      if (field === 'title') {
        errors.push(
          failure(
            'not_clearable',
            'The title is required and cannot be cleared.',
          ),
        );
        return { errors, warnings };
      }
      if (!(page.fields?.[field] ?? '')) {
        warnings.push({ code: 'unchanged', detail: field, number });
        return { errors, warnings };
      }
      return {
        op: {
          ...common,
          field,
          kind: definition.kind,
          value: '',
          cleared: true,
        },
        edited: [fieldKey(null, field)],
        errors,
        warnings,
      };
    }
    const result = checkContent(
      field,
      definition.kind,
      raw.value,
      page.fields?.[field] ?? '',
      env,
    );
    if (result.error) errors.push(result.error);
    if (errors.length) return { errors, warnings };
    if (result.unchanged) {
      warnings.push({ code: 'unchanged', detail: field, number });
      return { errors, warnings };
    }
    return {
      op: { ...common, field, kind: definition.kind, value: result.text },
      edited: [fieldKey(null, field)],
      errors,
      warnings,
    };
  }

  if (raw.op === 'replace_text') {
    return validateReplace(raw, common, context, errors);
  }

  if (raw.op === 'insert_block') {
    const hasAfter = typeof raw.after === 'string' && raw.after;
    const hasInto = typeof raw.into === 'string' && raw.into;
    if (!hasAfter === !hasInto) {
      errors.push(
        failure(
          'invalid_position',
          'insert_block needs either "after" (a block ref) or "into" (a container ref).',
        ),
      );
      return { errors, warnings };
    }
    let anchorRef = (hasAfter ? raw.after : raw.into).trim();
    let anchor = index.byRef.get(anchorRef);
    // "after": "b22.1" for the block inserted after b22 in this answer
    const chained = hasAfter && !anchor && CHAINED_REF.exec(anchorRef);
    const parent = chained && index.byRef.get(chained[1]);
    if (parent && !parent.block.children) {
      warnings.push({
        code: 'chained_ref',
        detail: `${anchorRef} -> after ${chained[1]}`,
        number,
      });
      anchorRef = chained[1];
      anchor = parent;
    }
    if (!anchor) {
      errors.push(
        failure(
          'unknown_block',
          `There is no block ${anchorRef}. New blocks have no ref yet: to insert several blocks in a row, give each one the same "after"; they keep the order of the operations.`,
        ),
      );
      return { errors, warnings };
    }
    if (hasInto && !anchor.block.children) {
      errors.push(
        failure(
          'not_container',
          `${anchorRef} is not a container; use "after".`,
        ),
      );
      return { errors, warnings };
    }
    // Required: fields differ from type to type, a default would turn a
    // button without "type" into a text block with the wrong fields
    if (typeof raw.type !== 'string' || !raw.type.trim()) {
      errors.push(
        failure(
          'missing_type',
          'insert_block needs "type": one of the types marked insertable in <types>.',
        ),
      );
      return { errors, warnings };
    }
    const type = typeOf(profile, raw.type.trim());
    const entry = blockTypeOf(profile, type);
    if (!entry?.insertable) {
      const insertable = Object.entries(profile.blockTypes || {})
        .filter(([, e]) => e.insertable)
        .map(([t]) => t);
      errors.push(
        failure(
          'not_insertable',
          `A ${type} block cannot be created. Types that can: ${insertable.join(', ')}.`,
        ),
      );
      return { errors, warnings };
    }
    const checked = checkFields(
      withoutDefaults(raw.fields, entry),
      entry,
      {},
      {},
      env,
      type,
    );
    errors.push(...checked.errors);
    // Styling and settings nobody asked for stay off a new block (D36 in
    // code, D57): an eval run's button came centered and narrow unasked
    Object.entries(checked.fields || {})
      .filter(
        ([name, field]) =>
          field.kind === 'styling' &&
          !askedFor(name, field.value, entry.styling?.[name], env.request),
      )
      .forEach(([name]) => {
        delete checked.fields[name];
        warnings.push({
          code: 'style_not_requested',
          detail: `new ${type} ${name}`,
          number,
        });
      });
    // A required value the user did not give, taken from the page (D58:
    // a button without a label got "Register now" from the block next to
    // it in half the runs of an eval case): left out, so the user is
    // asked, as for a missing one (D55)
    Object.entries(entry.fields || {})
      .filter(
        ([name, field]) =>
          field.required &&
          field.kind !== 'richtext' &&
          typeof checked.fields?.[name]?.value === 'string',
      )
      .forEach(([name]) => {
        const value = checked.fields[name].value.trim().toLowerCase();
        if (
          value &&
          !hasWords(env.request, value) &&
          hasWords(env.pageText, value)
        ) {
          delete checked.fields[name];
          warnings.push({
            code: 'copied_value',
            detail: `new ${type} ${name}`,
            number,
          });
        }
      });
    // A new block needs its text, and the fields its type requires (a
    // button's label)
    const missing = Object.entries(entry.fields || {})
      .filter(
        ([name, field]) =>
          (field.kind === 'richtext' || field.required) &&
          !checked.fields?.[name],
      )
      .map(([name]) => name);
    if (!checked.errors.length && missing.length) {
      errors.push(
        failure(
          'missing_field',
          // Not repaired: asked to "add it", the model invented a
          // button's label (D55). The harness asks the user (D57)
          `A new ${type} block needs "${missing[0]}", which the user did not give.`,
          { type, field: missing[0] },
        ),
      );
    }
    if (!errors.length && checked.fields) {
      const shown = withVisibleFields(
        type,
        entry.initial,
        checked.fields,
        entry,
        env,
        `new ${type}`,
      );
      if (shown.error) errors.push(shown.error);
      else checked.fields = shown.fields;
      if (shown.added) {
        warnings.push({
          code: 'setting_added',
          detail: `new ${type} ${shown.added} for ${shown.hidden.join(', ')}`,
          number,
        });
      }
    }
    const elements = Math.max(
      1,
      ...Object.values(checked.fields || {}).map(
        (field) => field.elements || 1,
      ),
    );
    const containerId = hasInto ? anchor.block.id : anchor.parentId;
    const container = containerOf(containerId, index, profile);
    const containerError = checkContainer(container, type, elements, added);
    if (containerError) errors.push(containerError);
    if (errors.length) return { errors, warnings };
    checked.removed.forEach((name) =>
      warnings.push({
        code: 'link_not_given',
        detail: `new ${type} ${name}`,
        number,
      }),
    );
    // A link field left empty (not given, or invented and removed)
    const noLink = Object.entries(entry.fields || {}).some(
      ([name, field]) =>
        LINK_KINDS.includes(field.kind) && !checked.fields[name],
    );
    return {
      adds: containerId ? { id: containerId, count: elements } : null,
      op: {
        ...common,
        position: hasInto ? 'into' : 'after',
        anchorRef,
        anchorId: anchor.block.id,
        containerId,
        type,
        fields: checked.fields,
        elements,
        ...(noLink ? { noLink: true } : {}),
      },
      errors,
      warnings,
    };
  }

  // edit_block, delete_block, move_block: a block
  const ref = String(raw.block || '').trim();
  const target = index.byRef.get(ref);
  if (!target) {
    errors.push(failure('unknown_block', `There is no block ${ref}.`));
    return { errors, warnings };
  }
  const { block } = target;

  if (raw.op === 'move_block') {
    return validateMove(raw, common, target, context, errors, warnings);
  }

  if (raw.op === 'delete_block') {
    if (block.required) {
      errors.push(
        failure(
          'required_block',
          `${ref} (${block.type}) is required on this page and cannot be deleted.`,
        ),
      );
    }
    if (errors.length) return { errors, warnings };
    return {
      op: {
        ...common,
        ref,
        id: block.id,
        type: block.type,
        parentId: target.parentId,
      },
      errors,
      warnings,
    };
  }

  // edit_block
  if (block.readonly) {
    errors.push(
      failure(
        'readonly_block',
        `${ref} (${block.type}) has no fields the assistant can change.`,
      ),
    );
    return { errors, warnings };
  }
  const entry = blockTypeOf(profile, block.type);
  const checked = checkFields(raw.fields, entry, block, block.locked, env);
  errors.push(...checked.errors);
  checked.removed.forEach((name) =>
    warnings.push({ code: 'link_not_given', detail: `${ref} ${name}`, number }),
  );
  Object.keys(checked.fields || {})
    .filter((name) => context.replaced.has(fieldKey(block.id, name)))
    .forEach((name) => errors.push(conflict(`${ref} ${name}`, 'replace_text')));
  // A split adds blocks to the container
  const extra = Math.max(
    0,
    ...Object.values(checked.fields || {}).map(
      (field) => (field.elements || 1) - 1,
    ),
  );
  const container = containerOf(target.parentId, index, profile);
  if (extra && container) {
    const containerError = checkContainer(container, block.type, extra, added);
    if (containerError) errors.push(containerError);
  }
  if (!errors.length && Object.keys(checked.fields).length) {
    const shown = withVisibleFields(
      block.type,
      env.formData && locateBlock(env.formData, block.id)?.block,
      checked.fields,
      entry,
      env,
      ref,
    );
    if (shown.error) errors.push(shown.error);
    else checked.fields = shown.fields;
    if (shown.added) {
      warnings.push({
        code: 'setting_added',
        detail: `${ref} ${shown.added} for ${shown.hidden.join(', ')}`,
        number,
      });
    }
  }
  if (errors.length) return { errors, warnings };
  checked.unchanged.forEach((name) =>
    warnings.push({ code: 'unchanged', detail: `${ref} ${name}`, number }),
  );
  if (!Object.keys(checked.fields).length) return { errors, warnings };
  return {
    adds: extra && container ? { id: container.id, count: extra } : null,
    op: {
      ...common,
      ref,
      id: block.id,
      type: block.type,
      parentId: target.parentId,
      fields: checked.fields,
    },
    edited: Object.entries(checked.fields)
      .filter(([, field]) => field.kind !== 'styling')
      .map(([name]) => fieldKey(block.id, name)),
    errors,
    warnings,
  };
};

/**
 * `replace_text` (D41): finds `find` once in the field, applies it with
 * the field's earlier replacements of this turn to the original text,
 * and checks the result like an edit of that field.
 */
const validateReplace = (raw, common, context, errors) => {
  const { index, page, profile, env } = context;
  const { number } = common;
  const warnings = [];
  if (typeof raw.find !== 'string' || !raw.find.trim()) {
    errors.push(
      failure('invalid_find', '"find" must be the exact text to replace.'),
    );
  }
  if (typeof raw.replace !== 'string') {
    errors.push(
      failure(
        'invalid_replace',
        '"replace" must be a text (an empty one removes the found text).',
      ),
    );
  }
  if (errors.length) return { errors, warnings };
  const ref = typeof raw.block === 'string' ? raw.block.trim() : '';
  const field = String(raw.field || (ref ? 'text' : '')).trim();
  let target = null;
  let entry = null;
  let definition;
  if (ref) {
    target = index.byRef.get(ref);
    if (!target) {
      errors.push(failure('unknown_block', `There is no block ${ref}.`));
      return { errors, warnings };
    }
    if (target.block.readonly) {
      errors.push(
        failure(
          'readonly_block',
          `${ref} (${target.block.type}) has no fields the assistant can change.`,
        ),
      );
      return { errors, warnings };
    }
    entry = blockTypeOf(profile, target.block.type);
    definition = Object.hasOwn(entry?.fields || {}, field)
      ? entry.fields[field]
      : undefined;
    if (!definition) {
      errors.push(
        failure(
          'unknown_field',
          `${ref} has no text field "${field}". Its text fields: ${Object.keys(entry?.fields || {}).join(', ') || 'none'}.`,
        ),
      );
      return { errors, warnings };
    }
  } else {
    definition = Object.hasOwn(profile.pageFields || {}, field)
      ? profile.pageFields[field]
      : undefined;
    if (!definition) {
      errors.push(
        failure(
          'unknown_field',
          `Without "block", "field" must be a page field: ${Object.keys(profile.pageFields || {}).join(', ')}.`,
        ),
      );
      return { errors, warnings };
    }
  }
  const block = target?.block;
  const label = ref ? `${ref} ${field}` : field;
  const key = fieldKey(block?.id, field);
  if (context.edited.has(key)) {
    errors.push(conflict(label, ref ? 'edit_block' : 'set_page_field'));
    return { errors, warnings };
  }
  const current = (ref ? block.fields?.[field] : page.fields?.[field]) ?? '';
  const find = env.unescape(raw.find, current);
  const { spans, loose } = locate(current, find);
  if (!spans.length) {
    const near = closest(current, find);
    errors.push(
      failure(
        'not_found',
        `"${raw.find}" does not occur in ${label}.${near ? ` Closest: "${near}".` : ''} Copy "find" exactly from the field.`,
      ),
    );
    return { errors, warnings };
  }
  if (spans.length > 1) {
    errors.push(
      failure(
        'ambiguous',
        `"${raw.find}" occurs ${spans.length} times in ${label}. Include a few words around it so it occurs once; one operation per place.`,
      ),
    );
    return { errors, warnings };
  }
  const [[start, end]] = spans;
  const span = {
    start,
    end,
    find: current.slice(start, end),
    replace: env.unescape(raw.replace, current),
    reason: common.reason,
    category: common.category,
    number,
    loose,
    suggested: common.source === 'check',
  };
  // A repair that brings the old value back (a browser test: the old
  // date reformatted, "for consistency")
  const turnChanges = [...context.replaced.values()]
    .flat()
    .map((other) => changeOf(other.find, other.replace));
  if (!span.suggested && restoresOld(span.replace, turnChanges)) {
    errors.push(
      failure(
        'restores_old',
        `"replace" brings back a value this answer replaces elsewhere ("${span.replace}"). Use the new value, written as at this place.`,
      ),
    );
    return { errors, warnings };
  }
  const earlier = context.replaced.get(key) || [];
  // The same replacement again, e.g. resent in the repair answer
  if (
    earlier.some(
      (other) =>
        other.start === start &&
        other.end === end &&
        other.replace === span.replace,
    )
  ) {
    warnings.push({
      code: 'duplicate',
      detail: `replace_text ${label}`,
      number,
    });
    return { errors, warnings };
  }
  if (overlaps(span, earlier)) {
    errors.push(
      failure(
        'overlap',
        `"${raw.find}" overlaps another replacement in ${label}. Replace each place once.`,
      ),
    );
    return { errors, warnings };
  }
  if (span.find === span.replace) {
    warnings.push({ code: 'unchanged', detail: label, number });
    return { errors, warnings };
  }
  // A valid operation with a wrong result: the new text repeats what is
  // next to the match (browser test: "Friday, April 9, 2027, 2027")
  const repeated = repeatedEdge(current, start, end, span.replace);
  if (repeated) {
    errors.push(
      failure(
        'repeats_text',
        `"replace" repeats "${repeated}", which is already next to "${raw.find}" in ${label}. Include it in "find", or leave it out of "replace".`,
      ),
    );
    return { errors, warnings };
  }
  const replacements = [...earlier, span].sort((a, b) => a.start - b.start);
  const value = applySpans(current, replacements);
  const withReplacements = {
    ...common,
    field,
    // Positions on the field's current text: the leftover search skips
    // them (leftovers.js); copies, the turn's state keeps the originals
    replacements: replacements.map((span) => ({ ...span })),
  };
  const commit = { key, span };
  if (!ref) {
    const result = checkContent(field, definition.kind, value, current, env);
    if (result.error) errors.push(result.error);
    if (errors.length) return { errors, warnings };
    if (result.unchanged) {
      warnings.push({ code: 'unchanged', detail: label, number });
      return { errors, warnings };
    }
    return {
      op: { ...withReplacements, kind: definition.kind, value: result.text },
      replaced: commit,
      errors,
      warnings,
    };
  }
  const checked = checkFields(
    { [field]: value },
    entry,
    block,
    block.locked,
    env,
  );
  errors.push(...checked.errors);
  const checkedField = checked.fields?.[field];
  const extra = Math.max(0, (checkedField?.elements || 1) - 1);
  const container = containerOf(target.parentId, index, profile);
  // The field's split as it is now, minus what its earlier replacements
  // already counted (D57, a code review: each counted the whole split
  // again, so two replacements in a full grid failed)
  const adding = extra - (context.splits.get(key) || 0);
  if (adding > 0 && container) {
    const containerError = checkContainer(
      container,
      block.type,
      adding,
      context.added,
    );
    if (containerError) errors.push(containerError);
  }
  if (errors.length) return { errors, warnings };
  if (!checkedField) {
    warnings.push({ code: 'unchanged', detail: label, number });
    return { errors, warnings };
  }
  return {
    adds: adding && container ? { id: container.id, count: adding } : null,
    split: { key, extra },
    op: {
      ...withReplacements,
      ref,
      id: block.id,
      type: block.type,
      parentId: target.parentId,
      fields: { [field]: checkedField },
    },
    replaced: commit,
    errors,
    warnings,
  };
};

// Tags of the prompt's page format; with the field names of the request,
// they are escaped in page text there (backend ai_edit/prompt.py, D29).
// The backend's list (`GET @ai-edit`) takes precedence.
export const STRUCTURAL_TAGS = ['page', 'block', 'types', 'type', 'summary'];

/** Every field and styling name of the page and the profile. */
const namesOf = (page, profile, tags) => {
  const names = new Set([
    ...tags,
    ...Object.keys(page.fields || {}),
    ...Object.keys(profile.pageFields || {}),
  ]);
  const walk = (blocks) =>
    blocks.forEach((block) => {
      Object.keys(block.fields || {}).forEach((name) => names.add(name));
      Object.keys(block.styling || {}).forEach((name) => names.add(name));
      walk(block.children || []);
    });
  walk(page.blocks || []);
  Object.values(profile.blockTypes || {}).forEach((entry) => {
    Object.keys(entry.fields || {}).forEach((name) => names.add(name));
    Object.keys(entry.styling || {}).forEach((name) => names.add(name));
  });
  return names;
};

/**
 * Undo the prompt's escaping (`&lt;title` for `<title`) in a value the
 * model copied back, unless the current value contains it literally.
 */
const unescaperOf = (names) => {
  const pattern = new RegExp(
    `&lt;(?=/?(?:${[...names].map(escapeRegExp).join('|')})\\b)`,
    'gi',
  );
  return (text, current = '') => {
    pattern.lastIndex = 0;
    if (pattern.test(current)) return text;
    pattern.lastIndex = 0;
    return text.replace(pattern, '<');
  };
};

/** One operation's identity, without numbering and explanations. */
const signatureOf = ({ number, callId, reason, category, ...op }) =>
  JSON.stringify(op);

/**
 * A validator for one turn: the first answer and the repair answer are
 * checked against the same state (D8), so container capacities add up
 * across both and an operation sent again is a duplicate, not a second
 * change. `vocabulary` is the backend's (`GET @ai-edit`): `operations`
 * (only those this harness can apply count), `categories`,
 * `structuralTags`; the lists here are the fallback. Returns
 * `validate(operations)` ->
 * `{valid, invalid, warnings}`: `valid` the normalized operations,
 * `invalid` `[{operation, errors}]` with messages for the repair call,
 * `warnings` the unchanged and duplicate ones.
 */
export const createValidator = ({
  page,
  profile,
  links = {},
  vocabulary = {},
  request = '',
  formData,
  visibleFields,
}) => {
  const context = {
    index: indexPage(page),
    page,
    profile,
    links,
    categories: vocabulary.categories || CATEGORIES,
    ops: (vocabulary.operations || OPS).filter((op) => OPS.includes(op)),
    added: new Map(),
    // Blocks a field's replacements split it into so far (field key ->
    // extra blocks), counted once per field
    splits: new Map(),
    // Content fields changed in this turn: rewritten (edit_block,
    // set_page_field) or by replacements (field key -> spans), D41
    edited: new Set(),
    replaced: new Map(),
    // Built once per turn, used for every field
    env: {
      links,
      // The panel's schema check (D53) and the blocks it looks at
      formData,
      visibleFields,
      kinds: kindsIn(links).add('link'),
      // The editor's request: link targets must come from it (D48), or
      // an address from the page (D52)
      request: request.toLowerCase(),
      pageText: pageTextOf(page),
      fieldNames: new Set(
        Object.values(profile.blockTypes || {}).flatMap((entry) => [
          ...Object.keys(entry.fields || {}),
          ...Object.keys(entry.styling || {}),
        ]),
      ),
      unescape: unescaperOf(
        namesOf(page, profile, vocabulary.structuralTags || STRUCTURAL_TAGS),
      ),
    },
  };
  const seen = new Set();
  return (operations) => {
    const valid = [];
    const invalid = [];
    const warnings = [];
    operations.forEach((operation) => {
      const result = validateOne(operation, context);
      warnings.push(...result.warnings);
      if (result.errors.length) {
        invalid.push({
          operation,
          errors: result.errors.map((e) => ({
            ...e,
            message: `Operation ${operation.number} (${describeOperation(operation.raw)}): ${e.message}`,
          })),
        });
        return;
      }
      if (!result.op) return;
      const signature = signatureOf(result.op);
      if (seen.has(signature)) {
        warnings.push({
          code: 'duplicate',
          detail: describeOperation(operation.raw),
          number: operation.number,
        });
        return;
      }
      seen.add(signature);
      (result.edited || []).forEach((key) => context.edited.add(key));
      if (result.replaced) {
        const { key, span } = result.replaced;
        context.replaced.set(key, [...(context.replaced.get(key) || []), span]);
      }
      if (result.adds) {
        const { id, count } = result.adds;
        context.added.set(id, (context.added.get(id) || 0) + count);
      }
      if (result.split)
        context.splits.set(result.split.key, result.split.extra);
      valid.push(result.op);
    });
    return { valid, invalid, warnings };
  };
};

/** Validate the operations of one answer (see `createValidator`). */
export const validateOperations = (operations, context) =>
  createValidator(context)(operations);

/**
 * The tool result of the repair call (D8): the failed operations as the
 * model sent them, with their errors, and calls that could not be read at
 * all (`callErrors`). The model sends its complete corrected proposal,
 * which replaces the first (D51): it may withdraw a mistake. Operations
 * that are not possible here (`notPossible`) are named so it does not
 * send them again.
 */
export const repairText = (invalid, callErrors = [], notPossible = []) =>
  [
    `Some operations could not be used. Call ${TOOL_NAME} again with the complete corrected proposal: every operation you still want, the ones below corrected. Operations you leave out are withdrawn. The page above does not include your proposed changes yet: it still shows the values you are changing.`,
    ...callErrors.map((e) => `- ${e.message}`),
    ...invalid.map(
      ({ operation, errors }) =>
        `- ${JSON.stringify(operation.raw)}\n${errors.map((e) => `  ${e.message}`).join('\n')}`,
    ),
    ...(notPossible.length
      ? [
          'Left out, not possible on this page (do not send them again):',
          ...notPossible.map(
            ({ errors }) => `- ${errors.map((e) => e.message).join(' ')}`,
          ),
        ]
      : []),
  ].join('\n');
