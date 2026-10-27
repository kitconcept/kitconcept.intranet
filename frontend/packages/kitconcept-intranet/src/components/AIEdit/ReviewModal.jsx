/**
 * Review the assistant's changes and apply the selected ones to the form
 * (spec §9, AI_WORKFLOW.md).
 *
 * One row per change: a field of the page, a field of a block (D35: content
 * and styling of one operation are separate rows), a new block or a
 * deleted one. Each row shows the reason, the category and what the editor
 * must notice (a link removed, a text split into blocks, a deleted
 * container). Deletes start unselected (D20); a warning shows when one
 * answer deletes a large part of the page.
 *
 * Changes whose fields were edited since the proposal are stale and cannot
 * be applied (D30, per field); applied ones are shown as applied. Saving
 * stays the normal form save. The diffs compare current and proposed
 * values: rich text from its slate value (exactly what will be applied),
 * plain text escaped (diffHtml.js; not Volto's DiffField, which builds a
 * store per rich-text diff).
 */
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Modal } from 'semantic-ui-react';
import escape from 'lodash/escape';
import { v4 as uuid } from 'uuid';
import TextDiff from './TextDiff';
import { slateToHtml } from './diffHtml';
import SparkleIcon from './SparkleIcon';
import { applyChanges, isStale } from './harness';
import { locate } from './harness/blocks';
import { getPath, shownField } from './harness/profile';
import { markdownToSlate } from './harness/markdown';

// Toggling a checkbox must not re-render the diffs, and each is only
// rendered once its row comes into view, so a review of a whole page
// opens fast.
const MemoTextDiff = memo(TextDiff);

const LazyDiff = (props) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(
    typeof window === 'undefined' || !('IntersectionObserver' in window),
  );
  useEffect(() => {
    if (visible || !ref.current) return undefined;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);
  return (
    <div className="ai-edit-diff" ref={ref}>
      {visible ? (
        <MemoTextDiff {...props} />
      ) : (
        <div className="ai-edit-diff-placeholder" />
      )}
    </div>
  );
};

const messages = defineMessages({
  header: { id: 'aiEditReviewHeader', defaultMessage: 'Proposed changes' },
  hint: {
    id: 'aiEditReviewHint',
    defaultMessage:
      'Selected changes are applied to the form. Review them in the editor and save the page as usual.',
  },
  leftovers: {
    id: 'aiEditReviewLeftovers',
    defaultMessage:
      'Not changed by these proposals, but may still mention the old value:',
  },
  references: {
    id: 'aiEditReviewReferences',
    defaultMessage:
      'Not changed by these proposals, but refers to a block they delete:',
  },

  massDeletion: {
    id: 'aiEditMassDeletion',
    defaultMessage:
      'These changes delete a large part of the page. Deletions are not selected; check them carefully before you select them.',
  },
  stale: {
    id: 'aiEditStale',
    defaultMessage:
      'This block was edited after the suggestion was made, so the change can no longer be applied. Ask again to get a new suggestion.',
  },
  applied: { id: 'aiEditApplied', defaultMessage: 'Applied' },
  current: { id: 'aiEditCurrent', defaultMessage: 'Current' },
  proposed: { id: 'aiEditProposedColumn', defaultMessage: 'Proposed' },
  apply: { id: 'aiEditApplySelected', defaultMessage: 'Apply selected' },
  cancel: { id: 'Cancel', defaultMessage: 'Cancel' },
  pageField: { id: 'aiEditPageField', defaultMessage: 'Page: {field}' },
  blockField: {
    id: 'aiEditBlockField',
    defaultMessage: 'Block {ref}: {field}',
  },
  insertAfter: {
    id: 'aiEditInsertAfter',
    defaultMessage: 'New {type} block after block {ref}',
  },
  insertInto: {
    id: 'aiEditInsertInto',
    defaultMessage: 'New {type} block at the start of block {ref}',
  },
  delete: { id: 'aiEditDelete', defaultMessage: 'Delete block {ref} ({type})' },
  removesPlaceholders: {
    id: 'aiEditRemovesPlaceholders',
    defaultMessage:
      '{count, plural, one {Removes a link} other {Removes # links}}',
  },
  dropsFormatting: {
    id: 'aiEditDropsFormatting',
    defaultMessage: 'Loses formatting: {formats}',
  },
  formatBold: { id: 'aiEditFormatBold', defaultMessage: 'bold' },
  formatItalic: { id: 'aiEditFormatItalic', defaultMessage: 'italic' },
  formatHeading: { id: 'aiEditFormatHeading', defaultMessage: 'heading' },
  formatList: { id: 'aiEditFormatList', defaultMessage: 'list' },
  splitsInto: {
    id: 'aiEditSplitsInto',
    defaultMessage: 'Becomes {count} blocks',
  },
  sameAsBlock: {
    id: 'aiEditSameAsBlock',
    defaultMessage:
      'Same value as {block} in this proposal: check that the page itself should change',
  },
  noLink: {
    id: 'aiEditNoLink',
    defaultMessage: 'No link target: add it in the editor',
  },
  refersToDeleted: {
    id: 'aiEditRefersToDeleted',
    defaultMessage:
      'Refers to block {block}, which this proposal deletes: apply both or neither',
  },
  atEnd: {
    id: 'aiEditAtEnd',
    defaultMessage:
      'Added at the end of the page: move it if it belongs elsewhere',
  },
  move: {
    id: 'aiEditMove',
    defaultMessage: 'Move block {ref} ({type}) after block {anchor}',
  },
  writesAltText: {
    id: 'aiEditWritesAltText',
    defaultMessage:
      'The assistant cannot see images: check that this describes the image',
  },
  deletesHidden: {
    id: 'aiEditDeletesHidden',
    defaultMessage:
      'Has content the assistant cannot see (for example a table)',
  },
  replacesMostText: {
    id: 'aiEditReplacesMostText',
    defaultMessage:
      'Replaces most of the current text: check that nothing is lost',
  },
  deletesNonText: {
    id: 'aiEditDeletesNonText',
    defaultMessage: 'Not a text block',
  },
  deletesContainerChild: {
    id: 'aiEditDeletesContainerChild',
    defaultMessage: 'Inside a container',
  },
  deletesContainer: {
    id: 'aiEditDeletesContainer',
    defaultMessage:
      '{count, plural, one {A container with # block inside} other {A container with # blocks inside}}',
  },
  noDiff: {
    id: 'aiEditNoDiff',
    defaultMessage: 'The block is removed from the page.',
  },
});

const categories = defineMessages({
  spelling: { id: 'aiEditCategorySpelling', defaultMessage: 'Spelling' },
  grammar: { id: 'aiEditCategoryGrammar', defaultMessage: 'Grammar' },
  style: { id: 'aiEditCategoryStyle', defaultMessage: 'Wording' },
  structure: { id: 'aiEditCategoryStructure', defaultMessage: 'Structure' },
  layout: { id: 'aiEditCategoryLayout', defaultMessage: 'Layout' },
  outdated: { id: 'aiEditCategoryOutdated', defaultMessage: 'Outdated' },
  accessibility: {
    id: 'aiEditCategoryAccessibility',
    defaultMessage: 'Accessibility',
  },
  metadata: { id: 'aiEditCategoryMetadata', defaultMessage: 'Metadata' },
  translation: {
    id: 'aiEditCategoryTranslation',
    defaultMessage: 'Translation',
  },
  other: { id: 'aiEditCategoryOther', defaultMessage: 'Other' },
});

const fieldLabels = defineMessages({
  title: { id: 'Title', defaultMessage: 'Title' },
  description: { id: 'Description', defaultMessage: 'Description' },
});

const label = (change, intl) => {
  const field = fieldLabels[change.field]
    ? intl.formatMessage(fieldLabels[change.field])
    : change.field;
  switch (change.kind) {
    case 'page_field':
      return intl.formatMessage(messages.pageField, { field });
    case 'block_field':
      return intl.formatMessage(messages.blockField, {
        ref: change.ref,
        field,
      });
    case 'insert':
      return intl.formatMessage(
        change.position === 'into' ? messages.insertInto : messages.insertAfter,
        { type: change.type, ref: change.anchorRef },
      );
    case 'move':
      return intl.formatMessage(messages.move, {
        ref: change.ref,
        type: change.type,
        anchor: change.anchorRef,
      });
    default:
      return intl.formatMessage(messages.delete, {
        ref: change.ref,
        type: change.type,
      });
  }
};

// The formats of `dropsFormatting` (operations.js formattingOf)
const FORMAT_NAMES = {
  bold: messages.formatBold,
  italic: messages.formatItalic,
  heading: messages.formatHeading,
  list: messages.formatList,
};

const flags = (change, intl) => {
  const { flags: f = {} } = change;
  return [
    f.removesPlaceholders &&
      intl.formatMessage(messages.removesPlaceholders, {
        count: f.removesPlaceholders.length,
      }),
    f.sameAsBlock &&
      intl.formatMessage(messages.sameAsBlock, { block: f.sameAsBlock }),
    f.noLink && intl.formatMessage(messages.noLink),
    f.writesAltText && intl.formatMessage(messages.writesAltText),
    f.deletesHidden && intl.formatMessage(messages.deletesHidden),
    f.replacesMostText && intl.formatMessage(messages.replacesMostText),
    f.dropsFormatting &&
      intl.formatMessage(messages.dropsFormatting, {
        formats: f.dropsFormatting
          .map((format) => intl.formatMessage(FORMAT_NAMES[format]))
          .join(', '),
      }),
    f.splitsInto &&
      intl.formatMessage(messages.splitsInto, { count: f.splitsInto }),
    f.atEnd && intl.formatMessage(messages.atEnd),
    f.refersToDeleted &&
      intl.formatMessage(messages.refersToDeleted, {
        block: f.refersToDeleted,
      }),
    f.deletesContainer &&
      intl.formatMessage(messages.deletesContainer, {
        count: f.deletesContainer.blocks,
      }),
    f.deletesContainerChild &&
      intl.formatMessage(messages.deletesContainerChild),
    f.deletesNonText &&
      !f.deletesContainer &&
      !f.deletesHidden &&
      intl.formatMessage(messages.deletesNonText),
  ].filter(Boolean);
};

const plain = (one, two) => ({
  one: escape(String(one ?? '')),
  two: escape(String(two ?? '')),
});

/** What the diff of a change compares, from the current form. */
const diffOf = (change, formData, links) => {
  const slate = (one, two) => ({
    one: slateToHtml(one),
    two: slateToHtml(two),
  });
  // A copy: rendering a placeholder must not extend the registry
  const toSlate = (markdown) => markdownToSlate(markdown, { ...links });
  if (change.kind === 'page_field') {
    return plain(formData?.[change.field], change.value);
  }
  if (change.kind === 'block_field') {
    const block = locate(formData, change.id)?.block;
    const current = getPath(block, change.path);
    if (change.fieldKind === 'styling') return { styling: true };
    if (change.fieldKind === 'richtext') {
      return slate(
        Array.isArray(current) ? current : [],
        toSlate(change.value),
      );
    }
    // A link shows its target, not the stored object
    return plain(shownField({ kind: change.fieldKind }, current), change.value);
  }
  // A move changes no content (D57): no diff, the label says it
  if (change.kind === 'move') return null;
  if (change.kind === 'insert') {
    const rich = Object.values(change.fields).find(
      (field) => field.kind === 'richtext',
    );
    if (rich) return slate([], toSlate(rich.value));
    // A block without text (a button): its fields, one per line; none
    // (a separator): no diff, the label says what it is
    const lines = Object.entries(change.fields)
      .filter(([, field]) => field.kind !== 'styling')
      .map(([name, field]) => `${name}: ${field.value}`);
    return lines.length ? plain('', lines.join('\n')) : null;
  }
  const block = locate(formData, change.id)?.block;
  return Array.isArray(block?.value) ? slate(block.value, []) : null;
};

/**
 * A passage of the page, shown as a quote, the words it is about
 * highlighted (D42: places left, dates that may depend on a change).
 */
const Quote = ({ excerpt, match }) => {
  const at = match ? excerpt.indexOf(match) : -1;
  return (
    <blockquote className="ai-edit-quote">
      {at < 0 ? (
        excerpt
      ) : (
        <>
          {excerpt.slice(0, at)}
          <mark>{match}</mark>
          {excerpt.slice(at + match.length)}
        </>
      )}
    </blockquote>
  );
};

const ReviewModal = ({
  message,
  formData,
  profile,
  links,
  created: createdBefore = {},
  onApply,
  onClose,
}) => {
  const intl = useIntl();
  // Computed once when the modal opens; the form does not change meanwhile.
  const rows = useMemo(
    () =>
      message.changes.map((change) => {
        const applied = message.applied.includes(change.key);
        const stale =
          !applied &&
          isStale(change, formData, message.baseFormData, {
            created: createdBefore,
            profile,
          });
        return {
          change,
          applied,
          stale,
          selectable: !applied && !stale,
          diff: diffOf(change, formData, links),
          // Once per row: a checkbox click re-renders every row
          notices: flags(change, intl),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [message],
  );
  const [selected, setSelected] = useState(() =>
    Object.fromEntries(
      rows.map((row) => [
        row.change.key,
        row.selectable && row.change.selected,
      ]),
    ),
  );
  const toApply = rows
    .filter((row) => row.selectable && selected[row.change.key])
    .map((row) => row.change);

  const apply = () => {
    const result = applyChanges(toApply, formData, {
      baseFormData: message.baseFormData,
      profile,
      links,
      created: createdBefore,
      newId: uuid,
    });
    const skipped = new Set(result.skipped.map((change) => change.key));
    onApply(
      result.formData,
      toApply.map((change) => change.key).filter((key) => !skipped.has(key)),
      result.created,
    );
  };

  return (
    <Modal open onClose={onClose} size="large" className="ai-edit-modal">
      <Modal.Header>
        <span className="ai-edit-title">
          <SparkleIcon className="ai-edit-sparkle" size={18} />
          {intl.formatMessage(messages.header)}
        </span>
      </Modal.Header>
      <Modal.Content scrolling>
        <p className="ai-edit-modal-hint">
          {intl.formatMessage(messages.hint)}
        </p>
        {message.massDeletion && (
          <p className="ai-edit-mass-deletion" role="alert">
            {intl.formatMessage(messages.massDeletion)}
          </p>
        )}
        {/* What the replacements left that could not be suggested
            (D42); current text */}
        {[
          ['leftovers', message.leftovers],
          ['references', message.references],
        ]
          .filter(([, places]) => places?.length > 0)
          .map(([kind, places]) => (
            <div key={kind} className="ai-edit-leftovers" role="status">
              <p>{intl.formatMessage(messages[kind])}</p>
              <ul>
                {places.map((place) => (
                  <li key={`${place.label}:${place.excerpt}`}>
                    <strong>{place.label}</strong>
                    <Quote excerpt={place.excerpt} match={place.match} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        {rows.map(({ change, applied, stale, selectable, diff, notices }) => (
          <div
            key={change.key}
            className={`ai-edit-change${selectable ? '' : ' disabled'}${
              selected[change.key] ? ' selected' : ''
            }${change.kind === 'delete' ? ' delete' : ''}`}
          >
            <label className="ai-edit-change-header">
              <input
                type="checkbox"
                checked={!!selected[change.key]}
                disabled={!selectable}
                onChange={(event) =>
                  setSelected((current) => ({
                    ...current,
                    [change.key]: event.target.checked,
                  }))
                }
              />
              <span className="ai-edit-change-label">
                {label(change, intl)}
              </span>
              {categories[change.category] && (
                <span className="ai-edit-category">
                  {intl.formatMessage(categories[change.category])}
                </span>
              )}
              {applied && (
                <span className="ai-edit-applied">
                  {intl.formatMessage(messages.applied)}
                </span>
              )}
            </label>
            {/* What changed and why; the diff below shows how (a
                replace_text change's reasons, the harness's suggestions
                with the reason of the replacement they repeat) */}
            {change.reason && <p className="ai-edit-reason">{change.reason}</p>}
            {notices.length > 0 && (
              <ul className="ai-edit-flags">
                {notices.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            )}
            {stale && (
              <p className="ai-edit-stale">
                {intl.formatMessage(messages.stale)}
              </p>
            )}
            {diff?.styling && (
              <p className="ai-edit-styling-change">
                <span className="deletion">{change.before}</span>
                {' → '}
                <span className="addition">{change.value}</span>
              </p>
            )}
            {diff && !diff.styling && (
              <>
                <div className="ai-edit-diff-columns">
                  <span>{intl.formatMessage(messages.current)}</span>
                  <span>{intl.formatMessage(messages.proposed)}</span>
                </div>
                <LazyDiff one={diff.one} two={diff.two} />
              </>
            )}
            {!diff && change.kind === 'delete' && (
              <p className="ai-edit-reason">
                {intl.formatMessage(messages.noDiff)}
              </p>
            )}
          </div>
        ))}
      </Modal.Content>
      <Modal.Actions>
        <button type="button" className="ai-edit-button" onClick={onClose}>
          {intl.formatMessage(messages.cancel)}
        </button>
        <button
          type="button"
          className="ai-edit-button primary"
          disabled={!toApply.length}
          onClick={apply}
        >
          {intl.formatMessage(messages.apply)}
        </button>
      </Modal.Actions>
    </Modal>
  );
};

export default ReviewModal;
