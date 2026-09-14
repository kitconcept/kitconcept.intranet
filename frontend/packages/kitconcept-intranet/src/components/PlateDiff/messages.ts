/**
 * Labels for the Plate-based Wiki Page diff and humanised names/values for
 * the node properties that `computeDiff` reports as `update` operations.
 *
 * Unknown properties and values fall back to the raw key / JSON value, so a
 * new Plate plugin never breaks the diff, it only shows a less pretty label.
 */
import { defineMessages, type IntlShape } from 'react-intl';
import type { DiffOperation } from '@platejs/diff';

export const messages = defineMessages({
  added: { id: 'plateDiff.added', defaultMessage: 'Added' },
  removed: { id: 'plateDiff.removed', defaultMessage: 'Removed' },
  changed: { id: 'plateDiff.changed', defaultMessage: 'Changed' },
  notInThisVersion: {
    id: 'plateDiff.notInThisVersion',
    defaultMessage: 'Not in this version',
  },
  removedInThisVersion: {
    id: 'plateDiff.removedInThisVersion',
    defaultMessage: 'Removed in this version',
  },
  notSet: { id: 'plateDiff.value.notSet', defaultMessage: 'not set' },
  yes: { id: 'plateDiff.value.yes', defaultMessage: 'yes' },
  no: { id: 'plateDiff.value.no', defaultMessage: 'no' },
});

const propertyMessages = defineMessages({
  align: { id: 'plateDiff.prop.align', defaultMessage: 'Alignment' },
  blockWidth: { id: 'plateDiff.prop.blockWidth', defaultMessage: 'Width' },
  type: { id: 'plateDiff.prop.type', defaultMessage: 'Block type' },
  indent: { id: 'plateDiff.prop.indent', defaultMessage: 'Indentation' },
  listStyleType: {
    id: 'plateDiff.prop.listStyleType',
    defaultMessage: 'List type',
  },
  listStart: { id: 'plateDiff.prop.listStart', defaultMessage: 'List start' },
  lineHeight: {
    id: 'plateDiff.prop.lineHeight',
    defaultMessage: 'Line height',
  },
  width: { id: 'plateDiff.prop.width', defaultMessage: 'Size' },
  caption: { id: 'plateDiff.prop.caption', defaultMessage: 'Caption' },
  url: { id: 'plateDiff.prop.url', defaultMessage: 'Source' },
  checked: { id: 'plateDiff.prop.checked', defaultMessage: 'Checked' },
  variant: { id: 'plateDiff.prop.variant', defaultMessage: 'Variant' },
  backgroundColor: {
    id: 'plateDiff.prop.backgroundColor',
    defaultMessage: 'Background colour',
  },
  color: { id: 'plateDiff.prop.color', defaultMessage: 'Text colour' },
});

const valueMessages = defineMessages({
  // align
  'align.start': { id: 'plateDiff.value.align.left', defaultMessage: 'Left' },
  'align.left': { id: 'plateDiff.value.align.left', defaultMessage: 'Left' },
  'align.center': {
    id: 'plateDiff.value.align.center',
    defaultMessage: 'Centred',
  },
  'align.end': { id: 'plateDiff.value.align.right', defaultMessage: 'Right' },
  'align.right': { id: 'plateDiff.value.align.right', defaultMessage: 'Right' },
  'align.justify': {
    id: 'plateDiff.value.align.justify',
    defaultMessage: 'Justified',
  },
  // blockWidth
  'blockWidth.default': {
    id: 'plateDiff.value.blockWidth.default',
    defaultMessage: 'Standard',
  },
  'blockWidth.narrow': {
    id: 'plateDiff.value.blockWidth.narrow',
    defaultMessage: 'Narrow',
  },
  'blockWidth.wide': {
    id: 'plateDiff.value.blockWidth.wide',
    defaultMessage: 'Wide',
  },
  'blockWidth.full': {
    id: 'plateDiff.value.blockWidth.full',
    defaultMessage: 'Full width',
  },
  // type
  'type.p': { id: 'plateDiff.value.type.p', defaultMessage: 'Paragraph' },
  'type.h1': { id: 'plateDiff.value.type.h1', defaultMessage: 'Heading 1' },
  'type.h2': { id: 'plateDiff.value.type.h2', defaultMessage: 'Heading 2' },
  'type.h3': { id: 'plateDiff.value.type.h3', defaultMessage: 'Heading 3' },
  'type.h4': { id: 'plateDiff.value.type.h4', defaultMessage: 'Heading 4' },
  'type.h5': { id: 'plateDiff.value.type.h5', defaultMessage: 'Heading 5' },
  'type.h6': { id: 'plateDiff.value.type.h6', defaultMessage: 'Heading 6' },
  'type.blockquote': {
    id: 'plateDiff.value.type.blockquote',
    defaultMessage: 'Quote',
  },
  'type.code_block': {
    id: 'plateDiff.value.type.code_block',
    defaultMessage: 'Code',
  },
  'type.callout': {
    id: 'plateDiff.value.type.callout',
    defaultMessage: 'Callout',
  },
  'type.toggle': {
    id: 'plateDiff.value.type.toggle',
    defaultMessage: 'Toggle',
  },
  'type.img': { id: 'plateDiff.value.type.img', defaultMessage: 'Image' },
  'type.table': { id: 'plateDiff.value.type.table', defaultMessage: 'Table' },
  'type.hr': { id: 'plateDiff.value.type.hr', defaultMessage: 'Divider' },
  // listStyleType
  'listStyleType.disc': {
    id: 'plateDiff.value.list.bulleted',
    defaultMessage: 'Bulleted list',
  },
  'listStyleType.decimal': {
    id: 'plateDiff.value.list.numbered',
    defaultMessage: 'Numbered list',
  },
  'listStyleType.todo': {
    id: 'plateDiff.value.list.todo',
    defaultMessage: 'To-do list',
  },
});

type Op = DiffOperation & {
  properties?: Record<string, unknown>;
  newProperties?: Record<string, unknown>;
};

export const propertyLabel = (key: string, intl: IntlShape): string => {
  const message = propertyMessages[key as keyof typeof propertyMessages];
  return message ? intl.formatMessage(message) : key;
};

export const valueLabel = (
  key: string,
  value: unknown,
  intl: IntlShape,
): string => {
  if (value === undefined || value === null || value === '') {
    return intl.formatMessage(messages.notSet);
  }
  if (value === true) return intl.formatMessage(messages.yes);
  if (value === false) return intl.formatMessage(messages.no);
  const message =
    valueMessages[`${key}.${String(value)}` as keyof typeof valueMessages];
  if (message) return intl.formatMessage(message);
  return typeof value === 'string' ? value : JSON.stringify(value);
};

/** Short label for a block or leaf: "Added", "Removed", "Changed". */
export const operationLabel = (op: DiffOperation, intl: IntlShape): string =>
  intl.formatMessage(
    op.type === 'insert'
      ? messages.added
      : op.type === 'delete'
        ? messages.removed
        : messages.changed,
  );

/**
 * Property changes of an `update`: "Alignment: Left → Centred, Width: Standard → Wide".
 * Empty string for insert/delete.
 */
export const changeSummary = (op: DiffOperation, intl: IntlShape): string => {
  if (op.type !== 'update') return '';
  const { properties = {}, newProperties = {} } = op as Op;
  return Object.keys(newProperties)
    .filter((key) => key !== 'id')
    .map(
      (key) =>
        `${propertyLabel(key, intl)}: ${valueLabel(key, properties[key], intl)} → ${valueLabel(key, newProperties[key], intl)}`,
    )
    .join(', ');
};

/**
 * Full description in one string, e.g. for a title attribute:
 * "Changed · Alignment: Left → Centred". For insert/delete just the label.
 */
export const describeOperation = (
  op: DiffOperation,
  intl: IntlShape,
): string => {
  const label = operationLabel(op, intl);
  const summary = changeSummary(op, intl);
  return summary ? `${label} · ${summary}` : label;
};
