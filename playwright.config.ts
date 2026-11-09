import { defineConfig } from '@playwright/test'

/**
 * Local runs only (`npx playwright test`). Checkly uses its own settings from
 * checkly.config.ts and the groups, but reads the same spec files.
 */
export default defineConfig({
  testDir: './__checks__/tests',
  timeout: 60_000,
  use: {
    trace: 'retain-on-failure',
  },
})
