import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import {
  tenderDiscoveryWorker,
  deadlineCheckWorker,
  singleQualificationWorker,
} from '@/lib/inngest/workers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Inngest serve endpoint for Hisako TenderOS background jobs & cron schedules
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    tenderDiscoveryWorker,
    deadlineCheckWorker,
    singleQualificationWorker,
  ],
});
