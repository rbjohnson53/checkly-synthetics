import { defineConfig } from 'checkly'
import { Frequency } from 'checkly/constructs'

/**
 * Project-wide settings for the Checkly CLI.
 * Groups in __checks__/groups.check.ts override these defaults for their checks.
 * Docs: https://www.checklyhq.com/docs/cli/project-structure/
 */
export default defineConfig({
  projectName: 'Checkly Synthetics',
  // Must be unique in your Checkly account. Changing it makes Checkly treat this as a new project.
  logicalId: 'checkly-synthetics',
  repoUrl: 'https://github.com/rbjohnson53/checkly-synthetics',
  checks: {
    frequency: Frequency.EVERY_10M,
    // One US and one EU location. The EU one also exercises the cookie consent banner.
    locations: ['us-east-1', 'eu-central-1'],
    // Runtime 2026.04 = Node.js 24 + Playwright 1.58.2 (keep @playwright/test in package.json on the same version)
    runtimeId: '2026.04',
    // Every *.check.ts file under __checks__ is loaded.
    // Playwright specs are NOT matched here on purpose: the "Playwright checks" group picks them up,
    // so each spec becomes exactly one check, inside that group.
    checkMatch: '**/__checks__/**/*.check.ts',
    tags: ['synthetics'],
  },
  cli: {
    // `npx checkly test` runs from the EU by default, the harder case for the shop test (consent banner).
    runLocation: 'eu-central-1',
  },
})
