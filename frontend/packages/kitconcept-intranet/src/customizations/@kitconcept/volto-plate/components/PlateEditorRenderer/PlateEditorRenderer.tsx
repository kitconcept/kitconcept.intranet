/**
 * OVERRIDE PlateEditorRenderer.tsx
 * REASON: Render a cleaned value: table rows hold cells only
 *         (`cleanTableRows`). Pasted HTML can leave a stray text child in a
 *         row; the server-side HTML parser moves it out of the table, the
 *         client keeps it, and React drops the server-rendered page
 *         ("Hydration failed"). Cleaning the value here covers pages saved
 *         with such rows; the editor repairs them on the next save.
 *         Relative imports are made absolute (shadowed files resolve
 *         relative imports against this package). Everything else is
 *         unchanged.
 * FILE: https://github.com/kitconcept/volto-plate/blob/1.0.0-alpha.28/packages/volto-plate/src/components/PlateEditorRenderer/PlateEditorRenderer.tsx
 * FILE VERSION: @kitconcept/volto-plate 1.0.0-alpha.28
 * DATE: 2026-09-25
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/655
 * DEVELOPER: @reekitconcept
 */

import React from 'react';
import type { Content } from '@plone/types';
import {
  PlateController,
  PlateRenderer,
  type Value,
} from '@plone/plate/components/editor';
import wikiEditorRenderer from '@kitconcept/volto-plate/plate/presets/wiki-renderer';
import { SOMERSAULT_KEY } from '@kitconcept/volto-plate/constants';
import {
  normalizeDiscussions,
  normalizeUsers,
} from '@kitconcept/volto-plate/plate/discussion-data';
import { PlatePluginsProvider } from '@kitconcept/volto-plate/plate/context/PlatePluginsProvider';
import { ToggleVisibilityProvider } from '@kitconcept/volto-plate/plate/context/ToggleVisibilityContext';
import MentionLinkTarget from '@kitconcept/volto-plate/components/PlateEditorRenderer/MentionLinkTarget';
import { cleanTableRows } from '@kitconcept/intranet/components/WikiTable/wikiTableNormalizePlugin';

type PlateEditorRendererProps = {
  content: Content;
};

type SomersaultBlock = {
  value?: Value;
  discussions?: Record<string, unknown>;
  users?: Record<string, { id: string; fullname?: string; portrait?: string }>;
};

const PlateEditorRenderer = ({ content }: PlateEditorRendererProps) => {
  const somersaultBlock = content.blocks?.[SOMERSAULT_KEY] as
    | SomersaultBlock
    | undefined;

  // OVERRIDE: rows hold cells only (see REASON).
  const value = React.useMemo(
    () =>
      somersaultBlock?.value ? cleanTableRows(somersaultBlock.value) : null,
    [somersaultBlock?.value],
  );

  if (!value) return null;

  const initialDiscussions = normalizeDiscussions(somersaultBlock?.discussions);
  const initialUsers = normalizeUsers(somersaultBlock?.users);

  return (
    <PlateController>
      <PlatePluginsProvider
        initialDiscussions={initialDiscussions}
        initialUsers={initialUsers}
        readOnly
      >
        <MentionLinkTarget />
        <ToggleVisibilityProvider value={value}>
          <PlateRenderer
            editorConfig={wikiEditorRenderer}
            value={value}
            className="typeset"
          />
        </ToggleVisibilityProvider>
      </PlatePluginsProvider>
    </PlateController>
  );
};

export default PlateEditorRenderer;
