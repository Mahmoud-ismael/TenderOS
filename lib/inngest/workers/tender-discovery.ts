import { inngest } from '../client';
import { runTenderScrapers } from '@/lib/agents/discovery/scraper-orchestrator';
import { qualifySingleTender } from '@/lib/agents/qualification/pipeline';
import { createClient } from '@/lib/supabase/server';
import { getSystemSettings, createNotification } from '@/lib/data/notifications';
import { sendEmailNotification } from '@/lib/services/notifications/email-dispatcher';

/**
 * Inngest Worker: Daily Automated Tender Discovery & Qualification Pipeline
 * Runs every morning at 05:00 UTC (08:00 EAT) and can be triggered on demand.
 */
export const tenderDiscoveryWorker = inngest.createFunction(
  {
    id: 'daily-tender-discovery',
    name: 'Daily Tender Discovery & Auto-Qualification',
    triggers: [
      { cron: '0 5 * * *' },
      { event: 'tenderos/discovery.trigger' },
    ],
  },
  async ({ step }) => {
    // 1. Scrape national procurement portals (tenders.go.ke, agpo.go.ke, etc.)
    const scrapeSummary = await step.run('scrape-procurement-portals', async () => {
      return await runTenderScrapers();
    });

    // 2. Chained Auto-Qualification: Evaluate newly discovered tenders
    const qualificationResult = await step.run('auto-qualify-new-tenders', async () => {
      const supabase = await createClient();
      const settings = await getSystemSettings();

      if (!settings.auto_qualify_discovered) {
        return {
          enabled: false,
          evaluatedCount: 0,
          alertsDispatched: 0,
        };
      }

      // Query latest un-qualified discovered tenders
      const { data: newTenders, error } = await supabase
        .from('tenders')
        .select('id, title, external_reference, procuring_entity, estimated_value, submission_deadline')
        .eq('status', 'discovered')
        .order('publish_date', { ascending: false })
        .limit(15);

      if (error || !newTenders || newTenders.length === 0) {
        return {
          enabled: true,
          evaluatedCount: 0,
          alertsDispatched: 0,
        };
      }

      let evaluatedCount = 0;
      let alertsDispatched = 0;

      for (const tender of newTenders) {
        try {
          const qualRes = await qualifySingleTender(tender.id);

          if (qualRes.success && qualRes.qualification) {
            evaluatedCount++;
            const qual = qualRes.qualification;
            const isWorthReviewing =
              qual.recommendation === 'pursue' ||
              qual.recommendation === 'borderline' ||
              qual.score >= settings.min_score_to_notify;

            if (isWorthReviewing) {
              alertsDispatched++;
              const isPursue = qual.recommendation === 'pursue';

              // Create in-app notification
              await createNotification({
                type: 'qualification_pending',
                title: `${isPursue ? 'High Fit (Pursue)' : 'Borderline'}: ${tender.title.substring(0, 42)}...`,
                message: `Score ${qual.score}/100 for ${tender.procuring_entity}. Matched: ${qual.matched_services.join(', ') || 'ICT scope'}.`,
                severity: isPursue ? 'success' : 'warning',
                entityType: 'tender',
                entityId: tender.id,
                link: `/qualification?tenderId=${tender.id}`,
              });

              // Dispatch email digest via Resend
              await sendEmailNotification({
                subject: `[New Qualified Tender] ${isPursue ? 'PURSUIT RECOMMENDED' : 'BORDERLINE'}: ${tender.title.substring(0, 50)}`,
                headline: `New Qualified Bid Match: ${tender.title}`,
                body: `A new tender discovered by Hisako TenderOS scored ${qual.score}/100 in AI Qualification. Recommendation: ${qual.recommendation.toUpperCase()}. Procuring Entity: ${tender.procuring_entity}. Deadline: ${tender.submission_deadline ? new Date(tender.submission_deadline).toLocaleDateString() : 'N/A'}.`,
                actionText: 'Review & Approve Bid',
                actionUrl: `/qualification?tenderId=${tender.id}`,
                severity: isPursue ? 'success' : 'warning',
              });
            }
          }
        } catch (qualErr) {
          console.warn(`Inngest Auto-qualify error for tender ${tender.id}:`, qualErr);
        }
      }

      return {
        enabled: true,
        evaluatedCount,
        alertsDispatched,
      };
    });

    return {
      timestamp: new Date().toISOString(),
      scrapeSummary,
      qualificationResult,
    };
  }
);
