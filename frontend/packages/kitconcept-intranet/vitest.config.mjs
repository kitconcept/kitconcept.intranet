import { defineConfig } from 'vitest/config';
import voltoVitestConfig from '@plone/volto/vitest.config.mjs';
import path from 'path';

// Volto's build resolves add-on imports to their `src` folder, mirror that
// for the add-ons whose modules the tests import
const addonAliases = {
  '@kitconcept/volto-light-theme': path.resolve(
    __dirname,
    'node_modules/@kitconcept/volto-light-theme/src',
  ),
};

export default defineConfig({
  ...voltoVitestConfig,
  test: {
    ...voltoVitestConfig.test,
    projects: voltoVitestConfig.test.projects.map((project) => ({
      ...project,
      resolve: {
        ...project.resolve,
        alias: { ...project.resolve?.alias, ...addonAliases },
      },
    })),
  },
  server: {
    fs: {
      allow: [
        // Allow vite/vitest to access these folders
        '..', // allow going up from frontend/
        path.resolve(__dirname, '../../../../../core/packages/volto'),
      ],
    },
  },
});
