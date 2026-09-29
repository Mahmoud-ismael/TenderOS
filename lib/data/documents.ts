import { createClient } from '@/lib/supabase/server';
import type {
  Database,
  GeneratedDocType,
  GeneratedDocStatus,
  ChecklistItem,
} from '@/lib/supabase/types';
import type { TenderRow } from './tenders';
import { getComplianceDocuments, type ComplianceDocumentItem } from './company-profile';

export type GeneratedDocumentRow = Database['public']['Tables']['generated_documents']['Row'];
export type DocumentTemplateRow = Database['public']['Tables']['document_templates']['Row'];
export type ApplicationRow = Database['public']['Tables']['applications']['Row'];

export interface ApplicationDetail {
  application: ApplicationRow;
  tender: TenderRow;
  generatedDocuments: GeneratedDocumentRow[];
  checklist: ChecklistItem[];
}

/**
 * Server function: Fetches all active tender applications (drafting, docs_ready, submitted).
 */
export async function getActiveApplications(): Promise<Array<{
  application: ApplicationRow;
  tender: TenderRow;
}>> {
  const supabase = await createClient();

  const { data: apps, error: appErr } = await supabase
    .from('applications')
    .select('*, tenders(*)')
    .order('created_at', { ascending: false });

  if (appErr || !apps) return [];

  return apps.map((a: any) => ({
    application: {
      id: a.id,
      tender_id: a.tender_id,
      status: a.status,
      checklist: a.checklist,
      submission_method: a.submission_method,
      submission_deadline: a.submission_deadline,
      submitted_at: a.submitted_at,
      notes: a.notes,
      created_at: a.created_at,
      updated_at: a.updated_at,
    },
    tender: a.tenders,
  }));
}

/**
 * Server function: Fetches detailed application record by ID with joined tender & generated documents.
 */
export async function getApplicationDetail(
  applicationId: string
): Promise<ApplicationDetail | null> {
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
    .order('version', { ascending: false });

  const rawChecklist = Array.isArray(app.checklist) ? (app.checklist as any[]) : [];
  const checklist: ChecklistItem[] = rawChecklist.map((item) => ({
    item: item.item || 'Document Requirement',
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
    checklist,
  };
}

/**
 * Server function: Fetches document templates.
 */
export async function getDocumentTemplates(): Promise<DocumentTemplateRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .order('name', { ascending: true });

  if (error || !data) return [];
  return data;
}

/**
 * Server function: Checks compliance documents against application requirements to verify bundle readiness.
 */
export async function verifyComplianceBundleReadiness(): Promise<{
  canBundle: boolean;
  validDocs: ComplianceDocumentItem[];
  missingDocs: string[];
  expiredDocs: string[];
}> {
  const docs = await getComplianceDocuments();
  const today = new Date();

  const requiredDocTypes = [
    { type: 'tax_compliance', label: 'Tax Compliance Certificate (KRA TCC)' },
    { type: 'agpo_cert', label: 'AGPO Youth Certificate' },
    { type: 'cr12', label: 'CR12 Official Search' },
    { type: 'business_permit', label: 'Single Business Permit' },
    { type: 'kra_pin_cert', label: 'KRA PIN Certificate' },
  ];

  const missingDocs: string[] = [];
  const expiredDocs: string[] = [];
  const validDocs: ComplianceDocumentItem[] = [];

  for (const req of requiredDocTypes) {
    const doc = docs.find((d) => d.doc_type === req.type && d.file_url);
    if (!doc) {
      missingDocs.push(req.label);
      continue;
    }

    if (doc.expiry_date) {
      const exp = new Date(doc.expiry_date);
      if (exp < today) {
        expiredDocs.push(`${req.label} (expired on ${doc.expiry_date})`);
        continue;
      }
    }

    validDocs.push(doc);
  }

  const canBundle = missingDocs.length === 0 && expiredDocs.length === 0;

  return {
    canBundle,
    validDocs,
    missingDocs,
    expiredDocs,
  };
}
