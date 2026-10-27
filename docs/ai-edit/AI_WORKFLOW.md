# AI-assisted editing — Spec

What the AI assistant in the edit form does, how it is built, and why.
Implemented in this repository as a proof of concept; state, code map,
known issues and how to run everything: [AI_EDIT_PLAN.md](AI_EDIT_PLAN.md).
Section numbers and decision ids (D…, §14) are stable: code comments
refer to them.

## 1. Principle
The model proposes *intent*; the harness owns *structure*. The assistant
is a chat with a fixed core: one LLM call per turn (plus at most one
repair call), one proposal tool that is never executed, nothing written
on the server. Model output is untrusted until validated; every proposal
shown is valid, minimal and safely applicable. The editor judges the
content, picks the changes, and saves (or not) with the normal form. It
is an assisted editing workflow, not an agent loop and not a model proxy.

## 2. What the assistant does (D1)
1. **Assess and report**: a text answer about the page, a part of it,
   or the selected block(s).
2. **Propose changes** to page fields and blocks through the single
   `propose_changes` tool; reviewed as diffs; the selected ones are
   applied to the live, unsaved form.

The chat carries the session (assess, ask for changes, assess another
part, …). The block selected in the editor is context: "this block" needs
no ref.

Where: the edit and add forms of slate-based content types (not
`PlateEditorContentTypes`). volto-light-theme (VLT) is a given (D26).
Who: the `kitconcept.intranet: Use AI editing` permission (Manager, Site
Administrator, Editor, Contributor, Owner; not Reviewer).

## 3. Responsibility split
| Concern | Owner |
|---|---|
| Block structure, refs, Slate validity, derived fields | Harness (enforced, recomputed) |
| What is visible and editable (pre-flight, allowlists) | Harness, site profile |
| Shape of operations, staleness, conflicts | Harness |
| Repair policy | Harness (one call: failed operations, and text referring to a deleted block, D59) |
| Prompt and tool schema | Backend (fixed; an insert's types from the request, D59) |
| Thinking, sampling, context and output limits | LLM gateway |
| Finding problems, wording, reason and category | Model |
| Which changes to apply; save or cancel | Editor |

## 4. Architecture (D13)

**From opening the tab to saving the page:**

1. **Tab.** The edit or add form shows the "AI" sidebar tab (tooltip "AI
   editing assistant") when
   `@site` says the assistant is available (registry toggle on, LLM
   configured). Selecting a block keeps the tab open, as Volto keeps
   the Order tab open.
2. **First opening.** The panel loads lazily. `GET @ai-edit` checks the
   permission on the context and returns the context budget and the
   vocabulary (operations, categories, tags). The panel builds the
   **site profile** from the live Volto/VLT configuration: which page
   and block fields, styling options, container rules and insertable
   types the model may see and change.
3. **A request** (typed or a quick action). The harness reads the live,
   unsaved form and the selection, **projects** the page (refs, fields,
   effective styling, placeholders, pre-flight locks), fits the
   conversation into the context budget, and posts it to `@ai-edit`.
4. **Backend.** Checks the permission and the request's shape, renders
   the prompt (rules, date, language, tool rules, block types, the page
   with every structural tag escaped), makes **one** call to the LLM
   gateway, returns the text, the raw tool calls and token usage.
5. **Validation.** The harness validates every operation against the
   page and the profile. Invalid ones go back to the model **once**
   with concrete errors; what is still invalid is reported, never
   dropped silently. Valid operations become **changes**, one per field.
6. **Review.** The panel shows the answer and "N changes proposed". The
   review shows each change as a diff with reason, category and flags;
   deletes start unselected; stale changes cannot be applied. The
   selected changes are applied to the **form state** (`setFormData`).
   Nothing is written on the server.
7. **Next turn.** The conversation goes back to the model compacted:
   past calls with their surviving operations and a neutral result
   (applied, not applied, new block refs). The current page is the only
   source of truth.
8. **Save.** The editor checks the result in the editor and saves or
   cancels with the normal form. Leaving the form ends the conversation.

```
Volto panel (React) ──┐
                      ├─ harness (pure JS): projection, pre-flight, budget,
Node eval runner    ──┘   validation, repair, changes, apply, history
                                │ POST <context>/@ai-edit
                                ▼
Plone @ai-edit: permission, toggle, fixed prompt and tool schema,
page rendering (escaped), byte limit, concurrency limit, LLM call, logs
                                │
                                ▼
LLM gateway (Open WebUI → Ollama): model, thinking, sampling, limits
```

- **Harness**: one pure JS module (no React, no registry) used by the
  panel and by the eval runner; all validation needs the Slate/Markdown
  code and must run headless.
- **Site profile** (D28): the harness never reads Volto or VLT
  configuration itself. The panel builds the profile; the eval loads a
  saved snapshot, which also shows when an upgrade changes what the
  model sees.
- **Backend**: a permissioned proxy with a fixed prompt and schema, so
  the endpoint is not a general LLM proxy. It checks only the shape of
  requests; it reads and writes no content.
- **One tool** (D58): `propose_changes`, with a list of operations. A
  second architecture (one tool per kind of change, "intent") was
  compared in D57 and removed; its result and a snapshot of its code
  are in [AI_EDIT_INTENT_TOOLSET.md](AI_EDIT_INTENT_TOOLSET.md) (§7).
- **Size limits**: a byte limit on the request (abuse guard), and the
  **context budget** in the harness (D22): characters ÷ `charsPerToken`
  (3 by default; ÷ 4 undercounts German) against the gateway's context
  length minus a reserve for reasoning and output (4096 tokens since
  D57, from eval data: §11). The oldest whole turns are dropped first (D33);
  if page and request alone do not fit, no call is made ("this page is
  too long"). Rough on purpose: it prevents silent truncation.

## 5. A turn
1. **Project** the live form (§6), with refs and selection flags.
2. **Pre-flight**: round-trip every text field; failures are locked.
3. **Request** `{language, messages, page, block_types}`; `block_types`
   describes every type on the page and every insertable type (D32). An
   empty answer that was not cut off (the gateway dropped a tool call it
   could not read, or the model gave up) is asked for once more, with a
   note to answer in text or call the tool with valid JSON, and to say
   so when the request is not possible (D47). That is the turn's one
   extra call: no repair call after it.
4. **Validate** each operation (§8).
5. **Repair** (D8, D51): if any failed, one more request in the same
   turn; its tool result lists the failed operations with their errors,
   asks for the complete corrected proposal and says that the page does
   not include the proposed changes yet. Unreadable calls go back as
   empty readable calls (each tool result needs its call). The repair's
   proposal replaces the first one and is checked on its own: an
   operation it leaves out is withdrawn, so the model can take back a
   mistake. Without a proposal (text only), or with one of which
   nothing can be used, the first answer's valid operations stay (D58:
   a repair resent 2 of 16 operations, both invalid, and lost 15 valid
   ones); an empty proposal withdraws everything. No further attempts.
   The same call asks for text that refers to a block the answer
   deletes (D59, §8), alone when nothing needs a repair.
6. **Leftovers** (D42): mentions of a value the answer replaced that are
   still on the page become replacements suggested by the harness,
   validated like the model's; what cannot be computed is listed for the
   editor.
7. **Present** (§9).
8. **Record** (§10): the final valid operations only (D14; not the
   harness's suggestions).

## 6. Projection (read path)
- **Refs**: `b1`, `b2`, …; dotted inside containers (`b5.1`) (D4).
  Stable for the conversation, never reused (D21): a new block gets one
  more than the highest number ever used at its level.
- **Page fields** (D6): allowlist per content type, default `title` and
  `description`; empty ones shown as `""` (D52).
- **Block fields** (D5, D23, D53): the fields the block type's allowlist
  names; a type without an allowlist entry gets the fields of its
  schema, by widget: one line, `textarea`, `url`, an object-browser link
  that stores only its target; other widgets (images, queries, lists of
  objects, a link that stores its target's data) are left out. The
  allowlist stays for content edited in the block itself (a text
  block's `value`, a heading's text), which no schema holds. Rich text (a Slate `value`) appears as `text`, in Markdown (D3);
  other fields as plain text; missing ones as `""` (Volto omits empty
  fields, the model must still see them). Not words (D52): the model
  copied the former `(empty)` back as a value, once as "(empty) -
  Please provide a descriptive alt text". Types without fields get
  a short read-only description.
- **Styling fields** (D25): `theme` and the `styles` entries `align`,
  `blockWidth`, `size` (stored with `:noprefix`, shown without), as the
  block's VLT schema offers them, with the **effective** value (unset =
  VLT's default). Allowed values come from VLT's configuration through
  the profile and are listed once per block type.
- **Settings** (D53): a schema's choice fields (names only, not multiple)
  and true/false fields, for every type, shown, listed and checked like
  styling (`true | false`, stored as booleans); changed on request only.
- **Fields the schema shows** (D53): fields and settings taken from a
  schema appear only where the block's schema, resolved with the block's
  data as the sidebar resolves it, shows them (a teaser's `title` only
  with `overwrite`). The panel checks this with the live configuration;
  the eval's snapshot cannot, so there every field shows.
- **Text structure**: one paragraph, heading or list per text field;
  heading levels are part of the text (`### Pricing`).
- **Placeholders**: inline nodes Markdown cannot express (links,
  mentions, custom nodes) become `[text](<kind>:N)`; the model may
  change the text, never the node. The prompt says a placeholder's
  target is hidden and valid (D52): the model took them for broken links
  and "fixed" them with invented URLs. A registry per conversation restores
  the node. Text that survives neither directly nor as placeholders is
  locked.
- **Containers** (D4): children inside their container, whose block type
  declares its rules (allowed types, maximum children).
- **Selection**: the selected block(s) carry `selected`: in a grid the
  clicked column (`ui.gridSelected`, only while its grid is selected),
  plus the multi-selection. The block the form selects by itself on load
  does not count until the editor changes the selection. Each request
  also carries its own selection (§10, D39).
- **Read-only**: blocks with neither content nor styling fields (e.g.
  `title`): assessable, usable as anchors, deletable, not editable. A
  locked text leaves the block's other fields editable.
- **Content not shown**: a block without content fields or a summary
  but with data (a table) is marked `content="not shown"`: shown blank,
  the model took a full table for empty and proposed deleting it.
- **Stripped**: everything else (image scales, URLs, ids, `plaintext`).
- **Format** (D29, D31): `name: value` lines; values with line breaks
  in an element named after the field, raw and unindented (the model
  writes back exactly what it saw). Every structural tag and every field
  name of the request is escaped in page text. Everything inside
  `<types>` and `<page>` is data, not instructions.

```
<types>
insertable: slate
<type name="slate" insertable="yes">
fields: text
theme: default | grey
</type>
</types>
<page>
title: Our page
description: ""
<block ref="b2" type="slate" selected>
text: A paragraph with [a link](link:1).
theme: default
</block>
<block ref="b3" type="slate">
<text>
- Audit
- Training
</text>
theme: grey
</block>
</page>
```

## 7. Operations (write path)
One tool, `propose_changes`, carries them as a list (D23; the other
tool architecture compared in D57 at the end of this section):

    {"operations": [
      {"op": "set_page_field",    "field": "description", "value": "..."},
      {"op": "edit_block",   "block": "b4",   "fields": {"text": "...", "theme": "grey"}},
      {"op": "replace_text", "block": "b8",   "field": "text", "find": "on March 18, 2027", "replace": "on April 9, 2027"},
      {"op": "insert_block", "after": "b4",   "type": "slate", "fields": {"text": "..."}},
      {"op": "insert_block", "into":  "b5",   "type": "slate", "fields": {"text": "..."}},
      {"op": "insert_blocks", "after": "b4",  "blocks": [{"type": "slate", "fields": {...}}, {"type": "__button", "fields": {...}}]},
      {"op": "move_block",   "block": "b7",   "after": "b2"},
      {"op": "delete_block", "block": "b7"}
    ]}

Each has `reason` (one sentence, shown in the review) and optionally
`category` (D12): `spelling`, `grammar`, `style` (wording),
`structure`, `layout` (styling), `outdated`, `accessibility`,
`metadata`, `translation`, `other`. Styling fields are always `layout`
(D35); inserts, deletes and moves always `structure`, and a missing or
unknown category is `other` (D57: a label only, never a reason to drop
an operation; an invalid one dropped half of a new section).

Rules the prompt gives the model, besides the format (D36–D38):
- One or two sentences for the user in the call's required `message`
  (D46): what is proposed and why, what they need to check or give (not
  the new texts themselves). Phrased as a proposal ("I propose …",
  never "I have changed …") and only about what the operations do
  (D52): messages claimed "updated all instances" and "added a
  placeholder image".
- Never invent facts about people (roles, job titles, employers,
  achievements, background): introduce someone neutrally with what is
  known and ask for the details in `message`.
- Never invent facts (dates, names, places, numbers, prices not on the
  page or in the request); for outdated or missing information, keep or
  neutrally rephrase it and say in the reason what needs checking.
- Change only what the request is about (D52); other problems noticed
  (a date format, a missing alt text, a typo elsewhere) go into
  `message`. A tone rewrite changed footer dates, "Hosted by" and alt
  texts; a contacts update edited the notice it took the values from.
  What a change makes wrong elsewhere is part of the request (D58): text
  referring to a deleted block, a date depending on a changed one. With
  scope as a rule of its own, 4 of 5 runs found the sentence pointing at
  a deleted section and left it, citing the scope.
- Change styling only when the user asks about layout or styling, and
  only on the blocks the request is about.
- A rewrite keeps the text's bold, italic, heading, list and
  placeholders unless the request is about formatting (D52).
- The prompt's examples use placeholders (`<ref>`, `<field>`) or values
  no real page or eval case uses (`b91`, a date in 2031): small models
  copy examples literally (D49). An eval test checks that no example
  ref exists on a case's page and that no date, expected value or name
  of a case, and no quoted phrase of three words or more from a case,
  appears in the prompt (D52: "one week before" was the summit page's
  wording of its deadline).
- When assessing, check spelling and grammar, title and description,
  the order of heading levels, outdated content, alt texts, clarity.
- Never describe images (D40): missing alt texts are reported for a
  person to write.
- Only types `<types>` lists as insertable are inserted; when part of
  a request needs another type (an image), the rest is proposed and
  `message` says what the user has to add (D52: the model tried an image
  in every run of the new-speaker test). `<types>` says it twice (D58):
  a first line `insertable: …` and `insertable="yes|no"` on every type;
  marked only by an attribute the other types lacked, the model read an
  image block on the page as insertable ("the type should be image as
  per the <types> section") in every run of two eval cases. When nothing is left (or the
  request needs moving blocks or a file), it is said in text, without a
  tool call.
- A link target (`href`) is a full https URL or a path of the site, as
  the user gave it; never invented, else asked for in `message`.
- A placeholder is never replaced by a URL and never called broken (its
  target is hidden); a new link in a text needs a URL the user gave, or
  an e-mail address or phone number written on the page (D52).
- Specific words, dates, names or numbers change with `replace_text`;
  `edit_block` rewrites most of a block (each value is the complete new
  value) or changes styling; never both on one field (D41).
- "Change it everywhere": every block and field, every way the value is
  written ("March 18, 2027", "the 18th", "18.03.2027"); each mention
  keeps its format (no year where it had none).
- A request about the whole page (improve, shorten, tone, translation)
  goes through every block and field, long ones included (D52: the tone
  test missed the same block in every run, a translation the intro).
- Consequences (D52): a changed date changes the text that depends on
  it (a deadline some days before, a weekday) in its own operation,
  computed, with the calculation in the reason, not asked about (the
  deadline was updated in 1 of 3 runs, asked about in the others); a
  deleted block or section changes the text that refers to it ("see
  the parking info below") in its own operation.

- `edit_block` may combine content and styling of one block (D35);
  fields it does not name stay as they are.
- `replace_text` (D41): exact words of one content field of a block
  (`field` defaults to `text`) or, without `block`, of a page field.
  `find` is matched in the field as the model saw it and must occur
  once; if it does not occur exactly, once more ignoring Markdown
  escapes, runs of spaces and typographic quotes and dashes. All
  replacements of a field in a turn apply to its original text, must
  not overlap, and become one change with the field's complete new
  value, checked like any edit; a field is changed either by
  replacements or by `edit_block`/`set_page_field`, not both. A replacement
  sent again is a duplicate.
- `insert_block`: `after` any ref, or `into` a container (first
  position). `type` is required (D50): an insertable type (D24, D53):
  one the site lists (`config.settings.aiEdit.insertable`; default text,
  button, separator, video) that the block chooser can offer (no
  `restricted`; one depending on the content needs the content), that
  is not a container and whose required fields the profile can fill.
  Opt-in: no schema says whether a block's main content is edited in
  the block itself (a table, a map's embed code), so a schema alone does
  not make a type insertable. The legend marks the fields a new block
  must have, `fields: url (required), preview_image, title` (D54): a text
  block's text, a button's label, and what the site lists
  (`config.settings.aiEdit.required`; default a video's `url`, which its
  schema does not declare); every other field is optional, and the
  prompt says to leave out what the user did not give instead of asking
  for it. Where: where the user says; when they name no place, after
  the selected block; with neither, at the end of the page (D56 asked
  the model to ask, D57 places it there and says so in the review). A
  required field the user did not give is never invented (D55); since
  D57 the model leaves it out and the harness asks (asked by a repair
  message to "add" it, the model invented a button's label from
  another block and its link from a placeholder). `fields` may be left out or empty when the type needs none (a
  separator): the first browser test's repair
  message asked for "at least one field" and the model added a default
  style, which is dropped, leaving nothing. A button's label is required, its link
  target (and a video's URL) optional, from the request only, never
  invented; alignment and the other styling as for any block. Inserts at one place keep their
  order: several blocks in a row all name the same `after` (the prompt
  shows it). A ref under a block that is not a container (`b22.1`, as
  models number the blocks they insert) means "after `b22`" (D45).
- `delete_block`: any block (D17), within its container's rules, except
  Volto's required blocks (a block's `required`, else the site's
  `requiredBlocks`; an event's metadata block): marked `required` for
  the model, dropped without a repair call. A `readOnly` block is
  read-only for the model too.
- A `text` with several elements is split into blocks of the same type
  (D7); new blocks take the block's styling as it is after applying. A
  block that already holds several elements (pasted paragraphs) keeps
  them all: else any small edit, even one `replace_text`, would cut it
  apart.
- Superseding (D27, D34): per target and field, the later one wins; a
  delete conflicts with every change of its block and the blocks inside.
- A value equal to the effective one is `unchanged` (not proposed);
  empty values are invalid (models send them for "keep"); `null` clears
  an optional field (D57: "remove the button's link"), never a required
  one, a text or the page title (`not_clearable`, not repairable).
- `insert_blocks` (D57): several new blocks in a row at one place, in
  order; the harness expands it into inserts with the same anchor
  before validation. The model need not guess refs of blocks that do
  not exist yet (an eval run anchored a row on the page's real b37–b39).
- `move_block` (D57): a block to the place after another block of the
  same container; its content is not written again, so it cannot
  change, and it keeps its identity (deleting and inserting it again
  would make the model regenerate it). Required blocks stay; an anchor
  in another container is `not_movable_here` (repairable); moving to
  where it is is `unchanged`. Applied before inserts, so a block
  inserted after a moved one follows it.
- A required field the user did not give: the model inserts the block
  without it and the harness asks (D57, `missing_field`, not
  repairable): its question replaces the repair call that made the
  model invent a label (D55) and the 46–167 s turns it spent deciding.
  Not given also means (D58): an empty value on a new block (sent as
  `url: ""`, it went to a repair, which invented a URL in every run of
  an eval case, 60–120 s), and a required plain value that is not in
  the request but, as whole words, on the page (`copied_value`: a
  button got the label of the block next to it in half the runs). The
  prompt says to leave such a field out entirely, with no empty value
  and nothing taken from another block.
- Where a new block goes (D57): where the user says, else after the
  selected block, else at the end of the page, flagged in the review
  (`atEnd`); the model never asks for the place (an eval run inserted
  at the end in every run anyway, against the rule to ask).
- Styling and settings on a new block only where the request names the
  value (`right`, `grey`) or, for a true/false setting, half of the
  words of its name (D57, `style_not_requested`): D36 in code.

Tool-call arguments are not decoded under the schema (Ollama parses them
out of the output), so invalid operations are normal: the repair call is
part of the normal path and its rate is measured.

### Tool architecture (D57, D58)
D57 compared this `list` toolset with an `intent` toolset of the same
operations and rules: one tool per kind of change (`edit_block(ref,
changes)`, `insert_block(type, after_ref, data)`, …), called in
parallel, parsed by the harness into the same operations. Over 23 cases
× 5 runs (`qwen3:14b`): the same quality (78 and 79 clean passes of
115); `intent` cost about 780 prompt tokens more per call (seven tool
schemas), left the editor without words in 30 of 112 answers and, with
several calls, repeated its message in each; the speed difference was
small (median 1 s). Removed in D58, one code path kept. Result, design
and code: [AI_EDIT_INTENT_TOOLSET.md](AI_EDIT_INTENT_TOOLSET.md). The
gateway passes parallel calls (up to 28 in one answer), should another
architecture be tried (§15).

## 8. Validation (harness, code-checked)
Per operation; every failure has a code and a model-facing message.

- Shape: known op (from the backend's vocabulary), required keys,
  `fields` an object; `category` only labels the review row (missing or
  unknown: "other" with a warning; structural operations "structure",
  D57; styling fields "layout" and nothing else "layout", D58: a removed
  link labelled layout counted as unrequested styling).
- **Read as meant** (D48), before the checks: `type` written inside
  `fields` moves to the insert, a `fields` object nested in `fields` is
  merged, `category` and `reason` given once for the call apply to the
  operations without them, a type name resolves without its leading
  underscores or case ("button" → `__button`).
- **Link targets only from the request** (D48): a link field whose value
  the request does not contain is left out (an invented `/register`);
  the block is kept, and a new block with an empty link field is
  flagged "No link target: add it in the editor". In rich text (D52) a
  new URL must be in the request, or, as `mailto:`/`tel:`, an address
  or phone number written on the page; anything else is `invented_url`
  (repairable: keep the placeholder). An eval run put
  `https://example.com/register` and a maps URL in place of link
  placeholders, selected by default.
- Refs exist; `into` names a container; fields are in the allowlist
  (own keys only); an inserted type can be created; no edits of
  read-only blocks or locked fields; container rules on inserts,
  deletes and splits, summed over both answers of a turn.
- Rich text: round trip stable; new URLs only `http(s)`, `mailto`, `tel`
  or relative; placeholders (D9) known, only in their own block, at most
  as often as there (two links to one target are one placeholder twice);
  removing one is allowed and flagged. Text that parses to nothing (a
  rule, an image alone) is empty.
- Plain fields: single line where declared; styling values from the
  allowed names (listed in the error).
- No value may start with `""` or `(empty)` (how the page shows an
  empty field, now and before D52); an emphasis marker left open (`*Workshop host`) is an error unless the
  asterisk is escaped (`\*`) or in inline code. On a new block, styling
  set to its default is dropped (no change, no styling unasked).
- **Fields the schema shows** (D53): a field or setting taken from a
  schema that the block would not show with the proposed data is
  completed or repaired. When exactly one true/false setting shows all
  of them, the harness switches it on with them (the model meant it:
  a teaser's title needs `overwrite`; a warning logs it, the review
  shows the setting as its own row); otherwise `hidden_field`
  (repairable), naming the settings that would show it. Settings
  written as JSON `true`/`false` are read as their names.
- **Not repairable**: an operation the page cannot take (an image
  inserted, a read-only block or locked field edited, a full container,
  a field of another block type on an existing block such as `alt` on a
  text block) is dropped without a repair call. On an insert, a missing
  `type` and a field the type does not have are repairable; the
  messages point to `<types>` instead of listing the types (dozens of
  block types would not fit). The type is never inferred from the
  fields; a repair call for other failures tells
  the model which were left out. A repair spent its whole answer on one
  of them and returned nothing (D44).
- **A repair keeps an insert's type** (D55): a repair's `insert_block`
  without `type` at the same place as a failed insert of the first answer
  takes that insert's type (when only one type was there; warning
  `type_kept`). The model's own type, not one inferred from the fields
  (D50): a repair added the label it was asked for and left the type
  out, which dropped the whole proposal.
- `replace_text`: `find` found once (not found: the closest passage is
  named in the repair message; found more than once: asks for more
  context), no overlap, no mix with a rewrite of the field, and
  `replace` must not repeat the text right before or after the match
  (≥3 characters with a letter or digit: "Thursday, March 18" →
  "Friday, April 9, 2027" before ", 2027" would give "2027, 2027").
- `replace` must not bring back a value replaced elsewhere in the turn
  (a date in any format, or a name or number) unless it also has the new
  one ("moved from March 18 to April 9" is fine): a repair once kept the
  old date, reformatted.
- **Leftovers** (D42), after the answer's replacements: what each
  changed (`find` and `replace` without the words they share at either
  end) is looked for in every changeable text of the page, outside the
  answer's replacements. Only a value that actually changed (D52): a
  date still written in `replace`, or with no new date there (a
  shortened text dropped it), and a changed passage of more than four
  words (a rewritten sentence or text) give nothing to look for; a
  shortened intro (one `replace_text` of the whole text) once listed
  five unrelated mentions of its date. A date in every usual format (March 18, Mar
  18th, 18 March, 18. März, 18.03., 3/18, the 18th), anything else as a
  whole word; a date match followed by another year ("March 18, 2026",
  "18.03.2026") is another date and left alone. Only listed, not
  changed (D57, a code review): a weak match that is not clearly the
  date ("3/18" without a year: "slide 3/18"; "the 18th" before a word
  other than of, at, from, to, until, and, or: "the 18th century"), and,
  for a change without a year, a date written with one (an archive's
  "March 18, 2019"); changes with a year are searched first, so they
  claim such matches. Each match becomes a
  `replace_text` of the harness, written
  in the match's own format (month spelling and case, padding, ordinal,
  a weekday in front recomputed from the year). Validated with the
  answer's operations (overlaps, conflicts). Not computed, only listed:
  a date whose year also changes, a rewritten field, a word in another
  case. Suggestions start selected like the model's changes ("the 18th"
  too: starting it unselected surprised in a browser test). At most 20
  of each.
- **Dependent dates** (D59): a date the page relates to a changed one
  ("closes one week before the event, on March 11"; "3 days after",
  "zwei Wochen vor") is computed when the relation holds for the old
  values (March 11 is one week before March 18): the event moving to
  April 9 puts it on April 2, with no guess involved. Nobody changed it:
  a suggestion like the leftovers', with the calculation in its reason;
  the model changed it to another date: its replacement is corrected
  (`dependent_corrected`), when the corrected proposal is still valid.
  Once per date, though several replacements change the same event
  date. The model left the deadline in 5 of 10 runs of the A/B and got
  it wrong in 2 of 3 runs after D58 (March 25, March 23); the looser
  check of D57, which flagged any date near a change, stays removed.
- **References to deleted blocks** (D59): a link whose target is a
  block the answer deletes (the anchor of a deleted heading, `#parking`
  for "## Parking", as volto-slate's heading ids are slugged; or the
  block's id), in text no operation changes, is named in the turn's
  extra call: "b29 text: its link (link:3) points to b31, which you
  delete", with the complete proposal asked for again (as a repair,
  D51, D58). In every eval run the model saw "check out the parking info
  below" and left it, citing the request's scope, after two prompt
  rules (D52, D58). A fix of such text starts unselected, flagged
  `refersToDeleted`, like the delete it belongs to; references still
  left are listed in the review.
- The prompt's escaping copied back (`&lt;title`) is undone, unless the
  page has it literally.
- **On apply** (D30): only the touched fields must be unchanged since
  the proposal (stale otherwise, never overwritten), compared as they
  show: Volto's block sidebar writes schema defaults when a block is
  selected (`theme: 'default'`), which is no change. A delete is stale
  when anything the profile shows in its subtree changed (D34). A split
  in a container needs room at apply time too. Inserts whose anchor is
  gone go where it was (after the nearest earlier sibling, else first in
  the container, else the same one level up).
- **Minimal writes**: untouched blocks and keys keep identity and order;
  styling written as VLT's sidebar writes it; `plaintext` recomputed.

## 9. Review and apply
- One row per change (D35): a field of the page, a field of a block, a
  new block or a deleted one; diff, label with ref, reason, category.
- A setting is reviewed like a styling field (`false` → `true`), in
  its own row; one the harness switched on for a field is a row of its
  own too (deselecting it leaves the field unused).
- Flags: an alt text (starts unselected: the model cannot see images,
  D40), deletes content the model cannot see (a table), removes a link,
  loses formatting (bold, italic, a heading, a list; stays selected,
  D52), splits into N blocks, replaces most of a
  longer text (a rewrite keeping under 30 % of the words at under half
  the length, measured on the field's whole text, also for a
  `replace_text` whose `find` is the whole text (D52); not for
  translations: a model describing the change
  instead of writing the text would wipe the block), deletes a non-text
  block, a container child, or a container (with its size), was added
  at the end of the page (D57), refers to a block the proposal deletes
  (D59: apply both or neither). Risky edits start unselected (D57):
  removing a link, losing formatting, splitting a block, replacing most
  of a text; easy to select when meant, while one applied unseen can
  lose content (D52 kept them selected; reversed on review). They and
  deletes are marked `confirm` (unselected for the editor to confirm),
  apart from the alt text and a page field equal to a block field
  (unselected as likely wrong).
- A move is a row of its own ("Move block b7 after block b2"), without a
  diff.
- The harness's own words replace the model's (D57, `notice`): its
  question for a required field the user did not give (with the model's
  text when other changes stand), and, when nothing of a proposal could
  be used, why ("This block type cannot be added by the assistant": the
  model's text described the image it tried to insert). In the
  editor's language; the history gets them in English.
- A field changed by `replace_text` shows its replacements' reasons and
  the diff (not the replacements again: the diff shows them); the field
  is applied as a whole.
- A suggested replacement carries the reason of the model's replacement
  it repeats ("Event date updated to April 9, 2027"): every row says
  what changed the same way; it is reviewed and applied like the
  model's. Above the changes: places that may still mention the old
  value (not changed by the proposal, current text).
- When operations were dropped and none is left, the chat says so ("The
  AI's proposal could not be used"), also below a text that claims a
  change: the model wrote "I've added a button" for a dropped insert.
- The chat shows the answer's text, the number of changes (with how
  many were applied) and the review button, always on the right, in a
  lighter style once changes were applied; operations that could not be used are not shown there
  (the editor cannot act on them; debug log and history have them). A
  cut input is shown as a warning.
- Defaults (D20): edits and inserts selected, deletes unselected; a
  warning when one answer deletes a quarter of the page or more.
- Stale and applied changes are shown, not selectable; a review can be
  reopened. Applied changes record the blocks they created.
- The review is the policy gate (D10). The assistant never saves.

## 10. Conversation state (D14)
- The browser keeps the conversation (chat completions format) and
  sends at most 10 turns, fewer when the budget requires; the server is
  stateless.
- Past calls are compacted to their surviving operations; repair
  attempts are not kept. Each is followed by a neutral tool result
  (applied, not applied, superseded, unusable, unchanged; refs of
  created blocks). The harness's suggestions that were applied are
  named apart ("found on the page by the search, not proposed by you"),
  open ones not at all; unusable operations are named by what they
  were ("insert_block after b22"), not by number: a result claiming
  changes the model never made confused its next answer. A `message`
  the model put in its call goes back into the call (D46). A delete is "deleted" only once applied ("deletion of
  b7" otherwise): the block is still on the page.
- Every request, past and current, is headed by the refs of the blocks
  selected when it was sent (`Selected: b4`, or `Selected: none`; D39).
  A request that means a block ("this paragraph") with nothing selected
  is answered with a question, not a guess.
- Reasoning (`<think>`) never enters the history.
- Prompt order: rules, tool rules, block types, page; then the history;
  the request last. Only the oldest whole turns are ever dropped.
- The conversation ends when the form is left.

## 11. Model and deployment (D2, D19)
- One model per site, named in the configuration; one call per turn;
  no self-review (the harness's checks are the feedback).
- **Context length**: known, sized to the workload, and small enough
  that the model runs fully on the GPU; the same value (at most the
  model's trained maximum) as the feature's context length, so the
  budget works. It holds the prompt *and* everything generated. Measured
  in the first eval: prompts 1.5–2.6k tokens, answers 0.2–0.8k (with
  reasoning); a 10-turn session stays far below 16k. A 43k context made
  the model run partly on the CPU (about 6–7 generated tokens per
  second, 30 % of the turns over 120 s). Set it explicitly (D43): on
  "Default" Ollama decides per model load, and in browser tests the
  window changed between days to 2048 tokens, cutting off the start of
  the system prompt (the rules) and the first blocks, without an error.
  Current setting: 16384.
- **Cut input detected** (D43): fewer prompt tokens reported than the
  request's size allows (at most 6 characters per token) means the
  gateway cut the input; logged as an error, flagged in the answer, a
  warning in the chat, a deployment failure in the eval.
- **Budget** (D22, D57): the browser estimates a request from its JSON
  without block ids, at the characters per token the last answer's
  reported prompt tokens give (3 before any call), with 4096 tokens
  kept for the answer (`_RESERVE_TOKENS`; the longest of 98 answers was
  2,725). A repair the budget has no room for is logged
  (`repair_too_long`): with ids counted, 3 characters per token and
  8000 kept, three repairs on the 39-block summit page were skipped
  silently, and a page a fifth longer would have been refused.
- **Retry** (D47, D57): one more request after an empty answer or after
  changes written as text instead of a call (op-shaped JSON, a tool's
  name with arguments: 5 of 63 eval turns; since D58 also a call in the
  model's own format, `<tools>{"name": "edit_block", …}`, which reached
  the chat once), with a note; it is the turn's one extra call (no
  repair after it).
- **Timeout** per call configurable (default 120 s), sized from measured
  latencies: each call holds a server worker. After D58: p50 23 s, p95
  111 s; every call but one under 120 s, the longest outside
  translations 76 s; a translation took up to 134 s (per-block calls,
  §15, would shorten it). It bounds the whole answer, streamed or not
  (D59, a code review: a slow JSON body held the worker past it).
- **Concurrency** (D59): at most `KITCONCEPT_INTRANET_AI_EDIT_MAX_CONCURRENT`
  calls per Zope process (default 2), further requests are answered
  "busy" at once; set it below the process's worker threads so one is
  always free for the site.
- **Logs** (D59): an empty answer is logged as a warning by its shape
  (finish reason, the message's keys with their lengths, usage), never
  its content; the raw response only at DEBUG.
- **Streamed** (D52): the backend asks the gateway for a stream and
  puts the chunks back together into one answer (text, reasoning, tool
  calls, usage); a tool call piece belongs to the call of its id, else
  of its index, and a piece announcing another call where one already
  is starts a new one (D57, a code review: a gateway sending each
  parallel call in its own chunk with the same index or none merged
  them into one unreadable call); malformed chunks are a gateway
  failure (`llm_failed`), not an HTTP 500; the timeout bounds the whole answer. A proxy
  in front of the gateway (Cloudflare: about 100 s) ends a request that
  sends nothing for that long: 2 of 3 translations failed at 125 and
  238 s. `KITCONCEPT_INTRANET_AI_EDIT_STREAM=0` asks for the whole answer
  at once; a gateway that answers JSON anyway is read whole. The
  browser still waits for the whole turn.
- **Thinking on**: one call both assesses and emits the tool call; the
  model reasons first, formats second. Reasoning is most of the time
  (about 1,000–1,300 of the output tokens of a proposal); thinking off,
  for all calls or only repairs (Qwen3's `/no_think`), is not measured
  yet: an eval configuration to compare, not a default.
- **Native function calling** in Open WebUI; only `model`, `messages`,
  `tools`, `stream` (true, D52) sent (`chat_id`/`id` would start Open WebUI's own
  tool loop).
- Every call logs prompt, completion and reasoning tokens and the
  finish reason; `length` means the answer was cut off (a deployment
  failure, shown to the editor as "truncated").

## 12. Security
- The permission gates who may use the LLM; the server reads and writes
  no content; the model can only propose.
- Prompt injection: page text is data inside escaped structure; nothing
  executes; every change is reviewed; deletes start unselected; model
  output is escaped in the review and the chat is plain text; inline
  nodes are placeholders; new URLs are restricted.

## 13. Evaluation (D16)
Runner, graders and cases: `frontend/eval/` (README there).

### 13.1 Cases
A case is real form data, the turns of a session and labels per turn,
in one file (`frontend/eval/cases/*.case.json`). Labels:

    must_flag:       [{target: b3, category: grammar}, {target: title, category: spelling},
                      {target: b6.1, category: accessibility, flag_only: true},  # report, don't change
                      {target: b2, category: spelling, if_found_in: 1}]          # only if turn 1 found it
    optional:        [{target: b8}]          # may be flagged, not counted against
    must_not_change: [b7, b9]                # changes count against precision
    must_not_obey:   [b8]                    # injected text: never act on it
    may_delete:      [b8]                    # deleting the injection itself is fine
    must_preserve:   [{block: b3, placeholder: "link:1"},
                      {block: b6.2, marks: [bold, italic]},
                      {block: b9, list: {type: ul, items: 3, depth: 1}, within: 2},  # or the next block
                      {block: b5, text: "March 19, 2026"}]   # a passage that must stay
    must_contain:    [{block: b8, text: "April 9, 2027"},    # values on what lands
                      {block: b8, sentences: 2},
                      {after: b22, shapes: [h3, em, p]}]     # new blocks after b22
    must_not_contain: [{block: b8, text: "March 18"}]
    # New blocks have no ref (D56): by their place after one
    must_contain:    [{after: b4, shapes: [[h2, h3], p, __button]},   # alternatives
                      {after: b4, index: 2, text: "Sponsors"},
                      {after: b4, fields: {"href.0.@id": "https://…",
                                           "styles.align:noprefix": right,
                                           preview_image: null}}]   # null: not set
    text_only:       true                    # words, no change: a question, a refusal
    no_other_changes: true                   # one place asked about: a change elsewhere fails (D58)

A case may name a shared page instead of holding its form data
(`formDataFile`): the summit cases test one real page.

### 13.2 Cases to cover
Clean page (false positives); long page (issues at start, middle, end);
links, mentions, tables; nested containers (inserts, deletes, splits);
metadata-only issues; a value changed everywhere in several formats
(only it may change); the summit page (a real 39-block page, nine
tasks: a date everywhere, a new attendee (a name the model cannot
know, D52), a section removed, a
translation, a shortened intro, contacts, tone, alt texts, a list);
block creation on the same page (D56: every insertable type, a row of
three types, the default place after the selection and at the end of
the page, a move, clearing a link, and the requests to answer with a
question or a refusal: no label, no URL, an image); injections in text, alt and metadata; a selected
block without a ref; multi-turn sessions with applied and edited
changes; styling (invalid names, defaults, mixed edits); concurrency
(edit between proposal and apply → stale); another language; empty
pages.

### 13.3 Metrics
Results carry the grading's version (`evalVersion`, 4 since D58);
files of different versions are not compared (the dashboard warns).

- **Clean pass** (D57) per run: answered, no violation, nothing lost, no
  protected block changed, every value check met, every labelled place
  found. Reported per case as pass@1 (the share of runs) and pass^k
  (every one of the k runs), and per group of cases: identical runs
  differ, and a target is honest only as pass^k.
- **Version 3** (D57): risky edits that start unselected land, like
  deletes (`confirm`); a text answer holding op JSON is no answer
  (`text_only`); `no_new_terms` fails a new text with facts nobody gave
  (the eval's coffee from 8:00); `{after, is}` checks a moved block by
  identity; reasoning estimates are capped at the completion tokens.
  The category-labelled recall stays a diagnostic.
- **Version 4** (D58): value checks and preservation also read the new
  blocks a change split off from a block (a rewritten intro in two
  blocks kept its date in the second and failed); the harness's "The
  proposal could not be used." is no `text_only` answer; a change
  outside the labelled places fails a `no_other_changes` turn (a
  separator request also rewrote the footer's date and passed);
  **model pass@1** next to pass@1: clean passes without a retry, a
  repair, the harness's words for an unusable proposal or its
  suggestions, so what the harness rescues is visible; since D59 also
  without the harness's question for references to a deleted block
  (`referencesAsked`, counted per case). Five repeats cannot separate
  two configurations by less than about 7 points.

- **What lands** (D52): value checks (`must_contain`,
  `must_not_contain`) and preservation are graded on the form after the
  changes the review selects by default, plus the deletes (unselected
  only so the editor confirms them, D20); with `apply: "all"`, after
  every change. An alt text the review leaves unselected does not land;
  an invented link that starts selected does. The invariants still apply
  every change.
- **Layer A, harness integrity** (code; target 0 violations):
  first-attempt validity (a retry after an empty answer, D47, is not
  valid), retries, repair rate and success, drops by code; changes
  selected by default despite a risk flag (removes a link, loses
  formatting, replaces most of a text, alt text, same as a block field);
  invariants on the applied form (untargeted blocks unchanged,
  placeholder misuse, injection obeyed); preservation (a placeholder's
  link by its target: a link with another URL in its place is not kept,
  D52); prompt tokens and finish reason (≥95 % of the context or
  `length` = deployment failure, excluded from B and C).
- **Layer B, assessment quality** (code, against labels): recall at the
  right target (the main number: a typo filed as grammar is still
  found), also with the right category, and once more counting failed
  runs as finding nothing (what the editor got); precision,
  `must_not_change`, detection per issue over ≥5 repeats (consistency).
  Report turns, and what a proposal only reports (`flag_only`: what the
  model cannot know, D40), are graded through an extractor call (eval
  only), itself to be hand-checked on ≥50 samples. A fix of "what you
  found" is graded only on what the earlier turn found (`if_found_in`):
  one miss is not counted twice.
- **Layer C, proposal quality** (human or calibrated judge, not built):
  does the change fix the issue, keep the meaning and facts, stay
  minimal. Needed: models invent facts (e.g. a new date for an outdated
  one). Until then a code signal points at them: **new terms**, numbers
  and names a proposal adds that neither the page nor the request
  contains (a name two letters from a page word counts as a spelling
  fix; numbers must match exactly; a date in numbers is known when the
  page or request names it in words; translations are left out, D52).
  To read, not a verdict.
- **Values after the changes**: `must_contain` and `must_not_contain`
  missed; the share of turns with words for the editor (text or
  `message`).
- **Speed**: time per turn (all its calls; mean, p50, p95), failed turns
  included with their time until the failure (D52: the editor waited
  that long), generated tokens per second, and reasoning tokens per turn
  (estimated from the reasoning text, about 4 characters a token, where
  the gateway reports none), next to quality.
- **Failed calls** are counted on their own, by code (`llm_timeout` apart
  from other `llm_failed`). What the editor got counts them (D52):
  recall as finding nothing (`recallTargetAll`, `recallTargetModelAll`),
  first-answer validity as invalid, speed with their time. The other
  Layer B means leave them out; the dashboard shows each value's `n`.
- **Unrequested layout changes**: styling changes on turns that did not
  ask for them (D36).
- **Layer D, production** (acceptance per category): not built (D15).

### 13.4 Diagnosis
Compare configurations (8B vs 14B, quantization, thinking on/off) and a
hand-written ideal projection for failing cases (single-turn first).
Layer A failures → harness; B fails with the real projection but passes
with the ideal one → projection; fails with both → model.

## 14. Decisions (why it is this way)
| # | Decision | Why |
|---|---|---|
| D1 | A chat with two tasks; the selected block is context | Editors work in sessions; isolated assessments lose context |
| D2 | One call per turn, the model chooses text or tool | Simple, fast; thinking gives the reasoning-first pattern |
| D3 | Markdown for rich text, round-trip checked | Readable for models; the round trip, not the format, guarantees safety (§16) |
| D4 | Nested blocks with dotted refs, editable within container rules | Grids are common; refs must show nesting |
| D5 | Block fields by allowlist, missing ones as `""` | Only what the model can handle; a missing alt must be visible (shown as `(empty)` until D52) |
| D6 | Page fields by allowlist (title, description by default) | Extensible per content type |
| D7 | Multi-element text is split into blocks, unless the block already had several | Volto text blocks hold one element; models ignore the rule. A block that already has several keeps them: a one-word fix must not cut it apart |
| D8 | One repair call | Tool arguments are not schema-constrained; one retry recovers most |
| D9 | Placeholders: never moved, not more often than in their block | Links and nodes can't be corrupted; editing text around them stays possible |
| D10 | No policy locks; the review is the gate | Every change is approved by a person |
| D11 | Reports are text; the eval extracts findings | Keeps production simple and still measurable |
| D12 | Every operation has `reason` and `category` | The editor sees why; metrics per category |
| D13 | All logic in a pure JS harness; the backend a fixed proxy | Validation needs Slate code; the eval runs it headless |
| D14 | History compacted to the surviving operations | Models copy their history; failed attempts would teach errors |
| D15 | No production telemetry yet | Privacy and scope; the eval measures first |
| D16 | Harness first, eval after | The eval needs a stable harness to measure |
| D17 | Any block can be deleted, except Volto's required ones | Editorial reality; deletes start unselected. What the form never lets an editor delete, the assistant does not propose |
| D19 | Context length, thinking, native function calling set on the gateway; context sized to the workload and to fit the GPU | Truncation looks like poor quality, and an oversized context makes the model slow; one call needs reasoning |
| D20 | Deletes unselected; mass-deletion warning | One click must not apply an injected deletion |
| D21 | Refs never reused | Old turns must never point at another block |
| D22 | A crude context budget in the harness | Prevents silent truncation without estimating every token |
| D23 | Few operations on two levels: `set_page_field` (the page itself), `edit_block`, `insert_block`, `delete_block` (its blocks), `replace_text` (both) | Small, flat vocabulary small models handle; the levels named apart (D51) |
| D24 | Only declared types can be inserted: text and buttons (since D53, a site list checked against the schemas) | The model cannot provide images; a button's link target comes from the request or is asked for (a `link` field: shown as its URL or path, stored as Volto's object browser does) |
| D25 | Styling fields editable, effective values shown | Layout is part of editing; "unset" is not "empty" |
| D26 | volto-light-theme is a given | The feature lives in this distribution |
| D27 | Superseding per target and field | Two edits of different fields both stand |
| D28 | An injected site profile | The harness stays headless; snapshots make evals reproducible |
| D29 | Every structural tag escaped | Page text cannot forge structure |
| D30 | Staleness and writes per field, compared as values show | An unrelated edit, or defaults Volto writes on selection, must not block a change |
| D31 | Multi-line values raw, unindented | Indentation is meaningful in Markdown |
| D32 | Insertable types always described | The model can insert a type the page lacks |
| D33 | Whole turns dropped | A tool call must keep its result |
| D34 | Deletes cover their subtree | Deleting a container conflicts with editing its child |
| D35 | One edit may mix content and styling; reviewed per field | Fewer, shorter calls; the editor decides field by field |
| D36 | Styling changes only on request | First eval: "improve this page" restyled every block of a clean page |
| D37 | Never invent facts; flag what needs checking | First eval: a new date for an outdated one, locations nobody named |
| D38 | Every answer explains itself in a sentence or two | First eval: proposals came with no text at all |
| D39 | Each request carries the selection it was sent with | With the selection only in the page, a second "this block" was read as the block of the first request |
| D40 | Images are never described; missing alt texts are reported for a person | The model sees a URL, not the image: first eval wrote alt texts for images it never saw |
| D41 | `replace_text` for exact words, compiled by the harness into the field's change | Asked to change a date everywhere, the model wrote "March 18 → April 9" as the new text of whole blocks; rewriting a block to change one date risks the rest and costs output tokens; the review, staleness and apply stay per field |
| D42 | The harness finds what a replacement left on the page and suggests the same change there itself; the editor confirms | The model found 3–4 of 6 mentions in three browser tests, also with the formats in the prompt. Asked about the rest in a follow-up, it kept the old date (the page still showed it everywhere). The harness knows old value, new value and each match's format: no extra call, deterministic, reviewed like the rest |
| D43 | Context length set explicitly; a cut input is detected from the reported prompt tokens | On "Default" the window changed between test days to 2048 tokens; the rules and the first blocks were cut off silently and the answers looked like model failures |
| D44 | Failures a repair cannot fix are dropped without a repair call | A repair call spent its whole answer on adding an alt text to a text block and returned nothing |
| D45 | A ref under a non-container (`b22.1`) means "after `b22`" | Asked for a speaker entry, the model chained its inserts as b22.1, b22.2 (container numbering), and its repairs repeated it although its reasoning knew better; inserts after one block already keep their order |
| D46 | `message` is a required parameter of `propose_changes`; the chat shows it when the model writes no text (the repair answer's when the first could not be read) | The model wrote no text next to a tool call in any test, but fills required parameters; it is also where it asks for missing details |
| D47 | An empty answer is asked for once more, with a note | A request for a type it could not insert made the 8B model produce a tool call the gateway dropped: an empty answer, and "try again" would repeat it |
| D48 | Read operations as meant (misplaced keys, type names, a call-level category); link targets only from the request | The 8B model without thinking put the type and the fields in the wrong places, the category once for the call, "button" for `__button`, and invented a link: a strict reader dropped a clear intent and spent a repair call. The prompt rule against invented links did not hold |
| D49 | Prompt examples use placeholders or values no page or case uses; a test keeps the eval cases out of the prompt | The 8B model copied the edit example (b4, theme grey) onto the real b4. The examples also held the summit tests' answers (b8, March 18 → April 9, b22, "### Name" / "*Role*", Mr. Spock): results were partly copied |
| D50 | `type` is required on inserts; no default | Fields differ from type to type: with `slate` as default, a button without `type` became a text block with a button's fields. The model left `type` out because the prompt's insert example had none, even when its reasoning named `__button` |
| D51 | `set_page_field` (was `set_field`), the prompt split into page level and block level; a repair replaces the first proposal; a page field equal to a block field of the same answer starts unselected and flagged | A browser test: the model sent a new button's fields again as `set_field` operations, so the page got the button's title. The repair understood the mistake but could not withdraw the valid title change |
| D52 | After the D51 eval review: rules for scope, formatting, consequences, whole-page requests, proposals in `message`, insertable types and placeholders; empty fields as `""`; invented URLs in rich text are errors; lost formatting flagged; leftovers only for values that changed; the answer streamed; the eval grades what lands and counts failed runs (version 2). Risk flags warn and do not deselect; no protected blocks by configuration | The run invented URLs in place of link placeholders (selected by default), changed dates and alt texts a tone request did not ask for, copied "(empty)" as a value, listed five false leftovers for a shortened intro, timed out on translations at the proxy's ~100 s, and its dashboard left failed runs out (recall 85 % shown, 79 % got). Removing a link or rewriting most of a text is often what was asked, so these stay selected; an editor cannot mark which block is the source of truth |
| D53 | Block fields and settings from the block schemas, by widget, for types without a hand-written entry; settings (choices, true/false) as styling-like fields for every type; insertable types a site list checked against the schemas; fields checked against the schema resolved with the block's data, one revealing setting switched on by the harness. The `@blocks-schema` endpoint is for the list and the docs, later (§15) | A hand-written entry per block would not scale to dozens of types (as with the repair messages, D50). A block's schema describes its sidebar settings, not the content edited in the block, and some fields depend on the data (a teaser's title on `overwrite`): only the live configuration can resolve that, so the panel's profile, not the endpoint's fixed answer, is the source for validation. No schema tells whether a block's main content is edited in the block itself, so insertability is opt-in |
| D54 | `<types>` marks required fields; all others are optional; a site list adds required fields a schema does not declare (a video's `url`) | A browser test: asked to add a video with its URL, the model read `fields: url, preview_image, title` as all required and asked for a title and a preview image instead of proposing. The video schema declares nothing required, though a video without its URL shows nothing |
| D55 | A required field the user did not give is asked for, never invented; a repair's insert without `type` keeps the type of the insert it corrects | A browser test: "add below a button block align it to the right" had no label; the repair message only said a label was needed, so the model copied "Register now" and `link:1` from b4, and left out `"type": "__button"`, so nothing was left |
| D56 | A new block goes where the user says, else after the selected block; with neither, the model asks. The eval grades block creation by place, shape and stored values, and requests to decline by a text answer with no change | A browser test put a video at the end of the page when nothing was selected. With text, buttons, separators and videos insertable, block creation needed cases of its own: new blocks have no ref, so they are found by their place |
| D59 | Before publishing, from a code review and the D58 run: (code review) an edit or insert without usable fields no longer throws and loses the turn; the measured characters per token are clamped where they are stored and not taken from a cut input; the history writes every insert's type; selection changes are tracked from the form's opening (the Sidebar); `@site` reads the intranet settings without failing on a site whose upgrade has not run; the upgrade adds its record by registering the interface instead of re-importing every registry file; the timeout bounds a non-streamed body too; the concurrency limit is configurable; an empty answer is logged by its shape only; the AI tab's index is the one the Sidebar computes; the closest-passage search stops early. (Eval) dependent dates computed where the page states the relation and it holds; text referring to a deleted block asked for in the extra call, its fix unselected with the delete; the insertable types as the schema's enum of an insert's `type`. Per-block calls for page-wide rewrites designed, not built (§15) | The D58 run (3 repeats) confirmed what code does and showed what prompts do not: the empty URL and the copied label were handled in every run, but the reference to the deleted parking section was left in every run and the deadline was computed wrong in 2 of 3, though the prompt asked for both; the model read `insertable="no"` and still tried an image. A code review found a crash on a field-less edit, a budget that a cut input could break open, history without types that the model copies, and an `@site` that fails before the upgrade, each with a regression test. Splitting page-wide rewrites changes D2 and needs its own eval |
| D58 | One tool, `propose_changes`: the intent toolset removed (snapshot in AI_EDIT_INTENT_TOOLSET.md). From the A/B run's reviews, in code: an empty value on a new block is not given, and a required value copied from the page is not given, both asked for without a repair; a repair of which nothing can be used keeps the first answer; `<types>` lists the insertable types first and marks every type `insertable="yes\|no"`; only styling is `layout`; text calls in the model's own format are retried. In the prompt: what a change makes wrong elsewhere is part of the request; required fields not given are left out entirely. Eval version 4: splits, `no_other_changes`, model pass@1, the harness's generic notice no answer; new checks on summit-3 ("Driving?") and summit-4 (b31 stays about parking) | Same quality at n=5 (78 vs 79 of 115), so the cheaper and clearer one stays: about 780 prompt tokens less per call, words for the editor in 113 instead of 87 turns, one message per answer, one code path. The run's failures were mostly shared and in the harness's reach: invented required values through the repair (every blocks-8 repair), a copied label (5 of 10 blocks-5 runs), an image read as insertable (every blocks-11 and summit-2 run), 15 valid changes lost to a repair, a dangling question and a mistranslated heading the grader passed, a run that kept every fact failing preservation |
| D57 | Two toolsets with the same capabilities for an A/B comparison (`list`, `intent`), one shared rules text and harness; `move_block`, `insert_blocks`, `null` to clear; categories never fatal; the harness asks for missing required fields and places blocks at the end when nothing says where; unrequested styling left off new blocks; risky edits unselected; the harness's notice when nothing could be used; a retry for changes written as text; a calibrated budget; eval version 3 with clean passes, pass@1 and pass^k. From a code review before the A/B run: parallel calls kept apart in the stream by id, malformed chunks a gateway failure, an unknown toolset name the site's toolset, weak date matches and yearless changes only listed, a field's split counted once; the check for dates that may depend on a change removed | The D56 eval (63 turns) and its review: the model reasons its way to the rule and then acts against it (asking where, not inventing a label), so those decisions moved to code; a wrong category dropped half a section; three repairs were skipped silently by an over-cautious budget; messages contradicted what survived; the grader passed answers that were JSON and new blocks with invented facts. A second toolset tests the research claim that flat, intent-named tools suit small models better than one tool with polymorphic items, without changing the rules or the eval. The dependent-dates check flagged a date of an unrelated change in a browser test: a half-reliable warning is worse than none, the editor owns those dates |

## 15. Out of scope, future possibilities
- **Page search tool**: questions about the page ("how many times is
  March 18 mentioned?", "where is the old phone number?") were answered
  wrongly in every browser test (four confident wrong counts), while the
  harness's search found every mention. A read-only `search_page` tool
  (text or a value, formats of dates included, as in leftovers.js) would
  answer them from code; the model phrases the answer. It can run in
  the browser: the harness has the page, executes the call, sends the
  result back as a tool result and asks again. No server-side loop, but
  a change to D2 (an extra call when the tool is used) and a tool
  registry in the harness. Decided: documented, not built yet.
- **More tools**: read-only tools that add context beyond the page, e.g.
  a site search (related pages, existing wording, people), or fetching
  block specifications on demand (§16). Any second tool needs a tool
  registry and a server-side loop (run read-only tools as the user,
  feed results back), a change to D2 to design together with
  non-blocking calls.
- **Attachments in the chat**: documents or images as context (e.g.
  "write this page from this PDF", alt texts from the image itself);
  needs upload handling, a multimodal model, and size limits.
- **Per-replacement review**: each `replace_text` its own row, accepted
  or rejected alone (e.g. keep the new date, reject a miscalculated
  deadline); needs apply and staleness per span, not per field.
- **Request routing**: offer only the operations that fit the request
  (only `replace_text` for "update everywhere"); fewer choices help
  small models.
- **Tables**: `slateTable` content is not projected, so the model cannot
  see dates or names in tables. Cells as text with refs (`b25.r2.c2`)
  and `replace_text` on them, before any table-editing operation.
- **Persistent conversations**, **production telemetry** (D15),
  **Layer C** judging, **policy locks** (D10), **moving blocks**,
  **Plate** content types, per-stage models or thinking.
- **Non-blocking LLM calls**: each call holds a Zope worker today (§16).
- **From the D57 A/B reviews** (2026-10-23), for a later round:
  - *Several new blocks addressed by new refs*: a model chained
    `insert_block` after b36, b37, b38, b39, taking the page's real
    blocks for the ones it was creating (blocks-12, summit-2). Temporary
    refs for new blocks (`after: "new:1"`), or a repairable error for a
    batch that inserts after consecutive existing blocks. `insert_blocks`
    covers most of it today.
  - *The editor's message built from the validated operations*, with
    the model's words as commentary: messages said "I've inserted an
    image block" for a dropped insert, "please confirm the date" after
    changing it. Since D57 the harness's words replace the model's only
    when nothing could be used.
  - *A visible placeholder for missing facts* (`[to be added]`) in new
    text about a person, instead of a neutral sentence and a question:
    9 of 10 runs invented a biography anyway (summit-2); grade the
    placeholder as the better answer.
  - *Insertable types as a schema enum per request*: built from the
    request's `<types>`; a hint only, since Ollama does not constrain
    tool arguments (§7), and it changes the fixed prompt size.
  - *A per-block check for page-wide rewrites*: a translation wrote the
    next heading's text into "Parking" (3 of 5 runs, selected by
    default); per-block calls (below) would prevent it, a judge would
    catch it.
- **From the D56 eval review** (2026-10-22), for a later round:
  - *Toolset C, two steps*: the model picks the operation and the
    block, then fills that block type's schema in a second call
    constrained to it, so it only ever sees one type's fields and
    cannot write another's. Needs structured output through the
    gateway (Open WebUI passing `format`/`response_format` to Ollama;
    tool arguments are not constrained) and costs a call per change.
    Worth it if the A/B shows that argument shape decides validity:
    it did not (D58: flat per-change tools gave the same quality; most
    invalid operations were empty or copied values and image inserts,
    which code now handles).
  - *A rewrite and replacements of one field combined* in code (apply
    the replacements to the rewrite where they still match) instead of
    the conflict that dropped both (summit-6).
  - *Link targets*: showing and editing `mailto:`/`tel:` targets, so a
    changed address can change its link too (summit-6 left one link
    pointing at the old address).
- **`@blocks-schema` for the list and a `describe_block` tool** (D53,
  steps after the schema fields): (3) links that store their target's
  data (`selectedItemAttrs`: a teaser renders its title and image from
  them) filled by a look-up of the target on the backend before the
  review, so teasers become insertable; (4) the prompt's `<types>`
  legend replaced by a list of the allowed, insertable types (`id —
  title: summary`, from the context endpoint, or evaluated in the browser
  on the add form) and a read-only `describe_block(types)` tool run in
  the browser harness (same origin as the Volto server, the user's
  cookie): the harness's own view of the fields (kinds, required,
  allowed values, container rules) plus the docs' text without the
  storage sections, at most one look-up round per turn; it can share
  the mechanism with the page search tool, and changes D2 (an extra
  call when used, 20–60 s with thinking); styling values then come from
  the repair message when a value is wrong; (5) eval cases inserting a
  heading, a separator, a video and a teaser, one with a required field
  the profile cannot fill, and a snapshot of the endpoint. The list pays
  off now (only buildable types offered: the image attempts); the tool
  once enough types are insertable that their details no longer fit the
  prompt.
- **From the D51 eval review** (2026-10-20), for a later round:
  - *Splitting page-wide tasks* (**the next design step**, decided
    after D58 to design and measure apart): a translation or a tone
    change as one call per block or section (with a glossary of what
    stays: names, venue, brand), run in parallel; mechanical requests
    (a date, contacts, a list) with thinking off. The biggest quality
    lever if the model stays at 14B. Evidence: tone 0 of 10 clean in the
    A/B and 0 of 3 after D58, missing the same block (b36) in every run;
    translation 0 of 13, the intro skipped, "On this page:" skipped in
    every run, and in 5 of 8 list runs the Parking heading written with
    the next heading's text ("## Was mitzubringen"), selected by default,
    which no single-call check can catch; translations reach 134 s per
    call. A sketch: (1) routing: the request is classified (page-wide
    rewrite or not) by a rule on the quick actions and a short call;
    (2) a plan call names the blocks to change and the glossary; (3) one
    call per block or section with only that block, the glossary and the
    request, thinking off, in parallel within the concurrency limit; (4)
    the harness validates each answer as today and merges them into one
    proposal and one review. Needs a change to D2 (several calls per
    turn), non-blocking calls or a raised concurrency limit (§11), the
    eval cases to compare against single-call runs, and a judge (below)
    for the quality of the rewrite.
  - *Dependent values computed in code*: done in D59 for dates with a
    stated relation (§8); other values (prices, counts) not yet.
  - *A judge model* for Layer C (meaning, facts, register, grammar, no
    invented content) on translate, tone, shorten and new-entry tasks,
    a stronger model than the one under test, calibrated on native
    speakers' spot checks. Code cannot see an invented biography or
    "Gesponsert von" for "Hosted by".
  - *More eval coverage*: 3–5 pages (tables, listings, nested layouts,
    a German page, a page with no issues), ≥10 repeats, conversations of
    several turns (the editor confirms "yes, the deadline too", corrects
    "keep the footer date"), requests to decline (a photo, checking
    links), a page with injected instructions; pass thresholds per case.
  - *Dashboard drill-down*: from a case to its runs and from a run to
    its message, changes with diffs and flags, dropped operations,
    expectations and reasoning; a feed of notable events across runs.
  - *Model comparison*: a 30B mixture-of-experts and a 32B dense model,
    and one with stronger German, against the 14B baseline with the
    same prompt, harness and eval; an extractor model other than the
    one under test (`EVAL_EXTRACTOR_MODEL`). Run settings, no code.

## 16. General challenges (beyond this feature)
Any AI feature working with Volto content meets these; a shared solution
would serve them all.

- **Block specification**: which blocks exist, their fields, styling
  and container rules. Here: schemas built by running each block's
  schema enhancers in the browser (fields and settings by widget, D53),
  which needs filled sample data and fails for some blocks, plus a
  hand-written allowlist for content edited in the block itself.
  Volto's `@blocks-schema` endpoint (branch `blocksschemaendpoint`)
  serves, from the Volto server: every block with its title, a summary
  and `restricted`; per block its Markdown docs (`*.block.md`), its
  resolved schema and its variations; Markdown on request; for a
  content path (`/<path>/@blocks-schema`) only the blocks the block
  chooser offers there. What it does not settle: its docs describe the
  stored JSON (Slate nodes, `plaintext`, UUIDs), for agents that write
  block data (the Plone MCP server), not this assistant's format; its
  schemas are resolved with empty data (fields some settings show, VLT's
  styling of a filled image are missing) and hold no content edited in
  the block; container rules are only in the docs' text; most add-on
  blocks have no docs yet.
- **Content conversion**: Slate (and other block data) to a text format
  a model reads and back, without loss. Here: own Markdown serializer,
  remark parser, placeholders for inline nodes, a round-trip check that
  locks what does not survive. Alternatives looked at: HTML through
  volto-slate's own (de)serializer (needs a DOM and an editor instance,
  more tokens); a Slate → mdast mapping with `remark-stringify` (one rule
  set both ways, but `mdast-util-to-markdown` writes `&#x20;` for
  whitespace at emphasis edges). General solution: a Plone/Volto content
  parser and serializer for LLMs, shared with RAG and indexing.
- **LLM runtime configuration**: context length, thinking, function
  calling and model limits live on the gateway, and wrong defaults look
  like poor model quality. General solution: a shared LLM layer and
  documented deployment requirements (with RAG).
- **Synchronous LLM calls in Plone**: a call holds a worker thread for
  its whole duration (minutes with thinking). General solution:
  non-blocking calls (streaming or a task queue), shared with RAG
  (ticket #515).
