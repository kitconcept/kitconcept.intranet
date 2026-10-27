// The eval of the AI assistant (AI_WORKFLOW.md §13, AI_EDIT_PLAN.md §2).
// Run with the add-on's vitest, which resolves the harness and its
// dependencies (see README.md):
//   cd frontend/packages/kitconcept-intranet
//   pnpm exec vitest run --config ../../eval/vitest.config.mjs
// No imports from packages here: this folder has no node_modules.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export default {
  root: here,
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.js', '**/*.eval.js'],
    // A run of all cases with repeats takes long on a local model
    testTimeout: 6 * 60 * 60 * 1000,
  },
  server: { fs: { allow: [path.resolve(here, '..')] } },
};
