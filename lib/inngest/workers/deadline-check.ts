import { inngest } from '../client';
import { runDeadlineAndComplianceScan } from '@/lib/services/notifications/deadline-scanner';

/**
 * Inngest Worker: Scheduled Deadline and Compliance Expiry Scanner
 * Runs 3 times daily (06:00, 12:00, 18:00 UTC) and can be triggered on demand.
 */
export const deadlineCheckWorker = inngest.createFunction(
  {
    id: 'scheduled-deadline-and-compliance-check',
    name: 'Tender Deadlines & Statutory Compliance Expiry Scanner',
    triggers: [
      { cron: '0 6,12,18 * * *' },
      { event: 'tenderos/deadline.scan' },
    ],
  },
  async ({ step }) => {
    const scanSummary = await step.run('scan-deadlines-and-compliance', async () => {
      return await runDeadlineAndComplianceScan();
    });

    return {
      timestamp: new Date().toISOString(),
      scanSummary,
    };
  }
);
