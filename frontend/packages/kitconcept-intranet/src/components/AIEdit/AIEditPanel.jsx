/**
 * The AI assistant's sidebar panel (spec §2, §5, AI_WORKFLOW.md; plan in
 * AI_EDIT_PLAN.md).
 *
 * A chat: the editor asks for an assessment or for changes; each request is
 * one turn of the harness (components/AIEdit/harness): the live form
 * (`state.form.global`, read when sending) and the selected block are
 * projected into the page, sent to `@ai-edit`, the answer's operations are
 * validated (with one repair call) and become changes, reviewed in the
 * ReviewModal and applied to the form with `setFormData`. Saving stays the
 * normal Volto save.
 *
 * Works the same in the edit and in the add form: the request goes to the
 * content in the store, which is the content being edited or, in the add
 * form, the folder the content is added to. Whether the user may use the
 * assistant here, and the context budget, are asked when the panel is
 * first opened (see useAIEditAccess).
 *
 * The site profile (what the model may see and change) is built once from
 * the live configuration (profile/buildProfile.js); quick actions come from
 * `config.settings.aiEdit` (see config/aiEdit.ts).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { setFormData } from '@plone/volto/actions/form/form';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import sendSVG from '@plone/volto/icons/send.svg';
import config from '@plone/volto/registry';
import { aiEdit } from '../../actions';
import useAIEditAccess, { isForbidden } from './useAIEditAccess';
import SparkleIcon from './SparkleIcon';
import { formatText } from './quickActions';
import { buildProfile, visibleFieldsOf } from './profile/buildProfile';
import { runTurn } from './harness';
import ReviewModal from './ReviewModal';
import { debug } from './debug';
import { createdBlocks, selectedBlocks } from './panelState';

const messages = defineMessages({
  header: { id: 'aiEditHeader', defaultMessage: 'AI assistant' },
  beta: { id: 'Beta', defaultMessage: 'Beta' },
  intro: {
    id: 'aiEditIntro',
    defaultMessage:
      'Ask the AI to assess this page or to improve it. Proposed changes are shown for review before they are applied to the form.',
  },
  placeholder: {
    id: 'aiEditPlaceholder',
    defaultMessage: 'Ask about this page…',
  },
  send: { id: 'aiEditSend', defaultMessage: 'Send' },
  thinking: { id: 'aiEditThinking', defaultMessage: 'Thinking…' },
  error: {
    id: 'aiEditError',
    defaultMessage:
      'The AI assistant is currently unavailable. Please try again.',
  },
  errorBusy: {
    id: 'aiEditErrorBusy',
    defaultMessage: 'The AI assistant is busy. Please try again in a moment.',
  },
  errorTooLarge: {
    id: 'aiEditErrorTooLarge',
    defaultMessage: 'This page is too long for the AI assistant.',
  },
  errorTruncated: {
    id: 'aiEditErrorTruncated',
    defaultMessage:
      'The answer was cut off before it was complete. Try asking for less at once.',
  },
  checking: { id: 'aiEditChecking', defaultMessage: 'Loading…' },
  forbidden: {
    id: 'aiEditForbidden',
    defaultMessage:
      "You don't have permission to use the AI assistant on this page. Ask a site administrator if you need it.",
  },
  emptyAnswer: {
    id: 'aiEditEmptyAnswer',
    defaultMessage:
      'The AI could not produce an answer for this request. It may not be possible here; try rephrasing it.',
  },
  notConfigured: {
    id: 'aiEditNotConfigured',
    defaultMessage: 'The AI assistant is currently switched off.',
  },
  proposed: {
    id: 'aiEditProposed',
    defaultMessage:
      '{count, plural, one {# change proposed} other {# changes proposed}}',
  },
  review: { id: 'aiEditReview', defaultMessage: 'Review changes' },
  applied: { id: 'aiEditApplied', defaultMessage: 'Applied' },
  partiallyApplied: {
    id: 'aiEditPartiallyApplied',
    defaultMessage: 'Partially applied ({applied} of {count})',
  },
  noChanges: {
    id: 'aiEditNoChanges',
    defaultMessage: 'No changes proposed.',
  },
  disclaimer: {
    id: 'aiEditDisclaimer',
    defaultMessage: 'AI-generated. It may contain errors.',
  },
  warningTruncated: {
    id: 'aiEditWarningTruncated',
    defaultMessage:
      'The answer was cut off, some changes may be missing. Try asking for fewer changes at once.',
  },
  warningNothingUsable: {
    id: 'aiEditWarningNothingUsable',
    defaultMessage:
      "The AI's proposal could not be used. Try rephrasing the request.",
  },
  // The harness's own words (D57): a question for what the user did not
  // give, or why nothing of a proposal could be used
  noticeQuestion: {
    id: 'aiEditNoticeQuestion',
    defaultMessage: 'What should the {field} of the new {type} block be?',
  },
  noticeNotInsertable: {
    id: 'aiEditNoticeNotInsertable',
    defaultMessage:
      'This block type cannot be added by the assistant. Add it in the editor.',
  },
  warningInputTruncated: {
    id: 'aiEditWarningInputTruncated',
    defaultMessage:
      'The AI saw only part of the page, so this answer is unreliable. The AI server needs a larger context; please tell an administrator.',
  },
  warningUnchanged: {
    id: 'aiEditWarningUnchanged',
    defaultMessage:
      '{count, plural, one {# proposed change is the same as the current content and is not shown.} other {# proposed changes are the same as the current content and are not shown.}}',
  },
});

// Answers with these error codes get a specific message
const ERROR_MESSAGES = {
  empty_answer: messages.emptyAnswer,
  forbidden: messages.forbidden,
  not_configured: messages.notConfigured,
  busy: messages.errorBusy,
  request_too_large: messages.errorTooLarge,
  page_too_long: messages.errorTooLarge,
  truncated: messages.errorTruncated,
};

/**
 * What the editor should know about an answer: cut off, the model saw
 * only part of the page, a proposal of which nothing could be used (also
 * when the model's text says it changed something), and, when nothing is
 * proposed, that the proposals were identical to the page. Single
 * operations that could not be used are not listed (the editor cannot
 * act on them): they are in the debug log (`turn`) and in the model's
 * history.
 */
/**
 * The harness's words instead of the model's (D57): with changes, the
 * model's text and the question; without, the question or why nothing
 * could be used (the model's text described what was dropped).
 */
const Notice = ({ message }) => {
  const intl = useIntl();
  const { notice } = message;
  const modelText = message.changes?.length ? message.modelContent : '';
  if (notice.kind === 'question') {
    return (
      <>
        {modelText && <p className="ai-edit-text">{modelText}</p>}
        {notice.questions.map(({ type, field }) => (
          <p key={`${type}:${field}`} className="ai-edit-text">
            {intl.formatMessage(messages.noticeQuestion, {
              field,
              type: String(type).replace(/^_+/, ''),
            })}
          </p>
        ))}
      </>
    );
  }
  return (
    <p className="ai-edit-text">
      {intl.formatMessage(
        notice.codes?.includes('not_insertable')
          ? messages.noticeNotInsertable
          : messages.warningNothingUsable,
      )}
    </p>
  );
};

const Warnings = ({ message }) => {
  const intl = useIntl();
  const unchanged = message.changes?.length
    ? 0
    : (message.warnings || []).filter((w) => w.code === 'unchanged').length;
  // Said by the harness's notice instead (D57)
  const nothingUsable =
    !message.notice && !message.changes?.length && message.dropped?.length > 0;
  if (
    !message.truncated &&
    !message.inputTruncated &&
    !unchanged &&
    !nothingUsable
  ) {
    return null;
  }
  return (
    <div className="ai-edit-warnings">
      {nothingUsable && (
        <p>{intl.formatMessage(messages.warningNothingUsable)}</p>
      )}
      {message.inputTruncated && (
        <p>{intl.formatMessage(messages.warningInputTruncated)}</p>
      )}
      {message.truncated && (
        <p>{intl.formatMessage(messages.warningTruncated)}</p>
      )}
      {unchanged > 0 && (
        <p>
          {intl.formatMessage(messages.warningUnchanged, { count: unchanged })}
        </p>
      )}
    </div>
  );
};

const AppliedStatus = ({ applied, count }) => {
  const intl = useIntl();
  if (!applied) return null;
  return (
    <span className="ai-edit-applied">
      {applied < count
        ? intl.formatMessage(messages.partiallyApplied, { applied, count })
        : intl.formatMessage(messages.applied)}
    </span>
  );
};

/**
 * `selectionChanged`: a ref, whether the editor changed the block
 * selection since the form opened (useSelectionChanged.js, kept by the
 * Sidebar).
 */
const AIEditPanel = ({ selectionChanged }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const store = useStore();
  const contentUrl = useSelector((state) =>
    flattenToAppURL(state.content.data?.['@id'] || ''),
  );
  const { access, budget } = useAIEditAccess(contentUrl);
  // What the model may see and change, from the live configuration
  const { profile, skipped } = useMemo(
    () => buildProfile({ config, intl }),
    [intl],
  );
  // Which schema fields a block shows for its data (D53)
  const visibleFields = useMemo(
    () => visibleFieldsOf({ config, intl }),
    [intl],
  );
  // The snapshot for the eval (AI_EDIT_PLAN.md §5), see debug.js;
  // once access is known, which also tells whether the backend traces
  useEffect(() => {
    if (access === 'ready') debug('profile', profile, 'skipped:', skipped);
  }, [access, profile, skipped]);
  // Guards against a second send before the `loading` state has rendered
  // (double Enter, chip click while sending)
  const sending = useRef(false);
  // Block id -> ref (b1, b5.2), kept for the whole conversation (D21)
  const refs = useRef({});
  // Placeholder number -> inline node (links, ...), kept for the whole
  // conversation (harness/markdown.js)
  const links = useRef({});
  const [conversation, setConversation] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(null);

  // One request to `@ai-edit`; failures become error codes
  const request = async (payload) => {
    debug('request', payload);
    try {
      const result = await dispatch(aiEdit(contentUrl, payload));
      debug('response', result);
      return result;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('AI assistant request failed:', e);
      return { error_code: isForbidden(e) ? 'forbidden' : 'request_failed' };
    }
  };

  const send = async (text) => {
    const question = text.trim();
    if (!question || sending.current) return;
    sending.current = true;
    // The selection belongs to the request: the history repeats it with
    // each one, so a later "this block" is not read as an earlier one
    const selected = selectedBlocks(
      store.getState(),
      !!selectionChanged?.current,
      config.blocks?.initialBlocksFocus,
    );
    const userMessage = { role: 'user', content: question, selected };
    const previous = conversation;
    setConversation((current) => [...current, userMessage]);
    setInput('');
    setLoading(true);
    // Read the live form state from the store right now, not from a render
    // closure: the proposals refer to it (staleness)
    const { global: formData } = store.getState().form;
    try {
      const result = await runTurn({
        text: question,
        formData,
        selected,
        profile,
        conversation: previous,
        refs: refs.current,
        links: links.current,
        budget,
        vocabulary: budget.vocabulary,
        language: intl.locale,
        send: request,
        visibleFields,
      });
      refs.current = result.refs;
      // What the harness made of the answers: changes for the review,
      // dropped operations, warnings, the repair
      const { baseFormData, ...turn } = result.message;
      debug('turn', { request: question, selected, ...turn });
      // Not shown in the panel: the editor cannot act on them
      if (turn.dropped?.length) debug('dropped operations', turn.dropped);
      // Functional update: the editor may apply an earlier proposal while
      // this request is pending
      setConversation((current) => [...current, result.message]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('AI assistant turn failed:', e);
      setConversation((current) => [
        ...current,
        { role: 'assistant', error: true },
      ]);
    } finally {
      sending.current = false;
      setLoading(false);
    }
  };

  const onApply = (newFormData, keys, created) => {
    dispatch(setFormData(newFormData));
    setConversation((current) =>
      current.map((m, i) =>
        i === reviewIndex
          ? {
              ...m,
              applied: [...m.applied, ...keys],
              created: { ...m.created, ...created },
            }
          : m,
      ),
    );
    setReviewIndex(null);
  };

  const reviewed = reviewIndex !== null ? conversation[reviewIndex] : null;

  return (
    <div className="ai-edit-panel">
      <div className="ai-edit-header">
        <span className="ai-edit-title">
          <SparkleIcon className="ai-edit-sparkle" />
          {intl.formatMessage(messages.header)}
        </span>
        <span className="ai-edit-beta">
          {intl.formatMessage(messages.beta)}
        </span>
      </div>
      <p className="ai-edit-intro">{intl.formatMessage(messages.intro)}</p>

      {access === 'checking' && (
        <p className="ai-edit-loading">
          {intl.formatMessage(messages.checking)}
        </p>
      )}
      {(access === 'forbidden' || access === 'not_configured') && (
        <p className="ai-edit-notice">
          {intl.formatMessage(ERROR_MESSAGES[access])}
        </p>
      )}
      {access === 'ready' && (
        <>
          <div className="ai-edit-quick-actions">
            {(config.settings.aiEdit?.quickActions || []).map((action) => (
              <button
                key={action.id}
                type="button"
                className="ai-edit-chip"
                disabled={loading}
                onClick={() => send(formatText(intl, action.prompt))}
              >
                {formatText(intl, action.label)}
              </button>
            ))}
          </div>

          {(conversation.length > 0 || loading) && (
            <div className="ai-edit-conversation">
              {conversation.map((message, index) => (
                <div key={index} className={`ai-edit-message ${message.role}`}>
                  {message.error ? (
                    <p className="ai-edit-error">
                      {intl.formatMessage(
                        ERROR_MESSAGES[message.error] || messages.error,
                      )}
                    </p>
                  ) : message.notice ? (
                    <Notice message={message} />
                  ) : (
                    message.content && (
                      <p className="ai-edit-text">{message.content}</p>
                    )
                  )}
                  {message.role === 'assistant' && !message.error && (
                    <>
                      {message.changes?.length > 0 ? (
                        <div className="ai-edit-proposals-summary">
                          {/* Count and status on the left, the button
                              always on the right */}
                          <span className="ai-edit-proposals-info">
                            <span className="ai-edit-proposals-count">
                              {intl.formatMessage(messages.proposed, {
                                count: message.changes.length,
                              })}
                            </span>
                            <AppliedStatus
                              applied={message.applied.length}
                              count={message.changes.length}
                            />
                          </span>
                          <button
                            type="button"
                            // Once applied (fully or partly) it steps back
                            className={`ai-edit-button ${
                              message.applied.length ? 'done' : 'primary'
                            }`}
                            onClick={() => setReviewIndex(index)}
                          >
                            {intl.formatMessage(messages.review)}
                          </button>
                        </div>
                      ) : (
                        // A dropped proposal is said in the warnings
                        !message.content &&
                        !message.dropped?.length && (
                          <p className="ai-edit-text">
                            {intl.formatMessage(messages.noChanges)}
                          </p>
                        )
                      )}
                      <Warnings message={message} />
                    </>
                  )}
                </div>
              ))}
              {loading && (
                <p className="ai-edit-loading">
                  {intl.formatMessage(messages.thinking)}
                </p>
              )}
            </div>
          )}

          <form
            className="ai-edit-input"
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <textarea
              rows={2}
              value={input}
              disabled={loading}
              aria-label={intl.formatMessage(messages.placeholder)}
              placeholder={intl.formatMessage(messages.placeholder)}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends, Shift+Enter adds a new line. Stop propagation so
                // the block editor does not react to the keys.
                event.stopPropagation();
                // Not while an IME composition is active (e.g. Japanese input)
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  send(input);
                }
              }}
            />
            <button
              type="submit"
              className="ai-edit-send"
              disabled={loading || !input.trim()}
              aria-label={intl.formatMessage(messages.send)}
              title={intl.formatMessage(messages.send)}
            >
              <Icon name={sendSVG} size="20px" />
            </button>
          </form>
          <p className="ai-edit-disclaimer">
            {intl.formatMessage(messages.disclaimer)}
          </p>
        </>
      )}

      {reviewed && (
        <ReviewModal
          message={reviewed}
          formData={store.getState().form.global}
          profile={profile}
          links={links.current}
          created={createdBlocks(conversation)}
          onApply={onApply}
          onClose={() => setReviewIndex(null)}
        />
      )}
    </div>
  );
};

export default AIEditPanel;
