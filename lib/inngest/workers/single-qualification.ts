import { inngest } from '../client';
import { qualifySingleTender } from '@/lib/agents/qualification/pipeline';

/**
 * Inngest Worker: On-demand AI Qualification for a specific tender
 */
export const singleQualificationWorker = inngest.createFunction(
  {
    id: 'single-tender-qualification',
    name: 'AI Single Tender Qualification Analysis',
    triggers: [{ event: 'tenderos/tender.qualify' }],
  },
  async ({ event, step }) => {
    const { tenderId } = event.data as { tenderId: string };

    if (!tenderId) {
      throw new Error('tenderId is required for single tender qualification');
    }

    const qualificationResult = await step.run('run-qualification-pipeline', async () => {
      return await qualifySingleTender(tenderId);
    });

    return {
      tenderId,
      result: qualificationResult,
    };
  }
);
