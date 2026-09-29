import type { TenderSource, TenderStatus } from '@/lib/supabase/types';

export interface RawScrapedTender {
  external_reference?: string;
  title: string;
  procuring_entity: string;
  category?: string;
  description?: string;
  publish_date?: string;
  submission_deadline: string;
  clarification_deadline?: string;
  site_visit_date?: string;
  estimated_value?: number;
  tender_document_url?: string;
  source: TenderSource;
  raw_scraped_data: Record<string, any>;
}

export interface ScraperRunResult {
  source: string;
  success: boolean;
  tenders: RawScrapedTender[];
  error?: string;
}

export interface ScraperOrchestratorSummary {
  totalFound: number;
  totalInserted: number;
  totalSkippedDuplicates: number;
  sourcesScraped: number;
  errors: Array<{ source: string; error: string }>;
}

export interface ColumnMappingProposal {
  title?: string;
  procuring_entity?: string;
  category?: string;
  external_reference?: string;
  submission_deadline?: string;
  publish_date?: string;
  tender_document_url?: string;
  description?: string;
  estimated_value?: string;
}

export interface RelevanceEvaluationItem {
  rowIndex: number;
  tender: RawScrapedTender;
  isRelevant: boolean;
  relevanceScore: number; // 0 - 100
  reason: string;
  matchedKeywords: string[];
}

export interface BulkImportResult {
  totalRows: number;
  importedCount: number;
  skippedIrrelevantCount: number;
  failedParseCount: number;
  relevantTenders: RawScrapedTender[];
  skippedTenders: RelevanceEvaluationItem[];
}
