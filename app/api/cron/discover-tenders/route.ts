import { NextResponse, type NextRequest } from 'next/server';
import { runTenderScrapers } from '@/lib/agents/discovery/scraper-orchestrator';
import { qualifySingleTender } from '@/lib/agents/qualification/pipeline';
import { createClient } from '@/lib/supabase/server';
import { getSystemSettings, createNotification } from '@/lib/data/notifications';
import { sendEmailNotification } from '@/lib/services/notifications/email-dispatcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleScraperRequest(request);
}

export async function POST(request: NextRequest) {
  return handleScraperRequest(request);
}

async function handleScraperRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const cronSecretHeader = request.headers.get('x-cron-secret');

  // Verify secret header if configured in production
  if (cronSecret) {
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (cronSecretHeader !== cronSecret && bearerToken !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid cron secret header' },
        { status: 401 }
      );
    }
  }

  try {
    // 1. Run discovery scrapers (tenders.go.ke, agpo.go.ke)
    const scrapeSummary = await runTenderScrapers();

    // 2. Automated Chaining: Qualify newly discovered tenders without manual interaction
    const supabase = await createClient();
    const settings = await getSystemSettings();

    let autoQualifiedCount = 0;
    let alertsDispatched = 0;

    if (settings.auto_qualify_discovered) {
      // Find newly discovered tenders awaiting qualification
      const { data: newTenders } = await supabase
        .from('tenders')
        .select('id, title, external_reference, procuring_entity, estimated_value, submission_deadline')
        .eq('status', 'discovered')
        .order('publish_date', { ascending: false })
        .limit(10);

      if (newTenders && newTenders.length > 0) {
        for (const tender of newTenders) {
          try {
            const qualRes = await qualifySingleTender(tender.id);

            if (qualRes.success && qualRes.qualification) {
              autoQualifiedCount++;
              const qual = qualRes.qualification;
              const isWorthReviewing =
                qual.recommendation === 'pursue' ||
                qual.recommendation === 'borderline' ||
                qual.score >= settings.min_score_to_notify;

              // Only notify the operator about tenders worth reviewing
              if (isWorthReviewing) {
                alertsDispatched++;
                const isPursue = qual.recommendation === 'pursue';

                await createNotification({
                  type: 'qualification_pending',
                  title: `${isPursue ? 'High Fit (Pursue)' : 'Borderline'}: ${tender.title.substring(0, 42)}...`,
                  message: `Score ${qual.score}/100 for ${tender.procuring_entity}. Match: ${qual.matched_services.join(', ') || 'ICT services'}.`,
                  severity: isPursue ? 'success' : 'warning',
                  entityType: 'tender',
                  entityId: tender.id,
                  link: `/qualification?tenderId=${tender.id}`,
                });

                await sendEmailNotification({
                  subject: `[New Qualified Tender] ${isPursue ? 'PURSUIT RECOMMENDED' : 'BORDERLINE'}: ${tender.title.substring(0, 50)}`,
                  headline: `New Qualified Bid Match: ${tender.title}`,
                  body: `A new tender discovered from national procurement portals scored ${qual.score}/100 in AI Qualification. Recommendation: ${qual.recommendation.toUpperCase()}. Procuring Entity: ${tender.procuring_entity}. Deadline: ${new Date(tender.submission_deadline).toLocaleDateString()}.`,
                  actionText: 'Review & Approve Bid',
                  actionUrl: `/qualification?tenderId=${tender.id}`,
                  severity: isPursue ? 'success' : 'warning',
                });
              }
            }
          } catch (qualErr) {
            console.warn(`Auto-qualification failed for tender ${tender.id}:`, qualErr);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      scrapeSummary,
      autoQualification: {
        enabled: settings.auto_qualify_discovered,
        tendersEvaluated: autoQualifiedCount,
        alertsDispatched,
      },
    });
  } catch (error: any) {
    console.error('Error executing chained tender discovery & auto-qualification:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Scraper execution failed',
      },
      { status: 500 }
    );
  }
}
