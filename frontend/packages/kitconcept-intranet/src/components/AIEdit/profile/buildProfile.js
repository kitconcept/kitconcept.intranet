/**
 * Build the site profile (harness/profile.js, spec §4, D28) from the live
 * configuration. The only module of the assistant that reads Volto and
 * volto-light-theme (VLT) configuration; it runs in the panel, which has
 * `intl` and the registry. volto-light-theme is a given (D26).
 *
 * - Content fields: an allowlist per block type (D5): the built-in
 *   `DEFAULT_BLOCK_FIELDS`, extended or overridden by
 *   `config.settings.aiEdit.blockFields` (`null` removes a type). It is
 *   needed for content edited in the block itself (a text block's
 *   `value`), which no schema holds. A type without an entry gets its
 *   fields from its schema, by widget (D53, `schemaFields`): one line,
 *   `textarea`, `url`, an object browser link that stores only the
 *   target; other widgets (images, queries, lists) are left out.
 * - Settings (D53): every type gets its schema's choice and true/false
 *   fields as styling-like fields (values listed, changed on request).
 * - Styling fields (D25): read from the block's schema as its sidebar
 *   builds it (`blockSchema` + `schemaEnhancer`, where VLT adds `theme` and
 *   the `styles` entries). Allowed values from the field's `actions` (VLT
 *   narrows them per block), else the `styleFieldDefinition` utility, else
 *   `choices`; `filterActions` narrows them as the widgets do. Defaults
 *   from the field, else VLT's rendering fallbacks.
 * - Containers: `allowedBlocks` and `maxLength` of the block config.
 * - Insertable (D24, D53): the types of `config.settings.aiEdit.insertable`
 *   (default `DEFAULT_INSERTABLE`) that the block chooser can offer
 *   (`restricted` not set; a function would need the content, D53), that
 *   are not containers and whose required fields the profile can fill.
 *   Opt-in: whether a block's main content is edited in the block itself
 *   (a table, a map's embed code) shows in no schema.
 * - Page fields (D6): title and description.
 *
 * Returns `{profile, skipped}`: `skipped` maps block types whose schema
 * could not be built to the error message.
 */
import cloneDeep from 'lodash/cloneDeep';
import { applySchemaEnhancer } from '@plone/volto/helpers/Extensions/withBlockSchemaEnhancer';
import { PROFILE_VERSION } from '../harness/profile';

export const DEFAULT_PAGE_FIELDS = {
  title: { kind: 'string' },
  description: { kind: 'text' },
};

export const DEFAULT_BLOCK_FIELDS = {
  slate: { text: { kind: 'richtext', path: 'value' } },
  introduction: { text: { kind: 'richtext', path: 'value' } },
  image: {
    alt: { kind: 'string', path: 'alt' },
    title: { kind: 'string', path: 'title' },
    description: { kind: 'text', path: 'description' },
  },
  // The label, and the link target (VLT's object browser format)
  __button: {
    title: { kind: 'string', path: 'title', required: true },
    href: { kind: 'link', path: 'href' },
  },
  heading: { heading: { kind: 'string', path: 'heading' } },
  listing: { headline: { kind: 'string', path: 'headline' } },
};

// Types the assistant may create (D24, D53), unless a check rules them
// out; `config.settings.aiEdit.insertable` replaces the list
export const DEFAULT_INSERTABLE = ['slate', '__button', 'separator', 'video'];

// Fields a new block must have although its schema does not say so (D54):
// a video without its URL shows nothing; `config.settings.aiEdit.required`
// extends it
export const DEFAULT_REQUIRED = { video: ['url'] };

// Schema keys that are not fields: styling (read apart), structure
const NOT_FIELDS = ['theme', 'styles', 'blocks', 'blocks_layout', '@type'];
// Volto's alignment widget, when the field lists no actions
const ALIGN_VALUES = ['left', 'right', 'center', 'full'];

/**
 * The profile's view of one schema property (D53): a content field
 * (`{kind}`), a setting (`{setting: {values, boolean?, default?}}`), or
 * null when the assistant cannot handle its widget.
 */
export const schemaField = (property) => {
  const widget = property?.widget;
  if (property?.type === 'boolean') {
    return {
      setting: {
        values: ['false', 'true'],
        boolean: true,
        default: String(property.default ?? false),
      },
    };
  }
  if (Array.isArray(property?.choices) && !property.isMulti) {
    const values = property.choices.map((choice) =>
      Array.isArray(choice) ? choice[0] : choice,
    );
    // Stored as the model writes them: only names
    if (!values.length || !values.every((v) => typeof v === 'string')) {
      return null;
    }
    return { setting: { values, default: property.default } };
  }
  if (widget === 'align') {
    return {
      setting: {
        values: names(property.actions).length
          ? names(property.actions)
          : ALIGN_VALUES,
        default: property.default,
      },
    };
  }
  if (widget === 'url') return { kind: 'url' };
  if (widget === 'textarea') return { kind: 'text' };
  // A link that stores only its target (the button's `href`); one that
  // also stores the target's data (`selectedItemAttrs`: a teaser renders
  // its title and image from them) needs a look-up first
  if (
    widget === 'object_browser' &&
    property.mode === 'link' &&
    !property.selectedItemAttrs &&
    property.multiple !== true
  ) {
    return { kind: 'link' };
  }
  if (
    !widget &&
    (property?.type === undefined || property.type === 'string') &&
    !property?.vocabulary &&
    !property?.items
  ) {
    return { kind: 'string' };
  }
  return null;
};

/** The names of a schema's fieldsets, in order, without duplicates. */
const fieldsetFields = (schema) => [
  ...new Set(
    (schema?.fieldsets || []).flatMap((fieldset) => fieldset?.fields || []),
  ),
];

// How VLT renders an unset styling field (classExtenders.ts)
const VLT_FALLBACKS = {
  theme: 'default',
  'blockWidth:noprefix': 'default',
  'align:noprefix': 'center',
};

// Conservative for German and most other languages (D22)
export const CHARS_PER_TOKEN = 3;

const EMPTY_SCHEMA = {
  fieldsets: [{ id: 'default', title: 'Default', fields: [] }],
  properties: {},
  required: [],
};

const names = (list) =>
  (Array.isArray(list) ? list : [])
    .map((item) => (typeof item === 'string' ? item : item?.name))
    .filter((name) => typeof name === 'string');

// Some schemas only offer fields for filled blocks (volto-light-theme's
// image block: align, width and size only with an image `url`). The
// profile describes what a block can have, so it is built for a filled one.
const SAMPLE_DATA = { url: '/sample' };

/**
 * The block's schema with its enhancers applied, as the sidebar has it for
 * `data` (by default a filled block, see SAMPLE_DATA).
 */
const blockSchema = (type, blocksConfig, intl, data = SAMPLE_DATA) => {
  const formData = { ...data, '@type': type };
  const base = blocksConfig[type]?.blockSchema;
  const schema =
    typeof base === 'function'
      ? base({ intl, formData, props: { data: formData } })
      : base;
  return applySchemaEnhancer({
    schema: cloneDeep(schema || EMPTY_SCHEMA),
    formData,
    intl,
    blocksConfig,
  });
};

const styleValues = (key, field, type, config) => {
  let values = names(field.actions);
  if (!values.length) {
    const utility = config.getUtility?.({
      type: 'styleFieldDefinition',
      name: key,
    });
    values = names(utility?.method?.({ data: { '@type': type } }));
  }
  if (!values.length && Array.isArray(field.choices)) {
    values = field.choices.map((choice) => String(choice[0]));
  }
  if (field.filterActions?.length) {
    values = values.filter((value) => field.filterActions.includes(value));
  }
  return values;
};

const withDefault = (entry, value) =>
  value !== undefined && entry.values.includes(value)
    ? { ...entry, default: value }
    : entry;

/** The styling fields of a schema, keyed by their short name. */
const stylingFields = (schema, type, config) => {
  const styling = {};
  const theme = schema?.properties?.theme;
  const themes = names(theme?.themes);
  if (themes.length) {
    styling.theme = withDefault(
      { path: 'theme', values: themes },
      theme.default ?? VLT_FALLBACKS.theme,
    );
  }
  const styles = schema?.properties?.styles?.schema?.properties || {};
  Object.entries(styles).forEach(([key, field]) => {
    const values = styleValues(key, field, type, config);
    if (!values.length) return;
    styling[key.replace(/:noprefix$/, '')] = withDefault(
      { path: `styles.${key}`, values },
      field.default ?? VLT_FALLBACKS[key],
    );
  });
  return styling;
};

/**
 * The fields and settings a block's schema offers (D53), for the sample
 * block and for each true/false setting switched on (a teaser shows its
 * `title` only with `overwrite`): `{fields, settings, required,
 * unsupported}`, all marked `fromSchema`.
 */
const schemaFields = (type, blocksConfig, intl, base) => {
  const properties = { ...base?.properties };
  const shown = new Set(fieldsetFields(base));
  Object.entries(base?.properties || {})
    .filter(([, property]) => property?.type === 'boolean')
    .forEach(([name]) => {
      try {
        const schema = blockSchema(type, blocksConfig, intl, {
          ...SAMPLE_DATA,
          [name]: true,
        });
        Object.assign(properties, schema?.properties);
        fieldsetFields(schema).forEach((field) => shown.add(field));
      } catch (error) {
        // The sample block's schema stands
      }
    });
  const fields = {};
  const settings = {};
  const unsupported = [];
  [...shown]
    .filter((name) => !NOT_FIELDS.includes(name))
    .forEach((name) => {
      const found = schemaField(properties[name]);
      if (!found) unsupported.push(name);
      else if (found.kind) {
        fields[name] = {
          kind: found.kind,
          path: name,
          fromSchema: true,
          ...(base?.required?.includes(name) ? { required: true } : {}),
        };
      } else {
        settings[name] = withDefault(
          {
            path: name,
            values: found.setting.values,
            ...(found.setting.boolean ? { boolean: true } : {}),
            fromSchema: true,
          },
          found.setting.default,
        );
      }
    });
  return {
    fields,
    settings,
    required: Array.isArray(base?.required) ? base.required : [],
    unsupported,
  };
};

const containerRules = (blockConfig) => {
  const { allowedBlocks, maxLength } = blockConfig || {};
  if (!allowedBlocks && !maxLength) return undefined;
  return {
    ...(Array.isArray(allowedBlocks) ? { allowed: allowedBlocks } : {}),
    ...(maxLength ? { max: maxLength } : {}),
  };
};

export const buildProfile = ({ config, intl }) => {
  const blocksConfig = config.blocks?.blocksConfig || {};
  const fieldsByType = {
    ...DEFAULT_BLOCK_FIELDS,
    ...config.settings?.aiEdit?.blockFields,
  };
  const insertable = new Set(
    config.settings?.aiEdit?.insertable || DEFAULT_INSERTABLE,
  );
  const requiredByType = {
    ...DEFAULT_REQUIRED,
    ...config.settings?.aiEdit?.required,
  };
  const skipped = {};
  const blockTypes = {};
  Object.keys(blocksConfig)
    .sort()
    .forEach((type) => {
      let styling = {};
      let derived = { fields: {}, settings: {}, required: [] };
      try {
        // Built once, for the styling and the fields (D57, a code review)
        const schema = blockSchema(type, blocksConfig, intl);
        styling = stylingFields(schema, type, config);
        derived = schemaFields(type, blocksConfig, intl, schema);
      } catch (error) {
        skipped[type] = String(error?.message || error);
      }
      // A hand-written entry decides the content fields; settings come
      // from the schema for every type, after VLT's styling
      // `null` in blockFields: no content fields at all
      const own =
        fieldsByType[type] === null ? {} : fieldsByType[type] || derived.fields;
      // Required by the site's list (D54), where the type has the field
      const fields = Object.fromEntries(
        Object.entries(own).map(([name, field]) => [
          name,
          requiredByType[type]?.includes(name)
            ? { ...field, required: true }
            : field,
        ]),
      );
      Object.entries(derived.settings).forEach(([name, setting]) => {
        if (!Object.hasOwn(styling, name) && !Object.hasOwn(fields, name)) {
          styling[name] = setting;
        }
      });
      const container = containerRules(blocksConfig[type]);
      const canInsert =
        insertable.has(type) &&
        !skipped[type] &&
        !blocksConfig[type].restricted &&
        !container &&
        derived.required.every(
          (name) => Object.hasOwn(fields, name) || Object.hasOwn(styling, name),
        );
      const entry = {
        ...(Object.keys(fields).length ? { fields } : {}),
        ...(Object.keys(styling).length ? { styling } : {}),
        ...(canInsert ? { insertable: true, initial: { '@type': type } } : {}),
      };
      if (container) entry.container = container;
      if (Object.keys(entry).length) blockTypes[type] = entry;
    });
  return {
    profile: {
      version: PROFILE_VERSION,
      charsPerToken: CHARS_PER_TOKEN,
      pageFields: DEFAULT_PAGE_FIELDS,
      blockTypes,
      // Types the form never lets an editor delete (a block's own
      // `required` takes precedence)
      ...(config.blocks?.requiredBlocks?.length
        ? { requiredBlocks: [...config.blocks.requiredBlocks] }
        : {}),
    },
    skipped,
  };
};

/**
 * The names a block's schema shows for its data (D53): `(type, data) =>
 * Set`, or null when the schema cannot be resolved (nothing is checked).
 * The harness checks the fields and settings marked `fromSchema` against
 * it: a teaser's `title` counts only with `overwrite` on.
 */
export const visibleFieldsOf = ({ config, intl }) => {
  const blocksConfig = config.blocks?.blocksConfig || {};
  return (type, data) => {
    if (!blocksConfig[type]?.blockSchema) return null;
    try {
      return new Set(
        fieldsetFields(blockSchema(type, blocksConfig, intl, data || {})),
      );
    } catch (error) {
      return null;
    }
  };
};
