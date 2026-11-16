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
 * FILE: https://github.com/kitconcept/volto-plate/blob/1.0.0a38/frontend/packages/volto-plate/src/components/PlateEditorRenderer/PlateEditorRenderer.tsx
 * FILE VERSION: @kitconcept/volto-plate 1.0.0-alpha.38
 * DATE: 2026-10-08
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/655
 * DEVELOPER: @reekitconcept
 * CHANGELOG:
 *  - Merge volto-plate 1.0.0-alpha.35: drop the `ToggleVisibilityProvider`
 *    wrapper, removed upstream with the toggle plugin. @sneridagh
 *  - Merge volto-plate 1.0.0-alpha.38: wrap in `InlineCommentsProvider`,
 *    keep the block in state and re-key the controller when an inline
 *    comment changes it, restoring the scroll position. @sneridagh
 */

import * as React from 'react';

import type { Content } from '@plone/types';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
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
import { InlineCommentsProvider } from '@kitconcept/volto-plate/plate/context/InlineCommentsProvider';
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

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

const PlateEditorRenderer = ({ content }: PlateEditorRendererProps) => {
  const contentBlock = content.blocks?.[SOMERSAULT_KEY] as
    | SomersaultBlock
    | undefined;
  const [somersaultBlock, setSomersaultBlock] =
    React.useState<SomersaultBlock | null>(contentBlock ?? null);
  const [revision, setRevision] = React.useState(0);
  const renderedValue = React.useRef<Value | undefined>(contentBlock?.value);
  const pendingScrollPosition = React.useRef<{ x: number; y: number } | null>(
    null,
  );
  const lastContentBlock = React.useRef(contentBlock);

  React.useEffect(() => {
    // State is already initialized from the first content block. Re-keying
    // the controller here on mount would discard and rebuild the whole tree.
    if (lastContentBlock.current === contentBlock) return;
    lastContentBlock.current = contentBlock;
    setSomersaultBlock(contentBlock ?? null);
    renderedValue.current = contentBlock?.value;
    setRevision((current) => current + 1);
  }, [contentBlock]);

  const updateBlock = React.useCallback((block: Record<string, unknown>) => {
    const nextBlock = block as SomersaultBlock;
    const valueChanged =
      JSON.stringify(renderedValue.current) !== JSON.stringify(nextBlock.value);

    renderedValue.current = nextBlock.value;
    setSomersaultBlock(nextBlock);
    if (valueChanged) {
      pendingScrollPosition.current = { x: window.scrollX, y: window.scrollY };
      setRevision((current) => current + 1);
    }
  }, []);

  useIsomorphicLayoutEffect(() => {
    const position = pendingScrollPosition.current;
    if (!position) return;

    window.scrollTo(position.x, position.y);
    const animationFrame = requestAnimationFrame(() => {
      window.scrollTo(position.x, position.y);
      pendingScrollPosition.current = null;
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [revision]);

  // OVERRIDE: rows hold cells only (see REASON).
  const value = React.useMemo(
    () =>
      somersaultBlock?.value ? cleanTableRows(somersaultBlock.value) : null,
    [somersaultBlock?.value],
  );

  if (!somersaultBlock || !value) return null;

  const initialDiscussions = normalizeDiscussions(somersaultBlock?.discussions);
  const initialUsers = normalizeUsers(somersaultBlock?.users);

  const contentPath = flattenToAppURL(content['@id']);

  return (
    <InlineCommentsProvider
      contentPath={contentPath}
      initiallyLocked={!!(content as any).lock?.locked}
      onBlockChange={updateBlock}
    >
      <PlateController key={revision}>
        <PlatePluginsProvider
          initialDiscussions={initialDiscussions}
          initialUsers={initialUsers}
          readOnly
        >
          <MentionLinkTarget />
          <PlateRenderer
            editorConfig={wikiEditorRenderer}
            value={value}
            className="typeset"
          />
        </PlatePluginsProvider>
      </PlateController>
    </InlineCommentsProvider>
  );
};

export default PlateEditorRenderer;
