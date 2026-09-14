/**
 * Plate plugin that renders the annotations produced by `computeDiff` from
 * `@platejs/diff`: text leaves carrying `diff: true` become <ins>/<del>/<span>
 * marks, block elements carrying `diffOperation` get a wrapper with a label.
 *
 * The plugin computes nothing; `computeDiff` does. See WikiPageDiff.tsx.
 *
 * Spike for #639 (HISTORY DIFF epic #636).
 */
import React from 'react';
import { useIntl } from 'react-intl';
import type { DiffOperation } from '@platejs/diff';
import type { TElement } from 'platejs';
import {
  createPlatePlugin,
  PlateLeaf,
  type PlateLeafProps,
} from 'platejs/react';
import { changeSummary, describeOperation, operationLabel } from './messages';

export const DIFF_KEY = 'diff';

const LEAF_TAGS: Record<DiffOperation['type'], 'ins' | 'del' | 'span'> = {
  insert: 'ins',
  delete: 'del',
  update: 'span',
};

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
  children,
}: React.PropsWithChildren<{ op: DiffOperation; inline: boolean }>) {
  const intl = useIntl();
  const summary = changeSummary(op, intl);
  if (inline) {
    return (
      <span
        className={`plate-diff-inline plate-diff-inline-${op.type}`}
        title={describeOperation(op, intl)}
      >
        {children}
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
  render: {
    node: DiffLeaf,
    aboveNodes:
      () =>
      ({ children, editor, element }) => {
        const op = (element as TElement & { diffOperation?: DiffOperation })
          .diffOperation;
        if (!op) return children;
        return (
          <DiffBlock op={op} inline={editor.api.isInline(element)}>
            {children}
          </DiffBlock>
        );
      },
  },
});
