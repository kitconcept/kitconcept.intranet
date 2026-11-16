import { defineConfig } from 'vitest/config';
import voltoVitestConfig from '@plone/volto/vitest.config.mjs';
import path from 'path';

// Volto's build resolves add-on imports to their `src` folder, mirror that
// for the add-ons whose modules the tests import
const addonAliases = {
  '@kitconcept/volto-plate': path.resolve(
    __dirname,
    'node_modules/@kitconcept/volto-plate/src',
  ),
  'react-router-dom': path.resolve(
    __dirname,
    '../../core/packages/volto/node_modules/react-router-dom',
  ),
  '@kitconcept/volto-light-theme': path.resolve(
    __dirname,
    'node_modules/@kitconcept/volto-light-theme/src',
  ),
};

export default defineConfig({
  ...voltoVitestConfig,
  test: {
    ...voltoVitestConfig.test,
    projects: voltoVitestConfig.test.projects.map((project) => {
      // Volto aliases `@plone/components` to its `src`, where the `Icons`
      // subpath export does not exist; point it at the icons in that `src`.
      // Must precede the `@plone/components` alias to take effect.
      const componentsSrc = project.resolve?.alias?.['@plone/components'];
      const iconsAlias = componentsSrc
        ? {
            '@plone/components/Icons': path.join(
              componentsSrc,
              'components/icons/index.ts',
            ),
          }
        : {};
      return {
        ...project,
        resolve: {
          ...project.resolve,
          alias: {
            ...iconsAlias,
            ...project.resolve?.alias,
            ...addonAliases,
          },
        },
      };
    }),
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
