import * as XLSX from 'xlsx';
import { callGeminiVertex } from '@/lib/ai/gemini';
import type {
  ColumnMappingProposal,
  RawScrapedTender,
  RelevanceEvaluationItem,
} from './types';

/**
 * Parses binary or base64 spreadsheet buffer into JSON rows and column headers.
 * Deeply sanitizes every row into a 100% plain object with no custom prototypes or methods.
 */
export function parseSpreadsheetData(buffer: Buffer): {
  headers: string[];
  rows: Record<string, any>[];
} {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON with raw strings/dates
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
  });

  // Deep sanitize to guarantee 100% plain JavaScript objects with no methods or custom prototypes
  const cleanRows: Record<string, any>[] = rawRows.map((row) => {
    const plain: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      if (value === null || value === undefined) {
        plain[key] = '';
      } else if (value instanceof Date) {
        plain[key] = isNaN(value.getTime()) ? '' : value.toISOString().split('T')[0];
      } else if (typeof value === 'object') {
        try {
          plain[key] = JSON.stringify(value);
        } catch {
          plain[key] = String(value);
        }
      } else if (typeof value === 'string') {
        plain[key] = value.trim();
      } else {
        plain[key] = value;
      }
    }
    return plain;
  });

  // Guarantee plain prototype via JSON serialization
  const plainRows: Record<string, any>[] = JSON.parse(JSON.stringify(cleanRows));
  const headers = plainRows.length > 0 ? Object.keys(plainRows[0]) : [];

  return { headers, rows: plainRows };
}

/**
 * Uses Google Cloud Vertex AI (Gemini 2.5 Flash) to dynamically analyze unpredictable column headers
 * and propose field mappings to the TenderOS schema.
 */
export async function proposeColumnMappingWithClaude(
  headers: string[],
  sampleRows: Record<string, any>[]
): Promise<ColumnMappingProposal> {
  const prompt = `You are a data integration assistant. Given the following column headers and sample data from a Kenyan tender spreadsheet, identify which column corresponds to each required TenderOS schema field.

Available Column Headers:
${JSON.stringify(headers, null, 2)}

Sample Rows (First 3):
${JSON.stringify(sampleRows.slice(0, 3), null, 2)}

Target Schema Fields to Map:
- title: Tender name / description / subject
- procuring_entity: Government Ministry, County, Agency, Parastatal, Buyer
- category: Category / Procurement Method / Scope
- external_reference: Tender Number / Notice Ref / RFP Number
- submission_deadline: Closing Date / Submission Deadline / Opening Date
- publish_date: Date Advertised / Published Date / Invitation Date
- tender_document_url: Download Link / Website URL
- estimated_value: Budget / Amount / Estimated Value (KES)
- description: Additional notes / Detailed Scope

Return ONLY valid JSON matching this structure (use exact header names from the input headers array, or null if not found):
{
  "title": string | null,
  "procuring_entity": string | null,
  "category": string | null,
  "external_reference": string | null,
  "submission_deadline": string | null,
  "publish_date": string | null,
  "tender_document_url": string | null,
  "estimated_value": string | null,
  "description": string | null
}`;

  try {
    const result = await callGeminiVertex({
      prompt,
      responseFormat: 'json',
      temperature: 0,
      maxTokens: 1024,
    });

    const cleanJson = result.text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.warn('AI dynamic mapping fallback:', error);
    // Heuristic regex fallback
    const proposal: ColumnMappingProposal = {};
    for (const h of headers) {
      const lower = h.toLowerCase();
      if (!proposal.title && (lower.includes('title') || lower.includes('desc') || lower.includes('name') || lower.includes('subject'))) {
        proposal.title = h;
      } else if (!proposal.procuring_entity && (lower.includes('entity') || lower.includes('ministry') || lower.includes('buyer') || lower.includes('client') || lower.includes('pe'))) {
        proposal.procuring_entity = h;
      } else if (!proposal.external_reference && (lower.includes('ref') || lower.includes('number') || lower.includes('tender no') || lower.includes('code'))) {
        proposal.external_reference = h;
      } else if (!proposal.submission_deadline && (lower.includes('close') || lower.includes('deadline') || lower.includes('due') || lower.includes('closing'))) {
        proposal.submission_deadline = h;
      } else if (!proposal.category && (lower.includes('category') || lower.includes('sector') || lower.includes('type') || lower.includes('method'))) {
        proposal.category = h;
      }
    }
    return proposal;
  }
}

/**
 * AI Relevance Filter:
 * Evaluates parsed tenders against Hisako Tech's core services:
 * - ICT infrastructure & networking
 * - Custom software, web & mobile app engineering
 * - IT consultation & systems audit
 * - AGPO Youth eligibility
 * 
 * Processes in batches of 30 to support large spreadsheets (e.g. 400+ tenders) reliably.
 */
export async function filterTenderRelevanceWithClaude(
  tenders: RawScrapedTender[]
): Promise<RelevanceEvaluationItem[]> {
  const ictKeywords = [
    'ict', 'software', 'web', 'portal', 'app', 'system', 'cloud', 'digital',
    'network', 'computer', 'erp', 'cyber', 'hardware', 'agpo', 'youth',
    'telecom', 'internet', 'biometric', 'cctv', 'database', 'license',
  ];

  const results: RelevanceEvaluationItem[] = [];
  const BATCH_SIZE = 30;

  for (let i = 0; i < tenders.length; i += BATCH_SIZE) {
    const chunk = tenders.slice(i, i + BATCH_SIZE);
    const chunkStartIndex = i;

    const simplifiedList = chunk.map((t, index) => ({
      index: chunkStartIndex + index,
      title: t.title,
      entity: t.procuring_entity,
      category: t.category,
      description: t.description || '',
    }));

    const prompt = `You are a procurement qualification officer for "Hisako Tech Solutions Ltd", a Kenyan technology firm eligible under AGPO (Youth).
Core Services Offered:
1. ICT Services & Infrastructure (hardware, network setup, maintenance)
2. Custom Software & Web Application Development
3. Mobile App Development (Android/iOS)
4. IT Consulting, Systems Audit, Cyber Security, Cloud Solutions, Digitization

Evaluate each tender below. Determine if it is plausibly relevant to Hisako's capabilities or an AGPO Youth tender in ICT. Non-ICT tenders (e.g. road construction, catering, security guarding, tree planting, cleaning, medical supplies) MUST be marked as NOT relevant.

Input Tenders:
${JSON.stringify(simplifiedList, null, 2)}

Return ONLY a valid JSON array:
[
  {
    "index": number,
    "isRelevant": boolean,
    "relevanceScore": number,
    "reason": "Clear explanation of why it is relevant or irrelevant to Hisako Tech",
    "matchedKeywords": ["keyword1", "keyword2"]
  }
]`;

    try {
      const result = await callGeminiVertex({
        prompt,
        responseFormat: 'json',
        temperature: 0,
        maxTokens: 3000,
      });

      const cleanJson = result.text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const evaluated: Array<{
        index: number;
        isRelevant: boolean;
        relevanceScore: number;
        reason: string;
        matchedKeywords?: string[];
      }> = JSON.parse(cleanJson);

      for (let j = 0; j < chunk.length; j++) {
        const globalIdx = chunkStartIndex + j;
        const t = chunk[j];
        const match = evaluated.find((e) => e.index === globalIdx);

        if (match) {
          results.push({
            rowIndex: globalIdx,
            tender: t,
            isRelevant: match.isRelevant,
            relevanceScore: match.relevanceScore,
            reason: match.reason,
            matchedKeywords: match.matchedKeywords || [],
          });
        } else {
          // Heuristic fallback for any unmatched item in chunk
          const text = `${t.title} ${t.category} ${t.description}`.toLowerCase();
          const isRel = ictKeywords.some((k) => text.includes(k));
          results.push({
            rowIndex: globalIdx,
            tender: t,
            isRelevant: isRel,
            relevanceScore: isRel ? 75 : 15,
            reason: isRel ? 'Matches core ICT/software keywords' : 'Non-ICT procurement category',
            matchedKeywords: ictKeywords.filter((k) => text.includes(k)),
          });
        }
      }
    } catch (err) {
      console.warn(`Batch AI relevance fallback for chunk ${i}-${i + chunk.length}:`, err);
      // Fast keyword fallback for the entire chunk
      for (let j = 0; j < chunk.length; j++) {
        const globalIdx = chunkStartIndex + j;
        const t = chunk[j];
        const text = `${t.title} ${t.category} ${t.description}`.toLowerCase();
        const isRel = ictKeywords.some((k) => text.includes(k));
        results.push({
          rowIndex: globalIdx,
          tender: t,
          isRelevant: isRel,
          relevanceScore: isRel ? 70 : 20,
          reason: isRel ? 'Keyword matched ICT services' : 'Non-ICT procurement category',
          matchedKeywords: ictKeywords.filter((k) => text.includes(k)),
        });
      }
    }
  }

  // Ensure 100% plain objects
  return JSON.parse(JSON.stringify(results));
}
