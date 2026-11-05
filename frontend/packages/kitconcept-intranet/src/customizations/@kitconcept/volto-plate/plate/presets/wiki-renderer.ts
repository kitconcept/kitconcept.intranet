/**
 * OVERRIDE wiki-renderer.ts
 * REASON: Register `FindPathCachePlugin` so read-only rendering (view,
 *         history diff) of large pages is linear instead of quadratic.
 *         Relative imports are made absolute (shadowed files resolve
 *         relative imports against this package). Everything else is
 *         unchanged.
 * FILE: https://github.com/kitconcept/volto-plate/blob/1.0.0a38/frontend/packages/volto-plate/src/plate/presets/wiki-renderer.ts
 * FILE VERSION: @kitconcept/volto-plate 1.0.0-alpha.38
 * DATE: 2026-10-01
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/655
 * DEVELOPER: @reekitconcept
 * CHANGELOG:
 *  - Merge volto-plate 1.0.0-alpha.38: register `ViewCommentKit` for
 *    view-mode inline comments. @sneridagh
 *  - Register `WikiTableCustomWidthPlugin`: the view and the history diff
 *    render a table's custom width (`tableWidth`); the table plugin gets
 *    `disableMarginLeft`, a stored table indent is ignored.
 *    https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/824
 *    @reekitconcept
 */

import { KEYS } from 'platejs';
import type { PlateConfig } from '@plone/plate/types';
import { PloneBlockAdapterRendererPlugin } from '@plone/plate/components/editor/plugins/plone-block-adapter-renderer';
import { wikiBaseEditorKit } from '@kitconcept/volto-plate/plate/kits/wiki-base-kit';

import { FindPathCachePlugin } from '@kitconcept/intranet/components/WikiRenderer/findPathCachePlugin';
import { WikiTableCustomWidthPlugin } from '@kitconcept/intranet/components/WikiTable/wikiTableCustomWidth';
import { TitleRendererBlock } from '@kitconcept/volto-plate/plate/plugins/volto-title-renderer';
import { ViewCommentKit } from '@kitconcept/volto-plate/plate/plugins/view-comment-kit';

const wikiEditorRenderer: PlateConfig = {
  readOnly: true,
  plugins: [
    // OVERRIDE
    FindPathCachePlugin,
    // OVERRIDE (824): a stored table indent (`marginLeft`) is ignored, as
    // in the editor (wiki-editor-kit.tsx).
    ...wikiBaseEditorKit.map((plugin) =>
      plugin.key === KEYS.table
        ? plugin.configure({ options: { disableMarginLeft: true } } as never)
        : plugin,
    ),
    // OVERRIDE (824): custom table width
    WikiTableCustomWidthPlugin,
    ...ViewCommentKit,
    TitleRendererBlock,
    PloneBlockAdapterRendererPlugin,
  ],
};

export default wikiEditorRenderer;
