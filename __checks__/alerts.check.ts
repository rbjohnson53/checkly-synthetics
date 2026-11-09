import { EmailAlertChannel } from 'checkly/constructs'

/**
 * One email channel, attached to both check groups in groups.check.ts,
 * so any failing check sends an email (and another when it recovers).
 */
export const emailAlert = new EmailAlertChannel('email-alert', {
  address: 'rbjohnson53@gmail.com',
  sendFailure: true,
  sendRecovery: true,
  sendDegraded: false,
})
