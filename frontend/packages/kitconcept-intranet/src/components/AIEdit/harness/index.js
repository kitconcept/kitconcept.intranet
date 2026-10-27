/**
 * The harness: one turn of AI-assisted editing (spec §5, AI_WORKFLOW.md).
 * Pure JS: the panel and the eval runner call it with their own `send`.
 *
 * 1. Project the live form into the page, with refs and the selection.
 * 2. Fit the conversation into the context budget.
 * 3. One request (`send`).
 * 4. Validate the operations of the answer.
 * 5. If some are invalid: one repair request in the same turn with the
 *    concrete errors (D8). Its proposal replaces the first one (D51):
 *    the model can withdraw a mistake there; still invalid operations
 *    are dropped and reported.
 * 6. Leftovers (leftovers.js, D42): what the replacements left on the
 *    page becomes suggested replacements of the harness, validated like
 *    the model's; what cannot be computed is listed for the review.
 * 7. Changes for the review (per field, superseding applied).
 *
 * Returns `{refs, message}`: the conversation's updated block refs and the
 * assistant's entry for the conversation (see history.js), or one with an
 * `error` code.
 */
import { blockTypesForRequest, projectPage } from './projection';
import { fitMessages } from './budget';
import { modelHistory, userMessage } from './history';
import {
  TOOL_NAME,
  createValidator,
  describeOperation,
  isRepairable,
  operationsFromToolCalls,
  proposeCall,
  repairText,
} from './operations';
import { isMassDeletion, toChanges } from './changes';
import { scanDependents, scanLeftovers } from './leftovers';
import { danglingReferences, referencesText } from './references';

export { applyChanges, isMassDeletion, isStale } from './changes';
export { modelHistory, userMessage } from './history';

/**
 * A repair's insert without `type` corrects the first answer's insert at
 * the same place (D55): it keeps that one's type, when only one type was
 * there. A browser test: the repair added the button's label it was
 * asked for and left out `"type": "__button"`, so the whole proposal was
 * dropped. Not an inference from the fields (D50): the model's own type.
 */
const withKeptTypes = (operations, earlier) => {
  const place = (raw) => `${raw?.after ?? ''}|${raw?.into ?? ''}`;
  const warnings = [];
  const kept = operations.map((operation) => {
    const { raw } = operation;
    const typed =
      raw?.type ||
      raw?.fields?.type ||
      raw?.fields?.['@type'] ||
      raw?.['@type'];
    if (raw?.op !== 'insert_block' || typed) return operation;
    const types = [
      ...new Set(
        earlier
          .map(({ operation: first }) => first.raw)
          .filter(
            (first) =>
              first?.op === 'insert_block' &&
              typeof first.type === 'string' &&
              place(first) === place(raw),
          )
          .map((first) => first.type),
      ),
    ];
    if (types.length !== 1) return operation;
    warnings.push({
      code: 'type_kept',
      detail: `insert_block ${raw.after || raw.into}: ${types[0]}`,
      number: operation.number,
    });
    return { ...operation, raw: { ...raw, type: types[0] } };
  });
  return { operations: kept, warnings };
};

/** Operations of an answer, validated; numbers continue after `offset`. */
const check = (toolCalls, offset, validate, earlier = []) => {
  const { operations, errors } = operationsFromToolCalls(toolCalls || []);
  const kept = withKeptTypes(
    operations.map((operation) => ({
      ...operation,
      number: operation.number + offset,
    })),
    earlier,
  );
  const result = validate(kept.operations);
  return {
    count: kept.operations.length,
    operations: kept.operations,
    callErrors: errors,
    ...result,
    warnings: [...kept.warnings, ...result.warnings],
  };
};

/**
 * The model's calls as the repair request repeats them: readable ones as
 * they were, an unreadable one (broken JSON, unknown tool) as an empty
 * call. The backend keeps only well-formed calls in the history, and a
 * tool result needs its call: without this the repair request would be
 * refused exactly when the first answer was broken.
 */
const repairCalls = (calls) =>
  calls.map((call, index) => {
    const id = call?.id || `call_${index}`;
    const { operations, errors } = operationsFromToolCalls([call]);
    return proposeCall(
      id,
      errors.length ? {} : { operations: operations.map((o) => o.raw) },
    );
  });

// The note of the retry after an empty answer (D47)
export const EMPTY_ANSWER_NOTE = `(Your previous answer was empty. Answer in text; or call ${TOOL_NAME} with valid JSON arguments. If the request is not possible with the operations and block types you have, say so in text.)`;

// Changes written as text instead of a tool call (D57): op-shaped JSON,
// a tool's name with arguments, or a call in the model's own tool format
// (`<tools>{"name": "edit_block", ...}`, shown to the editor in the D57
// A/B run). An eval run did it in 5 of 63 turns
export const TEXT_CALL =
  /"op"\s*:\s*"|"operations"\s*:|\b(?:set_page_field|edit_block|replace_text|insert_blocks?|delete_block|move_block|propose_changes)\s*\(|"name"\s*:\s*"(?:set_page_field|edit_block|replace_text|insert_blocks?|delete_block|move_block|propose_changes)"|<tool_?calls?>/;

// The note of the retry after changes written as text (D57)
export const TEXT_CALL_NOTE = `(Your previous answer wrote the changes as text instead of calling ${TOOL_NAME}. Nothing is proposed that way: call ${TOOL_NAME} with the changes, or answer in text only if you need something from the user.)`;

// What a new block's type is called in a question (`__button` -> button)
const typeLabel = (type) => String(type || '').replace(/^_+/, '');

/**
 * The harness's question for required fields the user did not give
 * (D57): the insert is dropped and the user asked, instead of a repair
 * that invites the model to invent them (D55). In English for the
 * history; the panel shows its own words (`notice`).
 */
const questionText = (questions) =>
  questions
    .map(
      ({ type, field }) =>
        `What should the ${field} of the new ${typeLabel(type)} block be?`,
    )
    .join(' ');

// The harness's explanation when nothing of a proposal could be used
// (D57): the model's words described what was dropped
const droppedText = (codes) =>
  codes.includes('not_insertable')
    ? 'This block type cannot be added by the assistant: add it in the editor.'
    : 'The proposal could not be used.';

// Characters per token the budget may assume at most (prose with markup
// is about 4; JSON of the request without ids measured at about 5)
const MAX_CHARS_PER_TOKEN = 6;

/** The request's page as the budget counts it: ids are not in the prompt. */
const pageSize = (page, blockTypes) =>
  JSON.stringify({ page, block_types: blockTypes }, (key, value) =>
    key === 'id' ? undefined : value,
  ).length;

/**
 * Characters per token measured in this conversation (D57): the last
 * answer's reported prompt tokens against the request's size. The
 * profile's 3 is a safe guess before any call; on the summit page it
 * left no room for a repair, which was skipped silently.
 */
const measuredCharsPerToken = (conversation, fallback) => {
  const last = [...conversation]
    .reverse()
    .find((entry) => entry.role === 'assistant' && entry.charsPerToken);
  return clampedCharsPerToken(last?.charsPerToken, fallback);
};

/**
 * A measured ratio within what a prompt can have: never below the
 * profile's guess, never above 6 (a code review: a raw ratio from a cut
 * input, about 20, let the next turns grow far past the context).
 */
const clampedCharsPerToken = (ratio, fallback) =>
  ratio ? Math.min(MAX_CHARS_PER_TOKEN, Math.max(fallback, ratio)) : fallback;

const dropped = (invalid, callErrors) => [
  ...invalid.map(({ operation, errors }) => ({
    number: operation.number,
    // What it was, for the tool result ("insert_block after b22")
    label: describeOperation(operation.raw),
    codes: errors.map((e) => e.code),
    messages: errors.map((e) => e.message),
    // What a harness question needs (missing_field: type and field)
    ...(errors.some((e) => e.detail)
      ? { details: errors.map((e) => e.detail).filter(Boolean) }
      : {}),
  })),
  ...callErrors.map((e) => ({ codes: [e.code], messages: [e.message] })),
];

/**
 * One turn. `text` is the editor's request; `formData` the live form;
 * `selected` the ids of the selected blocks; `conversation` the entries so
 * far; `refs` and `links` the conversation's block refs and placeholder
 * registry (`links` is extended in place); `budget` the values of
 * `GET @ai-edit` (`contextLength`, `reserveTokens`, `fixedPromptChars`);
 * `send(request)` resolves to the `@ai-edit` response (errors as
 * `{error_code}`); `vocabulary` is the backend's (`GET @ai-edit`:
 * operations, categories, structural tags).
 */
export const runTurn = async ({
  text,
  formData,
  selected = [],
  profile,
  conversation = [],
  refs = {},
  links = {},
  budget = {},
  language,
  send,
  vocabulary,
  // The panel's schema check (D53, profile/buildProfile.js); none in the
  // eval
  visibleFields,
}) => {
  const projected = projectPage({
    formData,
    profile,
    links,
    refs,
    selected,
    visibleFields,
  });
  const { page } = projected;
  const blockTypes = blockTypesForRequest(profile, page);
  const pageChars = pageSize(page, blockTypes);
  const fixedChars = budget.fixedPromptChars;
  let charsPerToken = measuredCharsPerToken(
    conversation,
    profile.charsPerToken,
  );
  const fit = (messages) =>
    fitMessages({
      messages,
      pageChars,
      fixedChars,
      contextLength: budget.contextLength,
      reserveTokens: budget.reserveTokens,
      charsPerToken,
    });
  const fail = (error) => ({
    refs: projected.refs,
    message: { role: 'assistant', error },
  });

  const first = fit([
    ...modelHistory(conversation, projected.refs),
    userMessage({ content: text, selected }, projected.refs),
  ]);
  if (first.tooLong) return fail('page_too_long');
  const request = {
    language,
    page,
    block_types: blockTypes,
  };
  let answer = await send({ ...request, messages: first.messages });
  if (answer.error_code) return fail(answer.error_code);
  // The real size of the prompt: the budget of the repair and of later
  // turns (D57)
  // Not from a cut input: its count is of what the gateway kept (D43)
  const promptTokens = answer.usage?.input_truncated
    ? null
    : answer.usage?.prompt_tokens;
  const measured = promptTokens
    ? (fixedChars || 0) + pageChars + JSON.stringify(first.messages).length
    : 0;
  if (promptTokens) {
    charsPerToken = clampedCharsPerToken(
      measured / promptTokens,
      profile.charsPerToken,
    );
  }
  const isEmpty = (a) => !a.message?.trim() && !a.tool_calls?.length;
  // One more try with a note, the turn's one extra call: after an empty
  // answer that was not cut off (the gateway dropped what the model
  // wrote, or it gave up; D47), or after changes written as text instead
  // of a call (D57)
  const retryReason =
    isEmpty(answer) && answer.finish_reason !== 'length'
      ? 'empty'
      : !answer.tool_calls?.length && TEXT_CALL.test(answer.message || '')
        ? 'text_call'
        : null;
  const retried = !!retryReason;
  const usage = [answer.usage];
  if (retried) {
    const last = first.messages.at(-1);
    const note = retryReason === 'empty' ? EMPTY_ANSWER_NOTE : TEXT_CALL_NOTE;
    answer = await send({
      ...request,
      messages: [
        ...first.messages.slice(0, -1),
        { ...last, content: `${last.content}\n\n${note}` },
      ],
    });
    if (answer.error_code) return fail(answer.error_code);
    usage.push(answer.usage);
  }
  // The model's words for the user: its text, else the `message` it is
  // required to put in the tool call (D46; it rarely writes text next to
  // a tool call)
  const toolMessage = operationsFromToolCalls(
    answer.tool_calls || [],
  ).messages.join(' ');
  let content = answer.message?.trim() || toolMessage;
  let contentFromTool = !answer.message?.trim() && !!toolMessage;
  if (isEmpty(answer)) {
    return fail(
      answer.finish_reason === 'length' ? 'truncated' : 'empty_answer',
    );
  }

  const validatorFor = () =>
    createValidator({
      page,
      profile,
      links,
      vocabulary,
      request: text,
      formData,
      visibleFields,
    });
  let validate = validatorFor();
  const firstCheck = check(answer.tool_calls, 0, validate);
  let valid = firstCheck.valid;
  // The operations `valid` was validated from (the first answer's or the
  // repair's), for a correction of dependent dates (D59)
  let proposed = firstCheck.operations;
  let warnings = firstCheck.warnings;
  // Only what a repair can fix is asked for again; the rest is dropped
  const toRepair = firstCheck.invalid.filter(isRepairable);
  const notPossible = firstCheck.invalid.filter((i) => !isRepairable(i));
  let failed = dropped(firstCheck.invalid, firstCheck.callErrors);
  let truncated = answer.finish_reason === 'length';
  let repaired = false;
  let repairSkipped = false;
  let count = firstCheck.count;

  // Text that refers to a block the proposal deletes (D59): asked for
  // in the same extra call, alone when nothing needs a repair
  const references = danglingReferences({
    operations: firstCheck.valid,
    page,
    links,
  });
  const needsRepair = !!(toRepair.length || firstCheck.callErrors.length);
  let referencesAsked = false;

  // One repair call (D8), not for an answer that was cut off, nor after
  // the retry of an empty answer (one extra call per turn)
  if ((needsRepair || references.length) && !truncated && !retried) {
    const calls = repairCalls(answer.tool_calls);
    const second = fit([
      ...first.messages,
      { role: 'assistant', content: answer.message || '', tool_calls: calls },
      ...calls.map((call, index) => ({
        role: 'tool',
        tool_call_id: call.id,
        content:
          index === 0
            ? [
                needsRepair &&
                  repairText(toRepair, firstCheck.callErrors, notPossible),
                references.length && referencesText(references),
              ]
                .filter(Boolean)
                .join('\n\n')
            : 'See the result of the first call.',
      })),
    ]);
    // Logged, not silent (D57): an eval run lost three repairs this way
    if (second.tooLong) {
      repairSkipped = true;
      warnings = [...warnings, { code: 'repair_too_long' }];
    }
    if (!second.tooLong) {
      const repair = await send({
        ...request,
        messages: second.messages,
        repair: true,
      });
      if (!repair.error_code) {
        // A call for references alone is no repair (the first answer was
        // valid): counted apart
        repaired = needsRepair;
        referencesAsked = references.length > 0;
        usage.push(repair.usage);
        truncated = repair.finish_reason === 'length';
        // The repair's proposal replaces the first one (D51), checked on
        // its own: the operations it leaves out are withdrawn. Without a
        // proposal (text only), the first answer's valid ones stay; so
        // they do when nothing of the repair's proposal can be used (D58:
        // a repair resent 2 of 16 operations, both invalid, and the 15
        // valid ones of the first answer were lost). An empty proposal
        // still withdraws everything.
        if (repair.tool_calls?.length) {
          validate = validatorFor();
          const secondCheck = check(
            repair.tool_calls,
            firstCheck.count,
            validate,
            toRepair,
          );
          const unusable =
            !secondCheck.valid.length &&
            (secondCheck.invalid.length || secondCheck.callErrors.length);
          if (unusable && firstCheck.valid.length) {
            validate = validatorFor();
            const again = validate(firstCheck.operations);
            valid = again.valid;
            proposed = firstCheck.operations;
            warnings = [...again.warnings, { code: 'repair_unusable' }];
          } else {
            valid = secondCheck.valid;
            proposed = secondCheck.operations;
            warnings = secondCheck.warnings;
          }
          failed = [
            ...dropped(notPossible, []),
            ...dropped(secondCheck.invalid, secondCheck.callErrors),
          ];
          count += secondCheck.count;
          // Its words describe the proposal that stands (D46)
          const repairMessage = operationsFromToolCalls(
            repair.tool_calls,
          ).messages.join(' ');
          if (!unusable && (repair.message?.trim() || repairMessage)) {
            content = repair.message?.trim() || repairMessage;
            contentFromTool = !repair.message?.trim();
          }
        }
      }
    }
  }

  // Dates that depend on a changed one (D59): one the model wrote
  // wrongly is corrected, when the corrected proposal is still valid
  const dependents = scanDependents({
    page,
    profile,
    operations: valid,
    changes: toChanges(valid, { page }).changes,
  });
  if (dependents.corrections.length) {
    const fixes = new Map(
      dependents.corrections.map((fix) => [fix.number, fix.replace]),
    );
    const revalidate = validatorFor();
    const corrected = revalidate(
      proposed.map((operation) =>
        fixes.has(operation.number)
          ? {
              ...operation,
              raw: { ...operation.raw, replace: fixes.get(operation.number) },
            }
          : operation,
      ),
    );
    if (corrected.valid.length === valid.length) {
      validate = revalidate;
      valid = corrected.valid;
      warnings = [
        ...warnings,
        ...dependents.corrections.map(({ detail }) => ({
          code: 'dependent_corrected',
          detail,
        })),
      ];
    }
  }

  // What the replacements left: suggested by the harness (D42), and the
  // dependent dates nobody changed (D59), checked by the same validator
  // (overlaps, conflicts with the answer)
  const leftoverScan = scanLeftovers({
    page,
    profile,
    operations: valid,
    changes: toChanges(valid, { page }).changes,
  });
  const scan = {
    ...leftoverScan,
    suggestions: [...dependents.suggestions, ...leftoverScan.suggestions],
  };
  const suggested = validate(
    scan.suggestions.map((suggestion, index) => ({
      raw: suggestion.raw,
      number: count + index + 1,
      source: 'check',
    })),
  );
  const usable = new Set(suggested.valid.map((op) => op.number - count - 1));
  const leftovers = [
    ...scan.suggestions
      .filter((_, index) => !usable.has(index))
      .map(({ label, excerpt, match }) => ({ label, excerpt, match })),
    ...scan.leftovers,
  ];
  valid = [...valid, ...suggested.valid];

  const built = toChanges(valid, { page });
  const superseded = built.warnings;
  // A fix of text that refers to a deleted block belongs to the deletion
  // (D59): unselected like it, so that both or neither are applied
  const deletedRefs = new Set(
    built.changes.filter((c) => c.kind === 'delete').map((c) => c.ref),
  );
  const referring = new Map(
    references
      .filter((reference) => deletedRefs.has(reference.target))
      .map((reference) => [reference.label, reference.target]),
  );
  const changes = built.changes.map((change) =>
    change.kind === 'block_field' && referring.has(change.label)
      ? {
          ...change,
          selected: false,
          confirm: true,
          flags: {
            ...change.flags,
            refersToDeleted: referring.get(change.label),
          },
        }
      : change,
  );
  // Required fields the user did not give: the harness asks (D57)
  const questions = [
    ...new Map(
      failed
        .flatMap((entry) => entry.details || [])
        .filter(Boolean)
        .map((detail) => [`${detail.type}:${detail.field}`, detail]),
    ).values(),
  ];
  let notice = null;
  // The model's own words, for the panel next to the harness's (the
  // history gets `content`)
  const modelContent = content;
  if (questions.length) {
    notice = { kind: 'question', questions };
    const asked = questionText(questions);
    content = changes.length ? `${content} ${asked}`.trim() : asked;
    contentFromTool = false;
  } else if (!changes.length && failed.length) {
    // Nothing usable: the model's words described what was dropped
    const codes = [...new Set(failed.flatMap((entry) => entry.codes))];
    notice = { kind: 'dropped', codes };
    content = droppedText(codes);
    contentFromTool = false;
  }
  return {
    refs: projected.refs,
    message: {
      role: 'assistant',
      content,
      // Where `content` came from: the history puts it back there
      contentFromTool,
      callId: answer.tool_calls?.[0]?.id,
      changes,
      // The review warns above the changes (D20)
      massDeletion: isMassDeletion(changes, page),
      // Text that still refers to a block this proposal deletes (D59),
      // listed in the review like the leftovers
      references: danglingReferences({ operations: valid, page, links }).map(
        ({ label, excerpt, match }) => ({ label, excerpt, match }),
      ),
      // The extra call asked for them (D59)
      referencesAsked,
      dropped: failed,
      warnings: [...warnings, ...superseded],
      truncated,
      // The first answer was asked for again (D47, D57): `empty` or
      // `text_call`
      retried,
      retryReason,
      // A repair the context budget had no room for (D57)
      repairSkipped,
      // The harness's own words for the editor (D57): a question for
      // missing required fields, or why nothing could be used
      notice,
      modelContent,
      // For the budget of the next turns (D57)
      charsPerToken: promptTokens
        ? Math.round(charsPerToken * 100) / 100
        : undefined,
      // The gateway cut the input (its context is too small): the model
      // saw only part of the page and the rules (backend usage)
      inputTruncated: usage.some((u) => u?.input_truncated),
      repaired,
      // What the replacements left (D42): suggestions are among the
      // changes; these are the places that could not be suggested
      suggested: suggested.valid.length,
      leftovers,
      // How the model's first answer did, for the eval (repair rate)
      firstAttempt: {
        operations: firstCheck.count,
        invalid: firstCheck.invalid.length,
        callErrors: firstCheck.callErrors.length,
      },
      usage,
      baseFormData: formData,
      applied: [],
      created: {},
    },
  };
};
