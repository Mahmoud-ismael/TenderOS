'use server';

import { revalidatePath } from 'next/cache';
import {
  upsertCompanyProfile,
  upsertComplianceDocument,
  deleteComplianceDocument,
  type CompanyProfileData,
  type ComplianceDocumentItem,
} from '@/lib/data/company-profile';
import type { ComplianceDocType, ComplianceDocStatus } from '@/lib/supabase/types';

export async function saveCompanyProfileAction(data: Partial<CompanyProfileData>) {
  try {
    const updated = await upsertCompanyProfile(data);
    revalidatePath('/company-profile');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update company profile' };
  }
}

export async function saveComplianceDocumentAction(data: {
  id?: string;
  doc_type: ComplianceDocType;
  file_url: string;
  issue_date?: string | null;
  expiry_date?: string | null;
  status: ComplianceDocStatus;
  notes?: string | null;
}) {
  try {
    const doc = await upsertComplianceDocument(data);
    revalidatePath('/company-profile');
    return { success: true, data: doc };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to save compliance document' };
  }
}

export async function deleteComplianceDocumentAction(id: string) {
  try {
    await deleteComplianceDocument(id);
    revalidatePath('/company-profile');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete compliance document' };
  }
}
