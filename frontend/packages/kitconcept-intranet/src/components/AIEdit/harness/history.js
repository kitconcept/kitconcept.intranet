/**
 * The conversation as the model gets it (spec §10, D14, AI_WORKFLOW.md).
 *
 * The browser keeps the conversation; every request sends it again in the
 * chat completions format. Past tool calls go back structured, compacted to
 * the changes that survived validation, the repair call and superseding
 * (repair attempts are not kept). Each is followed by a tool result the
 * harness writes: neutral, grouped by status, naming the refs of blocks the
 * applied changes created. The current page stays the only source of truth.
 *
 * A conversation entry (panel state):
 *
 *     {role: 'user', content, selected: [block ids]}
 *     {role: 'assistant', content, callId, changes, dropped, warnings,
 *      baseFormData, applied: [change keys], created: {key: {ids}},
 *      error?}
 */
import { proposeCall } from './operations';

/** The operations of the changes that survived, in the model's format. */
export const operationsOf = (changes = []) => {
  const operations = [];
  const edits = new Map();
  changes.forEach((change) => {
    const common = { reason: change.reason, category: change.opCategory };
    if (change.replacements) {
      // As the model sent them: short, and the rest of the text was kept.
      // The harness's suggestions (D42) are not the model's operations.
      change.replacements
        .filter((replacement) => !replacement.suggested)
        .forEach((replacement) =>
          operations.push({
            op: 'replace_text',
            ...(change.kind === 'block_field' ? { block: change.ref } : {}),
            field: change.field,
            find: replacement.find,
            replace: replacement.replace,
            reason: replacement.reason,
            category: replacement.category,
          }),
        );
    } else if (change.kind === 'page_field') {
      operations.push({
        op: 'set_page_field',
        field: change.field,
        // A cleared field as the model cleared it (D57)
        value: change.cleared ? null : change.value,
        ...common,
      });
    } else if (change.kind === 'block_field') {
      // One edit_block per original operation, with its surviving fields
      const key = `${change.number}:${change.id}`;
      if (!edits.has(key)) {
        const edit = {
          op: 'edit_block',
          block: change.ref,
          fields: {},
          ...common,
        };
        edits.set(key, edit);
        operations.push(edit);
      }
      edits.get(key).fields[change.field] = change.cleared
        ? null
        : change.value;
    } else if (change.kind === 'insert') {
      operations.push({
        op: 'insert_block',
        [change.position]: change.anchorRef,
        // Always with its type: required since D50, and the model copies
        // its history (a code review)
        type: change.type,
        fields: Object.fromEntries(
          Object.entries(change.fields).map(([name, field]) => [
            name,
            field.value,
          ]),
        ),
        ...common,
      });
    } else if (change.kind === 'move') {
      operations.push({
        op: 'move_block',
        block: change.ref,
        after: change.anchorRef,
        ...common,
      });
    } else {
      operations.push({ op: 'delete_block', block: change.ref, ...common });
    }
  });
  return operations;
};

/**
 * The result of a past call as the model reads it: what was applied (and
 * which blocks that created), what not, what was replaced or unusable,
 * what was identical to the page. Facts only, neutrally worded: "not
 * applied" read as a rejection steered the model away from those blocks.
 */
export const toolResult = (message, refs = {}) => {
  const applied = message.applied || [];
  // A delete is only "deleted" once applied; most are not (they start
  // unselected), and the block is still on the page
  const name = (change) => {
    if (change.kind === 'delete') {
      return applied.includes(change.key)
        ? `${change.ref} (deleted)`
        : `deletion of ${change.ref}`;
    }
    const created = (message.created?.[change.key]?.ids || [])
      .map((id) => refs[id])
      .filter(Boolean);
    return created.length
      ? `${change.label} (new blocks: ${created.join(', ')})`
      : change.label;
  };
  // The harness's suggestions (D42) are not the model's: an applied one
  // is named apart, an open one not at all (the model never proposed it)
  const own = (change) =>
    !change.replacements?.every((replacement) => replacement.suggested);
  const changes = message.changes || [];
  const done = changes.filter(
    (change) => own(change) && applied.includes(change.key),
  );
  const found = changes.filter(
    (change) => !own(change) && applied.includes(change.key),
  );
  const open = changes.filter(
    (change) => own(change) && !applied.includes(change.key),
  );
  const warnings = message.warnings || [];
  const details = (code) =>
    warnings.filter((w) => w.code === code).map((w) => w.detail);
  const superseded = details('superseded');
  const unchanged = details('unchanged');
  const dropped = (message.dropped || []).map(
    ({ number, label, codes }) =>
      `${label || (number ? `operation ${number}` : 'a call')} (${codes.join(', ')})`,
  );
  const parts = [
    done.length && `Applied: ${done.map(name).join(', ')}.`,
    found.length &&
      `Also applied, found on the page by the search (same change, not proposed by you): ${found.map(name).join(', ')}.`,
    open.length && `Not applied: ${open.map(name).join(', ')}.`,
    superseded.length &&
      `Replaced by a later change: ${superseded.join(', ')}.`,
    dropped.length && `Could not be used: ${dropped.join(', ')}.`,
    unchanged.length &&
      `Sent unchanged, identical to the current page, so nothing changed: ${unchanged.join(', ')}.`,
  ].filter(Boolean);
  if (!parts.length) return 'Nothing of this call could be used.';
  return `${parts.join(' ')} The current page is the source of truth.`;
};

/**
 * A request as the model reads it: headed by the refs of the blocks
 * selected when it was sent (ids are kept, refs never change, D21). Only
 * the page marks the current selection: a past "this block" next to it
 * made the model reuse the earlier block.
 */
export const userMessage = ({ content, selected = [] }, refs = {}) => {
  const names = selected.map((id) => refs[id]).filter(Boolean);
  return {
    role: 'user',
    content: `Selected: ${names.join(', ') || 'none'}\n\n${content || ''}`,
  };
};

const hadCall = (message) =>
  message.changes?.length ||
  message.dropped?.length ||
  message.warnings?.some((w) => w.code === 'unchanged');

/**
 * The conversation in the chat completions format. Failed answers and the
 * request that caused them are left out. `refs` (block id -> ref) are the
 * current ones, so created blocks are named as the page shows them.
 * Proposals go back as one `propose_changes` call with their result.
 */
export const modelHistory = (conversation, refs = {}) =>
  conversation
    .filter(
      (message, index) => !message.error && !conversation[index + 1]?.error,
    )
    .flatMap((message) => {
      if (message.role === 'user') return [userMessage(message, refs)];
      if (!hadCall(message)) {
        return [{ role: message.role, content: message.content || '' }];
      }
      const id = message.callId || 'call_0';
      // The message goes back where the model put it (D46)
      const fromTool = message.contentFromTool && message.content;
      const operations = operationsOf(message.changes);
      return [
        {
          role: 'assistant',
          content: fromTool ? '' : message.content || '',
          tool_calls: [
            proposeCall(id, {
              ...(fromTool ? { message: message.content } : {}),
              operations,
            }),
          ],
        },
        { role: 'tool', tool_call_id: id, content: toolResult(message, refs) },
      ];
    });
