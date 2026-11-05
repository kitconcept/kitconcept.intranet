/**
 * Labels for the Plate-based Wiki Page diff and humanised names/values for
 * the node properties that `computeDiff` reports as `update` operations.
 *
 * Unknown properties and values fall back to the raw key / JSON value, so a
 * new Plate plugin never breaks the diff, it only shows a less pretty label.
 */
import { defineMessages, type IntlShape } from 'react-intl';
import type { DiffOperation } from '@platejs/diff';
import {
  formatPx,
  isTableWidth,
  TABLE_WIDTH_KEY,
} from '../WikiTable/wikiTableCustomWidth';
import { BLOCK_WIDTH_KEY } from '../WikiTable/wikiTableWidthPlugin';

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
  linkTarget: { id: 'plateDiff.linkTarget', defaultMessage: 'Link' },
  notSet: { id: 'plateDiff.value.notSet', defaultMessage: 'not set' },
  yes: { id: 'plateDiff.value.yes', defaultMessage: 'yes' },
  no: { id: 'plateDiff.value.no', defaultMessage: 'no' },
  // Column widths of a table, e.g. "180, 240, 360 px" (work item 824).
  colSizes: { id: 'plateDiff.value.colSizes', defaultMessage: '{sizes} px' },
});

const propertyMessages = defineMessages({
  align: { id: 'plateDiff.prop.align', defaultMessage: 'Alignment' },
  blockWidth: { id: 'plateDiff.prop.blockWidth', defaultMessage: 'Width' },
  colSizes: { id: 'plateDiff.prop.colSizes', defaultMessage: 'Column widths' },
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
  size: { id: 'plateDiff.prop.width', defaultMessage: 'Size' },
  caption: { id: 'plateDiff.prop.caption', defaultMessage: 'Caption' },
  description: { id: 'plateDiff.prop.caption', defaultMessage: 'Caption' },
  alt: { id: 'plateDiff.prop.alt', defaultMessage: 'Alternative text' },
  url: { id: 'plateDiff.prop.url', defaultMessage: 'Source' },
  href: { id: 'plateDiff.prop.href', defaultMessage: 'Link' },
  checked: { id: 'plateDiff.prop.checked', defaultMessage: 'Checked' },
  variant: { id: 'plateDiff.prop.variant', defaultMessage: 'Variant' },
  icon: { id: 'plateDiff.prop.icon', defaultMessage: 'Icon' },
  lang: { id: 'plateDiff.prop.lang', defaultMessage: 'Language' },
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
  // The theme's name for "Wide", set on wiki tables (work item 823).
  'blockWidth.layout': {
    id: 'plateDiff.value.blockWidth.layout',
    defaultMessage: 'Wide',
  },
  // The table-only step between Text width and Wide (work item 825).
  'blockWidth.medium': {
    id: 'plateDiff.value.blockWidth.medium',
    defaultMessage: 'Medium',
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
  // size (image block: l / m / s)
  'size.l': { id: 'plateDiff.value.size.l', defaultMessage: 'Large' },
  'size.m': { id: 'plateDiff.value.size.m', defaultMessage: 'Medium' },
  'size.s': { id: 'plateDiff.value.size.s', defaultMessage: 'Small' },
  // callout variant
  'variant.info': {
    id: 'plateDiff.value.variant.info',
    defaultMessage: 'Info',
  },
  'variant.note': {
    id: 'plateDiff.value.variant.note',
    defaultMessage: 'Note',
  },
  'variant.warning': {
    id: 'plateDiff.value.variant.warning',
    defaultMessage: 'Warning',
  },
  'variant.success': {
    id: 'plateDiff.value.variant.success',
    defaultMessage: 'Success',
  },
  'variant.error': {
    id: 'plateDiff.value.variant.error',
    defaultMessage: 'Error',
  },
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
  if (key === 'colSizes' && Array.isArray(value)) {
    return intl.formatMessage(messages.colSizes, {
      sizes: value
        .map((size) => intl.formatNumber(Number(size), { useGrouping: false }))
        .join(', '),
    });
  }
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
 * The width of a table as one value (work item 824): its custom width in px
 * ("1180px") when it has one, else its step ("Medium").
 */
const tableWidthLabel = (
  props: Record<string, unknown>,
  intl: IntlShape,
): string => {
  const custom = props[TABLE_WIDTH_KEY];
  return isTableWidth(custom)
    ? formatPx(intl, custom)
    : valueLabel(BLOCK_WIDTH_KEY, props[BLOCK_WIDTH_KEY], intl);
};

/**
 * Property changes of an `update`: "Alignment: Left → Centred, Width: Standard → Wide".
 * Empty string for insert/delete.
 *
 * A table's step (`blockWidth`) and custom width (`tableWidth`) are one
 * "Width" line with the width each side shows: "Width: Medium → 1180px".
 * For the side whose step did not change to show, the step must be in the
 * operation (`withWidthContext`).
 */
export const changeSummary = (op: DiffOperation, intl: IntlShape): string => {
  if (op.type !== 'update') return '';
  const { properties = {}, newProperties = {} } = op as Op;
  const changed = (key: string) => key in properties || key in newProperties;
  const customWidth = changed(TABLE_WIDTH_KEY);
  // The column widths follow the table's width: with a width change they
  // are no news of their own.
  const widthChange = customWidth || changed(BLOCK_WIDTH_KEY);
  const keys = Object.keys(newProperties).filter(
    (key) => key !== 'id' && !(widthChange && key === 'colSizes'),
  );
  const parts: string[] = [];
  let widthDone = false;
  for (const key of keys) {
    if (customWidth && (key === BLOCK_WIDTH_KEY || key === TABLE_WIDTH_KEY)) {
      if (widthDone) continue;
      widthDone = true;
      let from = tableWidthLabel(properties, intl);
      let to = tableWidthLabel(newProperties, intl);
      // Both sides show the same custom width, the step under it changed
      // (it shows again once the custom width is removed): name the step.
      if (from === to) {
        from = valueLabel(BLOCK_WIDTH_KEY, properties[BLOCK_WIDTH_KEY], intl);
        to = valueLabel(BLOCK_WIDTH_KEY, newProperties[BLOCK_WIDTH_KEY], intl);
      }
      if (from !== to) {
        parts.push(`${propertyLabel(BLOCK_WIDTH_KEY, intl)}: ${from} → ${to}`);
      }
      continue;
    }
    parts.push(
      `${propertyLabel(key, intl)}: ${valueLabel(key, properties[key], intl)} → ${valueLabel(key, newProperties[key], intl)}`,
    );
  }
  return parts.join(', ');
};

/**
 * `computeDiff` puts only the changed properties into an update. For a
 * table whose custom width changed, the unchanged step (or, for a changed
 * step, the unchanged custom width) is what one side shows, so it is added
 * to both sides; `changeSummary` then reads the width of each side. `node`
 * is the older version of the node: an unchanged property has the same
 * value in both. Used as `getUpdateProps` of `computeDiff`.
 */
export const withWidthContext = (
  node: Record<string, unknown>,
  properties: Record<string, unknown>,
  newProperties: Record<string, unknown>,
) => {
  const changed = (key: string) => key in newProperties || key in properties;
  const both = (key: string) => {
    if (changed(key) || node[key] === undefined) return;
    properties[key] = node[key];
    newProperties[key] = node[key];
  };
  if (changed(TABLE_WIDTH_KEY)) both(BLOCK_WIDTH_KEY);
  if (changed(BLOCK_WIDTH_KEY) && isTableWidth(node[TABLE_WIDTH_KEY])) {
    both(TABLE_WIDTH_KEY);
  }
  return {
    diff: true,
    diffOperation: { newProperties, properties, type: 'update' as const },
  };
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
