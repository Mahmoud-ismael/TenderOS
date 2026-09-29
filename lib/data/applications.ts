import { createClient } from '@/lib/supabase/server';
import type { ApplicationRow, GeneratedDocumentRow } from './documents';
import type { ChecklistItem } from '@/lib/supabase/types';
import type { TenderRow } from './tenders';
import { getComplianceDocuments, type ComplianceDocumentItem } from './company-profile';

export interface ApplicationDetailFull {
  application: ApplicationRow;
  tender: TenderRow;
  generatedDocuments: GeneratedDocumentRow[];
  complianceDocuments: ComplianceDocumentItem[];
  checklist: ChecklistItem[];
}

export interface ApplicationWinRateStats {
  totalApplications: number;
  totalSubmitted: number;
  awardedCount: number;
  rejectedCount: number;
  pendingDecisionCount: number;
  winRate: number;
  totalValueWon: number;
}

/**
 * Server function: Fetches full application detail by ID with tender and generated documents.
 */
export async function getApplicationById(
  applicationId: string
): Promise<ApplicationDetailFull | null> {
  const supabase = await createClient();

  const { data: app, error: appErr } = await supabase
    .from('applications')
    .select('*, tenders(*)')
    .eq('id', applicationId)
    .single();

  if (appErr || !app) return null;

  const { data: docs } = await supabase
    .from('generated_documents')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });

  const complianceDocs = await getComplianceDocuments();

  const rawChecklist = Array.isArray(app.checklist) ? (app.checklist as any[]) : [];
  const checklist: ChecklistItem[] = rawChecklist.map((item) => ({
    item: item.item || 'Required Bid Item',
    required: Boolean(item.required),
    status: item.status || 'pending',
    document_id: item.document_id,
  }));

  return {
    application: {
      id: app.id,
      tender_id: app.tender_id,
      status: app.status,
      checklist: app.checklist,
      submission_method: app.submission_method,
      submission_deadline: app.submission_deadline,
      submitted_at: app.submitted_at,
      notes: app.notes,
      created_at: app.created_at,
      updated_at: app.updated_at,
    },
    tender: app.tenders as unknown as TenderRow,
    generatedDocuments: docs || [],
    complianceDocuments: complianceDocs,
    checklist,
  };
}

/**
 * Server function: Computes running win rate and conversion metrics across all applications.
 */
export async function getApplicationWinRateStats(): Promise<ApplicationWinRateStats> {
  const supabase = await createClient();

  const { data: apps, error } = await supabase
    .from('applications')
    .select('status, tenders(estimated_value)');

  if (error || !apps) {
    return {
      totalApplications: 0,
      totalSubmitted: 0,
      awardedCount: 0,
      rejectedCount: 0,
      pendingDecisionCount: 0,
      winRate: 0,
      totalValueWon: 0,
    };
  }

  const totalApplications = apps.length;
  let awardedCount = 0;
  let rejectedCount = 0;
  let pendingDecisionCount = 0;
  let totalValueWon = 0;

  for (const a of apps as any[]) {
    if (a.status === 'awarded') {
      awardedCount++;
      const val = Number(a.tenders?.estimated_value || 0);
      totalValueWon += val;
    } else if (a.status === 'rejected') {
      rejectedCount++;
    } else if (a.status === 'submitted') {
      pendingDecisionCount++;
    }
  }

  const totalDecided = awardedCount + rejectedCount;
  const winRate = totalDecided > 0 ? Math.round((awardedCount / totalDecided) * 100) : 0;
  const totalSubmitted = awardedCount + rejectedCount + pendingDecisionCount;

  return {
    totalApplications,
    totalSubmitted,
    awardedCount,
    rejectedCount,
    pendingDecisionCount,
    winRate,
    totalValueWon,
  };
}
