import { createClient } from '@/lib/supabase/server';
import type { Database, TenderSource, TenderStatus } from '@/lib/supabase/types';
import type { RawScrapedTender } from '@/lib/agents/discovery/types';

export type TenderRow = Database['public']['Tables']['tenders']['Row'];
export type ScrapeLogRow = Database['public']['Tables']['scrape_logs']['Row'];

export interface TenderFilterParams {
  category?: string;
  source?: string;
  search?: string;
  deadlineRange?: 'all' | 'urgent_7d' | 'urgent_14d' | 'active' | 'expired';
}

export interface DiscoveryMetrics {
  totalDiscovered: number;
  closingSoonCount: number; // < 7 days
  agpoCount: number;
  sourcesCount: {
    ifmis: number;
    agpo_portal: number;
    mygov: number;
    manual: number;
  };
}

/**
 * Server function: Fetches discovered tenders with optional filtering.
 */
export async function getDiscoveredTenders(
  filters: TenderFilterParams = {}
): Promise<TenderRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from('tenders')
    .select('*')
    .eq('status', 'discovered')
    .order('submission_deadline', { ascending: true });

  if (filters.source && filters.source !== 'all') {
    query = query.eq('source', filters.source as TenderSource);
  }

  if (filters.category && filters.category !== 'all') {
    query = query.ilike('category', `%${filters.category}%`);
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(
      `title.ilike.${term},procuring_entity.ilike.${term},external_reference.ilike.${term}`
    );
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  // In-memory deadline filter if requested
  if (filters.deadlineRange && filters.deadlineRange !== 'all') {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    return data.filter((t) => {
      const deadline = new Date(t.submission_deadline);
      if (filters.deadlineRange === 'expired') return deadline < now;
      if (filters.deadlineRange === 'urgent_7d') return deadline >= now && deadline <= in7Days;
      if (filters.deadlineRange === 'urgent_14d') return deadline >= now && deadline <= in14Days;
      if (filters.deadlineRange === 'active') return deadline >= now;
      return true;
    });
  }

  return JSON.parse(JSON.stringify(data));
}

/**
 * Server function: Adds a single manual tender entry.
 */
export async function createManualTender(
  tender: Partial<TenderRow>
): Promise<TenderRow> {
  const supabase = await createClient();

  const payload = {
    title: tender.title!,
    procuring_entity: tender.procuring_entity!,
    external_reference: tender.external_reference || `MAN-${Date.now()}`,
    category: tender.category || 'ICT & Software Services',
    description: tender.description || null,
    publish_date: tender.publish_date || new Date().toISOString(),
    submission_deadline: tender.submission_deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    clarification_deadline: tender.clarification_deadline || null,
    site_visit_date: tender.site_visit_date || null,
    estimated_value: tender.estimated_value || null,
    tender_document_url: tender.tender_document_url || null,
    source: (tender.source as TenderSource) || 'manual',
    status: 'discovered' as TenderStatus,
    raw_scraped_data: tender.raw_scraped_data || { manualEntry: true },
  };

  const { data, error } = await supabase
    .from('tenders')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create manual tender: ${error.message}`);
  }

  return data;
}

/**
 * Server function: Bulk inserts tenders (used by Excel/CSV importer).
 */
export async function bulkInsertTenders(
  tenders: RawScrapedTender[]
): Promise<{ insertedCount: number; duplicateCount: number }> {
  const supabase = await createClient();

  // Deduplicate against existing external references
  const { data: existing } = await supabase
    .from('tenders')
    .select('external_reference');

  const existingSet = new Set((existing || []).map((e) => e.external_reference).filter(Boolean));

  let insertedCount = 0;
  let duplicateCount = 0;

  for (const t of tenders) {
    if (t.external_reference && existingSet.has(t.external_reference)) {
      duplicateCount++;
      continue;
    }

    const { error } = await supabase.from('tenders').insert({
      external_reference: t.external_reference || null,
      title: t.title,
      procuring_entity: t.procuring_entity,
      category: t.category || 'ICT & Software Services',
      description: t.description || null,
      publish_date: t.publish_date || new Date().toISOString(),
      submission_deadline: t.submission_deadline,
      clarification_deadline: t.clarification_deadline || null,
      site_visit_date: t.site_visit_date || null,
      estimated_value: t.estimated_value || null,
      tender_document_url: t.tender_document_url || null,
      source: t.source || 'manual',
      status: 'discovered',
      raw_scraped_data: t.raw_scraped_data || {},
    });

    if (!error) {
      insertedCount++;
      if (t.external_reference) existingSet.add(t.external_reference);
    }
  }

  return { insertedCount, duplicateCount };
}

/**
 * Server function: Deletes a tender.
 */
export async function deleteTender(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from('tenders').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

/**
 * Server function: Fetches recent scrape audit logs.
 */
export async function getScrapeLogs(): Promise<ScrapeLogRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('scrape_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error || !data) return [];
  return JSON.parse(JSON.stringify(data));
}

/**
 * Server function: Computes discovery dashboard metrics.
 */
export async function getDiscoveryMetrics(): Promise<DiscoveryMetrics> {
  const supabase = await createClient();

  const { data: tenders } = await supabase
    .from('tenders')
    .select('submission_deadline, source, category, status')
    .eq('status', 'discovered');

  const all = tenders || [];
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let closingSoonCount = 0;
  let agpoCount = 0;
  const sourcesCount = {
    ifmis: 0,
    agpo_portal: 0,
    mygov: 0,
    manual: 0,
  };

  for (const t of all) {
    const deadline = new Date(t.submission_deadline);
    if (deadline >= now && deadline <= sevenDaysFromNow) {
      closingSoonCount++;
    }

    if (
      t.source === 'agpo_portal' ||
      t.category?.toLowerCase().includes('agpo') ||
      t.category?.toLowerCase().includes('youth')
    ) {
      agpoCount++;
    }

    if (t.source === 'ifmis') sourcesCount.ifmis++;
    else if (t.source === 'agpo_portal') sourcesCount.agpo_portal++;
    else if (t.source === 'mygov') sourcesCount.mygov++;
    else sourcesCount.manual++;
  }

  return JSON.parse(JSON.stringify({
    totalDiscovered: all.length,
    closingSoonCount,
    agpoCount,
    sourcesCount,
  }));
}
