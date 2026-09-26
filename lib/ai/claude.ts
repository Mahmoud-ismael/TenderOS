import { AnthropicVertex } from '@anthropic-ai/vertex-sdk';
import type { AiTaskOptions, AiTaskResult } from './types';

let cachedClient: AnthropicVertex | null = null;

export function getClaudeVertexClient(): AnthropicVertex {
  if (!cachedClient) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const region = process.env.GOOGLE_CLOUD_LOCATION || 'us-east5';

    if (!projectId) {
      throw new Error(
        'GOOGLE_CLOUD_PROJECT is required to invoke Claude models on Vertex AI.'
      );
    }

    cachedClient = new AnthropicVertex({
      projectId,
      region,
    });
  }

  return cachedClient;
}

/**
 * Invokes Claude 3.5 Sonnet via Google Cloud Vertex AI for judgment-heavy operations:
 * tender qualification analysis, proposal drafting, complex compliance checks.
 */
export async function callClaudeVertex(
  options: AiTaskOptions
): Promise<AiTaskResult> {
  const client = getClaudeVertexClient();
  const model = 'claude-3-5-sonnet@20240620';

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  if (options.messages && options.messages.length > 0) {
    for (const msg of options.messages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  } else {
    messages.push({ role: 'user', content: options.prompt });
  }

  const response = await client.messages.create({
    model,
    max_tokens: options.maxTokens ?? 4096,
    temperature: options.temperature ?? 0.2,
    system: options.systemPrompt,
    messages,
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('\n');

  return {
    text,
    model,
    provider: 'anthropic-vertex',
    usage: {
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    },
  };
}
