import { getGoogleVertexClient, callGeminiVertex } from './gemini';
import type { AiTaskOptions, AiTaskResult, ExtractedDocumentMetadata } from './types';

/**
 * Route Claude calls directly to Google Cloud Vertex AI (Gemini 2.5 Flash).
 */
export async function callClaudeVertex(
  options: AiTaskOptions
): Promise<AiTaskResult> {
  return await callGeminiVertex(options);
}

/**
 * Extracts issue date, expiry date, certificate number, and entity details
 * from Kenyan compliance documents using Google Cloud Vertex AI Gemini with multimodal capabilities.
 */
export async function extractDocumentMetadataWithClaude(params: {
  base64Data: string;
  mimeType: string;
  docTypeHint?: string;
  fileName?: string;
}): Promise<ExtractedDocumentMetadata> {
  const { base64Data, mimeType, docTypeHint, fileName } = params;

  try {
    const vertexAI = getGoogleVertexClient();
    const modelName = process.env.VERTEX_AI_MODEL || 'gemini-2.5-flash';

    const systemPrompt = `You are an expert procurement and compliance document analyst specializing in Kenyan public procurement (KRA, AGPO/National Treasury, BRS/CR12, County Business Permits).
Analyze the provided document and extract key compliance metadata.
Return ONLY valid JSON matching this schema:
{
  "docType": "tax_compliance" | "agpo_cert" | "cr12" | "business_permit" | "kra_pin_cert" | "bank_reference" | "audited_accounts" | "other",
  "certificateNumber": string | null,
  "issueDate": "YYYY-MM-DD" | null,
  "expiryDate": "YYYY-MM-DD" | null,
  "issuingAuthority": string | null,
  "entityName": string | null,
  "notes": string | null,
  "confidence": "high" | "medium" | "low"
}`;

    const promptText = `Please analyze this compliance document.${docTypeHint ? ` Expected document type: ${docTypeHint}.` : ''}${fileName ? ` File name: ${fileName}.` : ''} Extract the certificate/registration number, issue date, and expiry date (standardized to YYYY-MM-DD). If an expiry date is not applicable (e.g. CR12 or PIN cert), leave it null.`;

    const parts: any[] = [];
    if (base64Data) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: base64Data,
        },
      });
    }
    parts.push({ text: promptText });

    const generativeModel = vertexAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }],
      },
    });

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts }],
    });

    const text = result.response.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') || '';
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      docType: parsed.docType || docTypeHint || 'other',
      certificateNumber: parsed.certificateNumber || null,
      issueDate: parsed.issueDate || null,
      expiryDate: parsed.expiryDate || null,
      issuingAuthority: parsed.issuingAuthority || null,
      entityName: parsed.entityName || null,
      notes: parsed.notes || 'Extracted via Google Vertex AI (Gemini)',
      confidence: parsed.confidence || 'high',
    };
  } catch (error: any) {
    console.warn('Vertex AI document extraction fallback:', error?.message || error);
    return {
      docType: docTypeHint || 'other',
      certificateNumber: null,
      issueDate: null,
      expiryDate: null,
      issuingAuthority: null,
      entityName: null,
      notes: `AI extraction unavailable (${error?.message || 'Check GCP credentials'}). Please enter dates manually.`,
      confidence: 'low',
    };
  }
}

export const extractDocumentMetadataWithGemini = extractDocumentMetadataWithClaude;
export const callGeminiVertexDirect = callClaudeVertex;
