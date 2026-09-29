'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCompanyProfile } from '@/lib/data/company-profile';
import { getApplicationById } from '@/lib/data/applications';
import { assembleFinalPacketPdf } from '@/lib/agents/applications/pdf-assembler';
import type { SubmissionMethod, ApplicationStatus } from '@/lib/supabase/types';

export async function assembleFinalPacketAction(applicationId: string) {
  const supabase = await createClient();

  try {
    const appDetail = await getApplicationById(applicationId);
    if (!appDetail) throw new Error('Application not found');

    const { tender, application, generatedDocuments, complianceDocuments, checklist } = appDetail;
    const profile = await getCompanyProfile();

    // Check if any required checklist item is still pending
    const pendingRequired = checklist.filter(
      (item) => item.required && item.status === 'pending'
    );

    // Assemble the ordered PDF buffer
    const pdfBytes = await assembleFinalPacketPdf({
      tender,
      profile,
      applicationId,
      generatedDocs: generatedDocuments,
      complianceDocs: complianceDocuments,
    });

    const base64Pdf = Buffer.from(pdfBytes).toString('base64');
    const dataUri = `data:application/pdf;base64,${base64Pdf}`;
    const filename = `master_packet_${tender.external_reference || applicationId}_${Date.now()}.pdf`;

    let fileUrl = dataUri;

    // Attempt to store in Supabase Storage if bucket exists
    try {
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('compliance-docs')
        .upload(`packets/${filename}`, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('compliance-docs')
          .getPublicUrl(`packets/${filename}`);
        if (publicUrlData?.publicUrl) {
          fileUrl = publicUrlData.publicUrl;
        }
      }
    } catch (storageErr) {
      console.warn('Storage upload note (using base64 fallback):', storageErr);
    }

    // Save as master packet in generated_documents
    await supabase.from('generated_documents').insert({
      application_id: applicationId,
      doc_type: 'other',
      content: `# MASTER SUBMISSION PACKET FOR ${tender.title}\n\nGenerated: ${new Date().toISOString()}\nFile URL: ${fileUrl.substring(0, 100)}...`,
      file_url: fileUrl,
      version: 1,
      status: 'final',
    });

    // Update application status to 'docs_ready' if currently 'drafting'
    if (application.status === 'drafting') {
      await supabase
        .from('applications')
        .update({
          status: 'docs_ready',
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);
    }

    revalidatePath(`/applications/${applicationId}`);
    revalidatePath('/applications');
    revalidatePath('/documents');

    return {
      success: true,
      fileUrl,
      filename,
      dataUri,
      hasPendingWarnings: pendingRequired.length > 0,
      pendingCount: pendingRequired.length,
      fileSizeKb: Math.round(pdfBytes.length / 1024),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to assemble master PDF packet',
    };
  }
}

export async function updateSubmissionMethodAction(
  applicationId: string,
  method: SubmissionMethod,
  deliveryNotes?: string
) {
  const supabase = await createClient();

  try {
    const updatePayload: {
      submission_method: SubmissionMethod;
      updated_at: string;
      notes?: string;
    } = {
      submission_method: method,
      updated_at: new Date().toISOString(),
    };

    if (deliveryNotes !== undefined) {
      updatePayload.notes = deliveryNotes;
    }

    const { error } = await supabase
      .from('applications')
      .update(updatePayload)
      .eq('id', applicationId);

    if (error) throw new Error(error.message);

    revalidatePath(`/applications/${applicationId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update submission method' };
  }
}

export async function markAsSubmittedAction(applicationId: string) {
  const supabase = await createClient();

  try {
    const submittedAt = new Date().toISOString();

    // 1. Update application status and timestamp
    const { data: app, error: appErr } = await supabase
      .from('applications')
      .update({
        status: 'submitted',
        submitted_at: submittedAt,
        updated_at: submittedAt,
      })
      .eq('id', applicationId)
      .select('tender_id')
      .single();

    if (appErr) throw new Error(appErr.message);

    // 2. Update tender status to 'submitted'
    if (app?.tender_id) {
      await supabase
        .from('tenders')
        .update({
          status: 'submitted',
          updated_at: submittedAt,
        })
        .eq('id', app.tender_id);
    }

    revalidatePath(`/applications/${applicationId}`);
    revalidatePath('/applications');
    revalidatePath('/documents');
    revalidatePath('/qualification');

    return { success: true, submittedAt };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to mark as submitted' };
  }
}

export async function updateOutcomeStatusAction(
  applicationId: string,
  newStatus: 'awarded' | 'rejected',
  notes?: string
) {
  const supabase = await createClient();

  try {
    const now = new Date().toISOString();

    const { data: app, error } = await supabase
      .from('applications')
      .update({
        status: newStatus,
        notes: notes ? notes : undefined,
        updated_at: now,
      })
      .eq('id', applicationId)
      .select('tender_id')
      .single();

    if (error) throw new Error(error.message);

    // Update tender status
    if (app?.tender_id) {
      await supabase
        .from('tenders')
        .update({
          status: newStatus === 'awarded' ? 'won' : 'lost',
          updated_at: now,
        })
        .eq('id', app.tender_id);
    }

    revalidatePath(`/applications/${applicationId}`);
    revalidatePath('/applications');
    revalidatePath('/documents');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update outcome status' };
  }
}
