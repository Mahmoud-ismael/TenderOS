import { createClient } from '@/lib/supabase/server';
import { getComplianceHealthReport, type ComplianceHealthReport } from './company-profile';
import { getApplicationWinRateStats, type ApplicationWinRateStats } from './applications';
import { getNotifications, type NotificationRow } from './notifications';
import type { TenderRow } from './tenders';
import type { TenderStatus } from '@/lib/supabase/types';

export interface PipelineStageCounts {
  discovered: number;
  qualifying: number;
  qualified: number;
  in_progress: number;
  submitted: number;
  won: number;
  lost: number;
  total: number;
}

export interface UpcomingDeadlinesItem {
  id: string;
  title: string;
  external_reference: string | null;
  procuring_entity: string;
  submission_deadline: string;
  estimated_value: number | null;
  status: TenderStatus;
  daysRemaining: number;
  applicationId?: string;
  checklistProgress?: { verified: number; total: number; pct: number };
}

export interface ExecutiveDashboardData {
  pipelineCounts: PipelineStageCounts;
  totalPipelineValue: number;
  upcomingDeadlines: UpcomingDeadlinesItem[];
  complianceHealth: ComplianceHealthReport;
  recentActivity: NotificationRow[];
  winRateStats: ApplicationWinRateStats;
}

/**
 * Server function: Gathers all executive metrics and feeds in parallel for the root dashboard.
 */
export async function getExecutiveDashboardData(): Promise<ExecutiveDashboardData> {
  const supabase = await createClient();
  const now = new Date();
  const fourteenDaysLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // 1. Fetch Tenders with joined Applications
  const [
    { data: allTenders },
    complianceHealth,
    winRateStats,
    recentActivity,
  ] = await Promise.all([
    supabase
      .from('tenders')
      .select('*, applications(id, status, checklist)')
      .order('submission_deadline', { ascending: true }),
    getComplianceHealthReport(),
    getApplicationWinRateStats(),
    getNotifications(8),
  ]);

  const tenders = (allTenders || []) as any[];

  // 2. Compute Pipeline Stage Counts & Total Pipeline Value
  const pipelineCounts: PipelineStageCounts = {
    discovered: 0,
    qualifying: 0,
    qualified: 0,
    in_progress: 0,
    submitted: 0,
    won: 0,
    lost: 0,
    total: tenders.length,
  };

  let totalPipelineValue = 0;

  for (const t of tenders) {
    const s = t.status as TenderStatus;
    if (
      s === 'discovered' ||
      s === 'qualifying' ||
      s === 'qualified' ||
      s === 'in_progress' ||
      s === 'submitted' ||
      s === 'won' ||
      s === 'lost'
    ) {
      pipelineCounts[s]++;
    }

    if (s === 'qualified' || s === 'in_progress' || s === 'submitted') {
      totalPipelineValue += Number(t.estimated_value || 0);
    }
  }

  // 3. Filter and Map Upcoming Deadlines (within 14 days)
  const upcomingDeadlines: UpcomingDeadlinesItem[] = [];

  for (const t of tenders) {
    if (!t.submission_deadline) continue;
    const dlDate = new Date(t.submission_deadline);

    // Only include future or today's deadlines up to 14 days, not already won/lost
    if (dlDate >= now && dlDate <= fourteenDaysLater && t.status !== 'won' && t.status !== 'lost') {
      const diffMs = dlDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      const app = Array.isArray(t.applications) && t.applications.length > 0 ? t.applications[0] : null;
      let checklistProgress = undefined;

      if (app && Array.isArray(app.checklist)) {
        const total = app.checklist.length;
        const verified = app.checklist.filter((i: any) => i.status === 'verified').length;
        checklistProgress = {
          total,
          verified,
          pct: total > 0 ? Math.round((verified / total) * 100) : 0,
        };
      }

      upcomingDeadlines.push({
        id: t.id,
        title: t.title,
        external_reference: t.external_reference,
        procuring_entity: t.procuring_entity,
        submission_deadline: t.submission_deadline,
        estimated_value: t.estimated_value ? Number(t.estimated_value) : null,
        status: t.status,
        daysRemaining,
        applicationId: app?.id,
        checklistProgress,
      });
    }
  }

  return {
    pipelineCounts,
    totalPipelineValue,
    upcomingDeadlines,
    complianceHealth,
    recentActivity,
    winRateStats,
  };
}
