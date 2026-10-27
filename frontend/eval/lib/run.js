/**
 * The eval runner (AI_WORKFLOW.md §13): plays a case's turns as one chat
 * session through the harness, grades every turn, and aggregates repeats.
 *
 * A case (`cases/*.case.json`):
 *
 *     {
 *       "id": "services-v1",
 *       "description": "...",
 *       "formData": {...},              // real form state
 *       "selected": ["block id"],       // optional, for every turn
 *       "turns": [{
 *         "request": "Check this page and fix what is wrong.",
 *         "kind": "propose" | "report",
 *         "apply": "defaults" | "all" | "none",   // after the turn
 *         "labels": {
 *           "must_flag": [{"target": "b3", "category": "grammar"},
 *                         // To be reported in the text, not changed
 *                         // (graded with the extractor)
 *                         {"target": "b6.1", "category": "accessibility",
 *                          "flag_only": true},
 *                         // Counts only in runs where turn 1 found it
 *                         {"target": "b2", "category": "spelling",
 *                          "if_found_in": 1}],
 *           "optional": [...], "must_not_change": ["b7"],
 *           "must_not_obey": ["b8"], "may_delete": [],
 *           "must_preserve": [{"block": "b3", "placeholder": "link:1"},
 *                             {"block": "b6.2", "marks": ["bold"]},
 *                             {"block": "b5", "text": "March 19, 2026"},
 *                             {"block": "b9", "list": {"type": "ul",
 *                                                      "items": 3,
 *                                                      "depth": 1}}]
 *         }
 *       }]
 *     }
 *
 * Between turns the editor's choice is simulated: `defaults` applies what
 * the review pre-selects (deletes not), `all` everything, `none` nothing.
 */
import { applyChanges, projectPage, runTurn } from './harness.js';
import {
  expectations,
  findingsOf,
  invariants,
  landedOutcome,
  layerA,
  layerB,
  newTerms,
  preservation,
} from './grade.js';

/**
 * The turn's labels for this run: an `if_found_in` label only when that
 * earlier turn (1-based) graded it found at its target. "Fix what you
 * found" cannot fix what was not found: without this, one miss counts
 * twice.
 */
const labelsFor = (labels, turns) => ({
  ...labels,
  must_flag: (labels.must_flag || []).filter((label) => {
    if (!label.if_found_in) return true;
    const earlier = turns[label.if_found_in - 1]?.graded?.b?.detected || [];
    return earlier.some(
      (found) => found.target === label.target && found.foundTarget,
    );
  }),
});

// What a stored result keeps of the harness's message
const summary = (message) => {
  const { baseFormData, ...rest } = message;
  return {
    ...rest,
    changes: (message.changes || []).map(
      ({
        key,
        kind,
        label,
        value,
        category,
        reason,
        flags,
        ref,
        field,
        replacements,
        selected,
        confirm,
        type,
        fields,
        anchorRef,
      }) => ({
        key,
        kind,
        label,
        value,
        category,
        reason,
        flags,
        ref,
        field,
        replacements,
        selected,
        // Unselected for the editor to confirm, not as likely wrong (D57)
        confirm,
        // An inserted block, a move's place: its type, place and fields (its text)
        type,
        fields,
        anchorRef,
      }),
    ),
  };
};

/**
 * The version of the grading: results of different versions are not
 * comparable (the dashboard warns). 2 (D52): latency and first-answer
 * validity count failed runs, a retry is no valid first answer, value
 * checks and preservation look at what lands, links are compared by
 * target, translations and dates in numbers are no new terms. 3 (D57):
 * risky edits that start unselected land (like deletes), a text answer
 * holding op JSON is no answer, `no_new_terms` and moved blocks (`is`)
 * are checked, every turn has a clean pass (`passed`, pass@1 and pass^k
 * per case), reasoning estimates are capped at the completion tokens.
 * 4 (D58): value checks and preservation also look at what a change
 * split off from a block; `text_only` is not met by the harness's "The
 * proposal could not be used."; `no_other_changes` fails a change outside
 * the labelled places; `modelPassed` (pass@1 as `modelPassAt1`) leaves out
 * runs the harness rescued.
 */
export const EVAL_VERSION = 4;

/**
 * A clean pass (D57): answered, nothing broken (no violation, nothing
 * lost, no protected block changed), every value check met, and, where
 * the turn has labels, every labelled place found. A failed call is no
 * pass: pass@1 is what an editor gets.
 */
export const passedOf = (graded) =>
  !graded.a.error &&
  !graded.a.deploymentFailure &&
  !(graded.invariants?.violations > 0) &&
  (graded.preservation || []).every((rule) => rule.kept) &&
  (graded.expected || []).every((rule) => rule.met) &&
  !(graded.outOfScope > 0) &&
  (!graded.b ||
    ((graded.b.recallTarget === null || graded.b.recallTarget === 1) &&
      !graded.b.mustNotChange?.length));

/**
 * A clean pass the model made on its own (D58): without a retry, a
 * repair, the harness's question for references to a deleted block
 * (D59), the harness's own words for a proposal it could not use (an
 * image block refused), or the harness's suggestions (D42). The harness
 * asking for a required field the model left out is the designed path
 * (D57), not a rescue. Next to pass@1, it shows what the harness adds.
 */
export const modelPassedOf = (graded, message) =>
  graded.passed &&
  !message.retried &&
  !message.repaired &&
  !message.referencesAsked &&
  message.notice?.kind !== 'dropped' &&
  (!graded.bModel ||
    graded.bModel.recallTarget === null ||
    graded.bModel.recallTarget === 1);

// For estimating reasoning tokens from the text
const CHARS_PER_TOKEN = 4;

/** One run of a case. */
export const runCase = async (
  testCase,
  { send, profile, budget, vocabulary, extract, language = 'en' },
) => {
  let formData = testCase.formData;
  let conversation = [];
  let refs = {};
  const links = {};
  const turns = [];
  let counter = 0;
  const newId = () => {
    counter += 1;
    return `eval-${counter}`;
  };
  for (const turn of testCase.turns) {
    const labels = labelsFor(turn.labels || {}, turns);
    const before = formData;
    // Every call of the turn (the repair call included), timed
    const calls = [];
    const timedSend = async (payload) => {
      const started = performance.now();
      const answer = await send(payload);
      calls.push({
        ms: Math.round(performance.now() - started),
        repair: !!payload.repair,
        error: answer.error_code || null,
        promptTokens: answer.usage?.prompt_tokens ?? null,
        completionTokens: answer.usage?.completion_tokens ?? null,
        // The gateway reports none (Ollama behind Open WebUI): estimated
        // from the reasoning text, about 4 characters a token
        // (capped: an estimate above the completion tokens is wrong)
        reasoningTokens:
          answer.usage?.reasoning_tokens ||
          (answer.reasoning
            ? Math.min(
                Math.round(answer.reasoning.length / CHARS_PER_TOKEN),
                answer.usage?.completion_tokens ?? Infinity,
              )
            : 0),
        // To retrace a turn: what the model thought, wrote and called
        reasoning: answer.reasoning || null,
        text: answer.message || null,
        toolCalls: answer.tool_calls || [],
      });
      return answer;
    };
    const selected = turn.selected || testCase.selected || [];
    const turnStarted = performance.now();
    const result = await runTurn({
      text: turn.request,
      formData: before,
      selected,
      profile,
      conversation,
      refs,
      links,
      budget,
      vocabulary,
      language,
      send: timedSend,
    });
    refs = result.refs;
    const { message } = result;
    const graded = {
      a: layerA(message, budget),
      // Whether the turn has labels it can be graded on: a failed run of
      // it then counts as finding nothing (unconditional recall)
      gradable:
        !!turn.labels?.must_flag?.length &&
        (turn.kind !== 'report' || !!extract),
      // What the editor waits for: the whole turn, repair included
      timing: { turnMs: Math.round(performance.now() - turnStarted), calls },
    };
    if (!message.error) {
      // The page the proposal was made for, with the conversation's refs
      const { page } = projectPage({
        formData: before,
        profile,
        links: { ...links },
        refs,
      });
      const checked = invariants({
        message,
        formData: before,
        page,
        profile,
        links,
        labels,
      });
      graded.invariants = {
        violations: checked.violations,
        changedUntouched: checked.changedUntouched,
        placeholderViolations: checked.placeholderViolations,
        injectionObeyed: checked.injectionObeyed,
      };
      graded.layoutChanges = (message.changes || []).filter(
        (change) => change.category === 'layout',
      ).length;
      // Graded on what lands, not on every proposal (D52)
      const landed = landedOutcome({
        message,
        formData: before,
        profile,
        links,
        apply: turn.apply,
      });
      graded.preservation = preservation({
        after: landed,
        refs,
        labels,
        links,
        before,
      });
      graded.expected = expectations({
        after: landed,
        refs,
        labels,
        message,
        before,
      });
      // The words for the editor (text or the tool's message, D38, D46)
      graded.textAnswer = !!message.content?.trim();
      graded.newTerms = newTerms(message, page, turn.request);
      // Nothing the request or the page does not say (D57: a new block
      // with "coffee from 8:00" nobody mentioned)
      if (labels.no_new_terms) {
        graded.expected.push({
          kind: 'noNewTerms',
          met: !graded.newTerms.length,
          terms: graded.newTerms.flatMap((entry) => entry.terms),
        });
      }
      let findings = findingsOf(message);
      let textFindings = null;
      // Without an extractor, or when it failed, text is not graded
      let textGraded = !!extract;
      if (turn.kind === 'report') {
        // A report proposes nothing; its findings are in the text
        graded.unrequestedChanges = message.changes.length;
        findings = null;
        if (extract) {
          const extracted = await tryExtract(extract, message.content, page);
          findings = extracted.findings;
          graded.extractorError = extracted.error;
        }
        textFindings = findings;
      } else if (
        extract &&
        message.content?.trim() &&
        labels.must_flag.some((label) => label.flag_only)
      ) {
        // What a proposal only reports (D37: what it cannot know)
        const extracted = await tryExtract(extract, message.content, page);
        textFindings = extracted.findings;
        graded.extractorError = extracted.error;
        textGraded = !extracted.error;
      }
      if (findings && !graded.a.deploymentFailure) {
        graded.b = layerB(
          findings,
          labels,
          textFindings ?? (textGraded ? [] : null),
        );
        graded.findings = findings;
        // A request about one place (D58): a change anywhere else fails
        // the run (an eval run rewrote the footer's date for a separator)
        if (labels.no_other_changes) {
          graded.outOfScope = graded.b.falsePositives;
        }
        // The model's own share, without the harness's suggestions (D42)
        if (turn.kind !== 'report' && message.suggested) {
          graded.bModel = layerB(
            findingsOf(message, { modelOnly: true }),
            labels,
            textFindings ?? (textGraded ? [] : null),
          );
        }
        if (textFindings && turn.kind !== 'report') {
          graded.textFindings = textFindings;
        }
      }
    }
    graded.passed = passedOf(graded);
    graded.modelPassed = !message.error && modelPassedOf(graded, message);
    // The editor's choice, for the next turn
    let applied = [];
    let created = {};
    if (!message.error && turn.apply !== 'none') {
      const chosen = (message.changes || []).filter(
        (change) => turn.apply === 'all' || change.selected,
      );
      const outcome = applyChanges(chosen, before, {
        baseFormData: before,
        profile,
        links,
        newId,
      });
      formData = outcome.formData;
      applied = chosen.map((change) => change.key);
      created = outcome.created;
    }
    conversation = [
      ...conversation,
      { role: 'user', content: turn.request, selected },
      { ...message, applied, created },
    ];
    turns.push({
      request: turn.request,
      kind: turn.kind || 'propose',
      message: summary(message),
      graded,
    });
  }
  return { id: testCase.id, turns };
};

/**
 * An extraction that cannot fail the run: `{findings}` or `{error}` (the
 * turn's text answer is then not graded, see `extractorError`).
 */
const tryExtract = async (extract, text, page) => {
  try {
    return { findings: await extract(text, page) };
  } catch (error) {
    return { findings: null, error: String(error?.message || error) };
  }
};

const mean = (values) => {
  const numbers = values.filter((value) => typeof value === 'number');
  return numbers.length
    ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length
    : null;
};

const percentile = (values, share) => {
  const sorted = values
    .filter((v) => typeof v === 'number')
    .sort((a, b) => a - b);
  if (!sorted.length) return null;
  return sorted[
    Math.min(sorted.length - 1, Math.ceil(share * sorted.length) - 1)
  ];
};

/**
 * Aggregate the repeats of every case, turn by turn (spec §13.3):
 * - failures that are not the model's: `errors` (the call failed:
 *   `llm_timeout` for the chat timeout, `llm_failed` for the gateway) and
 *   `deploymentFailures` (prompt at the context limit, answer cut off).
 *   What the editor got counts errors (D52): `recallTargetAll` and
 *   `recallTargetModelAll` as finding nothing, `firstAttemptValid` as
 *   invalid, the speed numbers with the time until the failure. Layer B
 *   means otherwise leave both out;
 * - Layer A rates and Layer B means over the turns that were graded;
 *   `recallTargetAll` also counts the failed runs of a gradable turn as
 *   finding nothing (what the editor got);
 * - per `must_flag` label, in how many of the graded runs it was in it
 *   was found;
 * - new terms: numbers and names proposals added that are on neither the
 *   page nor the request (read them: invented facts?);
 * - clean passes (D57, `passedOf`): pass@1 over the runs, pass^k (all
 *   runs passed);
 * - reliability: retries after an empty answer (D47), dropped
 *   operations, repairs and how many left nothing dropped, changes
 *   selected by default despite a risk flag;
 * - speed: time per turn (all its calls), failed turns included, mean,
 *   p50 and p95; generated tokens per second of the answered calls;
 *   reasoning tokens per turn (estimated where the gateway reports none).
 */
export const aggregate = (runs) => {
  const byTurn = new Map();
  runs.forEach((run) =>
    run.turns.forEach((turn, index) => {
      const key = `${run.id} #${index + 1}`;
      if (!byTurn.has(key))
        byTurn.set(key, { key, kind: turn.kind, results: [] });
      byTurn.get(key).results.push(turn.graded);
    }),
  );
  return [...byTurn.values()].map(({ key, kind, results }) => {
    const errors = results.filter(
      (graded) => graded.a.error && !graded.a.deploymentFailure,
    );
    const deployment = results.filter((graded) => graded.a.deploymentFailure);
    const counted = results.filter(
      (graded) => !graded.a.error && !graded.a.deploymentFailure,
    );
    const withB = counted.filter((graded) => graded.b);
    const failedGradable = [...errors, ...deployment].filter(
      (graded) => graded.gradable,
    );
    const detection = {};
    withB.forEach((graded) =>
      graded.b.detected.forEach((label) => {
        const name = `${label.target}/${label.category}`;
        const entry = detection[name] || { hits: 0, runs: 0 };
        detection[name] = {
          hits: entry.hits + (label.found ? 1 : 0),
          runs: entry.runs + 1,
        };
      }),
    );
    // What the editor waited for, a failed turn included
    const turnMs = [...counted, ...errors].map((g) => g.timing?.turnMs);
    const answered = [...counted, ...errors];
    const repairedRuns = counted.filter((g) => g.a.repaired);
    const okCalls = counted
      .flatMap((g) => g.timing?.calls || [])
      .filter((c) => !c.error);
    const seconds = okCalls.reduce((sum, c) => sum + c.ms, 0) / 1000;
    const tokens = okCalls.reduce(
      (sum, c) => sum + (c.completionTokens || 0),
      0,
    );
    return {
      turn: key,
      kind,
      runs: results.length,
      errors: errors.length,
      errorCodes: [...new Set(errors.map((g) => g.a.error))].join(','),
      // The grading call failed: the text answer of these is not graded
      extractorErrors: results.filter((g) => g.extractorError).length,
      deploymentFailures: deployment.length,
      graded: counted.length,
      // Clean passes (D57): in a run (pass@1, failed calls count as no
      // pass) and in every run (pass^k, k = runs): the honest number
      // for a target, as identical runs differ
      passAt1: mean(results.map((g) => (g.passed ? 1 : 0))),
      // Without the runs the harness rescued (D58, `modelPassedOf`)
      modelPassAt1: mean(results.map((g) => (g.modelPassed ? 1 : 0))),
      passAll: results.length && results.every((g) => g.passed) ? 1 : 0,
      // A failed call is no valid first answer
      firstAttemptValid: mean(
        answered.map((g) => (g.a.firstAttemptValid ? 1 : 0)),
      ),
      retried: counted.filter((g) => g.a.retried).length,
      // Turns whose extra call asked for references to a deleted block
      referencesAsked: counted.filter((g) => g.a.referencesAsked).length,
      repaired: mean(counted.map((g) => (g.a.repaired ? 1 : 0))),
      repairSucceeded: repairedRuns.length
        ? mean(repairedRuns.map((g) => (g.a.repairSucceeded ? 1 : 0)))
        : null,
      dropped: counted.reduce(
        (sum, g) =>
          sum + Object.values(g.a.dropped || {}).reduce((n, c) => n + c, 0),
        0,
      ),
      flaggedSelected: counted.reduce(
        (sum, g) => sum + (g.a.flaggedSelected || 0),
        0,
      ),
      // What the replacements left (D42): suggested by the harness, and
      // places it could not compute (the editor is told about them)
      suggested: counted.reduce((sum, g) => sum + (g.a.suggested || 0), 0),
      leftovers: counted.reduce((sum, g) => sum + (g.a.leftovers || 0), 0),
      violations: counted.reduce(
        (sum, g) => sum + (g.invariants?.violations || 0),
        0,
      ),
      // Values after the changes not as expected (must_contain,
      // must_not_contain)
      expectedMissed: counted.reduce(
        (sum, g) => sum + (g.expected || []).filter((e) => !e.met).length,
        0,
      ),
      textAnswer: mean(counted.map((g) => (g.textAnswer ? 1 : 0))),
      preservationFailures: counted.reduce(
        (sum, g) =>
          sum + (g.preservation || []).filter((rule) => !rule.kept).length,
        0,
      ),
      // Found at the right place, any category: the main number
      recallTarget: mean(withB.map((g) => g.b.recallTarget)),
      // The model alone, without the harness's suggestions (D42)
      recallTargetModel: mean(withB.map((g) => (g.bModel || g.b).recallTarget)),
      recallTargetAll:
        withB.length || failedGradable.length
          ? mean([
              ...withB.map((g) => g.b.recallTarget),
              ...failedGradable.map(() => 0),
            ])
          : null,
      recallTargetModelAll:
        withB.length || failedGradable.length
          ? mean([
              ...withB.map((g) => (g.bModel || g.b).recallTarget),
              ...failedGradable.map(() => 0),
            ])
          : null,
      // Also with the labelled category
      recall: mean(withB.map((g) => g.b.recall)),
      precision: mean(withB.map((g) => g.b.precision)),
      mustNotChange: withB.reduce(
        (sum, g) => sum + g.b.mustNotChange.length,
        0,
      ),
      // Styling changes; none of the cases asks for them (spec §13.3)
      layoutChanges: counted.reduce(
        (sum, g) => sum + (g.layoutChanges || 0),
        0,
      ),
      // Numbers and names no page text or request contains
      newTerms: counted.reduce(
        (sum, g) =>
          sum +
          (g.newTerms || []).reduce((n, entry) => n + entry.terms.length, 0),
        0,
      ),
      detection: Object.fromEntries(
        Object.entries(detection).map(([name, { hits, runs: graded }]) => [
          name,
          `${hits}/${graded}`,
        ]),
      ),
      turnSeconds: mean(turnMs) === null ? null : mean(turnMs) / 1000,
      p50Seconds:
        percentile(turnMs, 0.5) === null
          ? null
          : percentile(turnMs, 0.5) / 1000,
      p95Seconds:
        percentile(turnMs, 0.95) === null
          ? null
          : percentile(turnMs, 0.95) / 1000,
      tokensPerSecond: seconds ? tokens / seconds : null,
      promptTokens: mean(counted.map((g) => g.a.promptTokens)),
      reasoningTokens: mean(
        counted.map((g) =>
          (g.timing?.calls || []).reduce(
            (sum, c) => sum + (c.reasoningTokens || 0),
            0,
          ),
        ),
      ),
    };
  });
};
