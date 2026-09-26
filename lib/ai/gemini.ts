import { VertexAI } from '@google-cloud/vertexai';
import type { AiTaskOptions, AiTaskResult } from './types';

let cachedVertex: VertexAI | null = null;

export function getGoogleVertexClient(): VertexAI {
  if (!cachedVertex) {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    if (!project) {
      throw new Error(
        'GOOGLE_CLOUD_PROJECT is required to invoke Gemini models on Vertex AI.'
      );
    }

    cachedVertex = new VertexAI({
      project,
      location,
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
  const modelName = 'gemini-1.5-flash-002';

  const generativeModel = vertexAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxTokens ?? 2048,
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

  const promptContent = options.prompt || '';
  const result = await generativeModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: promptContent }] }],
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
