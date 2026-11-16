/**
 * Plate plugin that renders the annotations produced by `computeDiff` from
 * `@platejs/diff`: text leaves carrying `diff: true` become <ins>/<del>/<span>
 * marks, block elements carrying `diffOperation` get a wrapper with a label.
 *
 * Elements that must stay direct children of a specific parent (table rows
 * and cells, columns, code lines) cannot be wrapped without breaking the
 * DOM structure; they get a class on the element itself instead.
 *
 * The plugin computes nothing; `computeDiff` does. See WikiPageDiff.tsx.
 *
 * Spike for #639 (HISTORY DIFF epic #636).
 */
import React from 'react';
import { useIntl } from 'react-intl';
import type { DiffOperation } from '@platejs/diff';
import { KEYS, type TElement } from 'platejs';
import {
  createPlatePlugin,
  PlateLeaf,
  type PlateLeafProps,
} from 'platejs/react';
import type { LinkChange, LinkPairElement } from './linkChanges';
import {
  changeSummary,
  describeOperation,
  messages,
  operationLabel,
} from './messages';

export const DIFF_KEY = 'diff';

/** Element types that are marked with a class instead of a wrapper. */
const UNWRAPPABLE_TYPES: string[] = [
  KEYS.tr,
  KEYS.td,
  KEYS.th,
  KEYS.column,
  KEYS.codeLine,
];

const LEAF_TAGS: Record<DiffOperation['type'], 'ins' | 'del' | 'span'> = {
  insert: 'ins',
  delete: 'del',
  update: 'span',
};

type DiffElement = TElement & { diffOperation?: DiffOperation };

function DiffLeaf(props: PlateLeafProps) {
  const intl = useIntl();
  const op = (props.leaf as { diffOperation?: DiffOperation }).diffOperation;
  if (!op) {
    return <PlateLeaf {...props}>{props.children}</PlateLeaf>;
  }
  return (
    <PlateLeaf
      {...props}
      as={LEAF_TAGS[op.type]}
      className={`plate-diff-leaf plate-diff-${op.type}`}
      title={describeOperation(op, intl)}
    >
      {props.children}
    </PlateLeaf>
  );
}

function DiffBlock({
  op,
  inline,
  pair,
  linkChange,
  children,
}: React.PropsWithChildren<{
  op: DiffOperation;
  inline: boolean;
  pair?: 'old' | 'new';
  linkChange?: LinkChange;
}>) {
  const intl = useIntl();
  const summary = changeSummary(op, intl);
  if (inline) {
    const label = intl.formatMessage(messages.linkTarget);
    const pairClass = pair ? ` plate-diff-link-${pair}` : '';
    return (
      <span
        className={`plate-diff-inline plate-diff-inline-${op.type}${pairClass}`}
        title={
          linkChange
            ? `${label}: ${linkChange.from} → ${linkChange.to}`
            : describeOperation(op, intl)
        }
      >
        {children}
        {linkChange && pair === 'new' ? (
          // The old target shows on the left / as removed, the new one on
          // the right / as added, through the classes of the text marks.
          <span className="plate-diff-inline-label" contentEditable={false}>
            {label}: <del className="plate-diff-delete">{linkChange.from}</del>
            <ins className="plate-diff-insert">{linkChange.to}</ins>
          </span>
        ) : null}
      </span>
    );
  }
  return (
    <div className={`plate-diff-block plate-diff-block-${op.type}`}>
      <span className="plate-diff-label" contentEditable={false}>
        <strong>{operationLabel(op, intl)}</strong>
        {summary ? (
          <span className="plate-diff-summary"> · {summary}</span>
        ) : null}
      </span>
      {children}
    </div>
  );
}

export const DiffPlugin = createPlatePlugin({
  key: DIFF_KEY,
  node: { isLeaf: true },
  inject: {
    isBlock: true,
    targetPlugins: UNWRAPPABLE_TYPES,
    nodeProps: {
      nodeKey: 'diffOperation',
      transformClassName: ({ nodeValue }) =>
        `plate-diff-node plate-diff-node-${
          (nodeValue as DiffOperation | undefined)?.type ?? 'update'
        }`,
    },
  },
  render: {
    node: DiffLeaf,
    aboveNodes:
      () =>
      ({ children, editor, element }) => {
        const op = (element as DiffElement).diffOperation;
        if (!op || UNWRAPPABLE_TYPES.includes(element.type)) return children;
        const { diffLinkPair, diffLinkChange } = element as LinkPairElement;
        return (
          <DiffBlock
            op={op}
            inline={editor.api.isInline(element)}
            pair={diffLinkPair}
            linkChange={diffLinkChange}
          >
            {children}
          </DiffBlock>
        );
      },
  },
});
