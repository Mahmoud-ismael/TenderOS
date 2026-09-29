import dns from 'node:dns';
import { VertexAI } from '@google-cloud/vertexai';
import type { AiTaskOptions, AiTaskResult } from './types';

if (typeof (dns as any).setDefaultResultOrder === 'function') {
  try {
    (dns as any).setDefaultResultOrder('ipv4first');
  } catch {
    // ignore
  }
}

let cachedVertex: VertexAI | null = null;

export function getGoogleVertexClient(): VertexAI {
  if (!cachedVertex) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.GCP_LOCATION || 'us-central1';

    if (!project) {
      throw new Error(
        'GOOGLE_CLOUD_PROJECT or GCP_PROJECT_ID is required to invoke Gemini models on Vertex AI.'
      );
    }

    const clientEmail = process.env.GCP_CLIENT_EMAIL;
    const rawKey = process.env.GCP_PRIVATE_KEY;

    let googleAuthOptions: any = undefined;
    if (clientEmail && rawKey) {
      const privateKey = rawKey.replace(/\\n/g, '\n').trim();
      googleAuthOptions = {
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        projectId: project,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      };
    }

    cachedVertex = new VertexAI({
      project,
      location,
      googleAuthOptions,
    });
  }

  return cachedVertex;
}

/**
 * Invokes Gemini Flash via Google Cloud Vertex AI for cheap/high-throughput tasks:
 * text extraction, JSON formatting, metadata categorization, basic summarization.
 */
export async function callGeminiVertex(
  options: AiTaskOptions
): Promise<AiTaskResult> {
  const vertexAI = getGoogleVertexClient();
  const modelName = process.env.VERTEX_AI_MODEL || 'gemini-2.5-flash';

  const generativeModel = vertexAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxTokens ?? 4096,
      ...(options.responseFormat === 'json'
        ? { responseMimeType: 'application/json' }
        : {}),
    },
    systemInstruction: options.systemPrompt
      ? {
          role: 'system',
          parts: [{ text: options.systemPrompt }],
        }
      : undefined,
  });

  let contents: any[] = [];
  if (options.messages && options.messages.length > 0) {
    contents = options.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
  } else {
    contents = [{ role: 'user', parts: [{ text: options.prompt || '' }] }];
  }

  const result = await generativeModel.generateContent({
    contents,
  });

  const response = result.response;
  const candidate = response.candidates?.[0];
  const text =
    candidate?.content?.parts?.map((p) => p.text || '').join('\n') || '';

  return {
    text,
    model: modelName,
    provider: 'google-vertex',
    usage: {
      inputTokens: response.usageMetadata?.promptTokenCount,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
    },
  };
}
