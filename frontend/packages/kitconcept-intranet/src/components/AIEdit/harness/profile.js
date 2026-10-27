/**
 * The site profile (spec §4, D28, AI_WORKFLOW.md): the single description
 * of what the model may see and change. The harness never reads Volto or
 * volto-light-theme configuration; it gets this plain object instead. The
 * panel builds it from the live configuration (profile/buildProfile.js);
 * the eval loads a saved snapshot.
 *
 *     {
 *       version: 1,
 *       charsPerToken: 3,
 *       pageFields: {title: {kind: 'string'}, description: {kind: 'text'}},
 *       blockTypes: {
 *         slate: {
 *           fields: {text: {kind: 'richtext', path: 'value'}},
 *           styling: {theme: {path: 'theme', values: ['default', 'grey'],
 *                             default: 'default'}},
 *           insertable: true,
 *           initial: {'@type': 'slate'},
 *         },
 *         gridBlock: {container: {allowed: ['slate', 'image'], max: 4}},
 *       },
 *     }
 *
 * Field kinds: `richtext` (a slate value, shown as Markdown), `string` (one
 * line), `text` (may span lines), `link` (a link target: shown as its URL
 * or path, stored as Volto's object browser does, `[{'@id': url}]`; a
 * button's `href`), `url` (a URL stored as a plain string: a video's
 * `url`). Paths are dotted (`styles.align:noprefix`). A field with
 * `required: true` must be set when the block is inserted (a button's
 * label).
 *
 * Styling holds VLT's styling fields and the block's settings (D53): a
 * choice or a true/false field of its schema (a heading level, a table's
 * `striped`), shown and checked like styling. A true/false one has
 * `boolean: true` (values `false`, `true`, stored as booleans). Fields and
 * settings taken from the block's schema have `fromSchema: true`: the
 * panel checks them against the schema resolved with the block's data
 * (fields some settings show only, D53).
 */

export const PROFILE_VERSION = 1;

export const FIELD_KINDS = ['richtext', 'string', 'text', 'link', 'url'];

/** A plain field's value as the model sees it (not rich text). */
export const shownField = (field, raw) => {
  if (field.kind === 'link') {
    const target = Array.isArray(raw) ? raw[0]?.['@id'] : raw;
    return typeof target === 'string' ? target : '';
  }
  return typeof raw === 'string' ? raw : '';
};

/**
 * A styling value or setting as it shows: its default when unset, as a
 * name (a true/false setting as `true` or `false`).
 */
export const shownStyling = (field, raw) => {
  const value = raw === undefined || raw === null ? field.default : raw;
  return value === undefined ? undefined : String(value);
};

/** A plain field's value as the block stores it. */
export const storedField = (field, value) => {
  if (field.kind === 'link') return value ? [{ '@id': value }] : [];
  if (field.kind === 'styling' && field.boolean) return value === 'true';
  return value;
};

/** A value at a dotted path, e.g. `styles.align:noprefix`. */
export const getPath = (data, path) =>
  path.split('.').reduce((value, key) => value?.[key], data);

/**
 * `data` with `value` at a dotted path. Immutable; existing keys keep their
 * place (D30: writing one style must not reorder the others).
 */
export const setPath = (data, path, value) => {
  const [key, ...rest] = path.split('.');
  return {
    ...data,
    [key]: rest.length
      ? setPath(data?.[key] || {}, rest.join('.'), value)
      : value,
  };
};

/** The profile entry of a block type, or undefined. */
export const blockTypeOf = (profile, type) =>
  Object.hasOwn(profile?.blockTypes || {}, type)
    ? profile.blockTypes[type]
    : undefined;

/**
 * The effective styling of a block (D25): the stored value, or the default
 * when the field is unset.
 */
export const stylingOf = (profile, block) =>
  Object.fromEntries(
    Object.entries(blockTypeOf(profile, block?.['@type'])?.styling || {}).map(
      ([name, field]) => [
        name,
        shownStyling(field, getPath(block, field.path)),
      ],
    ),
  );

const isStringList = (list) =>
  Array.isArray(list) && list.every((item) => typeof item === 'string');

/**
 * Problems of a profile, as messages (empty when it is usable): for loading
 * snapshots and for tests of the builder.
 */
export const checkProfile = (profile) => {
  const problems = [];
  if (profile?.version !== PROFILE_VERSION) {
    problems.push(`version must be ${PROFILE_VERSION}`);
  }
  if (!(profile?.charsPerToken > 0)) {
    problems.push('charsPerToken must be a positive number');
  }
  const checkFields = (fields, where, needsPath) =>
    Object.entries(fields || {}).forEach(([name, field]) => {
      if (!FIELD_KINDS.includes(field?.kind)) {
        problems.push(`${where}.${name}: unknown kind ${field?.kind}`);
      }
      if (needsPath && typeof field?.path !== 'string') {
        problems.push(`${where}.${name}: path missing`);
      }
    });
  checkFields(profile?.pageFields, 'pageFields', false);
  Object.entries(profile?.blockTypes || {}).forEach(([type, entry]) => {
    checkFields(entry.fields, `${type}.fields`, true);
    Object.entries(entry.styling || {}).forEach(([name, field]) => {
      const where = `${type}.styling.${name}`;
      if (typeof field?.path !== 'string')
        problems.push(`${where}: path missing`);
      if (!isStringList(field?.values) || !field.values.length) {
        problems.push(`${where}: values must be a non-empty list of names`);
      } else if (
        field.default !== undefined &&
        !field.values.includes(field.default)
      ) {
        problems.push(`${where}: default ${field.default} is not a value`);
      }
    });
    if (entry.container && entry.container.allowed !== undefined) {
      if (!isStringList(entry.container.allowed)) {
        problems.push(`${type}.container.allowed must be a list of types`);
      }
    }
    if (entry.insertable && entry.initial?.['@type'] !== type) {
      problems.push(`${type}: insertable needs initial data of its type`);
    }
  });
  return problems;
};
