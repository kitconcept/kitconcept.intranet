/**
 * Diff of two versions of a Wiki Page (Plate content stored in
 * `blocks.__somersault__.value`), rendered with Plate itself.
 *
 * `computeDiff` (from `@platejs/diff`) returns the *new* document with the
 * changed nodes annotated (`diff`, `diffOperation`); deleted nodes are kept
 * in place and marked. `DiffPlugin` turns those annotations into markup.
 *
 * - unified: one renderer showing insertions and deletions inline.
 * - split: one row per top-level node, the left cell shows the node without
 *   insertions, the right cell without deletions; added/removed nodes get an
 *   empty slot on the other side (design variant 2a).
 *
 * Spike for #639 (HISTORY DIFF epic #636).
 */
import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { computeDiff } from '@platejs/diff';
import type { Descendant, TElement, Value } from 'platejs';
import { PlateController, PlateRenderer } from '@plone/plate/components/editor';
import wikiEditorRenderer from '@kitconcept/volto-plate/plate/presets/wiki-renderer';
import { PlatePluginsProvider } from '@kitconcept/volto-plate/plate/context/PlatePluginsProvider';
import { ToggleVisibilityProvider } from '@kitconcept/volto-plate/plate/context/ToggleVisibilityContext';
import { SOMERSAULT_KEY } from '@kitconcept/volto-plate/constants';
import { cleanTableRows } from '@kitconcept/intranet/components/WikiTable/wikiTableNormalizePlugin';
import { DiffPlugin } from './DiffPlugin';
import { messages } from './messages';
import './plate-diff.css';

// Inline element types of the wiki kit. The spike hardcodes them; the real
// implementation should ask the editor (`editor.api.isInline`).
const INLINE_TYPES = new Set(['a', 'link', 'mention', 'date']);

const editorConfig = {
  ...wikiEditorRenderer,
  plugins: [...wikiEditorRenderer.plugins, DiffPlugin],
};

type Content = {
  blocks?: Record<string, { value?: Value }>;
};

// Rows hold cells only, like the view renderer (see wikiTableNormalizePlugin).
const getValue = (content?: Content): Value =>
  cleanTableRows(
    (content?.blocks?.[SOMERSAULT_KEY]?.value as Value | undefined) ?? [],
  );

export const hasPlateContent = (content?: Content): boolean =>
  Boolean(content?.blocks && SOMERSAULT_KEY in content.blocks);

const opType = (node: Descendant) =>
  (node as TElement & { diffOperation?: { type: string } }).diffOperation?.type;

const nodeText = (node: Descendant): string =>
  'text' in node
    ? node.text
    : ((node as TElement).children ?? []).map(nodeText).join('');

const hasInlineElements = (node: Descendant): boolean =>
  !('text' in node) &&
  ((node as TElement).children ?? []).some(
    (child) => !('text' in child) || hasInlineElements(child),
  );

/**
 * An added or removed paragraph without any text or inline element is
 * spacing, not content; showing it as an empty coloured box only confuses.
 */
const isEmptyChange = (node: Descendant): boolean => {
  const type = opType(node);
  if (type !== 'insert' && type !== 'delete') return false;
  if ('text' in node) return false;
  const element = node as TElement;
  if (element.type !== 'p') return false;
  return nodeText(element).trim() === '' && !hasInlineElements(element);
};

type Props = {
  one?: Content;
  two?: Content;
  view: 'split' | 'unified';
};

/*
 * The wiki renderer's toggle nodes need a ToggleVisibilityProvider (they
 * throw without one). It is given an empty document on purpose: with the
 * real one, content under a closed toggle is hidden, and a diff must show
 * every change.
 */
const Renderer = ({ id, value }: { id: string; value: Value }) => (
  <ToggleVisibilityProvider value={[]}>
    <PlateRenderer
      editorConfig={{ ...editorConfig, id }}
      value={value}
      className="typeset"
    />
  </ToggleVisibilityProvider>
);

const WikiPageDiff = ({ one, two, view }: Props) => {
  const intl = useIntl();
  const diffValue = useMemo(
    () =>
      computeDiff(getValue(one), getValue(two), {
        isInline: (node) => INLINE_TYPES.has((node as TElement).type),
      }).filter((node) => !isEmptyChange(node)),
    [one, two],
  );

  return (
    <PlateController>
      <PlatePluginsProvider initialDiscussions={[]} initialUsers={{}} readOnly>
        {view === 'unified' ? (
          <div className="plate-diff plate-diff-unified">
            <Renderer id="plate-diff-unified" value={diffValue} />
          </div>
        ) : (
          <div className="plate-diff plate-diff-split">
            {diffValue.map((node, i) => {
              const type = opType(node);
              const key = (node as TElement).id ?? i;
              return (
                <React.Fragment key={String(key)}>
                  <div className="plate-diff-cell plate-diff-left">
                    {type === 'insert' ? (
                      <div className="plate-diff-empty">
                        {intl.formatMessage(messages.notInThisVersion)}
                      </div>
                    ) : (
                      <Renderer id={`plate-diff-left-${i}`} value={[node]} />
                    )}
                  </div>
                  <div className="plate-diff-cell plate-diff-right">
                    {type === 'delete' ? (
                      <div className="plate-diff-empty">
                        {intl.formatMessage(messages.removedInThisVersion)}
                      </div>
                    ) : (
                      <Renderer id={`plate-diff-right-${i}`} value={[node]} />
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </PlatePluginsProvider>
    </PlateController>
  );
};

export default WikiPageDiff;
