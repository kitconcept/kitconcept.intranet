const { defineConfig } = require('cypress');
const path = require('path');

const currentDir = path.dirname(__filename);

module.exports = defineConfig({
  viewportWidth: 1280,
  viewportHeight: 1280,
  retries: {
    runMode: 3,
  },
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
    },
  },
});
