# Eval of the AI assistant

Measures the AI-assisted editing feature against labelled pages, as
specified in [AI_WORKFLOW.md](../../docs/ai-edit/AI_WORKFLOW.md) §13. Plan and status:
[AI_EDIT_PLAN.md](../../docs/ai-edit/AI_EDIT_PLAN.md) §1 and §2.

The runner plays every case through the same harness the editor's panel
uses (`components/AIEdit/harness`) and through `@ai-edit` on a running
backend, so the real prompt and tool schema are tested (spec D13). The
backend's LLM environment decides the model under test.

## Contents

| Path | What |
| --- | --- |
| `cases/*.case.json` | Real form data (or `formDataFile`: a shared page), the turns of a session, labels per turn (format in `lib/run.js`) |
| `pages/*.json` | Shared pages: `horizon-summit.json`, the summit page as the site stores it (39 blocks, image scales left out) |
| `profiles/intranet.json` | The site profile snapshot (what the model may see and change). Patched by hand on 2026-10-22 to the live D53–D55 profile of the types on the summit page (separator and video insertable, the video's fields, the button's `openLinkInNewTab`), from a browser trace; regenerate it with the script for the whole site |
| `lib/run.js` | Runner: plays a case's turns, simulates the editor's choice between turns, aggregates repeats |
| `lib/grade.js` | Graders: Layer A (harness integrity, invariants) and Layer B (findings against labels) |
| `lib/backend.js` | `@ai-edit` client |
| `lib/extract.js` | Report extractor: text assessments to findings (eval only, straight to the gateway) |
| `grade.test.js` | Tests of runner and graders with a scripted model |
| `run.eval.js` | The run; skipped without `EVAL_BACKEND` |
| `scripts/snapshot-profile.mjs` | Captures the profile from the running app |
| `dashboard.html` | Compares results files: open it in a browser, select or drop one or more `results/*.json` |
| `results/` | Run results (git-ignored) |

## Running

Everything runs with the add-on's vitest, from
`frontend/packages/kitconcept-intranet` (Node 22 or 24):

```sh
# The runner and graders themselves (no LLM)
pnpm exec vitest run --config ../../eval/vitest.config.mjs

# A run against a backend
EVAL_BACKEND=http://localhost:8080/Plone \
EVAL_USER=admin EVAL_PASSWORD=admin \
EVAL_LABEL="qwen3_14b_ctx16384_thinking_D52" \
EVAL_REPEAT=5 \
pnpm exec vitest run --config ../../eval/vitest.config.mjs run.eval
```

The backend needs the assistant switched on (Intranet settings) and
`KITCONCEPT_SOLR_LLM_URL`, `_TOKEN`, `_CHAT_MODEL` set. It streams the
gateway's answers (D52; `KITCONCEPT_INTRANET_AI_EDIT_STREAM=0` turns it
off), so long answers are not ended by the gateway's proxy. Set
`KITCONCEPT_INTRANET_AI_EDIT_CONTEXT_LENGTH` only to a context length you
know (`ollama ps`); with the gateway's default left unknown, leave it
unset (the budget then only limits turns, and truncation is not
detected). For an eval, raise `KITCONCEPT_INTRANET_AI_EDIT_TIMEOUT`
(seconds, default 120) so slow answers are measured, not cut off: in the
first full run 30 % of the turns hit 120 s.
To compare models (8B vs 14B, quantization, thinking on/off; spec §13.4),
restart the backend with another `KITCONCEPT_SOLR_LLM_CHAT_MODEL` and give
each run its own `EVAL_LABEL`.

| Variable | Default | Meaning |
| --- | --- | --- |
| `EVAL_BACKEND` | (none: skipped) | Site URL with `@ai-edit` |
| `EVAL_USER`, `EVAL_PASSWORD` | `admin`, `admin` | A user with "Use AI editing" on the site |
| `EVAL_CASES` | all | Comma-separated case ids |
| `EVAL_REPEAT` | 5 | Runs per case (consistency needs ≥5) |
| `EVAL_LABEL` | `unlabeled` | Names the configuration in the results |
| `EVAL_PROFILE` | `profiles/intranet.json` | Another profile snapshot |
| `EVAL_EXTRACTOR_URL`, `_TOKEN`, `_MODEL` | the feature's `KITCONCEPT_SOLR_LLM_URL` (+ `_CHAT_PATH`, default `/api/chat/completions`), `_TOKEN`, `_CHAT_MODEL` | The report extractor's endpoint, token and model. **Pin `EVAL_EXTRACTOR_MODEL`** when comparing models: the fallback model is the one under test |

The extractor uses the feature's LLM variables when they are set in the
shell that runs the eval (export the same values the backend uses); the
results record which model graded the report turns. Without it, report
turns are graded for Layer A only (and must propose nothing), and
`flag_only` labels are left out. With only qwen3 models available, the extractor
runs on qwen3:14b, the same class of model it measures: hand-check a
sample of ≥50 of its extractions (in the results JSON, `findings` next to
the report text) before trusting report recall.

## Reading the results

Results carry `evalVersion` (4 since D58; files without it are 1); the
D57 A/B files also carry `toolset` (`list` or `intent`, the second tool
architecture, removed in D58: `AI_EDIT_INTENT_TOOLSET.md` at the
repository root). The grading changed between versions, so compare files
of one version only (the dashboard warns). Version 2: value checks and
preservation on what lands, failed turns in latency and first-answer
validity, a retry no valid first answer, links checked by target,
translations and dates in numbers left out of new terms. Version 3: a
clean pass per turn (`graded.passed`), risky edits that start
unselected land like deletes (`confirm`), a text answer holding op JSON
is no answer, `no_new_terms`, `{after, is}`, capped reasoning
estimates. Version 4 (D58): value checks and preservation also read the
new blocks a change split off from a block (a rewritten intro in two
blocks keeps its date in the second); the harness's "The proposal could
not be used." is no `text_only` answer (its refusal of a block type it
cannot add still is); `no_other_changes` fails a change outside the
labelled places; `modelPassed` per turn and `modelPassAt1` per case.

- **passAt1**, **passAll** (D57): the share of runs with a clean pass
  (answered, no violation, nothing lost, no protected block changed,
  every value check met, every labelled place found), and whether every
  run passed (pass^k, k = the repeats). Identical runs differ: pass^k
  is the honest number for a target. With 5 repeats, one run moves
  pass@1 by 0.2 and a difference between two configurations under
  about 7 points is noise: use ≥10 repeats to compare.
- **modelPassAt1** (D58): clean passes the model made on its own,
  without a retry, a repair, the harness's own words for a proposal it
  could not use (an image refused) or the harness's suggestions. The
  harness asking for a required field the model left out is the
  designed path, not a rescue. pass@1 minus this is what the harness
  adds.

The run prints the results file's path first, then one line per run
(seconds, and per turn: errors, recall, value checks met, an extractor
failure), and at the end one row per case and turn. `results/*.json`
holds the summary and every turn (the model's text, the changes, the
grades). It is written after every run: a run that stops leaves what it
measured (`"complete": false`). A case that fails with an unexpected
error is recorded (`error` in its run) and the run goes on.
- **extractorErrors**: turns whose text answer could not be graded (the
  extractor call failed twice, e.g. HTTP 524: the gateway's proxy gives
  up after about 100 s). The extractor asks the model not to reason
  (`/no_think`): it only sorts a report into a list.

- **errors** (`errorCodes`): calls that failed: `llm_timeout` for the
  backend's chat timeout, `llm_failed` for other gateway failures. **deploymentFailures**: the prompt reached
  ≥95 % of the context, the answer was cut off, or the gateway cut the
  input (fewer prompt tokens than the request's size allows, a context
  too small: per turn `graded.a.inputTruncated`). Neither is the model's
  quality. Setup failures are left out of every other column; errors
  count where the editor would notice them: `recallTargetAll` and
  `recallTargetModelAll` (as finding nothing), `firstAttemptValid` (as
  invalid) and the speed columns (with their time until the failure).
  **graded** is what remains for the other columns; fix the setup
  (timeout, context, output limit).
- **firstAttemptValid**, **retried**, **repaired**, **repairSucceeded**:
  how often the first answer was valid (a retry after an empty answer,
  D47, is not), how many turns were retried, how often the repair call
  was needed (expected well below 100 %, spec §7) and how often it left
  nothing dropped. **dropped**: operations that could not be used.
- **flaggedSelected**: changes selected by default despite a risk flag
  (removes a link, loses formatting, replaces most of a text, an alt
  text, same as a block field): what lands unless the editor reads the
  warning.
- **suggested**, **leftovers**: mentions of a replaced value the model
  missed that the harness suggested, and places it could not compute
  (listed for the editor; D42).
- **violations**: blocks no change targets changed, placeholder misuse,
  an injection obeyed. Target 0: anything else is a harness bug.
- **preservationFailures**: links (by their target: a link with another
  URL in place of a placeholder is lost), marks, list shapes or passages
  that must stay (`text`) lost, on what lands.
- **What lands** (D52): the form after the changes the review selects
  by default, plus the deletes (they start unselected only so the
  editor confirms them); with `"apply": "all"`, every change. An alt
  text that starts unselected does not land; an invented link that
  starts selected does.
- **expectedMissed**: values not as the labels expect on what lands: `must_contain` (the new date, a two-sentence intro, a row
  of new blocks of the right shapes) and `must_not_contain` (the old
  date, casual phrases); ignoring case. Per turn: `graded.expected`.
- **textAnswer**: share of turns with words for the editor (text or the
  tool's `message`, D46).
- **recallTarget** (the main number): share of labelled issues found at
  the right place, any category, by the feature (the harness's
  suggestions included). **recallTargetModel**: by the model alone. **recallTargetAll**: the same with
  every failed run of a gradable turn counted as finding nothing (what
  the editor got). **recall**: also with the labelled category.
- **precision**: share of changes on labelled targets; **mustNotChange**:
  changes to blocks that should stay.
- **detection**: per labelled issue, in how many of the graded runs that
  expected it it was found (consistency).
- **layoutChanges**: styling changes; none of the cases asks for them, so
  every one is unrequested.
- **newTerms**: numbers and names proposals added that neither the page
  nor the request contains (per turn in the JSON: `graded.newTerms`).
  Translations are left out, and a date in numbers counts as known when
  the page or the request names it in words. A signal for invented
  facts: read those proposals.
- **turnSeconds**, **p50Seconds**, **p95Seconds**: time per turn, all its
  calls (repair included), failed turns with their time until the
  failure: what the editor waits for.
  **tokensPerSecond**: generated tokens per second over the answered
  calls; a 14B model fully on a GPU should be far above 10.
  **reasoningTokens**: per turn, from the gateway or estimated from the
  reasoning text (about 4 characters a token; Ollama behind Open WebUI
  reports none).
- Per turn in the JSON: `graded.timing` (each call's duration, tokens,
  error, whether it was the repair, and to retrace it: the model's
  `reasoning` when the gateway passes it, its `text` and `toolCalls`);
  `message.changes` with the fields of inserted blocks.

## Dashboard

Open `dashboard.html` in a browser and select or drop one or more results
files; nothing is uploaded. It computes every value from the runs in the
file, so older files show the same definitions (values a file does not
record show as n/a). Failed turns count as the editor met them: recall 0,
no valid first answer, their time in speed; each value shows its `n`
(the turns behind it).

- The overview table groups the KPIs; each chart holds one direction:
  success and reliability (higher is better: recall for the editor and
  the model alone, precision, value checks, first answer valid, repair
  succeeded), failures (lower: errors, setup failures, retries, repairs
  needed), safety counts (lower: protected blocks changed, flagged but
  selected, preservation failures, violations, dropped operations,
  unrequested layout) and speed (mean, p50, p95). Diagnostics (tokens
  per second, reasoning and prompt tokens, harness suggestions,
  leftovers, new terms, text answers) are in the table only.
- **Clean passes** (version 3, D57): pass@1, pass^k and (version 4,
  D58) the model's own pass@1 in the success group, and per group of
  cases (blocks, summit, …) below the table; each file's header names
  its toolset (`list` for files without one; the D57 A/B files have
  `-list` and `-intent`).
- **Per case**: bars for the case's value, a dot per run, a red cross
  per failed run, and the number of runs per file under each case.
- **Baseline**: pick a loaded file; the table then shows each other
  file's change against it, green where better and red where worse.
- A banner warns when the loaded files come from different eval
  versions.

Each run can be hidden or removed; runs are ordered by start time.

Diagnosis (spec §13.4): Layer A failures point to the harness; recall that
fails with the real projection but passes with a hand-written ideal one
points to the projection; failing both points to the model.

## Cases

| Case | Covers |
| --- | --- |
| `services-v1` | The services example page: metadata, grammar, heading level, outdated date, missing alt in a grid, a legal block, an injection, a clean list |
| `services-v1-report` | The same page, assessed only (report extractor) |
| `clean-page` | No problems: every change is a false positive |
| `links-and-lists` | One link target twice (one placeholder twice), a list, emphasis |
| `selected-block` | "Shorten this block" with a selection, no ref |
| `session` | Assess, fix what was found, a new request (history, applied changes) |
| `injection-alt` | An injection in an image's alt text, a skipped heading level |
| `long-page` | 32 blocks, typos at the start, middle and end |
| `summit-1-date` … `summit-9-list` | The summit page with the nine tasks of a draft eval page, adapted (each case's description says how): a date everywhere with a dependent deadline, a new attendee (`summit-2-attendee`, a name no model knows; was `summit-2-spock`), a section removed, a translation, a two-sentence intro, contacts from the moved-notice, a formal tone, alt texts (by D40: reported, not written), a list. Graded mostly by values after the changes (`must_contain`, `must_not_contain`) |
| `date-everywhere` | A date changed on the whole page in five formats; only the date may change (`replace_text`, D41), last year's date stays, a dependent deadline |
| `blocks-1-text` … `blocks-14-clear-link` | Block creation on the summit page (D56, D57): a paragraph, a heading and a paragraph, a button with label, link and alignment, a button without a link (none invented), a separator, a video with its URL alone, the default places (after the selected block; at the end of the page with nothing selected), a row of four blocks of three types, a moved block (`blocks-13-move`), a cleared link on a small page (`blocks-14-clear-link`); and requests answered with a question or a refusal (`text_only`): a button without a label, a video without a URL (the harness asks), an image |

Labels besides `must_flag`, `optional`, `must_not_change` and
`must_preserve` (spec §13.1): `must_contain` / `must_not_contain` rules
`{block, text}` (`within: n` adds the next blocks, for splits),
`{block, sentences}`, `{field, text}` for page fields, and
`{after, shapes}` (`h3`, `em` for a line in italics, `p`, `ul`; a block
without text by its type, `__button`; an entry may list alternatives,
`[["h2", "h3"], "p"]`) for the blocks right after one. New blocks have no
ref (D56): `{after, index, text}` checks the text of the block `index`
(default 0) after one, `{after, index, fields}` its stored values by
dotted path (`"href.0.@id"`, `"styles.align:noprefix"`; `null`: not
set). `{after, is}` checks that the block right after one is a given
block (a move: the same block, not a copy). `text_only: true` (a label
of its own, no `must_flag`) expects a text answer and no change, and no
changes written as JSON; `no_new_terms: true` fails a turn whose new
texts add numbers or names neither the page nor the request has;
`no_other_changes: true` (D58, every `blocks-*` case with a target)
fails a turn that changes anything outside `must_flag` and `optional`
(counted per turn as `outOfScope`). All but the last are counted in
`expectedMissed`.

Adding a case: write real form data (as Volto stores it), the turns and
labels with refs as the harness assigns them (`b1` is the first block, the
title block included; nested `b6.1`). A `must_flag` label can be
`flag_only` (the model cannot know the fix, e.g. an alt text: found in
the answer's text through the extractor, so add the target to
`must_not_change`) or `if_found_in: N` (counts only in runs where turn N
found it, for "fix what you found").
