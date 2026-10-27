import type { ConfigType } from '@plone/registry';
import { QUICK_ACTIONS } from '../components/AIEdit/quickActions';

/**
 * AI assistant (see AI_WORKFLOW.md, AI_EDIT_PLAN.md): the frontend extension
 * points.
 *
 * - `quickActions`: predefined requests shown as chips in the panel (see
 *   components/AIEdit/quickActions.js).
 * - `blockFields`: the content fields the assistant may see and change, per
 *   block type (site profile, see components/AIEdit/profile/buildProfile.js);
 *   extends or overrides the built-in ones, `null` removes a type's
 *   content fields. A type without an entry gets the fields of its schema
 *   (by widget, D53).
 * - `insertable`: the block types the assistant may create (default in
 *   buildProfile.js, `DEFAULT_INSERTABLE`), as far as the profile can
 *   fill them: not restricted, not a container, every required field
 *   known. Opt-in, as no schema shows whether a block's main content is
 *   edited in the block itself.
 * - `required`: fields a new block must have although its schema does not
 *   say so, per block type (default in buildProfile.js, `DEFAULT_REQUIRED`:
 *   a video's `url`).
 *
 * Add-ons extend them in their own config, e.g.
 * `config.settings.aiEdit.blockFields.teaser = {title: {kind: 'string',
 * path: 'title'}}`.
 */
type Text = string | { id: string; defaultMessage: string };

export type AIEditSettings = {
  quickActions: { id: string; label: Text; prompt: Text }[];
  blockFields: Record<
    string,
    Record<
      string,
      {
        kind: 'richtext' | 'string' | 'text' | 'link' | 'url';
        path: string;
        // Must be set when the block is inserted (a button's label)
        required?: boolean;
      }
    > | null
  >;
  insertable?: string[];
  required?: Record<string, string[]>;
};

declare module '@plone/types' {
  export interface SettingsConfig {
    aiEdit: AIEditSettings;
  }
}

export default function installAiEdit(config: ConfigType) {
  config.settings.aiEdit = {
    quickActions: [...QUICK_ACTIONS],
    blockFields: {},
  };
  return config;
}
