import { callGeminiVertex } from '@/lib/ai/gemini';
import type { CompanyProfileData } from '@/lib/data/company-profile-types';
import type { TenderRow } from '@/lib/data/tenders';
import type { GeneratedDocType } from '@/lib/supabase/types';

export interface GenerationParams {
  docType: GeneratedDocType;
  tender: TenderRow;
  profile: CompanyProfileData;
  templateContent?: string;
  userInputs?: {
    proposedPrice?: number;
    timelineMonths?: number;
    assignedTeam?: string[];
    customStrategy?: string;
  };
}

export interface SectionRegenerationParams {
  currentContent: string;
  sectionTitle: string;
  userInstruction: string;
  tender: TenderRow;
  profile: CompanyProfileData;
}

/**
 * Fills template placeholders with company profile and tender particulars.
 */
function interpolateTemplateVariables(
  template: string,
  params: GenerationParams
): string {
  const { tender, profile, userInputs } = params;
  const now = new Date();

  const pastProjectsText = profile.past_projects.length > 0
    ? profile.past_projects
        .map(
          (p, i) =>
            `${i + 1}. **Client:** ${p.client} | **Value:** KES ${Number(p.value).toLocaleString()} | **Year:** ${p.year}\n   *Scope:* ${p.description}`
        )
        .join('\n\n')
    : 'Similar assignments available upon official request.';

  const keyPersonnelText = profile.key_personnel.length > 0
    ? profile.key_personnel
        .map(
          (m, i) =>
            `${i + 1}. **${m.name}** — *${m.role}*\n   ${m.bio}${m.cv_url ? ` ([View CV Profile](${m.cv_url}))` : ''}`
        )
        .join('\n\n')
    : 'Key technical CVs attached in proposal appendix.';

  const proposedTotal = userInputs?.proposedPrice || tender.estimated_value || 5000000;
  const subtotal = Math.round(proposedTotal / 1.16);
  const vat = proposedTotal - subtotal;

  const replacements: Record<string, string> = {
    '{{tender_title}}': tender.title,
    '{{external_reference}}': tender.external_reference || 'N/A',
    '{{procuring_entity}}': tender.procuring_entity,
    '{{company_name}}': profile.legal_name,
    '{{agpo_category}}': profile.agpo_category || 'Youth',
    '{{agpo_cert_number}}': profile.agpo_cert_number || 'N/A',
    '{{kra_pin}}': profile.kra_pin || 'N/A',
    '{{physical_address}}': profile.physical_address || 'Nairobi, Kenya',
    '{{postal_address}}': profile.postal_address || 'P.O. Box 00100, Nairobi',
    '{{contact_email}}': profile.contact_email || 'tenders@hisako.co.ke',
    '{{contact_phone}}': profile.contact_phone || '+254 700 000000',
    '{{submission_deadline}}': new Date(tender.submission_deadline).toLocaleDateString(),
    '{{current_date}}': now.toLocaleDateString(),
    '{{past_projects_section}}': pastProjectsText,
    '{{key_personnel_section}}': keyPersonnelText,
    '{{price_design}}': (subtotal * 0.15).toLocaleString(),
    '{{price_dev}}': (subtotal * 0.45).toLocaleString(),
    '{{price_cloud}}': (subtotal * 0.15).toLocaleString(),
    '{{price_training}}': (subtotal * 0.1).toLocaleString(),
    '{{price_support}}': (subtotal * 0.15).toLocaleString(),
    '{{subtotal_price}}': subtotal.toLocaleString(),
    '{{vat_amount}}': vat.toLocaleString(),
    '{{grand_total_price}}': proposedTotal.toLocaleString(),
    '{{grand_total_words}}': `${proposedTotal.toLocaleString()} Kenya Shillings`,
  };

  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(key, value);
  }
  return result;
}

/**
 * AI Drafting Flow using Claude 3.5 Sonnet on Vertex AI:
 * Generates tailored, comprehensive public procurement proposal documents.
 */
export async function generateProposalDraft(
  params: GenerationParams
): Promise<string> {
  const { docType, tender, profile, templateContent, userInputs } = params;

  // Pre-fill template if provided
  const baseStructure = templateContent
    ? interpolateTemplateVariables(templateContent, params)
    : '';

  const systemPrompt = `You are a Senior Bid Specialist and Principal Software Architect for Hisako Tech Solutions Ltd.
Your mission is to author an authoritative, professional, and compliant bid document for a Kenyan public procurement tender.

Company Profile Context:
- Legal Entity: ${profile.legal_name}
- AGPO Classification: ${profile.agpo_category} (Youth-owned affirmative enterprise)
- Registration: ${profile.registration_number || 'CPR/2021/12345'} | KRA PIN: ${profile.kra_pin || 'P051234567Z'}
- Core Capabilities: ${JSON.stringify(profile.core_services)}
- Past Reference Projects: ${JSON.stringify(profile.past_projects)}
- Key Technical Personnel: ${JSON.stringify(profile.key_personnel)}

Tender Requirements Context:
- Tender Title: ${tender.title}
- Reference: ${tender.external_reference || 'N/A'}
- Procuring Entity: ${tender.procuring_entity}
- Category: ${tender.category || 'ICT'}
- Stated Scope / Description: ${tender.description || 'Full scope in tender dossier'}
- Stated Submission Deadline: ${tender.submission_deadline}

Operator Custom Instructions:
- Proposed Budget: ${userInputs?.proposedPrice ? `KES ${userInputs.proposedPrice.toLocaleString()}` : 'Standard schedule'}
- Proposed Timeline: ${userInputs?.timelineMonths ? `${userInputs.timelineMonths} Months` : '12–16 weeks'}
- Key Team Allocated: ${userInputs?.assignedTeam ? userInputs.assignedTeam.join(', ') : 'All core personnel'}
- Additional Strategic Focus: ${userInputs?.customStrategy || 'High-reliability, cloud security, local capacity building'}

Formatting Guidelines:
- Document Type: ${docType}
- Tone: Formal, precise, persuasive, adhering to the Public Procurement and Asset Disposal Act (PPADA, 2015).
- Structure: Clear Markdown headers (#, ##, ###), tables where appropriate for price/timelines, bulleted technical deliverables.
- Produce the FULL, complete, ready-to-submit document content without meta-conversational text or generic placeholders.`;

  const userPrompt = `Please synthesize the complete official ${docType.replace('_', ' ').toUpperCase()} for this tender.
${baseStructure ? `\nReference this pre-configured template structure, expanding technical details and replacing any remaining placeholders:\n\n${baseStructure}` : ''}`;

  try {
    const response = await callGeminiVertex({
      systemPrompt,
      prompt: userPrompt,
      temperature: 0.2,
      maxTokens: 4096,
    });

    const text = response.text.trim();
    return text || baseStructure;
  } catch (error: any) {
    console.warn('Vertex AI document generation fallback:', error);
    // Return interpolated template if Vertex AI is temporarily unreachable
    return baseStructure || `# ${docType.toUpperCase()} FOR ${tender.title}\n\nDraft content prepared for ${profile.legal_name}.`;
  }
}

/**
 * "Regenerate Section" AI Action:
 * Re-writes a specific section of the document based on operator feedback while preserving the surrounding document.
 */
export async function regenerateDocumentSection(
  params: SectionRegenerationParams
): Promise<string> {
  const { currentContent, sectionTitle, userInstruction, tender, profile } = params;

  const prompt = `You are editing a bid proposal document for Hisako Tech Solutions Ltd.
Tender: "${tender.title}" (Ref: ${tender.external_reference || 'N/A'})

Current Full Document:
\`\`\`markdown
${currentContent}
\`\`\`

Target Section to Revise: "${sectionTitle}"
Revision Instruction from Operator: "${userInstruction}"

Your Task:
Rewrite the ENTIRE document, replacing the section "${sectionTitle}" with an improved, highly detailed version adhering strictly to the operator's instruction.
Keep all other sections identical and preserve all markdown headers, formatting, and tables.
Return ONLY the updated full markdown text, with no introductory or concluding conversational text.`;

  try {
    const response = await callGeminiVertex({
      prompt,
      temperature: 0.2,
      maxTokens: 4096,
    });

    const text = response.text.trim();
    return text || currentContent;
  } catch (error: any) {
    console.warn('Vertex AI section regeneration fallback:', error);
    return currentContent;
  }
}
