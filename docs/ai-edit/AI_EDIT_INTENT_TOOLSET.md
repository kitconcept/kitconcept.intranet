# AI-assisted editing: the intent toolset (removed, D58)

A snapshot of the second tool architecture built for the A/B comparison
of D57 and removed after it (D58, [AI_WORKFLOW.md](AI_WORKFLOW.md) §14).
It holds the result of the comparison and enough of the implementation,
verbatim, to build it again in essence. The code below is as it was on
2026-10-23; the files it names no longer exist or no longer have these
parts.

## 1. What it was

Two toolsets with the same operations, rules and harness (D57):

| | `list` (A, kept) | `intent` (B, removed) |
|---|---|---|
| Tools | `propose_changes` | `set_page_field(field, value)`, `edit_block(ref, changes)`, `replace_text(ref, field, find, replace)`, `insert_block(type, after_ref \| into_ref, data)`, `insert_blocks(after_ref \| into_ref, blocks)`, `delete_block(ref)`, `move_block(ref, after_ref)` |
| Calls per answer | one, with `operations` | one per change, in parallel |
| Schema | items with an `op` | each tool flat; `reason` required, `category` optional |
| `message` | required | optional on every tool ("first call only" in the schema) |

The question it tested: a research note claimed that flat, intent-named
tools suit small models better than one tool with polymorphic items
(D57). Both toolsets parsed into the same harness operations, so
everything after parsing (validation, repair, leftovers, changes,
review, apply) and the eval's grading were shared; a parity test checked
that one proposal in both shapes gave the same changes, history and
review.

## 2. The comparison (2026-10-22)

`qwen3:14b`, `num_ctx` 16384, thinking on, native function calling,
23 cases (14 `blocks-*`, 9 `summit-*`) × 5 repeats, both toolsets
alternating per repeat in one session (eval version 3). Files:
`frontend/eval/results/2026-10-22T14-05-02-667Z-qwen3_14b_ctx16384_thinking_D57_AB-{list,intent}.json`.

| | list | intent |
|---|---|---|
| Clean passes | 78/115 (0.678) | 79/115 (0.687) |
| Block cases (14) | 0.914 | 0.943 |
| Summit cases (9) | 0.311 | 0.289 |
| Cases passing 5/5 | 12 | 12 |
| Failed calls | 1 (empty answer, translate) | 0 |
| Dropped operations | 31 | 26 |
| Repairs | 9 | 15 |
| Retries: empty / changes as text | 6 / 3 | 4 / 0 |
| Turns with words for the editor | 113/115 | 87/115 |
| Fixed prompt (rules + tools) | 12,557 chars | 16,457 chars |
| Prompt tokens per call | ~5,150 | ~5,930 |
| Completion tokens per turn | 687 | 845 |
| Time per turn, mean / median | 37.7 s / 21.6 s | 42.3 s / 22.8 s |

Paired over the 115 runs (bootstrap, 95 %): pass difference −0.9 points
(−7.8 to +6.1): the same quality at this sample size, and n=5 cannot
show a difference under about 7 points. Time −4.6 s for list (−9.3 to
−0.1), median −1 s, list faster in 11 of 23 cases: a small edge from a
few long cases (contacts, tone, date), not a general one. Completion
tokens −100 per turn for list (−209 to +7). Prompt tokens are a fixed
cost of the seven tool schemas: about 780 more per call for intent.

Per case, clean pass@1 and turns with words for the editor:

| Case | pass@1 list | pass@1 intent | words list | words intent | s list | s intent |
|---|---|---|---|---|---|---|
| blocks-1-text | 0.6 | 0.8 | 1.0 | 0.8 | 17 | 15 |
| blocks-2-heading-text | 1.0 | 1.0 | 1.0 | 0.2 | 20 | 27 |
| blocks-3-button | 1.0 | 1.0 | 1.0 | 0.8 | 20 | 20 |
| blocks-4-button-no-link | 1.0 | 1.0 | 1.0 | 1.0 | 17 | 28 |
| blocks-5-button-no-label | 0.4 | 0.6 | 1.0 | 1.0 | 23 | 42 |
| blocks-6-separator | 1.0 | 1.0 | 1.0 | 0.8 | 11 | 12 |
| blocks-7-video | 1.0 | 0.8 | 1.0 | 0.6 | 11 | 11 |
| blocks-8-video-no-url | 1.0 | 1.0 | 1.0 | 1.0 | 64 | 69 |
| blocks-9-no-position | 1.0 | 1.0 | 1.0 | 0.8 | 17 | 17 |
| blocks-10-selected-default | 1.0 | 1.0 | 1.0 | 0.2 | 10 | 8 |
| blocks-11-image | 1.0 | 1.0 | 1.0 | 1.0 | 22 | 35 |
| blocks-12-row | 0.8 | 1.0 | 1.0 | 0.0 | 24 | 23 |
| blocks-13-move | 1.0 | 1.0 | 0.8 | 0.6 | 14 | 15 |
| blocks-14-clear-link | 1.0 | 1.0 | 1.0 | 0.8 | 14 | 12 |
| summit-1-date | 0.4 | 0.2 | 1.0 | 0.8 | 62 | 86 |
| summit-2-attendee | 0.6 | 0.6 | 1.0 | 0.6 | 65 | 60 |
| summit-3-parking | 0.2 | 0.0 | 1.0 | 0.6 | 29 | 32 |
| summit-4-translate | 0.0 | 0.0 | 1.0 | 1.0 | 181 | 161 |
| summit-5-shorten | 0.4 | 0.0 | 1.0 | 1.0 | 35 | 32 |
| summit-6-contacts | 0.2 | 0.6 | 1.0 | 1.0 | 73 | 108 |
| summit-7-formal | 0.0 | 0.0 | 1.0 | 1.0 | 60 | 94 |
| summit-8-alt | 0.0 | 0.2 | 1.0 | 1.0 | 49 | 43 |
| summit-9-list | 1.0 | 1.0 | 1.0 | 0.8 | 28 | 24 |

Findings:
- **Words for the editor**: intent left `message` out in 30 of its 112
  answers with calls (0 of 5 in blocks-12, 1 of 5 in blocks-2 and blocks-10).
  With several calls, it put a `message` into most of them (an answer
  of 28 calls carried 28); the harness joined them all, so the chat
  showed repetitive text. Once (summit-6) the text held a raw
  `<tools>{"name": "set_page_field", …}` block the retry check did not
  recognize. The spec said
  "the first counts"; the code joined every one.
- **Parallel calls work through the gateway**: Open WebUI → Ollama
  passed up to 28 calls of one answer (the open question of D57).
  Calls per answer: none 7, one 85, 2–8 20, 11–28 7.
- **Better in intent**: never wrote changes as JSON text (list 3
  times); 1 `empty_value` drop against list's 12 (11 in list's translate
  runs, empty styling values); every blocks-12 run used `insert_blocks`
  (one list run chained `insert_block` on existing refs).
- **Worse in intent**: the largest loss of the run, summit-7 run 5: 16
  operations, 1 invalid; the repair resent 2, both invalid, and since a
  repair's proposal replaces the first one (D51), 15 valid changes were
  lost ("The proposal could not be used"). Slower on blocks-4, blocks-5
  and blocks-11 (longer reasoning on optional fields), on contacts
  (108 s vs 73 s) and tone (94 s vs 61 s).
- **Shared by both** (the toolset did not matter): invented content in
  new text, alt texts written for unseen images, image inserts tried in
  every blocks-11 and summit-2 run, translate and tone 0 of 10, the
  translation's b5 ("On this page:") skipped in all 10 runs.

Decision (D58): keep `list`, remove `intent`. Same quality; list is
cheaper by a fixed ~780 prompt tokens per call, gives the editor words
almost always and one message per answer, and keeps one code path for
the harness, history and repair. The speed edge is small and not the
reason.

## 3. How it plugged in

A toolset was chosen per request and read the same way on both sides:

- **Backend** (`ai_edit/toolsets.py`): a `Toolset(name, tools,
  instructions, names)`; `instructions` were the toolset's "how to call"
  text followed by the shared rules (`rules.py`, `SHARED_RULES`), so the
  prompt differed only in that part and in the tool definitions.
  `toolset_for(name, default)` picked the request's `toolset`, else the
  site's (`KITCONCEPT_INTRANET_AI_EDIT_TOOLSET`, `list` by default);
  unknown names fell back to the site's. The history kept only calls of
  the toolset's tool names (`clean_history(messages, toolset.names)`).
  `GET @ai-edit` answered `toolset`, `toolsets` and
  `fixed_prompt_chars_by_toolset` (the budget of each).
- **Harness** (`harness/toolsets.js`): a toolset object
  `{name, callName, parse, toCalls, emptyCall, show}`:
  - `parse(toolCalls)` → `{operations, errors, messages}`: the
    harness's operations (`{raw, number, callId}`), unreadable calls,
    the `message`s found;
  - `toCalls(operations, {id, message})` → the calls that make them
    (for the history and the repair request);
  - `emptyCall(id)`: a readable call standing for an unreadable one
    (each tool result needs its call);
  - `show(operation)`: an operation as the repair message names it;
  - `callName`: how notes name the way to propose ("propose_changes",
    "the tools").
  `runTurn` took `toolset` (the request's), sent it in the request, used
  the toolset's fixed prompt size for the budget, and used the toolset
  for parsing, the retry notes, the repair calls and the repair message.
  `modelHistory(conversation, refs, toolset)` wrote past proposals in
  the toolset's shape: one call per change for intent, the first call's
  tool result describing all of them, the others "See the result of the
  first call."; when nothing survived, one empty call carried the
  result.
- **Panel**: `localStorage.setItem('aiEditToolset', 'intent')` chose
  the toolset in one browser.
- **Eval**: `EVAL_TOOLSET=intent`, or `EVAL_TOOLSETS=list,intent` to
  run both alternating per repeat (gateway load and warm-up hit both
  alike), each into its own file (`…-list.json`, `…-intent.json`);
  results carried `toolset`; the dashboard showed it per file.

## 4. The code

### 4.1 Backend: the intent tools (`ai_edit/intent_tools.py`)

```python
"""The intent toolset (B): one tool per kind of change (D57).

The comparison to the list toolset (``propose_changes.py``): the same
capabilities and rules (``rules.py``), but each change is its own call,
with a flat schema whose shape does not depend on another field's value,
and the tools named after what the user wants to do. The model calls
several tools in one answer; nothing is executed on the server, the
browser's harness turns the calls into the same operations as the list
toolset's (``components/AIEdit/harness/toolsets.js``).
"""

from kitconcept.intranet.ai_edit.rules import CATEGORIES
from kitconcept.intranet.ai_edit.rules import SHARED_RULES


# How to call the tools (D57: the rest of the rules is shared). Prose for
# the model, not SQL ("insert ... into" trips ruff's S608); examples use
# placeholders or values no page or case uses (D49).
CALLING = """\
How to use the tools: call one tool per change, all calls in this one \
answer (several calls at once); nothing is applied before the user has \
reviewed them. Put your sentences for the user in "message" of the \
first call. The tools work on two levels:
  Page level, the page itself (its fields title and description, shown \
first):
  - set_page_field {"field": "<title or description>", "value": \
"<complete new value>"}: sets a field of the page itself.
  Block level, the blocks of the page:
  - edit_block {"ref": "<ref>", "changes": {"<field>": "<complete new \
value>"}}: fields of one block; content, styling and settings may be \
changed together.
  - insert_block {"type": "<insertable type>", "after_ref": "<ref>", \
"data": {"<field>": "<value>"}}: a new block after any block, with all \
its values inside "data". "into_ref": "<container ref>" instead of \
"after_ref" puts it first into a container.
  - insert_blocks {"after_ref": "<ref>", "blocks": [{"type": "<type>", \
"data": {...}}, {"type": "<type>", "data": {...}}]}: several new blocks \
in a row after one block, in this order.
  - move_block {"ref": "<ref>", "after_ref": "<ref>"}: moves a block to \
the place after another block of the same container.
  - delete_block {"ref": "<ref>"}: removes the block and everything \
inside it.
  Both levels:
  - replace_text {"ref": "b91", "field": "text", "find": "on June 3, \
2031", "replace": "on June 12, 2031"}: replaces exact words in one \
field and keeps the rest. With "ref", a field of that block ("field" \
defaults to "text"); without "ref", a page field. "find" is copied \
exactly from the field as shown and must occur there only once: \
include a few words around it. One call per place.
"""

INSTRUCTIONS = f"{CALLING}{SHARED_RULES}"

# A field's new value; null clears an optional field
VALUE = {"type": ["string", "null"]}

# Every tool's own parameters, besides these
COMMON = {
    "reason": {
        "type": "string",
        "description": "One short sentence for the user: why this change.",
    },
    "category": {"type": "string", "enum": CATEGORIES},
    "message": {
        "type": "string",
        "description": (
            "First call only: one or two sentences for the user, what you "
            "propose and why, and what they need to check or give you."
        ),
    },
}

REF = {"type": "string", "description": 'A block\'s ref, e.g. "b91".'}
DATA = {
    "type": "object",
    "description": (
        "Field name -> value, only the fields that change; null clears an "
        "optional field."
    ),
    "additionalProperties": VALUE,
}


def _tool(name: str, description: str, properties: dict, required: list) -> dict:
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": {
                "type": "object",
                "properties": {**properties, **COMMON},
                "required": [*required, "reason"],
            },
        },
    }


TOOLS = [
    _tool(
        "set_page_field",
        "Set a field of the page itself (title, description), never a block's.",
        {
            "field": {"type": "string"},
            "value": {**VALUE, "description": "The complete new value."},
        },
        ["field", "value"],
    ),
    _tool(
        "edit_block",
        "Change fields of one block: content, styling and settings.",
        {"ref": REF, "changes": DATA},
        ["ref", "changes"],
    ),
    _tool(
        "replace_text",
        "Replace exact words in one field, keeping the rest.",
        {
            "ref": {
                **REF,
                "description": "The block's ref; leave it out for a page field.",
            },
            "field": {"type": "string", "description": 'Default "text".'},
            "find": {
                "type": "string",
                "description": "The exact text, occurring once in the field.",
            },
            "replace": {"type": "string", "description": "The new text for it."},
        },
        ["find", "replace"],
    ),
    _tool(
        "insert_block",
        "Add a new block of an insertable type after a block.",
        {
            "type": {"type": "string", "description": "A type marked insertable."},
            "after_ref": {**REF, "description": "The ref of the block it follows."},
            "into_ref": {
                **REF,
                "description": "Instead of after_ref: a container; first in it.",
            },
            "data": DATA,
        },
        ["type"],
    ),
    _tool(
        "insert_blocks",
        "Add several new blocks in a row after a block, in order.",
        {
            "after_ref": {**REF, "description": "The ref of the block they follow."},
            "into_ref": {
                **REF,
                "description": "Instead of after_ref: a container; first in it.",
            },
            "blocks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {"type": {"type": "string"}, "data": DATA},
                    "required": ["type"],
                },
            },
        },
        ["blocks"],
    ),
    _tool(
        "delete_block",
        "Remove a block and everything inside it.",
        {"ref": REF},
        ["ref"],
    ),
    _tool(
        "move_block",
        "Move a block to the place after another block of the same container.",
        {
            "ref": REF,
            "after_ref": {**REF, "description": "The ref of the block it follows."},
        },
        ["ref", "after_ref"],
    ),
]

NAMES = {tool["function"]["name"] for tool in TOOLS}
```

### 4.2 Backend: toolsets and selection (`ai_edit/toolsets.py`)

```python
"""The toolsets the assistant can offer the model (D57, AI_WORKFLOW.md).

For an A/B comparison of tool architectures with the same rules and the
same harness: ``list`` (A, one ``propose_changes`` tool with a list of
operations) and ``intent`` (B, one tool per kind of change). The site's
default comes from ``KITCONCEPT_INTRANET_AI_EDIT_TOOLSET``; a request may
name another one (the eval, a tester's browser): both are equally safe,
every change is reviewed. ``GET @ai-edit`` says which one is the default,
and the browser's harness reads the calls of the one it asked for.
"""

from dataclasses import dataclass
from kitconcept.intranet.ai_edit import intent_tools
from kitconcept.intranet.ai_edit import propose_changes


@dataclass(frozen=True)
class Toolset:
    name: str
    # The tool definitions sent to the gateway
    tools: list
    # How to call them and the shared rules, for the system prompt
    instructions: str
    # The tool names a history may hold (others are dropped)
    names: frozenset


TOOLSETS = {
    "list": Toolset(
        name="list",
        tools=propose_changes.TOOLS,
        instructions=propose_changes.INSTRUCTIONS,
        names=frozenset({propose_changes.NAME}),
    ),
    "intent": Toolset(
        name="intent",
        tools=intent_tools.TOOLS,
        instructions=intent_tools.INSTRUCTIONS,
        names=frozenset(intent_tools.NAMES),
    ),
}

DEFAULT_TOOLSET = "list"


def toolset_for(name, default: str = DEFAULT_TOOLSET) -> Toolset:
    """The toolset of a name, else the default (an unknown name is no
    error: the request falls back to the site's toolset)."""
    if isinstance(name, str) and name in TOOLSETS:
        return TOOLSETS[name]
    return TOOLSETS[default if default in TOOLSETS else DEFAULT_TOOLSET]
```

In `ai_edit/config.py`, `AIEditConfig.toolset` from
`KITCONCEPT_INTRANET_AI_EDIT_TOOLSET` (`list` by default). In
`services/ai_edit.py`, the budget per toolset and the selection:

```python
def fixed_prompt_chars(toolset: Toolset) -> int:
    """The size of what every request sends besides page and history: the
    base rules, the toolset's rules and its definitions (for the budget)."""
    return (
        len(base_prompt("English", date.today().isoformat()))
        + len(toolset.instructions)
        + len(json.dumps(toolset.tools))
    )
```

```python
def _clean_messages(messages, repair: bool, toolset: Toolset) -> list[dict]:
    """The conversation: it ends with the user's request, or for a repair
    call with the tool result listing the failed operations. Calls of
    tools the toolset does not offer are dropped."""
    if not isinstance(messages, list):
        raise BadRequest("messages must be a list")
    turns = clean_history(messages, set(toolset.names))
    if not turns:
        raise BadRequest("The conversation must start with a user message")
    last = turns[-1][-1]
    if repair and last["role"] != "tool":
        raise BadRequest("A repair call must end with a tool result")
    if not repair and (len(turns[-1]) != 1 or last["role"] != "user"):
        raise BadRequest("The last message must be a user message")
    return [message for turn in turns for message in turn]

```

```python
            "available": True,
            "error_code": None,
            "context_length": config.context_length,
            "reserve_tokens": config.reserve_tokens,
            "fixed_prompt_chars": fixed_prompt_chars(toolset_for(config.toolset)),
            # Per toolset: a request may name another one (D57)
            "fixed_prompt_chars_by_toolset": {
                name: fixed_prompt_chars(toolset) for name, toolset in TOOLSETS.items()
            },
            # The browser logs its side of the round trip too
            "trace": trace_enabled(),
            # The toolset offered by default, and the ones a request may
            # name (D57)
            "toolset": toolset_for(config.toolset).name,
            "toolsets": sorted(TOOLSETS),
            # The vocabulary the prompt and the tool schema use: the
            # browser validates against it (one source of truth)
            "operations": OPS,
```

```python
            raise BadRequest("Missing page")
        block_types = clean_block_types(data.get("block_types"))
        repair = data.get("repair") is True
        config = get_ai_edit_config()
        # The request's toolset, else the site's (D57)
        toolset = toolset_for(
            data.get("toolset"), config.toolset if config else DEFAULT_TOOLSET
        )
        history = _clean_messages(data.get("messages"), repair, toolset)
```

The rest of the service used `toolset.instructions` for the system
prompt and `toolset.tools` for the call, the trace and the size check.

### 4.3 Harness: the toolsets (`harness/toolsets.js`)

```js
/**
 * Toolsets (D57, AI_WORKFLOW.md): how the model's tool calls are shaped,
 * for an A/B comparison of tool architectures. Both have the same
 * capabilities; only the shape differs. A toolset turns the model's calls
 * into the harness's operations (`parse`) and operations back into calls
 * (`toCalls`, for the history and the repair request). Everything after
 * parsing (validation, repair, leftovers, changes, review, apply) and the
 * eval's grading are shared.
 *
 * - `list` (A): one tool, `propose_changes`, with a list of operations
 *   (`{"op": "edit_block", ...}`) and the `message` for the user.
 * - `intent` (B): one tool per kind of change, called in parallel, each
 *   with a flat schema: `set_page_field(field, value)`, `edit_block(ref,
 *   changes)`, `replace_text(ref, field, find, replace)`,
 *   `insert_block(type, after_ref | into_ref, data)`,
 *   `insert_blocks(after_ref | into_ref, blocks)`, `delete_block(ref)`,
 *   `move_block(ref, after_ref)`; `message` in any call (the first one
 *   counts).
 *
 * The backend offers the matching tool definitions and rules
 * (`ai_edit/toolsets.py`); `GET @ai-edit` says which toolset is active.
 */
import {
  TOOL_NAME,
  argumentsOf,
  expandList,
  normalized,
  operationsFromToolCalls,
} from './operations';

export const INTENT_TOOLS = [
  'set_page_field',
  'edit_block',
  'replace_text',
  'insert_block',
  'insert_blocks',
  'delete_block',
  'move_block',
];

const isObject = (value) =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const call = (id, name, args) => ({
  id,
  type: 'function',
  function: { name, arguments: JSON.stringify(args) },
});

const failure = (code, message) => ({ code, message });

/** An operation of the list toolset, the shape the harness works with. */
const list = {
  name: 'list',
  // How the rules and messages name the way to propose
  callName: 'propose_changes',
  parse: (toolCalls) => operationsFromToolCalls(toolCalls),
  toCalls: (operations, { id, message }) => [
    call(id, TOOL_NAME, { ...(message ? { message } : {}), operations }),
  ],
  // A call that could not be read, as the repair request repeats it
  emptyCall: (id) => call(id, TOOL_NAME, {}),
  // An operation as the repair message shows it
  show: (operation) => JSON.stringify(operation.raw),
};

/**
 * An intent call's arguments as the harness's operation. The list
 * toolset's names are read as meant too (`block`, `fields`, `after`,
 * D48): small models mix them up.
 */
const fromIntent = (name, args) => {
  const {
    ref,
    block,
    changes,
    fields,
    data,
    after_ref: afterRef,
    into_ref: intoRef,
    after,
    into,
    blocks,
    message,
    ...rest
  } = args;
  const target = ref ?? block;
  const place = {
    ...((afterRef ?? after) !== undefined ? { after: afterRef ?? after } : {}),
    ...((intoRef ?? into) !== undefined ? { into: intoRef ?? into } : {}),
  };
  const common = { ...rest, op: name };
  switch (name) {
    case 'set_page_field':
      return common;
    case 'edit_block':
      return { ...common, block: target, fields: changes ?? fields ?? data };
    case 'replace_text':
      return {
        ...common,
        ...(target !== undefined && target !== '' ? { block: target } : {}),
      };
    case 'insert_block':
      return { ...common, ...place, fields: data ?? fields ?? changes };
    case 'insert_blocks':
      return {
        ...common,
        ...place,
        blocks: Array.isArray(blocks)
          ? blocks.map((item) =>
              isObject(item)
                ? (({ data: itemData, ...itemRest }) => ({
                    ...itemRest,
                    fields: itemData ?? itemRest.fields,
                  }))(item)
                : item,
            )
          : blocks,
      };
    case 'move_block':
      return { ...common, block: target, ...place };
    default:
      // delete_block
      return { ...common, block: target };
  }
};

/** A harness operation as the intent tool call that makes it. */
const toIntent = (raw) => {
  const { op, block, fields, after, into, ...rest } = raw;
  const ref = block !== undefined ? { ref: block } : {};
  const place = {
    ...(after !== undefined ? { after_ref: after } : {}),
    ...(into !== undefined ? { into_ref: into } : {}),
  };
  switch (op) {
    case 'edit_block':
      return { ...ref, changes: fields, ...rest };
    case 'insert_block':
      return { ...place, ...rest, data: fields };
    case 'insert_blocks':
      return {
        ...place,
        ...rest,
        blocks: (rest.blocks || []).map(({ fields: itemFields, ...item }) => ({
          ...item,
          data: itemFields,
        })),
      };
    case 'move_block':
      return { ...ref, ...place, ...rest };
    default:
      return { ...ref, ...rest };
  }
};

const intent = {
  name: 'intent',
  callName: 'the tools',
  parse: (toolCalls = []) => {
    const operations = [];
    const errors = [];
    const messages = [];
    toolCalls.forEach((toolCall) => {
      const name = toolCall?.function?.name;
      if (!INTENT_TOOLS.includes(name)) {
        errors.push(
          failure(
            'unknown_tool',
            `There is no tool "${name}"; the tools are: ${INTENT_TOOLS.join(', ')}.`,
          ),
        );
        return;
      }
      const args = argumentsOf(toolCall);
      if (!isObject(args)) {
        errors.push(
          failure(
            'invalid_call',
            `The arguments of ${name} must be a JSON object.`,
          ),
        );
        return;
      }
      if (typeof args.message === 'string' && args.message.trim()) {
        messages.push(args.message.trim());
      }
      expandList(fromIntent(name, args)).forEach((raw) =>
        operations.push({
          raw: normalized(raw, args),
          number: operations.length + 1,
          callId: toolCall.id,
        }),
      );
    });
    return { operations, errors, messages };
  },
  // One call per operation; the message goes into the first
  toCalls: (operations, { id, message }) =>
    operations.map((raw, index) =>
      call(index ? `${id}_${index}` : id, raw.op, {
        ...(index === 0 && message ? { message } : {}),
        ...toIntent(raw),
      }),
    ),
  emptyCall: (id) => call(id, 'edit_block', {}),
  show: (operation) =>
    `${operation.raw?.op}(${JSON.stringify(toIntent(operation.raw || {}))})`,
};

export const TOOLSETS = { list, intent };

/** The toolset of a name, the list toolset for anything else. */
export const toolsetOf = (name) => TOOLSETS[name] || list;
```

### 4.4 Harness: where `runTurn` used the toolset (`harness/index.js`)

```js
/**
 * The model's calls as the repair request repeats them: readable ones in
 * the toolset's shape, an unreadable one (broken JSON, unknown tool) as
 * an empty call. The backend keeps only well-formed calls in the
 * history, and a tool result needs its call: without this the repair
 * request would be refused exactly when the first answer was broken.
 */
const repairCalls = (calls, toolset) =>
  calls.flatMap((call, index) => {
    const id = call?.id || `call_${index}`;
    const { operations, errors } = toolset.parse([call]);
    return errors.length
      ? [toolset.emptyCall(id)]
      : toolset.toCalls(
          operations.map((o) => o.raw),
          { id },
        );
  });

// The note of the retry after an empty answer (D47)
export const emptyAnswerNote = (toolset) =>
  `(Your previous answer was empty. Answer in text; or call ${toolset.callName} with valid JSON arguments. If the request is not possible with the operations and block types you have, say so in text.)`;
export const EMPTY_ANSWER_NOTE = emptyAnswerNote(toolsetOf('list'));

// Changes written as text instead of a tool call (D57): op-shaped JSON
// or a tool's name with arguments. An eval run did it in 5 of 63 turns
export const TEXT_CALL =
  /"op"\s*:\s*"|"operations"\s*:|\b(?:set_page_field|edit_block|replace_text|insert_blocks?|delete_block|move_block|propose_changes)\s*\(/;

// The note of the retry after changes written as text (D57)
export const textCallNote = (toolset) =>
  `(Your previous answer wrote the changes as text instead of calling ${toolset.callName}. Nothing is proposed that way: call ${toolset.callName} with the changes, or answer in text only if you need something from the user.)`;
```

```js
  // An unknown name falls back to the site's toolset, not to `list`
  // (D57, a code review: a tester's typo silently ran the other one)
  const toolset = toolsetOf(
    TOOLSETS[toolsetName] ? toolsetName : vocabulary?.toolset,
  );
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
  const fixedChars =
    budget.fixedPromptCharsByToolset?.[toolset.name] ?? budget.fixedPromptChars;
```

```js
  // The model's words for the user: its text, else the `message` it is
  // required to put in the tool call (D46; it rarely writes text next to
  // a tool call)
  const toolMessage = toolset.parse(answer.tool_calls || []).messages.join(' ');
  let content = answer.message?.trim() || toolMessage;
  let contentFromTool = !answer.message?.trim() && !!toolMessage;
```

The repair (`repairCalls(answer.tool_calls, toolset)`,
`repairText(toRepair, callErrors, notPossible, toolset)`) and the
repair's message (`toolset.parse(repair.tool_calls).messages.join(' ')`)
likewise; the request carried `toolset: toolset.name`. In
`operations.js`, `repairText` named the way to propose with
`toolset.callName` and each operation with `toolset.show`.

### 4.5 Harness: the history in the toolset's shape (`harness/history.js`)

```js
const hadCall = (message) =>
  message.changes?.length ||
  message.dropped?.length ||
  message.warnings?.some((w) => w.code === 'unchanged');

/**
 * The conversation in the chat completions format. Failed answers and the
 * request that caused them are left out. `refs` (block id -> ref) are the
 * current ones, so created blocks are named as the page shows them.
 * Proposals are written in the shape of `toolset` (D57): one
 * `propose_changes` call, or one call per change; the first call's
 * result describes them all.
 */
export const modelHistory = (conversation, refs = {}, toolset = toolsetOf()) =>
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
      const calls = toolset.toCalls(operations, {
        id,
        message: fromTool ? message.content : undefined,
      });
      // Nothing survived in a toolset without a list: an empty call
      // carries the result (what could not be used)
      const toolCalls = calls.length ? calls : [toolset.emptyCall(id)];
      return [
        {
          role: 'assistant',
          content: fromTool ? '' : message.content || '',
          tool_calls: toolCalls,
        },
        ...toolCalls.map((call, index) => ({
          role: 'tool',
          tool_call_id: call.id,
          content: index
            ? 'See the result of the first call.'
            : toolResult(message, refs),
        })),
      ];
    });
```

### 4.6 Panel and eval

```jsx
/**
 * A tester's toolset (D57): `localStorage.setItem('aiEditToolset',
 * 'intent')` overrides the backend's default in this browser, for
 * comparing the tool architectures without a restart.
 */
const testerToolset = () => {
  try {
    return window.localStorage?.getItem('aiEditToolset') || undefined;
  } catch (e) {
    return undefined;
  }
};

```

```js
    // The toolsets to compare (D57): EVAL_TOOLSETS=list,intent runs both,
    // alternating per repeat (gateway load and warm-up hit both alike),
    // each into its own file; EVAL_TOOLSET one; else the backend's default
    const toolsets = (
      env.EVAL_TOOLSETS ||
      env.EVAL_TOOLSET ||
      vocabulary.toolset ||
      'list'
    )
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    const unknown = toolsets.filter(
      (name) => vocabulary.toolsets && !vocabulary.toolsets.includes(name),
    );
    if (unknown.length) {
      throw new Error(`The backend offers no toolset ${unknown.join(', ')}`);
    }
```

## 5. Tests it had

- Backend `test_toolsets.py`: both toolsets end with `SHARED_RULES`;
  the list schema's `op` enum equals `OPS` and equals the intent tool
  names; every intent tool requires `reason` and has no `op`; selection
  and fallbacks. `test_ai_edit_post.py`: a request naming `intent` gets
  the seven tools and "How to use the tools:", and its history keeps
  only intent calls (a `propose_changes` call in it is dropped); an
  unknown name falls back.
- Harness `toolsets.test.js` (parity): the same proposal (an edit, a
  replacement, a row of two inserts, a move, a page field) written as
  `TOOLSETS.list.toCalls(...)` and `TOOLSETS.intent.toCalls(...)` gives
  identical changes (apart from `callId`) and the same message; the
  intent history has one call per change, each with its tool result;
  list names inside intent calls are read as meant (D48), an unknown
  tool is `unknown_tool`; an unknown toolset name falls back to the
  site's.
- Eval `grade.test.js`: a run with `toolset: 'intent'` sends it and
  grades an intent answer like a list one; the prompt test (D49) also
  read `intent_tools.py`.

## 6. Building it again

1. Bring back `intent_tools.py` (§4.1) and the `Toolset` registry with
   the selection (§4.2); `instructions` = its calling text +
   `SHARED_RULES`. Offer `fixed_prompt_chars` per toolset in `GET
   @ai-edit` and filter the history by the toolset's tool names.
2. Bring back `toolsets.js` (§4.3) and pass the toolset through
   `runTurn` (parse, notes, repair calls and text, the repair's
   message, the budget) and `modelHistory` (§4.5). Restore the parity
   test first: it is what makes the comparison measure the model.
3. Decide the message before measuring: require one `message` in the
   first call, or take only the first, never join them all.
4. Re-run the A/B with n ≥ 10 per case (n=5 cannot separate 7 points)
   and compare per case, with the parallel-call distribution.

Worth it again if a model or gateway changes the picture (structured
output per tool, a model trained on many small tools), or as the first
step of the two-step "Toolset C" (spec §15).
