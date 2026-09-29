import type {
  ComplianceDocType,
  ComplianceDocStatus,
  PastProject,
  KeyPersonnel,
  BankDetails,
} from '@/lib/supabase/types';

export interface CompanyProfileData {
  id: number;
  legal_name: string;
  registration_number: string;
  agpo_category: string;
  agpo_cert_number: string;
  agpo_cert_expiry: string;
  kra_pin: string;
  tax_compliance_cert_number: string;
  tax_compliance_cert_expiry: string;
  cr12_details: Record<string, any>;
  business_permit_details: Record<string, any>;
  core_services: string[];
  past_projects: PastProject[];
  key_personnel: KeyPersonnel[];
  bank_details: BankDetails;
  physical_address: string;
  postal_address: string;
  contact_email: string;
  contact_phone: string;
  updated_at?: string;
}

export interface ComplianceDocumentItem {
  id: string;
  doc_type: ComplianceDocType;
  file_url: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: ComplianceDocStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceHealthReport {
  overallStatus: 'ready' | 'warning' | 'blocked';
  validCount: number;
  expiringCount: number;
  expiredCount: number;
  missingCount: number;
  totalRequired: number;
  blockingReasons: string[];
  recommendations: string[];
  plainSummary: string;
}

export const MANDATORY_COMPLIANCE_DOCS: Array<{
  type: ComplianceDocType;
  label: string;
  description: string;
  hasExpiry: boolean;
}> = [
  {
    type: 'tax_compliance',
    label: 'Tax Compliance Certificate (TCC)',
    description: 'Valid KRA certificate certifying tax compliance.',
    hasExpiry: true,
  },
  {
    type: 'agpo_cert',
    label: 'AGPO Certificate (Youth)',
    description: 'National Treasury affirmative action certificate.',
    hasExpiry: true,
  },
  {
    type: 'cr12',
    label: 'CR12 Official Search Certificate',
    description: 'Business Registration Service list of directors & shareholders.',
    hasExpiry: false,
  },
  {
    type: 'business_permit',
    label: 'County Single Business Permit',
    description: 'Current local government operating license.',
    hasExpiry: true,
  },
  {
    type: 'kra_pin_cert',
    label: 'KRA PIN Certificate',
    description: 'Company taxpayer registration certificate.',
    hasExpiry: false,
  },
  {
    type: 'bank_reference',
    label: 'Bank Reference / Bid Bond Facility',
    description: 'Letter from commercial bank certifying active standing & bid security capacity.',
    hasExpiry: false,
  },
  {
    type: 'audited_accounts',
    label: 'Audited Financial Statements',
    description: 'Past 1–2 years certified financial audits.',
    hasExpiry: false,
  },
  {
    type: 'other',
    label: 'Additional Accreditations',
    description: 'NCA, ICT Authority licenses, or client recommendation letters.',
    hasExpiry: false,
  },
];
