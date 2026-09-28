/**
 * OVERRIDE wiki-renderer.ts
 * REASON: Register `FindPathCachePlugin` so read-only rendering (view,
 *         history diff) of large pages is linear instead of quadratic.
 *         Relative imports are made absolute (shadowed files resolve
 *         relative imports against this package). Everything else is
 *         unchanged.
 * FILE: https://github.com/kitconcept/volto-plate/blob/1.0.0-alpha.28/packages/volto-plate/src/plate/presets/wiki-renderer.ts
 * FILE VERSION: @kitconcept/volto-plate 1.0.0-alpha.28
 * DATE: 2026-09-25
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/655
 * DEVELOPER: @reekitconcept
 */

import type { PlateConfig } from '@plone/plate/types';
import { PloneBlockAdapterRendererPlugin } from '@plone/plate/components/editor/plugins/plone-block-adapter-renderer';
import { wikiBaseEditorKit } from '@kitconcept/volto-plate/plate/kits/wiki-base-kit';

import { FindPathCachePlugin } from '@kitconcept/intranet/components/WikiRenderer/findPathCachePlugin';
import { TitleRendererBlock } from '@kitconcept/volto-plate/plate/plugins/volto-title-renderer';

const wikiEditorRenderer: PlateConfig = {
  readOnly: true,
  plugins: [
    // OVERRIDE
    FindPathCachePlugin,
    ...wikiBaseEditorKit,
    TitleRendererBlock,
    PloneBlockAdapterRendererPlugin,
  ],
};

export default wikiEditorRenderer;
