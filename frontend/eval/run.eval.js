/**
 * The eval run (AI_WORKFLOW.md §13): every case, `EVAL_REPEAT` times,
 * through `@ai-edit` on a running backend; results and a summary go to
 * `results/`. Skipped without `EVAL_BACKEND`. See README.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkProfile } from './lib/harness.js';
import { backendClient } from './lib/backend.js';
import { extractor } from './lib/extract.js';
import { EVAL_VERSION, aggregate, runCase } from './lib/run.js';
import { loadCases } from './lib/cases.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const env = process.env;

/** One line per run: time, and per turn what went wrong or how it did. */
const progress = (run, index, repeat, ms) => {
  const head = `${run.id} ${index + 1}/${repeat} ${Math.round(ms / 1000)}s`;
  if (run.error) return `${head} FAILED: ${run.error.split('\n')[0]}`;
  const turns = run.turns.map(({ graded }, i) => {
    const notes = [
      graded.a.error && `error ${graded.a.error}`,
      graded.a.deploymentFailure && 'setup failure',
      graded.extractorError && `extractor failed (${graded.extractorError})`,
      graded.passed ? 'PASS' : 'no pass',
      graded.b && `recall ${graded.b.recallTarget?.toFixed(2) ?? '-'}`,
      graded.expected?.length &&
        `expected ${graded.expected.filter((e) => e.met).length}/${graded.expected.length}`,
      graded.invariants?.violations &&
        `VIOLATIONS ${graded.invariants.violations}`,
    ].filter(Boolean);
    return `#${i + 1} ${notes.join(', ') || 'ok'}`;
  });
  return `${head}: ${turns.join('; ')}`;
};

describe.skipIf(!env.EVAL_BACKEND)('eval', () => {
  it('runs the cases', async () => {
    const profile = JSON.parse(
      fs.readFileSync(
        env.EVAL_PROFILE || path.join(here, 'profiles/intranet.json'),
        'utf8',
      ),
    );
    expect(checkProfile(profile)).toEqual([]);
    const only = env.EVAL_CASES ? env.EVAL_CASES.split(',') : null;
    const cases = loadCases(here).filter(
      (testCase) => !only || only.includes(testCase.id),
    );
    const client = backendClient({
      url: env.EVAL_BACKEND,
      user: env.EVAL_USER,
      password: env.EVAL_PASSWORD,
    });
    const { budget, vocabulary } = await client.info();
    // The report extractor: its own settings, else the feature's LLM
    // variables (as the backend reads them). Pin EVAL_EXTRACTOR_MODEL when
    // comparing models, or the instrument changes with the model under
    // test.
    const llmUrl = env.KITCONCEPT_SOLR_LLM_URL?.replace(/\/$/, '');
    const extractorConfig = {
      url:
        env.EVAL_EXTRACTOR_URL ||
        (llmUrl &&
          `${llmUrl}${env.KITCONCEPT_SOLR_LLM_CHAT_PATH || '/api/chat/completions'}`),
      token: env.EVAL_EXTRACTOR_TOKEN || env.KITCONCEPT_SOLR_LLM_TOKEN,
      model: env.EVAL_EXTRACTOR_MODEL || env.KITCONCEPT_SOLR_LLM_CHAT_MODEL,
    };
    const extract =
      extractorConfig.url && extractorConfig.model
        ? extractor({ ...extractorConfig, categories: vocabulary.categories })
        : null;
    // eslint-disable-next-line no-console
    console.log(
      extract
        ? `report extractor: ${extractorConfig.model} at ${extractorConfig.url}`
        : 'report extractor: off (report turns graded for Layer A only)',
    );
    const repeat = Number(env.EVAL_REPEAT || 5);
    // The file is written after every run: a run that stops (a gateway
    // error, Ctrl-C) leaves what it measured so far
    const startedAt = new Date().toISOString();
    const stamp = startedAt.replace(/[:.]/g, '-');
    const label = (env.EVAL_LABEL || 'unlabeled').replace(/[^\w.-]+/g, '_');
    fs.mkdirSync(path.join(here, 'results'), { recursive: true });
    const runs = [];
    const file = path.join(here, 'results', `${stamp}-${label}.json`);
    const save = (done) => {
      const summary = aggregate(runs.filter((run) => !run.error));
      fs.writeFileSync(
        file,
        JSON.stringify(
          {
            label: env.EVAL_LABEL,
            evalVersion: EVAL_VERSION,
            startedAt,
            budget,
            repeat,
            // Every case and repeat finished (else the run stopped)
            complete: done,
            // Which instrument graded the text answers (no token)
            extractor: extract
              ? { model: extractorConfig.model, url: extractorConfig.url }
              : null,
            summary,
            runs,
          },
          null,
          2,
        ),
      );
      return summary;
    };
    // eslint-disable-next-line no-console
    console.log(`results: ${file}`);
    for (const testCase of cases) {
      for (let index = 0; index < repeat; index += 1) {
        const started = performance.now();
        let run;
        try {
          run = await runCase(testCase, {
            send: client.send,
            profile,
            budget,
            vocabulary,
            extract,
          });
        } catch (error) {
          // A bug or an unexpected failure: recorded, the run goes on
          run = { id: testCase.id, error: String(error?.stack || error) };
        }
        runs.push(run);
        save(false);
        // eslint-disable-next-line no-console
        console.log(progress(run, index, repeat, performance.now() - started));
      }
    }
    // The key numbers; everything else is in the file
    const KEY = [
      'turn',
      'runs',
      'passAt1',
      'modelPassAt1',
      'passAll',
      'recallTargetAll',
      'expectedMissed',
      'firstAttemptValid',
      'p50Seconds',
    ];
    const summary = save(true);
    // eslint-disable-next-line no-console
    console.table(
      summary.map((row) =>
        Object.fromEntries(
          KEY.map((name) => [
            name,
            typeof row[name] === 'number' && !Number.isInteger(row[name])
              ? Number(row[name].toFixed(2))
              : row[name],
          ]),
        ),
      ),
    );
  });
});
