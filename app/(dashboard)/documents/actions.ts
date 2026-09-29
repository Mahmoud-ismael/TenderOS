'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCompanyProfile } from '@/lib/data/company-profile';
import {
  generateProposalDraft,
  regenerateDocumentSection,
} from '@/lib/agents/documents/generator';
import {
  verifyComplianceBundleReadiness,
  type GeneratedDocumentRow,
} from '@/lib/data/documents';
import type { GeneratedDocType, ChecklistItem } from '@/lib/supabase/types';

export async function generateInitialDocumentAction(params: {
  applicationId: string;
  docType: GeneratedDocType;
  templateId?: string;
  userInputs?: {
    proposedPrice?: number;
    timelineMonths?: number;
    assignedTeam?: string[];
    customStrategy?: string;
  };
}) {
  const supabase = await createClient();
  const { applicationId, docType, templateId, userInputs } = params;

  try {
    // 1. Fetch application with tender
    const { data: app, error: appErr } = await supabase
      .from('applications')
      .select('*, tenders(*)')
      .eq('id', applicationId)
      .single();

    if (appErr || !app) throw new Error('Application not found');

    const tender = app.tenders as any;
    const profile = await getCompanyProfile();

    // 2. Fetch template content if templateId provided or find default for docType
    let templateContent = '';
    let resolvedTemplateId = templateId;

    if (templateId) {
      const { data: tmpl } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      if (tmpl) templateContent = tmpl.template_content;
    } else {
      const { data: tmpl } = await supabase
        .from('document_templates')
        .select('*')
        .eq('doc_type', docType)
        .maybeSingle();
      if (tmpl) {
        templateContent = tmpl.template_content;
        resolvedTemplateId = tmpl.id;
      }
    }

    // 3. Invoke Claude Sonnet on Vertex AI
    const content = await generateProposalDraft({
      docType,
      tender,
      profile,
      templateContent,
      userInputs,
    });

    // 4. Calculate version
    const { data: existingDocs } = await supabase
      .from('generated_documents')
      .select('version')
      .eq('application_id', applicationId)
      .eq('doc_type', docType)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingDocs && existingDocs.length > 0 ? existingDocs[0].version + 1 : 1;

    // 5. Insert new generated document
    const { data: newDoc, error: docErr } = await supabase
      .from('generated_documents')
      .insert({
        application_id: applicationId,
        doc_type: docType,
        template_id: resolvedTemplateId || null,
        content,
        version: nextVersion,
        status: 'draft',
      })
      .select('*')
      .single();

    if (docErr) throw new Error(docErr.message);

    // 6. Auto-update application checklist item
    const rawChecklist = Array.isArray(app.checklist) ? (app.checklist as any[]) : [];
    const updatedChecklist = rawChecklist.map((item) => {
      const itemName = (item.item || '').toLowerCase();
      const matchType = docType.replace('_', ' ');
      if (itemName.includes(matchType) || (docType === 'technical_proposal' && itemName.includes('technical'))) {
        return { ...item, status: 'attached', document_id: newDoc.id };
      }
      return item;
    });

    await supabase
      .from('applications')
      .update({ checklist: updatedChecklist, updated_at: new Date().toISOString() })
      .eq('id', applicationId);

    revalidatePath('/documents');
    revalidatePath('/applications');

    return { success: true, document: newDoc };
  } catch (error: any) {
    return { success: false, error: error.message || 'Draft generation failed' };
  }
}

export async function saveRevisedDraftAction(params: {
  applicationId: string;
  docType: GeneratedDocType;
  content: string;
  templateId?: string | null;
  createNewVersion?: boolean;
}) {
  const supabase = await createClient();
  const { applicationId, docType, content, templateId, createNewVersion } = params;

  try {
    const { data: latest } = await supabase
      .from('generated_documents')
      .select('*')
      .eq('application_id', applicationId)
      .eq('doc_type', docType)
      .order('version', { ascending: false })
      .limit(1);

    const currentDoc = latest?.[0];

    if (createNewVersion || !currentDoc) {
      const nextVersion = currentDoc ? currentDoc.version + 1 : 1;
      const { data: created, error } = await supabase
        .from('generated_documents')
        .insert({
          application_id: applicationId,
          doc_type: docType,
          template_id: templateId || currentDoc?.template_id || null,
          content,
          version: nextVersion,
          status: 'reviewed',
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      revalidatePath('/documents');
      return { success: true, document: created };
    } else {
      const { data: updated, error } = await supabase
        .from('generated_documents')
        .update({
          content,
          status: 'reviewed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentDoc.id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      revalidatePath('/documents');
      return { success: true, document: updated };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to save revised draft' };
  }
}

export async function regenerateSectionAction(params: {
  applicationId: string;
  docType: GeneratedDocType;
  currentContent: string;
  sectionTitle: string;
  userInstruction: string;
}) {
  const supabase = await createClient();
  const { applicationId, docType, currentContent, sectionTitle, userInstruction } = params;

  try {
    const { data: app } = await supabase
      .from('applications')
      .select('*, tenders(*)')
      .eq('id', applicationId)
      .single();

    if (!app) throw new Error('Application not found');

    const tender = app.tenders as any;
    const profile = await getCompanyProfile();

    // Call Claude section rewrite
    const revisedContent = await regenerateDocumentSection({
      currentContent,
      sectionTitle,
      userInstruction,
      tender,
      profile,
    });

    // Save as new version
    const result = await saveRevisedDraftAction({
      applicationId,
      docType,
      content: revisedContent,
      createNewVersion: true,
    });

    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Section regeneration failed' };
  }
}

export async function markDocumentFinalAction(docId: string, applicationId: string) {
  const supabase = await createClient();

  try {
    const { data: doc, error } = await supabase
      .from('generated_documents')
      .update({
        status: 'final',
        updated_at: new Date().toISOString(),
      })
      .eq('id', docId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    // Update application checklist item status to 'verified'
    const { data: app } = await supabase
      .from('applications')
      .select('checklist')
      .eq('id', applicationId)
      .single();

    if (app && Array.isArray(app.checklist)) {
      const updatedChecklist = (app.checklist as any[]).map((item) => {
        const itemName = (item.item || '').toLowerCase();
        const matchType = doc.doc_type.replace('_', ' ');
        if (itemName.includes(matchType) || (doc.doc_type === 'technical_proposal' && itemName.includes('technical'))) {
          return { ...item, status: 'verified', document_id: doc.id };
        }
        return item;
      });

      await supabase
        .from('applications')
        .update({ checklist: updatedChecklist })
        .eq('id', applicationId);
    }

    revalidatePath('/documents');
    revalidatePath('/applications');

    return { success: true, document: doc };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to finalize document' };
  }
}

export async function assembleComplianceBundleAction(applicationId: string) {
  const supabase = await createClient();

  try {
    const readiness = await verifyComplianceBundleReadiness();
    if (!readiness.canBundle) {
      return {
        success: false,
        error: `Cannot assemble compliance bundle. Missing or expired documents: ${[...readiness.missingDocs, ...readiness.expiredDocs].join(', ')}`,
      };
    }

    // Create Markdown index of verified compliance documents
    const bundleContent = `# OFFICIAL COMPLIANCE PACKET & STATUTORY CERTIFICATES
**Bidder:** Hisako Tech Solutions Ltd (AGPO Youth)  
**Assembled:** ${new Date().toLocaleString()}  
**Integrity Status:** All certificates verified against KRA, BRS, and National Treasury databases.

---

## 1. Verified Certificates Schedule
${readiness.validDocs
  .map(
    (d, i) =>
      `### 1.${i + 1} ${d.doc_type.toUpperCase().replace('_', ' ')}
- **Certificate Status:** Valid (Active)
- **Issue Date:** ${d.issue_date || 'N/A'}
- **Expiry Date:** ${d.expiry_date || 'Perpetual'}
- **Storage Attachment:** [View Official Scan](${d.file_url})`
  )
  .join('\n\n')}

---
*Generated by TenderOS Single-Operator Compliance Bundler.*`;

    // Upsert compliance bundle in generated_documents
    const { data: bundleDoc, error: bundleErr } = await supabase
      .from('generated_documents')
      .upsert(
        {
          application_id: applicationId,
          doc_type: 'compliance_bundle',
          content: bundleContent,
          version: 1,
          status: 'final',
        },
        { onConflict: 'application_id,doc_type' }
      )
      .select('*')
      .single();

    if (bundleErr) {
      // Fallback insert without conflict constraint
      const { data: insertedDoc } = await supabase
        .from('generated_documents')
        .insert({
          application_id: applicationId,
          doc_type: 'compliance_bundle',
          content: bundleContent,
          version: 1,
          status: 'final',
        })
        .select('*')
        .single();
    }

    // Update application checklist items for all compliance docs to 'verified'
    const { data: app } = await supabase
      .from('applications')
      .select('checklist')
      .eq('id', applicationId)
      .single();

    if (app && Array.isArray(app.checklist)) {
      const updatedChecklist = (app.checklist as any[]).map((item) => {
        const name = (item.item || '').toLowerCase();
        if (
          name.includes('tax') ||
          name.includes('agpo') ||
          name.includes('cr12') ||
          name.includes('permit') ||
          name.includes('pin')
        ) {
          return { ...item, status: 'verified' };
        }
        return item;
      });

      await supabase
        .from('applications')
        .update({ checklist: updatedChecklist })
        .eq('id', applicationId);
    }

    revalidatePath('/documents');
    revalidatePath('/applications');

    return { success: true, count: readiness.validDocs.length };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to assemble compliance bundle' };
  }
}

export async function toggleChecklistItemAction(
  applicationId: string,
  itemIndex: number,
  newStatus: 'pending' | 'attached' | 'verified'
) {
  const supabase = await createClient();

  try {
    const { data: app } = await supabase
      .from('applications')
      .select('checklist')
      .eq('id', applicationId)
      .single();

    if (!app || !Array.isArray(app.checklist)) throw new Error('Checklist not found');

    const checklist = [...(app.checklist as any[])];
    if (checklist[itemIndex]) {
      checklist[itemIndex].status = newStatus;
    }

    await supabase
      .from('applications')
      .update({ checklist, updated_at: new Date().toISOString() })
      .eq('id', applicationId);

    revalidatePath('/documents');
    revalidatePath('/applications');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update checklist' };
  }
}
