import {
  AlertEscalationBuilder,
  CheckGroupV2,
  Frequency,
  RetryStrategyBuilder,
} from 'checkly/constructs'
import { emailAlert } from './alerts.check'

// Alert after a run fails (retries included), and again when it recovers.
const alertOnFirstFailure = AlertEscalationBuilder.runBasedEscalation(1)

/**
 * Group 1: every Playwright test in __checks__/tests/.
 *
 * `testMatch` turns each *.spec.ts file in that folder into its own browser check
 * in this group. To add a check, add a spec file there and deploy. Nothing else to edit.
 */
export const playwrightGroup = new CheckGroupV2('playwright-checks', {
  name: 'Playwright checks',
  tags: ['playwright'],
  locations: ['us-east-1', 'eu-central-1'],
  frequency: Frequency.EVERY_10M,
  browserChecks: {
    testMatch: 'tests/**/*.spec.ts',
    frequency: Frequency.EVERY_10M,
  },
  alertChannels: [emailAlert],
  alertEscalationPolicy: alertOnFirstFailure,
  // Public websites have the odd slow or flaky moment; one retry absorbs it
  // before anyone gets an email.
  retryStrategy: RetryStrategyBuilder.singleRetry({ baseBackoffSeconds: 30 }),
})

/**
 * Group 2: the API checks generated from data/users.json (see api-checks.check.ts).
 */
export const userApiGroup = new CheckGroupV2('user-api-checks', {
  name: 'User API checks',
  tags: ['api', 'users'],
  locations: ['us-east-1', 'eu-central-1'],
  frequency: Frequency.EVERY_5M,
  alertChannels: [emailAlert],
  alertEscalationPolicy: alertOnFirstFailure,
  // The API is hosted on Render, which can be slow to answer after a quiet period
  // (cold start). One retry stops that from sending a false alert.
  retryStrategy: RetryStrategyBuilder.singleRetry({ baseBackoffSeconds: 30 }),
})
