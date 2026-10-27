/**
 * The context budget (spec §4, D22, D33, AI_WORKFLOW.md): keeps every
 * request inside the gateway's context so it is never truncated silently.
 *
 * Deliberately rough: characters ÷ `charsPerToken` (3 by default; ÷ 4 is an
 * English rule of thumb and undercounts German), against the context length
 * minus a reserve for reasoning and the answer. The page and block types
 * are measured as the JSON the request carries, a little more than the
 * prompt they become. At most the last `MAX_TURNS` turns are sent; when
 * they don't fit, the oldest whole turns are dropped (a turn is the user
 * message, the answer and the results of its calls, never split, D33). The
 * page and the current turn are never dropped: a request they don't fit
 * into is not sent.
 */

export const MAX_TURNS = 10;

const size = (value) => JSON.stringify(value).length;

/** Messages split into turns, each starting with a user message. */
export const turnsOf = (messages) =>
  messages.reduce((turns, message) => {
    if (message.role === 'user' || !turns.length) turns.push([message]);
    else turns[turns.length - 1].push(message);
    return turns;
  }, []);

/**
 * The messages to send: `{messages, droppedTurns}`, or `{tooLong: true}`.
 * `pageChars`: the size of page and block types; `fixedChars`: base
 * prompt, tool rules and definition (from `GET @ai-edit`). Without a
 * `contextLength` only the turn limit applies.
 */
export const fitMessages = ({
  messages,
  pageChars = 0,
  fixedChars = 0,
  contextLength,
  reserveTokens = 0,
  charsPerToken = 3,
}) => {
  const all = turnsOf(messages);
  let turns = all.slice(-MAX_TURNS);
  if (contextLength) {
    const available = (contextLength - reserveTokens) * charsPerToken;
    const total = () => fixedChars + pageChars + size(turns.flat());
    while (turns.length > 1 && total() > available) turns = turns.slice(1);
    if (total() > available) return { tooLong: true };
  }
  return { messages: turns.flat(), droppedTurns: all.length - turns.length };
};
