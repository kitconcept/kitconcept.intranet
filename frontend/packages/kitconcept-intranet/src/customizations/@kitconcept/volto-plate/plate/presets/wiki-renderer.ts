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
 */

import type { PlateConfig } from '@plone/plate/types';
import { PloneBlockAdapterRendererPlugin } from '@plone/plate/components/editor/plugins/plone-block-adapter-renderer';
import { wikiBaseEditorKit } from '@kitconcept/volto-plate/plate/kits/wiki-base-kit';

import { FindPathCachePlugin } from '@kitconcept/intranet/components/WikiRenderer/findPathCachePlugin';
import { TitleRendererBlock } from '@kitconcept/volto-plate/plate/plugins/volto-title-renderer';
import { ViewCommentKit } from '@kitconcept/volto-plate/plate/plugins/view-comment-kit';

const wikiEditorRenderer: PlateConfig = {
  readOnly: true,
  plugins: [
    // OVERRIDE
    FindPathCachePlugin,
    ...wikiBaseEditorKit,
    ...ViewCommentKit,
    TitleRendererBlock,
    PloneBlockAdapterRendererPlugin,
  ],
};

export default wikiEditorRenderer;
