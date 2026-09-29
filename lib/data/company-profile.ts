import { createClient } from '@/lib/supabase/server';
import type {
  ComplianceDocType,
  ComplianceDocStatus,
  PastProject,
  KeyPersonnel,
  BankDetails,
} from '@/lib/supabase/types';
import {
  MANDATORY_COMPLIANCE_DOCS,
  type CompanyProfileData,
  type ComplianceDocumentItem,
  type ComplianceHealthReport,
} from './company-profile-types';

export * from './company-profile-types';

const DEFAULT_PROFILE: CompanyProfileData = {
  id: 1,
  legal_name: 'Hisako Tech Solutions Ltd',
  registration_number: 'PVT-ABC12345',
  agpo_category: 'Youth',
  agpo_cert_number: '',
  agpo_cert_expiry: '',
  kra_pin: '',
  tax_compliance_cert_number: '',
  tax_compliance_cert_expiry: '',
  cr12_details: { directors: [], shareholding: {} },
  business_permit_details: { county: 'Nairobi', permit_number: '', year: '2026' },
  core_services: [
    'ICT Infrastructure & Networking',
    'Custom Software & Web Application Development',
    'Mobile Application Engineering',
    'IT Consultation & Systems Audit',
  ],
  past_projects: [],
  key_personnel: [],
  bank_details: {
    bank_name: '',
    branch: '',
    account_name: '',
    account_number: '',
    swift_code: '',
  },
  physical_address: 'Nairobi, Kenya',
  postal_address: 'P.O. Box 00100, Nairobi',
  contact_email: 'tenders@hisako.co.ke',
  contact_phone: '+254 700 000000',
};

/**
 * Server function: Fetches single company profile row.
 */
export async function getCompanyProfile(): Promise<CompanyProfileData> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('company_profile')
    .select('*')
    .eq('id', 1)
    .single();

  if (error || !data) {
    return DEFAULT_PROFILE;
  }

  return {
    id: 1,
    legal_name: data.legal_name || DEFAULT_PROFILE.legal_name,
    registration_number: data.registration_number || '',
    agpo_category: data.agpo_category || 'Youth',
    agpo_cert_number: data.agpo_cert_number || '',
    agpo_cert_expiry: data.agpo_cert_expiry || '',
    kra_pin: data.kra_pin || '',
    tax_compliance_cert_number: data.tax_compliance_cert_number || '',
    tax_compliance_cert_expiry: data.tax_compliance_cert_expiry || '',
    cr12_details: (data.cr12_details as Record<string, any>) || {},
    business_permit_details: (data.business_permit_details as Record<string, any>) || {},
    core_services: Array.isArray(data.core_services)
      ? (data.core_services as string[])
      : DEFAULT_PROFILE.core_services,
    past_projects: Array.isArray(data.past_projects)
      ? (data.past_projects as unknown as PastProject[])
      : [],
    key_personnel: Array.isArray(data.key_personnel)
      ? (data.key_personnel as unknown as KeyPersonnel[])
      : [],
    bank_details: (data.bank_details as unknown as BankDetails) || DEFAULT_PROFILE.bank_details,
    physical_address: data.physical_address || '',
    postal_address: data.postal_address || '',
    contact_email: data.contact_email || '',
    contact_phone: data.contact_phone || '',
    updated_at: data.updated_at,
  };
}

/**
 * Server function: Upserts company profile row (id = 1).
 */
export async function upsertCompanyProfile(
  profile: Partial<CompanyProfileData>
): Promise<CompanyProfileData> {
  const supabase = await createClient();

  const payload = {
    id: 1,
    legal_name: profile.legal_name ?? 'Hisako Tech Solutions Ltd',
    registration_number: profile.registration_number ?? null,
    agpo_category: profile.agpo_category ?? 'Youth',
    agpo_cert_number: profile.agpo_cert_number ?? null,
    agpo_cert_expiry: profile.agpo_cert_expiry || null,
    kra_pin: profile.kra_pin ?? null,
    tax_compliance_cert_number: profile.tax_compliance_cert_number ?? null,
    tax_compliance_cert_expiry: profile.tax_compliance_cert_expiry || null,
    cr12_details: profile.cr12_details ?? {},
    business_permit_details: profile.business_permit_details ?? {},
    core_services: profile.core_services ?? [],
    past_projects: (profile.past_projects as any) ?? [],
    key_personnel: (profile.key_personnel as any) ?? [],
    bank_details: (profile.bank_details as any) ?? {},
    physical_address: profile.physical_address ?? null,
    postal_address: profile.postal_address ?? null,
    contact_email: profile.contact_email ?? null,
    contact_phone: profile.contact_phone ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('company_profile')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to save company profile: ${error.message}`);
  }

  return {
    ...profile,
    id: 1,
    legal_name: data.legal_name,
    registration_number: data.registration_number || '',
    agpo_category: data.agpo_category || 'Youth',
    agpo_cert_number: data.agpo_cert_number || '',
    agpo_cert_expiry: data.agpo_cert_expiry || '',
    kra_pin: data.kra_pin || '',
    tax_compliance_cert_number: data.tax_compliance_cert_number || '',
    tax_compliance_cert_expiry: data.tax_compliance_cert_expiry || '',
    cr12_details: (data.cr12_details as Record<string, any>) || {},
    business_permit_details: (data.business_permit_details as Record<string, any>) || {},
    core_services: (data.core_services as string[]) || [],
    past_projects: (data.past_projects as unknown as PastProject[]) || [],
    key_personnel: (data.key_personnel as unknown as KeyPersonnel[]) || [],
    bank_details: (data.bank_details as unknown as BankDetails) || {},
    physical_address: data.physical_address || '',
    postal_address: data.postal_address || '',
    contact_email: data.contact_email || '',
    contact_phone: data.contact_phone || '',
    updated_at: data.updated_at,
  };
}

/**
 * Server function: Fetches all compliance documents.
 */
export async function getComplianceDocuments(): Promise<ComplianceDocumentItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('compliance_documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((d) => ({
    id: d.id,
    doc_type: d.doc_type,
    file_url: d.file_url,
    issue_date: d.issue_date,
    expiry_date: d.expiry_date,
    status: d.status,
    notes: d.notes,
    created_at: d.created_at,
    updated_at: d.updated_at,
  }));
}

/**
 * Server function: Saves or updates a compliance document.
 */
export async function upsertComplianceDocument(doc: {
  id?: string;
  doc_type: ComplianceDocType;
  file_url: string;
  issue_date?: string | null;
  expiry_date?: string | null;
  status: ComplianceDocStatus;
  notes?: string | null;
}): Promise<ComplianceDocumentItem> {
  const supabase = await createClient();

  const payload = {
    ...(doc.id ? { id: doc.id } : {}),
    doc_type: doc.doc_type,
    file_url: doc.file_url,
    issue_date: doc.issue_date || null,
    expiry_date: doc.expiry_date || null,
    status: doc.status,
    notes: doc.notes || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('compliance_documents')
    .upsert(payload)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to save compliance document: ${error.message}`);
  }

  return {
    id: data.id,
    doc_type: data.doc_type,
    file_url: data.file_url,
    issue_date: data.issue_date,
    expiry_date: data.expiry_date,
    status: data.status,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Server function: Deletes a compliance document.
 */
export async function deleteComplianceDocument(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('compliance_documents')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete compliance document: ${error.message}`);
  }
  return true;
}

/**
 * Pure calculation helper: Computes compliance health, counts, and plain-language eligibility blockers.
 */
export function calculateComplianceHealth(
  docs: ComplianceDocumentItem[],
  profile: CompanyProfileData
): ComplianceHealthReport {
  const today = new Date();
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(today.getDate() + 60);

  // Group latest doc per doc_type
  const latestDocsByType = new Map<ComplianceDocType, ComplianceDocumentItem>();
  for (const d of docs) {
    if (!latestDocsByType.has(d.doc_type)) {
      latestDocsByType.set(d.doc_type, d);
    }
  }

  let validCount = 0;
  let expiringCount = 0;
  let expiredCount = 0;
  const blockingReasons: string[] = [];
  const recommendations: string[] = [];

  const requiredTypes: ComplianceDocType[] = [
    'tax_compliance',
    'agpo_cert',
    'cr12',
    'business_permit',
    'kra_pin_cert',
  ];

  let missingCount = 0;

  for (const reqType of requiredTypes) {
    const doc = latestDocsByType.get(reqType);
    const meta = MANDATORY_COMPLIANCE_DOCS.find((m) => m.type === reqType)!;

    if (!doc || !doc.file_url) {
      missingCount++;
      blockingReasons.push(`Missing ${meta.label}: mandatory statutory requirement for all Kenyan tenders.`);
      recommendations.push(`Upload current ${meta.label}.`);
      continue;
    }

    if (doc.expiry_date) {
      const expDate = new Date(doc.expiry_date);
      if (expDate < today) {
        expiredCount++;
        blockingReasons.push(`${meta.label} expired on ${doc.expiry_date}. Bids will be automatically disqualified.`);
        recommendations.push(`Renew and upload renewed ${meta.label} immediately.`);
      } else if (expDate <= sixtyDaysFromNow) {
        expiringCount++;
        const daysRemaining = Math.ceil(
          (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        recommendations.push(
          `${meta.label} expires in ${daysRemaining} days (${doc.expiry_date}). Begin renewal process.`
        );
      } else {
        validCount++;
      }
    } else {
      validCount++;
    }
  }

  // Check additional documents (audited accounts, bank reference, etc.)
  for (const [type, doc] of latestDocsByType.entries()) {
    if (requiredTypes.includes(type)) continue;

    if (doc.expiry_date) {
      const expDate = new Date(doc.expiry_date);
      if (expDate < today) {
        expiredCount++;
      } else if (expDate <= sixtyDaysFromNow) {
        expiringCount++;
      } else {
        validCount++;
      }
    } else {
      validCount++;
    }
  }

  // Profile-specific checks
  if (!profile.kra_pin) {
    blockingReasons.push('KRA PIN is missing from company profile.');
  }
  if (!profile.bank_details?.account_number) {
    recommendations.push('Bank details are incomplete; required for bid bond requests and tender award contracts.');
  }

  let overallStatus: 'ready' | 'warning' | 'blocked' = 'ready';
  if (blockingReasons.length > 0 || expiredCount > 0) {
    overallStatus = 'blocked';
  } else if (expiringCount > 0 || recommendations.length > 0) {
    overallStatus = 'warning';
  }

  let plainSummary = '';
  if (overallStatus === 'ready') {
    plainSummary = 'Company is 100% compliant. All mandatory statutory documents and AGPO certificates are active and valid.';
  } else if (overallStatus === 'blocked') {
    plainSummary = `Tender eligibility blocked: ${blockingReasons.length} critical issue(s) detected. Fix missing/expired documents before submitting bids.`;
  } else {
    plainSummary = `Tender eligibility active with warnings: ${expiringCount} document(s) expiring within 60 days.`;
  }

  return {
    overallStatus,
    validCount,
    expiringCount,
    expiredCount,
    missingCount,
    totalRequired: requiredTypes.length,
    blockingReasons,
    recommendations,
    plainSummary,
  };
}

/**
 * Server function: Fetches profile and docs to compute the comprehensive compliance health report.
 */
export async function getComplianceHealthReport(): Promise<ComplianceHealthReport> {
  const [profile, docs] = await Promise.all([
    getCompanyProfile(),
    getComplianceDocuments(),
  ]);
  return calculateComplianceHealth(docs, profile);
}
