import { defineConfig, devices } from '@playwright/test';

/**
 * Visual regression snapshots of the wiki's native blocks, for checking that
 * an upgrade (e.g. of Plone Aurora / @plone/plate) doesn't change how content
 * looks. They are not part of the regular acceptance run or CI: take the
 * baseline before the upgrade, then compare after it.
 *
 *   make visual-baseline   # before the upgrade
 *   make visual-compare    # after the upgrade
 *
 * Screenshots depend on the OS, fonts and browser build, so the baseline is
 * kept local (gitignored) and must be taken on the same machine.
 */
const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: 'acceptance/visual',
  testMatch: ['**/*.visual.ts'],
  outputDir: 'playwright/visual-results',
  // Disable parallel tests to avoid conflicts creating/deleting content
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright/visual-report', open: 'never' }],
  ],
  use: {
    baseURL: frontendURL,
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
});
