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
import { LINK_TYPES } from './linkChanges';
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

/** Old and new target of a changed link, if the target changed. */
const linkTargetChange = (op: DiffOperation) => {
  if (op.type !== 'update') return undefined;
  const key = ['url', 'href'].find((name) => name in op.newProperties);
  if (!key) return undefined;
  return {
    from: String(op.properties[key] ?? ''),
    to: String(op.newProperties[key] ?? ''),
  };
};

function DiffBlock({
  op,
  inline,
  link,
  children,
}: React.PropsWithChildren<{
  op: DiffOperation;
  inline: boolean;
  link: boolean;
}>) {
  const intl = useIntl();
  const summary = changeSummary(op, intl);
  if (inline) {
    const target = link ? linkTargetChange(op) : undefined;
    const label = intl.formatMessage(messages.linkTarget);
    return (
      <span
        className={`plate-diff-inline plate-diff-inline-${op.type}`}
        title={
          target
            ? `${label}: ${target.from} → ${target.to}`
            : describeOperation(op, intl)
        }
      >
        {children}
        {target ? (
          // The old target shows on the left / as removed, the new one on
          // the right / as added, through the classes of the text marks.
          <span className="plate-diff-inline-label" contentEditable={false}>
            {label}: <del className="plate-diff-delete">{target.from}</del>
            <ins className="plate-diff-insert">{target.to}</ins>
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
        return (
          <DiffBlock
            op={op}
            inline={editor.api.isInline(element)}
            link={LINK_TYPES.has(element.type)}
          >
            {children}
          </DiffBlock>
        );
      },
  },
});
