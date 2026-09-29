import { createClient } from '@/lib/supabase/server';
import { getCompanyProfile, getComplianceDocuments, upsertCompanyProfile } from '@/lib/data/company-profile';
import { qualifySingleTender } from '@/lib/agents/qualification/pipeline';
import { runTenderScrapers } from '@/lib/agents/discovery/scraper-orchestrator';
import { generateProposalDraft, regenerateDocumentSection } from '@/lib/agents/documents/generator';
import {
  getApplicationDetail,
  verifyComplianceBundleReadiness,
  type GeneratedDocumentRow,
} from '@/lib/data/documents';
import { getApplicationById, getApplicationWinRateStats } from '@/lib/data/applications';
import { assembleFinalPacketPdf } from '@/lib/agents/applications/pdf-assembler';
import type { GeneratedDocType } from '@/lib/supabase/types';

/**
 * Anthropic tool declarations for Claude 3.5 Sonnet on Vertex AI.
 */
export const AGENT_TOOLS: any[] = [
  {
    name: 'query_tenders',
    description:
      'Search and filter tenders from the database by status, keyword, category, closing deadline, or procuring entity.',
    input_schema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Keyword search in tender title, reference number, or description.',
        },
        status: {
          type: 'string',
          description:
            'Filter by status: "discovered", "qualifying", "qualified", "disqualified", "in_progress", "submitted", "won", "lost".',
        },
        category: {
          type: 'string',
          description: 'Filter by category (e.g. "ICT", "Consultancy", "Supply").',
        },
        closingWithinDays: {
          type: 'number',
          description: 'Filter tenders whose submission deadline is within this number of days from now.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of tenders to return (default 10).',
        },
      },
    },
  },
  {
    name: 'qualify_tender',
    description:
      'Run the AI qualification assessment on a specific tender using Claude Sonnet. Evaluates AGPO Youth fit, service capabilities match, compliance readiness, score (0-100), and recommends pursue/skip/borderline.',
    input_schema: {
      type: 'object',
      properties: {
        tenderId: {
          type: 'string',
          description: 'UUID of the tender to qualify.',
        },
      },
      required: ['tenderId'],
    },
  },
  {
    name: 'trigger_discovery_scrape',
    description:
      'Run scrapers on Kenya national tender portals (tenders.go.ke, agpo.go.ke) on-demand to fetch newly published tenders.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_company_profile_and_compliance',
    description:
      'Retrieve Hisako Tech Solutions company profile (registration, KRA PIN, AGPO cert, key personnel, past projects) and compliance document vault readiness.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'update_company_profile_info',
    description:
      'Update general information in company profile (contact details, physical address, core services list).',
    input_schema: {
      type: 'object',
      properties: {
        contact_email: { type: 'string' },
        contact_phone: { type: 'string' },
        physical_address: { type: 'string' },
        postal_address: { type: 'string' },
      },
    },
  },
  {
    name: 'get_application_dossier',
    description:
      'Inspect an active application dossier including its tender particulars, live checklist items, generated proposal documents, and submission packet status.',
    input_schema: {
      type: 'object',
      properties: {
        applicationId: {
          type: 'string',
          description: 'UUID of the application (optional if tenderId is provided).',
        },
        tenderId: {
          type: 'string',
          description: 'UUID of the tender to look up application for.',
        },
      },
    },
  },
  {
    name: 'approve_tender_and_start_application',
    description:
      'Approve a qualified tender and create an active application in "drafting" status with standard Kenyan checklist requirements.',
    input_schema: {
      type: 'object',
      properties: {
        tenderId: {
          type: 'string',
          description: 'UUID of the tender to approve and start application for.',
        },
        notes: {
          type: 'string',
          description: 'Optional initial bid strategy notes.',
        },
      },
      required: ['tenderId'],
    },
  },
  {
    name: 'generate_or_revise_document',
    description:
      'Synthesize or redraft an application proposal document (technical_proposal, financial_proposal, cover_letter, form_of_tender) using Claude 3.5 Sonnet.',
    input_schema: {
      type: 'object',
      properties: {
        applicationId: {
          type: 'string',
          description: 'UUID of the application.',
        },
        docType: {
          type: 'string',
          enum: ['technical_proposal', 'financial_proposal', 'cover_letter', 'form_of_tender'],
          description: 'Document type to draft.',
        },
        proposedPrice: {
          type: 'number',
          description: 'Proposed bid price in Kenya Shillings (KES).',
        },
        timelineMonths: {
          type: 'number',
          description: 'Proposed implementation timeline in months.',
        },
        customStrategy: {
          type: 'string',
          description: 'Strategic emphasis or specific features to highlight.',
        },
      },
      required: ['applicationId', 'docType'],
    },
  },
  {
    name: 'regenerate_document_section',
    description:
      'Rewrite a specific section in an existing proposal document based on operator instructions while preserving the surrounding text.',
    input_schema: {
      type: 'object',
      properties: {
        applicationId: {
          type: 'string',
          description: 'UUID of the application.',
        },
        docType: {
          type: 'string',
          enum: ['technical_proposal', 'financial_proposal', 'cover_letter', 'form_of_tender'],
        },
        sectionTitle: {
          type: 'string',
          description: 'Title of the section to rewrite (e.g. "2. Technical Methodology" or "Payment Terms").',
        },
        userInstruction: {
          type: 'string',
          description: 'Detailed instructions on how to rewrite or improve this section.',
        },
      },
      required: ['applicationId', 'docType', 'sectionTitle', 'userInstruction'],
    },
  },
  {
    name: 'assemble_final_packet',
    description:
      'Compile all finalized documents and verified statutory certificates into a single ordered master PDF submission packet for an application.',
    input_schema: {
      type: 'object',
      properties: {
        applicationId: {
          type: 'string',
          description: 'UUID of the application.',
        },
      },
      required: ['applicationId'],
    },
  },
  {
    name: 'mark_application_submitted',
    description:
      'Timestamp and record an application as officially submitted, stopping active deadline alerts.',
    input_schema: {
      type: 'object',
      properties: {
        applicationId: {
          type: 'string',
          description: 'UUID of the application to mark submitted.',
        },
      },
      required: ['applicationId'],
    },
  },
  {
    name: 'record_bid_outcome',
    description:
      'Record the final evaluation outcome for a submitted tender ("awarded" or "rejected") with optional debrief notes.',
    input_schema: {
      type: 'object',
      properties: {
        applicationId: {
          type: 'string',
          description: 'UUID of the application.',
        },
        outcome: {
          type: 'string',
          enum: ['awarded', 'rejected'],
          description: 'Evaluation outcome: "awarded" (contract won) or "rejected" (lost).',
        },
        notes: {
          type: 'string',
          description: 'Debrief or feedback notes from the procuring entity.',
        },
      },
      required: ['applicationId', 'outcome'],
    },
  },
  {
    name: 'get_win_rate_stats',
    description:
      'Retrieve overall win-rate percentage, total bids submitted, total contracts won, and pipeline stats.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Executes a tool called by Claude and returns the result.
 */
export async function executeAgentTool(name: string, input: any): Promise<any> {
  const supabase = await createClient();

  try {
    switch (name) {
      case 'query_tenders': {
        let query = supabase.from('tenders').select('*');

        if (input.status) {
          query = query.eq('status', input.status);
        }
        if (input.category) {
          query = query.ilike('category', `%${input.category}%`);
        }
        if (input.search) {
          query = query.or(
            `title.ilike.%${input.search}%,external_reference.ilike.%${input.search}%,procuring_entity.ilike.%${input.search}%`
          );
        }
        if (input.closingWithinDays) {
          const target = new Date(Date.now() + input.closingWithinDays * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('submission_deadline', new Date().toISOString()).lte('submission_deadline', target);
        }

        query = query.order('submission_deadline', { ascending: true }).limit(input.limit || 10);
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return {
          count: data?.length || 0,
          tenders: (data || []).map((t) => ({
            id: t.id,
            title: t.title,
            external_reference: t.external_reference,
            procuring_entity: t.procuring_entity,
            category: t.category,
            status: t.status,
            estimated_value: t.estimated_value,
            submission_deadline: t.submission_deadline,
          })),
        };
      }

      case 'qualify_tender': {
        const res = await qualifySingleTender(input.tenderId);
        return res;
      }

      case 'trigger_discovery_scrape': {
        const summary = await runTenderScrapers();
        return { success: true, summary };
      }

      case 'get_company_profile_and_compliance': {
        const [profile, docs, readiness] = await Promise.all([
          getCompanyProfile(),
          getComplianceDocuments(),
          verifyComplianceBundleReadiness(),
        ]);
        return {
          profile: {
            legal_name: profile.legal_name,
            registration_number: profile.registration_number,
            agpo_category: profile.agpo_category,
            agpo_cert_number: profile.agpo_cert_number,
            kra_pin: profile.kra_pin,
            core_services: profile.core_services,
            past_projects_count: profile.past_projects.length,
            key_personnel_count: profile.key_personnel.length,
          },
          complianceReadiness: {
            canBundle: readiness.canBundle,
            validDocsCount: readiness.validDocs.length,
            missingDocs: readiness.missingDocs,
            expiredDocs: readiness.expiredDocs,
          },
          documentsVault: docs.map((d) => ({
            doc_type: d.doc_type,
            status: d.status,
            expiry_date: d.expiry_date,
            hasFile: Boolean(d.file_url),
          })),
        };
      }

      case 'update_company_profile_info': {
        const profile = await getCompanyProfile();
        await upsertCompanyProfile({
          ...profile,
          ...input,
        });
        return { success: true, updatedFields: input };
      }

      case 'get_application_dossier': {
        let appId = input.applicationId;
        if (!appId && input.tenderId) {
          const { data: found } = await supabase
            .from('applications')
            .select('id')
            .eq('tender_id', input.tenderId)
            .maybeSingle();
          if (found) appId = found.id;
        }

        if (!appId) {
          return { error: 'No application found for given ID or tender ID' };
        }

        const appDetail = await getApplicationById(appId);
        if (!appDetail) return { error: `Application ${appId} not found` };

        return {
          application: {
            id: appDetail.application.id,
            status: appDetail.application.status,
            submission_method: appDetail.application.submission_method,
            submission_deadline: appDetail.tender.submission_deadline,
            submitted_at: appDetail.application.submitted_at,
          },
          tender: {
            id: appDetail.tender.id,
            title: appDetail.tender.title,
            external_reference: appDetail.tender.external_reference,
            procuring_entity: appDetail.tender.procuring_entity,
          },
          checklist: appDetail.checklist,
          generatedDocuments: appDetail.generatedDocuments.map((d) => ({
            id: d.id,
            doc_type: d.doc_type,
            version: d.version,
            status: d.status,
          })),
        };
      }

      case 'approve_tender_and_start_application': {
        const { data: tender, error: tErr } = await supabase
          .from('tenders')
          .select('*')
          .eq('id', input.tenderId)
          .single();

        if (tErr || !tender) throw new Error('Tender not found');

        const initialChecklist = [
          { item: 'Tax Compliance Certificate', required: true, status: 'pending' },
          { item: 'AGPO Youth Certificate', required: true, status: 'pending' },
          { item: 'CR12 Official Search', required: true, status: 'pending' },
          { item: 'Single Business Permit', required: true, status: 'pending' },
          { item: 'Technical Proposal', required: true, status: 'pending' },
          { item: 'Financial Proposal & Price Schedule', required: true, status: 'pending' },
          { item: 'Form of Tender', required: true, status: 'pending' },
          { item: 'Cover Letter', required: true, status: 'pending' },
        ];

        const { data: app, error: aErr } = await supabase
          .from('applications')
          .insert({
            tender_id: tender.id,
            status: 'drafting',
            checklist: initialChecklist,
            submission_method: 'physical',
            submission_deadline: tender.submission_deadline,
            notes: input.notes || 'Initiated via TenderOS AI Copilot',
          })
          .select('*')
          .single();

        if (aErr) throw new Error(aErr.message);

        await supabase
          .from('tenders')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .eq('id', tender.id);

        return {
          success: true,
          applicationId: app.id,
          tenderTitle: tender.title,
          status: 'drafting',
        };
      }

      case 'generate_or_revise_document': {
        const { data: app } = await supabase
          .from('applications')
          .select('*, tenders(*)')
          .eq('id', input.applicationId)
          .single();

        if (!app) throw new Error('Application not found');

        const profile = await getCompanyProfile();
        const content = await generateProposalDraft({
          docType: input.docType as GeneratedDocType,
          tender: app.tenders as any,
          profile,
          userInputs: {
            proposedPrice: input.proposedPrice,
            timelineMonths: input.timelineMonths,
            customStrategy: input.customStrategy,
          },
        });

        // Insert generated doc
        const { data: doc, error: dErr } = await supabase
          .from('generated_documents')
          .insert({
            application_id: input.applicationId,
            doc_type: input.docType as GeneratedDocType,
            content,
            version: 1,
            status: 'draft',
          })
          .select('*')
          .single();

        if (dErr) throw new Error(dErr.message);

        return {
          success: true,
          documentId: doc.id,
          docType: doc.doc_type,
          version: doc.version,
          snippet: content.substring(0, 300) + '...',
        };
      }

      case 'regenerate_document_section': {
        const { data: latestDoc } = await supabase
          .from('generated_documents')
          .select('*')
          .eq('application_id', input.applicationId)
          .eq('doc_type', input.docType)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!latestDoc || !latestDoc.content) {
          throw new Error(`No existing ${input.docType} found to regenerate.`);
        }

        const { data: app } = await supabase
          .from('applications')
          .select('*, tenders(*)')
          .eq('id', input.applicationId)
          .single();

        const profile = await getCompanyProfile();
        const updatedContent = await regenerateDocumentSection({
          currentContent: latestDoc.content,
          sectionTitle: input.sectionTitle,
          userInstruction: input.userInstruction,
          tender: app?.tenders as any,
          profile,
        });

        const nextVersion = latestDoc.version + 1;
        const { data: createdDoc } = await supabase
          .from('generated_documents')
          .insert({
            application_id: input.applicationId,
            doc_type: input.docType,
            content: updatedContent,
            version: nextVersion,
            status: 'reviewed',
          })
          .select('*')
          .single();

        return {
          success: true,
          version: nextVersion,
          sectionRewritten: input.sectionTitle,
          snippet: updatedContent.substring(0, 300) + '...',
        };
      }

      case 'assemble_final_packet': {
        const appDetail = await getApplicationById(input.applicationId);
        if (!appDetail) throw new Error('Application not found');

        const profile = await getCompanyProfile();
        const pdfBytes = await assembleFinalPacketPdf({
          tender: appDetail.tender,
          profile,
          applicationId: input.applicationId,
          generatedDocs: appDetail.generatedDocuments,
          complianceDocs: appDetail.complianceDocuments,
        });

        const base64Pdf = Buffer.from(pdfBytes).toString('base64');
        const dataUri = `data:application/pdf;base64,${base64Pdf}`;

        await supabase
          .from('applications')
          .update({ status: 'docs_ready', updated_at: new Date().toISOString() })
          .eq('id', input.applicationId);

        return {
          success: true,
          fileSizeKb: Math.round(pdfBytes.length / 1024),
          status: 'docs_ready',
          message: 'Master submission packet successfully merged and verified.',
        };
      }

      case 'mark_application_submitted': {
        const now = new Date().toISOString();
        const { data: app } = await supabase
          .from('applications')
          .update({ status: 'submitted', submitted_at: now, updated_at: now })
          .eq('id', input.applicationId)
          .select('tender_id')
          .single();

        if (app?.tender_id) {
          await supabase
            .from('tenders')
            .update({ status: 'submitted', updated_at: now })
            .eq('id', app.tender_id);
        }

        return {
          success: true,
          submittedAt: now,
          status: 'submitted',
        };
      }

      case 'record_bid_outcome': {
        const now = new Date().toISOString();
        const { data: app } = await supabase
          .from('applications')
          .update({
            status: input.outcome,
            notes: input.notes || undefined,
            updated_at: now,
          })
          .eq('id', input.applicationId)
          .select('tender_id')
          .single();

        if (app?.tender_id) {
          await supabase
            .from('tenders')
            .update({
              status: input.outcome === 'awarded' ? 'won' : 'lost',
              updated_at: now,
            })
            .eq('id', app.tender_id);
        }

        return {
          success: true,
          outcome: input.outcome,
        };
      }

      case 'get_win_rate_stats': {
        const stats = await getApplicationWinRateStats();
        return stats;
      }

      default:
        return { error: `Tool ${name} not recognized.` };
    }
  } catch (error: any) {
    return { error: error.message || `Execution of ${name} failed` };
  }
}
