import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import type { TenderRow } from './tenders';
import type {
  QualificationRecommendation,
  TenderStatus,
  ApplicationStatus,
} from '@/lib/supabase/types';

export type QualificationRow = Database['public']['Tables']['qualification_results']['Row'];

export interface TenderWithQualification {
  tender: TenderRow;
  qualification: QualificationRow | null;
}

export interface QualificationMetrics {
  totalTenders: number;
  qualifiedPursueCount: number; // >= 70
  borderlineCount: number;      // 40 - 69
  disqualifiedSkipCount: number;// < 40
  pendingCount: number;         // status = 'discovered'
  averageScore: number;
}

/**
 * Server function: Fetches tenders alongside their qualification results.
 */
export async function getTendersWithQualifications(
  filter: 'all' | 'pursue' | 'borderline' | 'skip' | 'pending' = 'all'
): Promise<TenderWithQualification[]> {
  const supabase = await createClient();

  const { data: tenders, error: tenderErr } = await supabase
    .from('tenders')
    .select('*')
    .order('submission_deadline', { ascending: true });

  if (tenderErr || !tenders) return [];

  const { data: qualifications, error: qualErr } = await supabase
    .from('qualification_results')
    .select('*');

  const qualMap = new Map<string, QualificationRow>();
  for (const q of qualifications || []) {
    qualMap.set(q.tender_id, q);
  }

  const combined: TenderWithQualification[] = tenders.map((t) => ({
    tender: t,
    qualification: qualMap.get(t.id) || null,
  }));

  if (filter === 'all') return combined;

  return combined.filter(({ tender, qualification }) => {
    if (filter === 'pending') {
      return !qualification || tender.status === 'discovered';
    }
    if (filter === 'pursue') {
      return qualification?.recommendation === 'pursue';
    }
    if (filter === 'borderline') {
      return qualification?.recommendation === 'borderline';
    }
    if (filter === 'skip') {
      return qualification?.recommendation === 'skip';
    }
    return true;
  });
}

/**
 * Server function: Fetches all tender IDs that need qualification (status = 'discovered' or no qualification).
 */
export async function getPendingTenderIdsForBatch(): Promise<string[]> {
  const supabase = await createClient();

  const { data: tenders } = await supabase
    .from('tenders')
    .select('id, status')
    .or('status.eq.discovered,status.eq.qualifying');

  return (tenders || []).map((t) => t.id);
}

/**
 * Server function: Approves tender and creates an application record.
 */
export async function approveAndCreateApplication(tenderId: string) {
  const supabase = await createClient();

  // 1. Fetch tender and qualification
  const { data: tender } = await supabase
    .from('tenders')
    .select('*')
    .eq('id', tenderId)
    .single();

  if (!tender) throw new Error('Tender not found');

  const { data: qual } = await supabase
    .from('qualification_results')
    .select('*')
    .eq('tender_id', tenderId)
    .maybeSingle();

  // 2. Mark qualification as reviewed
  if (qual) {
    await supabase
      .from('qualification_results')
      .update({ reviewed_by_user: true })
      .eq('id', qual.id);
  }

  // 3. Update tender status to 'in_progress'
  await supabase
    .from('tenders')
    .update({ status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', tenderId);

  // 4. Create standard Kenyan bid checklist
  const defaultChecklist = [
    { item: 'Valid KRA Tax Compliance Certificate', required: true, status: 'pending' },
    { item: 'AGPO Youth Affirmative Action Certificate', required: true, status: 'pending' },
    { item: 'CR12 Official Company Search Certificate', required: true, status: 'pending' },
    { item: 'County Single Business Permit', required: true, status: 'pending' },
    { item: 'KRA PIN Certificate', required: true, status: 'pending' },
    { item: 'Technical Proposal Document', required: true, status: 'pending' },
    { item: 'Financial Proposal & Price Schedule', required: true, status: 'pending' },
    { item: 'Form of Tender (Signed & Stamped)', required: true, status: 'pending' },
    { item: 'Bank Reference / Tender Security Bid Bond', required: false, status: 'pending' },
    { item: 'Key Technical Staff CVs & Testimonials', required: false, status: 'pending' },
  ];

  // 5. Upsert into applications table
  const { data: existingApp } = await supabase
    .from('applications')
    .select('id')
    .eq('tender_id', tenderId)
    .maybeSingle();

  if (existingApp) {
    return existingApp;
  }

  const { data: newApp, error: appError } = await supabase
    .from('applications')
    .insert({
      tender_id: tenderId,
      status: 'drafting' as ApplicationStatus,
      checklist: defaultChecklist,
      submission_method: 'online_portal',
      submission_deadline: tender.submission_deadline,
      notes: `Qualified via Claude 3.5 Sonnet (Score: ${qual?.score ?? 'N/A'}/100)`,
    })
    .select('*')
    .single();

  if (appError) throw new Error(appError.message);
  return newApp;
}

/**
 * Server function: Skips / Marks tender as Disqualified.
 */
export async function skipTender(tenderId: string) {
  const supabase = await createClient();

  await supabase
    .from('tenders')
    .update({ status: 'disqualified', updated_at: new Date().toISOString() })
    .eq('id', tenderId);

  await supabase
    .from('qualification_results')
    .update({ reviewed_by_user: true })
    .eq('tender_id', tenderId);

  return true;
}

/**
 * Server function: Computes qualification dashboard metrics.
 */
export async function getQualificationMetrics(): Promise<QualificationMetrics> {
  const supabase = await createClient();

  const { data: tenders } = await supabase.from('tenders').select('id, status');
  const { data: quals } = await supabase.from('qualification_results').select('score, recommendation');

  const allTenders = tenders || [];
  const allQuals = quals || [];

  let qualifiedPursueCount = 0;
  let borderlineCount = 0;
  let disqualifiedSkipCount = 0;
  let totalScore = 0;

  for (const q of allQuals) {
    totalScore += Number(q.score) || 0;
    if (q.recommendation === 'pursue') qualifiedPursueCount++;
    else if (q.recommendation === 'borderline') borderlineCount++;
    else if (q.recommendation === 'skip') disqualifiedSkipCount++;
  }

  const pendingCount = allTenders.filter(
    (t) => t.status === 'discovered' || t.status === 'qualifying'
  ).length;

  const averageScore = allQuals.length > 0 ? Math.round(totalScore / allQuals.length) : 0;

  return {
    totalTenders: allTenders.length,
    qualifiedPursueCount,
    borderlineCount,
    disqualifiedSkipCount,
    pendingCount,
    averageScore,
  };
}
