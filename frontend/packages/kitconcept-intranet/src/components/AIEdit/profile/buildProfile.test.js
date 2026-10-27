import { describe, expect, it } from 'vitest';
import { checkProfile } from '../harness/profile';
import { buildProfile, visibleFieldsOf } from './buildProfile';

const THEMES = [
  { name: 'default', label: 'Default', style: {} },
  { name: 'grey', label: 'Grey', style: {} },
];

// Enhancers shaped like volto-light-theme's: `theme` and `styles` entries
const withTheme = (schema, theme = { themes: THEMES, default: 'default' }) => {
  schema.properties.theme = { widget: 'color_picker', ...theme };
  return schema;
};
const withStyles = (schema, properties) => {
  schema.properties.styles = {
    widget: 'object',
    schema: { fieldsets: [], properties, required: [] },
  };
  return schema;
};

const config = {
  blocks: {
    blocksConfig: {
      slate: { schemaEnhancer: ({ schema }) => withTheme(schema) },
      __button: {
        blockSchema: () => ({
          fieldsets: [{ id: 'default', fields: ['title', 'href'] }],
          properties: { title: {}, href: {} },
          required: [],
        }),
        schemaEnhancer: ({ schema }) =>
          withStyles(withTheme(schema, { themes: THEMES }), {
            'align:noprefix': { actions: ['left', 'center', 'right'] },
            'blockWidth:noprefix': {
              actions: [
                { name: 'narrow' },
                { name: 'default' },
                { name: 'full' },
              ],
              filterActions: ['narrow', 'default'],
            },
          }),
      },
      image: {
        // Like volto-light-theme's: styling only for an image with a url
        schemaEnhancer: ({ schema, formData }) =>
          withStyles(
            schema,
            formData.url
              ? {
                  'align:noprefix': {
                    actions: ['left', 'center', 'right'],
                    default: 'center',
                  },
                  'size:noprefix': { widget: 'image_size', default: 'l' },
                }
              : {},
          ),
      },
      gridBlock: {
        allowedBlocks: ['image', 'listing', 'slate', 'teaser'],
        maxLength: 4,
        schemaEnhancer: ({ schema }) => withTheme(schema),
      },
      html: {},
      broken: {
        blockSchema: () => {
          throw new Error('needs a navRoot');
        },
      },
    },
  },
  getUtility: ({ type, name }) =>
    type === 'styleFieldDefinition' && name === 'size:noprefix'
      ? { method: () => [{ name: 's' }, { name: 'm' }, { name: 'l' }] }
      : {},
  settings: {},
};

const intl = { formatMessage: (message) => message.defaultMessage };

describe('buildProfile', () => {
  const { profile, skipped } = buildProfile({ config, intl });

  it('builds a valid profile', () => {
    expect(checkProfile(profile)).toEqual([]);
  });

  it('reads styling from the enhanced block schemas', () => {
    expect(profile.blockTypes.slate.styling).toEqual({
      theme: { path: 'theme', values: ['default', 'grey'], default: 'default' },
    });
    expect(profile.blockTypes.__button.styling).toEqual({
      // No default in the schema: VLT's rendering fallback
      theme: { path: 'theme', values: ['default', 'grey'], default: 'default' },
      align: {
        path: 'styles.align:noprefix',
        values: ['left', 'center', 'right'],
        default: 'center',
      },
      // Narrowed by filterActions, as the widget does
      blockWidth: {
        path: 'styles.blockWidth:noprefix',
        values: ['narrow', 'default'],
        default: 'default',
      },
    });
  });

  it('takes values from the styleFieldDefinition utility without actions', () => {
    expect(profile.blockTypes.image.styling.size).toEqual({
      path: 'styles.size:noprefix',
      values: ['s', 'm', 'l'],
      default: 'l',
    });
  });

  it('adds content fields, insertable types and container rules', () => {
    expect(profile.blockTypes.slate).toMatchObject({
      fields: { text: { kind: 'richtext', path: 'value' } },
      insertable: true,
      initial: { '@type': 'slate' },
    });
    expect(Object.keys(profile.blockTypes.image.fields)).toEqual([
      'alt',
      'title',
      'description',
    ]);
    expect(profile.blockTypes.gridBlock.container).toEqual({
      allowed: ['image', 'listing', 'slate', 'teaser'],
      max: 4,
    });
  });

  it('leaves out types with nothing to see or change, reports failures', () => {
    expect(profile.blockTypes.html).toBeUndefined();
    expect(profile.blockTypes.broken).toBeUndefined();
    expect(skipped).toEqual({ broken: 'needs a navRoot' });
  });

  it('lets the configuration extend and remove content fields', () => {
    const { profile: custom } = buildProfile({
      config: {
        ...config,
        settings: {
          aiEdit: {
            blockFields: {
              __button: null,
              html: { headline: { kind: 'string', path: 'headline' } },
            },
          },
        },
      },
      intl,
    });
    expect(custom.blockTypes.__button.fields).toBeUndefined();
    expect(custom.blockTypes.html.fields).toEqual({
      headline: { kind: 'string', path: 'headline' },
    });
  });
});

describe('fields and settings from block schemas (D53)', () => {
  // Like Volto's teaser: title and description only with `overwrite`;
  // the target stores its data (not supported yet)
  const teaser = {
    blockSchema: ({ formData }) => ({
      fieldsets: [
        {
          id: 'default',
          fields: [
            'href',
            'overwrite',
            ...(formData?.overwrite ? ['title', 'description'] : []),
          ],
        },
      ],
      properties: {
        href: {
          widget: 'object_browser',
          mode: 'link',
          selectedItemAttrs: ['Title'],
        },
        overwrite: { type: 'boolean', default: false },
        title: {},
        description: { widget: 'textarea' },
      },
      required: ['href'],
    }),
  };
  // Like Volto's video block
  const video = {
    blockSchema: () => ({
      fieldsets: [{ id: 'default', fields: ['url', 'title', 'align'] }],
      properties: {
        url: { widget: 'url' },
        title: {},
        align: { widget: 'align' },
      },
      required: [],
    }),
  };
  const listing = {
    blockSchema: () => ({
      fieldsets: [
        {
          id: 'default',
          fields: ['headline', 'headlineTag', 'levels', 'size', 'querystring'],
        },
      ],
      properties: {
        headline: {},
        headlineTag: {
          choices: [
            ['h2', 'H2'],
            ['h3', 'H3'],
          ],
          default: 'h2',
        },
        levels: { choices: [['h2', 'H2']], isMulti: true },
        size: { choices: [[1, 'One']] },
        querystring: { widget: 'querystring' },
      },
      required: [],
    }),
  };
  const derivedConfig = {
    blocks: {
      blocksConfig: {
        teaser,
        video,
        listing,
        restrictedVideo: { ...video, restricted: true },
        grid: { ...video, allowedBlocks: ['video'] },
      },
    },
    settings: {
      aiEdit: {
        insertable: ['teaser', 'video', 'restrictedVideo', 'grid'],
      },
    },
  };
  const { profile } = buildProfile({ config: derivedConfig, intl });

  it('builds a valid profile', () => {
    expect(checkProfile(profile)).toEqual([]);
  });

  it('maps widgets to field kinds, also fields a setting shows', () => {
    expect(profile.blockTypes.teaser.fields).toEqual({
      title: { kind: 'string', path: 'title', fromSchema: true },
      description: { kind: 'text', path: 'description', fromSchema: true },
    });
    expect(profile.blockTypes.teaser.styling).toEqual({
      overwrite: {
        path: 'overwrite',
        values: ['false', 'true'],
        boolean: true,
        default: 'false',
        fromSchema: true,
      },
    });
    expect(profile.blockTypes.video.fields.url).toEqual({
      kind: 'url',
      path: 'url',
      fromSchema: true,
      // DEFAULT_REQUIRED (D54)
      required: true,
    });
    expect(profile.blockTypes.video.styling.align.values).toEqual([
      'left',
      'right',
      'center',
      'full',
    ]);
  });

  it('keeps hand-written content fields and adds the settings', () => {
    // listing has a hand-written entry (DEFAULT_BLOCK_FIELDS)
    expect(Object.keys(profile.blockTypes.listing.fields)).toEqual([
      'headline',
    ]);
    // Name choices only: no multiple choice, no numbers, no query
    expect(Object.keys(profile.blockTypes.listing.styling)).toEqual([
      'headlineTag',
    ]);
    expect(profile.blockTypes.listing.styling.headlineTag.default).toBe('h2');
  });

  it("marks fields a new block needs although its schema doesn't (D54)", () => {
    // A video without its URL shows nothing (DEFAULT_REQUIRED)
    expect(profile.blockTypes.video.fields.url.required).toBe(true);
    expect(profile.blockTypes.video.fields.title.required).toBeUndefined();
    const { profile: custom } = buildProfile({
      config: {
        ...derivedConfig,
        settings: { aiEdit: { required: { video: ['title'] } } },
      },
      intl,
    });
    expect(custom.blockTypes.video.fields.title.required).toBe(true);
  });

  it('inserts listed types the profile can fill', () => {
    expect(profile.blockTypes.video).toMatchObject({
      insertable: true,
      initial: { '@type': 'video' },
    });
    // Required target not supported yet; restricted; a container
    expect(profile.blockTypes.teaser.insertable).toBeUndefined();
    expect(profile.blockTypes.restrictedVideo.insertable).toBeUndefined();
    expect(profile.blockTypes.grid.insertable).toBeUndefined();
    // Not listed
    expect(profile.blockTypes.listing.insertable).toBeUndefined();
  });

  it('tells which fields a block shows for its data', () => {
    const visible = visibleFieldsOf({ config: derivedConfig, intl });
    expect(visible('teaser', {}).has('title')).toBe(false);
    expect(visible('teaser', { overwrite: true }).has('title')).toBe(true);
    expect(visible('unknown', {})).toBeNull();
  });
});
