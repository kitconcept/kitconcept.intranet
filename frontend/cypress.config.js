const { defineConfig } = require('cypress');
const path = require('path');
const fs = require('fs');

const currentDir = path.dirname(__filename);

module.exports = defineConfig({
  viewportWidth: 1440,
  viewportHeight: 1280,
  retries: {
    runMode: 3,
  },
  // Prevent the browser renderer from accumulating memory across a long run of
  // specs (which crashed the process partway through the a11y suite in CI).
  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 0,
  screenshotsFolder: `${currentDir}/cypress/screenshots`,
  videosFolder: `${currentDir}/cypress/videos`,
  video: true,
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/tests/**/*.cy.{js,jsx,ts,tsx}',
    supportFolder: `${currentDir}/cypress/support`,
    supportFile: `${currentDir}/cypress/support/e2e.js`,
    setupNodeEvents(on, config) {
      on('task', {
        table(message) {
          console.table(message);
          return null;
        },
      });
      // Keep the recorded video only when the spec has failing tests.
      on('after:spec', (spec, results) => {
        if (results && results.video) {
          const failures = results.tests.some((test) =>
            test.attempts.some((attempt) => attempt.state === 'failed'),
          );
          if (!failures) {
            fs.unlinkSync(results.video);
          }
        }
      });
    },
  },
});
